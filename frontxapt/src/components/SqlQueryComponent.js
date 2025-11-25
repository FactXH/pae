import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import './SqlQueryComponent.css';

const SqlQueryComponent = () => {
  const [query, setQuery] = useState('SELECT first_name, last_name, is_active FROM engagement_employee WHERE first_name LIKE \'Xavi%\'');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [executionTime, setExecutionTime] = useState(null);
  const [expandedTables, setExpandedTables] = useState({});
  const [tableColumns, setTableColumns] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(1000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [columnFilter, setColumnFilter] = useState('');
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('sqlite');
  const [columnFilters, setColumnFilters] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [frozenColumns, setFrozenColumns] = useState(0);

  const databases = [
    { id: 'sqlite', name: 'SQLite (Local)', icon: '🗄️' },
    { id: 'trino', name: 'Trino/Starburst', icon: '⚡' },
    { id: 'athena', name: 'AWS Athena', icon: '☁️' },
    { id: 'postgres', name: 'PostgreSQL', icon: '🐘' },
  ];

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    let intervalId;
    if (autoRefresh && query.trim()) {
      intervalId = setInterval(() => {
        executeQuery(true);
      }, refreshInterval);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, query]);

  const loadTables = async () => {
    try {
      const data = await apiClient.get('/sql/tables/');
      if (data.status === 'success') {
        setTables(data.tables);
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  };

  const loadTableColumns = async (tableName) => {
    if (tableColumns[tableName]) {
      return; // Already loaded
    }

    try {
      const data = await apiClient.getTableColumns(tableName);
      if (data.status === 'success') {
        setTableColumns(prev => ({
          ...prev,
          [tableName]: data.columns
        }));
      }
    } catch (err) {
      console.error(`Failed to load columns for ${tableName}:`, err);
    }
  };

  const toggleTable = async (tableName) => {
    const newExpanded = !expandedTables[tableName];
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: newExpanded
    }));

    if (newExpanded && !tableColumns[tableName]) {
      await loadTableColumns(tableName);
    }
  };

  const executeQuery = async (isAutoRefresh = false) => {
    if (!query.trim()) {
      setError({ message: 'Please enter a SQL query' });
      return;
    }

    // For auto-refresh, don't clear results or show loading state
    if (isAutoRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
      setResult(null);
      setExecutionTime(null);
    }

    const startTime = Date.now();

    try {
      const data = await apiClient.post('/sql/execute/', { 
        query,
        database: selectedDatabase 
      });
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (data.status === 'success') {
        setResult(data);
        setError(null);
        // Initialize all columns as visible
        if (data.columns) {
          setVisibleColumns(data.columns);
          // Reset column filters
          setColumnFilters({});
        }
      } else {
        // Show error in results table format
        setResult({
          columns: ['Error'],
          rows: [[data.message]],
          row_count: 1
        });
        setError({ message: data.message, traceback: data.traceback });
      }
    } catch (err) {
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      // Show error in results table format
      setResult({
        columns: ['Error'],
        rows: [[err.message || 'An error occurred']],
        row_count: 1
      });
      setError({
        message: err.message,
        data: err.data,
      });
    } finally {
      if (isAutoRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  const insertTableName = (tableName) => {
    setQuery(prev => prev + tableName);
  };

  const insertColumnName = (columnName) => {
    setQuery(prev => {
      const trimmed = prev.trimEnd();
      // Add comma and space if query doesn't end with SELECT, comma, or opening parenthesis
      if (trimmed && !trimmed.match(/(SELECT|,|\()\s*$/i)) {
        return prev + ', ' + columnName;
      }
      return prev + columnName;
    });
  };

  const toggleColumnVisibility = (columnName) => {
    setVisibleColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    );
  };

  const handleColumnFilterChange = (columnName, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  const getFilteredRows = () => {
    if (!result || !result.rows) return [];
    
    return result.rows.filter(row => {
      return result.columns.every((col, colIndex) => {
        const filterValue = columnFilters[col];
        if (!filterValue) return true;
        
        const cellValue = row[colIndex];
        if (cellValue === null) return 'null'.includes(filterValue.toLowerCase());
        
        return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  };

  return (
    <div className="sql-query-container">
      <div className="sql-header">
        <div className="header-content">
          <h2>🗄️ SQL Query Explorer</h2>
          <p className="description">Execute SQL queries against your databases</p>
        </div>
        <div className="database-selector">
          <label>Database:</label>
          <select 
            value={selectedDatabase} 
            onChange={(e) => setSelectedDatabase(e.target.value)}
            className="database-dropdown"
          >
            {databases.map(db => (
              <option key={db.id} value={db.id}>
                {db.icon} {db.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sql-layout">
        <div className="sql-sidebar">
          <h3>📋 Available Tables</h3>
          <div className="tables-list">
            {tables.length > 0 ? (
              tables.map((table, index) => (
                <div key={index} className="table-container">
                  <div className="table-header">
                    <span
                      className="expand-icon"
                      onClick={() => toggleTable(table)}
                    >
                      {expandedTables[table] ? '▼' : '▶'}
                    </span>
                    <div
                      className="table-item"
                      onClick={() => insertTableName(table)}
                      title="Click to insert into query"
                    >
                      📊 {table}
                    </div>
                  </div>
                  {expandedTables[table] && tableColumns[table] && (
                    <div className="columns-list">
                      {tableColumns[table].map((col, idx) => (
                        <div 
                          key={idx} 
                          className="column-item" 
                          title={`Type: ${col.type}. Click to insert into query`}
                          onClick={() => insertColumnName(col.name)}
                        >
                          <span className="column-name">{col.name}</span>
                          <span className="column-type">{col.type}</span>
                          {col.primary_key && <span className="column-badge pk">PK</span>}
                          {!col.nullable && <span className="column-badge nn">NOT NULL</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-tables">No tables found</p>
            )}
          </div>
        </div>

        <div className="sql-main">
          <div className="query-editor">
            <div className="editor-header">
              <span className="editor-title">Query Editor</span>
              <span className="editor-hint">Ctrl + Enter to execute</span>
            </div>
            <textarea
              className="query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your SELECT query here..."
              rows={8}
            />
            <div className="button-group">
              <button
                onClick={executeQuery}
                disabled={loading}
                className="execute-button"
              >
                {loading ? '⏳ Executing...' : '▶ Execute Query'}
              </button>
              <label className="auto-refresh-control">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span>Auto-refresh every {refreshInterval / 1000}s</span>
              </label>
            </div>
          </div>

          {executionTime !== null && (
            <div className="execution-info">
              <span>⚡ Executed in {executionTime}ms</span>
              {isRefreshing && <span className="refreshing-indicator">🔄 Refreshing...</span>}
            </div>
          )}

          {loading && (
            <div className="loading-overlay">
              <div className="spinner-large"></div>
              <p>Executing query...</p>
            </div>
          )}

          {error && (
            <div className="result-container error-container">
              <h3>❌ Error</h3>
              <p className="error-message">{error.message}</p>
              {error.traceback && (
                <pre className="error-traceback">{error.traceback}</pre>
              )}
              {error.data && (
                <pre className="error-data">{JSON.stringify(error.data, null, 2)}</pre>
              )}
            </div>
          )}

          {result && result.status === 'success' && (
            <div className={`result-container success-container ${isFullscreen ? 'fullscreen' : ''}`}>
              <div className="result-header">
                <h3>✅ Query Results</h3>
                <div className="result-header-actions">
                  <div className="freeze-controls">
                    <label>Freeze:</label>
                    <button 
                      className={`freeze-btn ${frozenColumns === 0 ? 'active' : ''}`}
                      onClick={() => setFrozenColumns(0)}
                      title="No frozen columns"
                    >
                      0
                    </button>
                    <button 
                      className={`freeze-btn ${frozenColumns === 1 ? 'active' : ''}`}
                      onClick={() => setFrozenColumns(1)}
                      title="Freeze 1st column"
                    >
                      1
                    </button>
                    <button 
                      className={`freeze-btn ${frozenColumns === 2 ? 'active' : ''}`}
                      onClick={() => setFrozenColumns(2)}
                      title="Freeze first 2 columns"
                    >
                      2
                    </button>
                    <button 
                      className={`freeze-btn ${frozenColumns === 3 ? 'active' : ''}`}
                      onClick={() => setFrozenColumns(3)}
                      title="Freeze first 3 columns"
                    >
                      3
                    </button>
                  </div>
                  <span className="row-count">{result.row_count} rows</span>
                  <button 
                    className="fullscreen-button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? '❌' : '⛶️'}
                  </button>
                </div>
              </div>

              {result.columns && result.columns.length > 0 && (
                <div className="column-filter-section">
                  <input
                    type="text"
                    className="column-filter-input"
                    placeholder="Filter columns..."
                    value={columnFilter}
                    onChange={(e) => setColumnFilter(e.target.value)}
                  />
                  <div className="column-toggles">
                    {result.columns
                      .filter(col => col.toLowerCase().includes(columnFilter.toLowerCase()))
                      .map((col, idx) => (
                        <label key={idx} className="column-toggle">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(col)}
                            onChange={() => toggleColumnVisibility(col)}
                          />
                          <span>{col}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {result.row_count > 0 ? (
                <div className="table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        {result.columns
                          .filter(col => visibleColumns.includes(col))
                          .map((col, index) => {
                            const visibleIndex = result.columns
                              .filter(c => visibleColumns.includes(c))
                              .indexOf(col);
                            const isFrozen = visibleIndex < frozenColumns;
                            
                            return (
                              <th 
                                key={index} 
                                className={isFrozen ? 'frozen-column' : ''}
                                style={isFrozen ? { left: `${visibleIndex * 150}px` } : {}}
                              >
                                <div className="column-header">
                                  <span className="column-name-header">{col}</span>
                                  <input
                                    type="text"
                                    className="column-filter-box"
                                    placeholder="Filter..."
                                    value={columnFilters[col] || ''}
                                    onChange={(e) => handleColumnFilterChange(col, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </th>
                            );
                          })}
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredRows().map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row
                            .filter((_, cellIndex) => visibleColumns.includes(result.columns[cellIndex]))
                            .map((cell, cellIndex) => {
                              const visibleColIndex = result.columns
                                .filter(c => visibleColumns.includes(c))
                                .findIndex((c, i) => {
                                  const filteredRow = row.filter((_, ci) => 
                                    visibleColumns.includes(result.columns[ci])
                                  );
                                  return i === cellIndex;
                                });
                              const isFrozen = visibleColIndex < frozenColumns;
                              
                              return (
                                <td 
                                  key={cellIndex}
                                  className={isFrozen ? 'frozen-column' : ''}
                                  style={isFrozen ? { left: `${visibleColIndex * 150}px` } : {}}
                                >
                                  {cell === null ? (
                                    <span className="null-value">NULL</span>
                                  ) : typeof cell === 'boolean' ? (
                                    <span className={`boolean-value ${cell ? 'true' : 'false'}`}>
                                      {cell.toString()}
                                    </span>
                                  ) : (
                                    String(cell)
                                  )}
                                </td>
                              );
                            })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-results">
                  <p>Query executed successfully but returned no rows.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SqlQueryComponent;
