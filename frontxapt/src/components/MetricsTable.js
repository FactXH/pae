import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import apiClient from '../services/apiClient';
import './MetricsTable.css';

/**
 * MetricsTable Component
 * 
 * Executes a SQL query and displays results with color-coded metrics
 * 
 * Column naming convention:
 * - Suffix '__dim' for dimension columns (displayed as regular text)
 * - Suffix '__metric' for metric columns (displayed with color coding)
 * - Suffix '__hidden' for columns that should not be displayed
 * - No suffix: displayed as regular text
 * 
 * Color coding for metrics:
 * - Red: value < 2.2
 * - Yellow: 2.2 <= value < 4.0
 * - Green: value >= 4.0
 * 
 * @param {string} query - SQL query to execute
 * @param {string} title - Title for the table (optional)
 * @param {object} thresholds - Custom thresholds (optional): { red: 2.2, yellow: 4.0 }
 * @param {array} visibleColumns - Array of column names to show (optional, shows all if not provided)
 * @param {array} groupByDimensions - Array of dimension column names to group by (optional)
 * @param {object} metricAggregations - Map of metric names to aggregation type: 'AVG' or 'SUM' (optional)
 */
const MetricsTable = ({ 
  query, 
  title = '', 
  thresholds = { red: 2.2, yellow: 4.0 },
  visibleColumns = null,
  groupByDimensions = null,
  metricAggregations = {}
}) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query) {
      executeQuery();
    }
  }, [query, visibleColumns, groupByDimensions, metricAggregations]);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build dynamic query if groupBy or aggregations are specified
      let finalQuery = query;
      
      if (groupByDimensions && groupByDimensions.length > 0) {
        // Parse the original query to extract table/from clause
        const fromMatch = query.match(/FROM\s+([^\s;]+)/i);
        if (fromMatch) {
          const tableName = fromMatch[1];
          
          // Build SELECT clause with dimensions and aggregated metrics
          const selectParts = [];
          
          // Add dimensions
          groupByDimensions.forEach(dim => {
            const cleanDim = dim.replace('__dim', '');
            selectParts.push(`${cleanDim} AS ${cleanDim}__dim`);
          });
          
          // Add aggregated metrics
          Object.keys(metricAggregations).forEach(metric => {
            const cleanMetric = metric.replace('__metric', '');
            const aggType = metricAggregations[metric] || 'AVG';
            selectParts.push(`${aggType}(${cleanMetric}) AS ${cleanMetric}__metric`);
          });
          
          // Build final query
          finalQuery = `
            SELECT ${selectParts.join(',\n       ')}
            FROM ${tableName}
            GROUP BY ${groupByDimensions.map(d => d.replace('__dim', '')).join(', ')}
          `;
        }
      }

      const result = await apiClient.executeSQL(finalQuery);
      
      if (result.columns && result.data) {
        // Parse column metadata
        const parsedColumns = result.columns.map(col => {
          const colName = col.name || col;
          let displayName = colName;
          let type = 'text';
          let visible = true;

          // Check for suffixes
          if (colName.endsWith('__dim')) {
            displayName = colName.replace('__dim', '');
            type = 'dimension';
          } else if (colName.endsWith('__metric')) {
            displayName = colName.replace('__metric', '');
            type = 'metric';
          } else if (colName.endsWith('__hidden')) {
            displayName = colName.replace('__hidden', '');
            type = 'hidden';
            visible = false;
          }

          return {
            name: colName,
            displayName: displayName,
            type: type,
            visible: visible,
          };
        });

        // Filter columns based on visibleColumns prop
        let filteredColumns = parsedColumns.filter(col => col.visible);
        if (visibleColumns && visibleColumns.length > 0) {
          filteredColumns = filteredColumns.filter(col => 
            visibleColumns.includes(col.name) || visibleColumns.includes(col.displayName)
          );
        }

        setColumns(filteredColumns);
        setData(result.data);
      } else {
        setError('Invalid response format from API');
      }
    } catch (err) {
      setError(err.message || 'Failed to execute query');
      console.error('Query execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'neutral';
    }

    const numValue = Number(value);
    
    if (numValue < thresholds.red) {
      return 'red';
    } else if (numValue < thresholds.yellow) {
      return 'yellow';
    } else {
      return 'green';
    }
  };

  const renderCell = (row, column) => {
    const value = row[column.name];

    if (value === null || value === undefined) {
      return <span className="null-value">—</span>;
    }

    if (column.type === 'metric') {
      const color = getMetricColor(value);
      const displayValue = typeof value === 'number' ? value.toFixed(2) : value;

      return (
        <Chip
          label={displayValue}
          className={`metric-chip metric-${color}`}
          size="small"
        />
      );
    }

    // Dimension or regular text
    if (typeof value === 'number') {
      return value.toFixed(2);
    }

    return value.toString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (data.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No data to display
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      
      <TableContainer component={Paper} className="metrics-table-container">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell 
                  key={col.name}
                  className={col.type === 'metric' ? 'metric-header' : 'dimension-header'}
                >
                  {col.displayName}
                  {col.type === 'metric' && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      (metric)
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex} hover>
                {columns.map((col) => (
                  <TableCell key={col.name}>
                    {renderCell(row, col)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          Legend:
        </Typography>
        <Chip label="Green ≥ 4.0" size="small" className="metric-chip metric-green" />
        <Chip label="Yellow 2.2-3.9" size="small" className="metric-chip metric-yellow" />
        <Chip label="Red < 2.2" size="small" className="metric-chip metric-red" />
      </Box>
    </Box>
  );
};

export default MetricsTable;
