"""
API views for frontend communication
All API endpoints that the React frontend will consume
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.conf import settings
import traceback
import sqlite3
import pandas as pd
from threading import Thread
import time


@api_view(['GET'])
def test_connection(request):
    """
    Simple test endpoint to verify API connectivity
    GET /api/test/
    """
    return Response({
        'status': 'success',
        'message': 'API connection successful!',
        'timestamp': str(request.META.get('HTTP_DATE', 'N/A'))
    })


@api_view(['GET', 'POST'])
def echo(request):
    """
    Echo endpoint - returns whatever you send
    GET /api/echo/ - returns query params
    POST /api/echo/ - returns request body
    """
    if request.method == 'GET':
        return Response({
            'method': 'GET',
            'query_params': dict(request.query_params),
            'message': 'Echo successful'
        })
    else:
        return Response({
            'method': 'POST',
            'data': request.data,
            'message': 'Echo successful'
        })


@api_view(['GET'])
def employee_list(request):
    """
    Get list of employees
    GET /api/employees/
    """
    try:
        from engagement.models import Employee
        
        employees = Employee.objects.all()
        data = [{
            'id': emp.id,
            'name': emp.name,
            'email': getattr(emp, 'email', None),
            'position': getattr(emp, 'position', None),
        } for emp in employees]
        
        return Response({
            'status': 'success',
            'count': len(data),
            'employees': data
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def employee_detail(request, employee_id):
    """
    Get single employee details
    GET /api/employees/<id>/
    """
    try:
        from engagement.models import Employee
        
        employee = Employee.objects.get(id=employee_id)
        
        return Response({
            'status': 'success',
            'employee': {
                'id': employee.id,
                'name': employee.name,
                'email': getattr(employee, 'email', None),
                'position': getattr(employee, 'position', None),
            }
        })
    except Employee.DoesNotExist:
        return Response({
            'status': 'error',
            'message': f'Employee with id {employee_id} not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def calculate(request):
    """
    Example calculation endpoint
    POST /api/calculate/
    Body: { "operation": "add|subtract|multiply|divide", "a": 10, "b": 5 }
    """
    try:
        operation = request.data.get('operation')
        a = float(request.data.get('a', 0))
        b = float(request.data.get('b', 0))
        
        operations = {
            'add': lambda x, y: x + y,
            'subtract': lambda x, y: x - y,
            'multiply': lambda x, y: x * y,
            'divide': lambda x, y: x / y if y != 0 else None,
        }
        
        if operation not in operations:
            return Response({
                'status': 'error',
                'message': f'Invalid operation. Choose from: {list(operations.keys())}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = operations[operation](a, b)
        
        if result is None:
            return Response({
                'status': 'error',
                'message': 'Division by zero'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'status': 'success',
            'operation': operation,
            'a': a,
            'b': b,
            'result': result
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def execute_sql(request):
    """
    Execute SQL query against selected database
    POST /api/sql/execute/
    Body: { 
        "query": "SELECT * FROM table_name LIMIT 10",
        "database": "sqlite" | "postgres" | "trino" | "athena"
    }
    """
    query = request.data.get('query', '').strip()
    database = request.data.get('database', 'sqlite').strip().lower()
    
    if not query:
        return Response({
            'status': 'error',
            'message': 'Query is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Only allow SELECT queries for safety
    if not query.upper().startswith('SELECT'):
        return Response({
            'status': 'error',
            'message': 'Only SELECT queries are allowed'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        import os
        import sys
        from pathlib import Path
        
        # Map frontend database names to QueryRunner sources
        db_mapping = {
            'sqlite': 'sqlite',
            'postgres': 'postgres',
            'trino': 'galaxy',
            'athena': 'athena'
        }
        
        if database not in db_mapping:
            return Response({
                'status': 'error',
                'message': f'Unknown database: {database}. Supported: sqlite, postgres, trino, athena'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Execute query with timeout
        result_data = {'completed': False, 'error': None, 'columns': None, 'rows': None, 'row_count': 0}
        
        def run_query():
            try:
                # Add project root to path
                project_root = Path(settings.BASE_DIR).parent
                if str(project_root) not in sys.path:
                    sys.path.insert(0, str(project_root))
                
                from utils.query_runner.query_runner import QueryRunner
                
                qr = QueryRunner()
                source = db_mapping[database]
                
                # Add db_path for SQLite
                kwargs = {}
                if database == 'sqlite':
                    kwargs['db_path'] = os.path.join(settings.BASE_DIR, 'db.sqlite3')
                
                df = qr.run_query(query, source=source, dataframe=True, **kwargs)
                
                result_data['completed'] = True
                result_data['columns'] = list(df.columns)
                result_data['rows'] = df.values.tolist()
                result_data['row_count'] = len(df)
                    
            except Exception as e:
                result_data['error'] = str(e)
                result_data['traceback'] = traceback.format_exc()
        
        # Run query in thread with timeout
        query_thread = Thread(target=run_query)
        query_thread.start()
        query_thread.join(timeout=60.0)  # 60 second timeout
        
        if query_thread.is_alive():
            return Response({
                'status': 'error',
                'message': 'Query execution timeout (60 seconds)',
                'timeout': True
            }, status=status.HTTP_408_REQUEST_TIMEOUT)
        
        if result_data['error']:
            return Response({
                'status': 'error',
                'message': result_data['error'],
                'traceback': result_data.get('traceback', '')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not result_data['completed']:
            return Response({
                'status': 'error',
                'message': 'Query did not complete'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'status': 'success',
            'columns': result_data['columns'],
            'rows': result_data['rows'],
            'row_count': result_data['row_count'],
            'query': query
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def list_tables(request):
    """
    List all tables in the SQLite database
    GET /api/sql/tables/
    """
    try:
        import os
        
        db_path = os.path.join(settings.BASE_DIR, 'db.sqlite3')
        
        if not os.path.exists(db_path):
            return Response({
                'status': 'error',
                'message': f'Database not found at {db_path}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        all_tables = [row[0] for row in cursor.fetchall()]
        
        # Filter out Django internal tables
        django_prefixes = ['django_', 'auth_', 'sqlite_']
        tables = [t for t in all_tables if not any(t.startswith(prefix) for prefix in django_prefixes)]
        
        conn.close()
        
        return Response({
            'status': 'success',
            'tables': tables,
            'count': len(tables)
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def table_columns(request, table_name):
    """
    Get columns for a specific table
    GET /api/sql/tables/<table_name>/columns/
    """
    try:
        import os
        
        db_path = os.path.join(settings.BASE_DIR, 'db.sqlite3')
        
        if not os.path.exists(db_path):
            return Response({
                'status': 'error',
                'message': f'Database not found at {db_path}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get table info using PRAGMA
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns_info = cursor.fetchall()
        
        if not columns_info:
            conn.close()
            return Response({
                'status': 'error',
                'message': f'Table "{table_name}" not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Format column information
        columns = [{
            'name': col[1],
            'type': col[2],
            'nullable': not bool(col[3]),
            'primary_key': bool(col[5])
        } for col in columns_info]
        
        conn.close()
        
        return Response({
            'status': 'success',
            'table_name': table_name,
            'columns': columns,
            'count': len(columns)
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


