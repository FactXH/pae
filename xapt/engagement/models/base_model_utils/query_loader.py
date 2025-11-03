"""
Query Loader Utility for BaseModel

This utility provides functionality to load multiple model instances from SQL queries.
It integrates with PAE utils QueryRunner to execute queries and create model instances
from the results.
"""

import sys
import os
from typing import List, Dict, Any, Optional, Type
from django.db import models

# Add PAE project root to Python path to access utils modules
PAE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
if PAE_ROOT not in sys.path:
    sys.path.append(PAE_ROOT)

# Import PAE utils
try:
    from utils.query_runner.query_runner import QueryRunner
except ImportError as e:
    print(f"Warning: Could not import QueryRunner: {e}")
    QueryRunner = None


class QueryLoader:
    """
    Utility class for loading model instances from SQL queries.
    
    This class handles:
    1. Executing SQL queries using PAE QueryRunner
    2. Mapping query results to model fields
    3. Creating model instances from query data
    4. Handling errors and validation
    """
    
    def __init__(self, model_class: Type[models.Model]):
        """
        Initialize QueryLoader for a specific model class.
        
        Args:
            model_class: Django model class to create instances for
        """
        self.model_class = model_class
        self.query_runner = None
        
        if QueryRunner:
            self.query_runner = QueryRunner()
        else:
            print(f"Warning: QueryRunner not available for {model_class.__name__}")
    
    def load_instances_from_query(self, query: str, 
                                field_mapping: Optional[Dict[str, str]] = None,
                                create_if_not_exists: bool = True,
                                update_existing: bool = True,
                                unique_fields: List[str] = None) -> Dict[str, Any]:
        """
        Load model instances from a SQL query.
        
        Args:
            query (str): SQL query to execute
            field_mapping (dict): Mapping of query columns to model fields
                                 If None, assumes column names match field names
            create_if_not_exists (bool): Create new instances if they don't exist
            update_existing (bool): Update existing instances with new data
            unique_fields (list): Fields to use for checking existing instances
            
        Returns:
            dict: Result summary with created/updated/failed counts and instances
        """
        
        if not self.query_runner:
            return {
                'success': False,
                'error': 'QueryRunner not available - PAE utils could not be imported',
                'created': 0,
                'updated': 0,
                'failed': 0,
                'instances': []
            }
        
        try:
            print(f"🔄 Executing query for {self.model_class.__name__} instances...")
            print(f"📝 Query: {query}")
            
            # Execute query using PAE QueryRunner
            df = self.query_runner.run_query(query, source='postgres', dataframe=True)

            if df is None or df.empty:
                return {
                    'success': True,
                    'message': 'Query executed successfully but returned no results',
                    'created': 0,
                    'updated': 0,
                    'failed': 0,
                    'instances': []
                }
            
            print(f"📊 Query returned {len(df)} rows")
            print(f"📋 Columns: {list(df.columns)}")
            print(df)
            # Process results
            result = self._process_query_results(
                df, 
                field_mapping or {},
                create_if_not_exists,
                update_existing,
                unique_fields or ['id']
            )
            
            return result
            
        except Exception as e:
            print(f"❌ Error in load_instances_from_query: {e}")
            return {
                'success': False,
                'error': f'Failed to load instances from query: {str(e)}',
                'created': 0,
                'updated': 0,
                'failed': 0,
                'instances': []
            }
    
    def _process_query_results(self, df, field_mapping: Dict[str, str],
                             create_if_not_exists: bool,
                             update_existing: bool,
                             unique_fields: List[str]) -> Dict[str, Any]:
        """Process query results and create/update model instances."""
        
        created_count = 0
        updated_count = 0
        failed_count = 0
        instances = []
        
        print(f"🔧 Processing {len(df)} rows for {self.model_class.__name__}")
        
        for index, row in df.iterrows():
            try:
                # Convert row to dictionary
                row_data = row.to_dict()
                
                # Apply field mapping
                model_data = self._map_fields(row_data, field_mapping)
                
                # Check if instance already exists
                existing_instance = self._find_existing_instance(model_data, unique_fields)

                
                if existing_instance:
                    if update_existing:
                        # Update existing instance
                        print(f"  🔧 Updating {self.model_class.__name__} with data: {model_data}")
                        for field, value in model_data.items():
                            setattr(existing_instance, field, value)
                        existing_instance.save()
                        instances.append(existing_instance)
                        updated_count += 1
                        print(f"  ✅ Updated: {existing_instance}")
                    else:
                        # Skip existing instance
                        instances.append(existing_instance)
                        print(f"  ⏭️ Skipped existing: {existing_instance}")
                
                elif create_if_not_exists:
                    # Create new instance
                    print(f"  🔧 Creating {self.model_class.__name__} with data: {model_data}")
                    new_instance = self.model_class.objects.create(**model_data)
                    instances.append(new_instance)
                    created_count += 1
                    print(f"  ✅ Created: {new_instance}")
                
                else:
                    print(f"  ⚠️ Instance not found and create_if_not_exists=False")
                    failed_count += 1
                
            except Exception as e:
                print(f"  ❌ Failed to process row {index + 1}: {e}")
                failed_count += 1
        
        return {
            'success': True,
            'message': f'Processed {len(df)} rows successfully',
            'created': created_count,
            'updated': updated_count,
            'failed': failed_count,
            'total_rows': len(df),
            'instances': instances
        }
    
    def _map_fields(self, row_data: Dict[str, Any], field_mapping: Dict[str, str]) -> Dict[str, Any]:
        """Map query columns to model fields."""
        
        if not field_mapping:
            # No mapping provided, assume column names match field names
            return row_data
        
        mapped_data = {}
        
        for column_name, value in row_data.items():
            # Use mapping if provided, otherwise use column name directly
            model_field = field_mapping.get(column_name, column_name)
            mapped_data[model_field] = value
        
        return mapped_data
    
    def _find_existing_instance(self, model_data: Dict[str, Any], unique_fields: List[str]):
        """Find existing instance based on unique fields."""
        
        try:
            # Build filter based on unique fields
            filter_kwargs = {}
            
            for field in unique_fields:
                if field in model_data:
                    filter_kwargs[field] = model_data[field]
            
            if not filter_kwargs:
                return None
            
            # Try to find existing instance
            return self.model_class.objects.filter(**filter_kwargs).first()
            
        except Exception as e:
            print(f"  ⚠️ Error finding existing instance: {e}")
            return None


def load_instances_from_query(model_class: Type[models.Model], 
                            query: str,
                            field_mapping: Optional[Dict[str, str]] = None,
                            create_if_not_exists: bool = True,
                            update_existing: bool = False,
                            unique_fields: List[str] = None) -> Dict[str, Any]:
    """
    Convenient function to load instances from query without creating QueryLoader instance.
    
    Args:
        model_class: Django model class
        query: SQL query to execute
        field_mapping: Column to field mapping
        create_if_not_exists: Whether to create new instances
        update_existing: Whether to update existing instances  
        unique_fields: Fields for finding existing instances
        
    Returns:
        dict: Result summary
    """
    
    loader = QueryLoader(model_class)
    return loader.load_instances_from_query(
        query=query,
        field_mapping=field_mapping,
        create_if_not_exists=create_if_not_exists,
        update_existing=update_existing,
        unique_fields=unique_fields
    )


class QueryTemplates:
    """Common query templates for different use cases."""
    
    @staticmethod
    def simple_select(table_name: str, limit: int = 100) -> str:
        """Generate a simple SELECT query."""
        return f"SELECT * FROM {table_name} LIMIT {limit}"
    
    @staticmethod
    def test_data_query() -> str:
        """Generate test data for demonstration purposes."""
        return """
        SELECT 
            'JAJA' as first_name,
            'LOLO' as last_name,
            'test@xapt.com' as email,
            'Test Employee Profile' as name,
            'Auto-generated test employee from query' as description,
            true as is_active
        UNION ALL
        SELECT 
            'PEPE' as first_name,
            'TUTU' as last_name,
            'pepe@xapt.com' as email,
            'Pepe Employee Profile' as name,
            'Another auto-generated test employee' as description,
            true as is_active
        """
    
    @staticmethod
    def employee_from_external_source(source_table: str) -> str:
        """Generate query to import employees from external source."""
        return f"""
        SELECT 
            first_name,
            last_name,
            email,
            CONCAT(first_name, ' ', last_name, ' Profile') as name,
            CONCAT('Imported employee: ', first_name, ' ', last_name) as description,
            true as is_active
        FROM {source_table}
        WHERE email IS NOT NULL
        """
