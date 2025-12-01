import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  TableSortLabel,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import apiClient from '../services/apiClient';
import HistogramSlider from './HistogramSlider';
import SimpleRangeSlider from './SimpleRangeSlider';
import './ConfigurableMetricsCard.css';

/**
 * ConfigurableMetricsCard Component
 * 
 * A self-contained card that displays metrics based on column naming conventions
 * 
 * Column naming convention (use AS in SQL query):
 * - 'columnname__dim' → Dimension (regular text, can be toggled)
 * - 'columnname__metric__avg' → Metric with color coding, averaged when dimension hidden
 * - 'columnname__metric__sum' → Metric with color coding, summed when dimension hidden
 * - 'columnname__metric__pct' → Metric with color coding, summed then divided by employee_count__count__sum (weighted average)
 * - 'columnname__metric__max' → Metric with color coding, max value when dimension hidden
 * - 'columnname__metric__min' → Metric with color coding, min value when dimension hidden
 * - 'columnname__metricbignumber__sum' → Big number (EUR format) with gradient background
 * - 'columnname__metricrank__max' → Rank metric (centered, bold, no color)
 * - 'columnname__count__sum' → Count metric (no color), summed when dimension hidden
 * - 'columnname__count__avg' → Count metric (no color), averaged when dimension hidden
 * 
 * Multi-aggregation support (define multiple aggregation options):
 * - 'columnname__metric__sum-avg-max' → Supports SUM, AVG, and MAX (default: first one = SUM)
 * 
 * Aggregation types: avg, sum, pct, count, min, max
 * 
 * Example query:
 * SELECT 
 *   manager_full_name AS manager__dim,
 *   reporting_level AS level__dim,
 *   1 AS employee_count__count__sum,
 *   avg_salary AS salary__metricbignumber__sum-avg-max,
 *   rank AS ranking__metricrank__max,
 *   avg_accomplishments_recognised AS accomplishments__metric__pct
 * FROM table
 * 
 * When you hide a dimension, metrics are automatically aggregated using their specified function:
 * - If you hide "reporting_level", it will SUM employee_count and calculate weighted avg for pct metrics per manager
 * - PCT type: SUM(metric * count) / SUM(count) = proper weighted average
 * 
 * @param {string} title - Card title
 * @param {string} query - SQL query with properly named columns
 * @param {string} database - 'trino' or 'sqlite' (default: 'trino')
 * @param {object} thresholds - Thresholds for color coding: { red: 2.2, yellow: 4.0 }
 * @param {string} description - Optional description text
 */
const ConfigurableMetricsCard = ({
  title,
  query,
  database = 'trino',
  thresholds = { red: 2.2, yellow: 4.0 },
  description = '',
  initialConfig = null, // NEW: Optional initial configuration from saved view
  existingQueryId = null, // NEW: If provided, query is already saved
  enableHistograms = false, // NEW: Enable histogram sliders (expensive calculation, disabled by default)
}) => {
  const [columns, setColumns] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedDimensions, setSelectedDimensions] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dimensionFilters, setDimensionFilters] = useState({});
  const [dimensionExcludes, setDimensionExcludes] = useState({});
  const [enabledFilters, setEnabledFilters] = useState({});
  const [metricRanges, setMetricRanges] = useState({}); // { metricName: [min, max] } - for raw data
  const [aggMetricRanges, setAggMetricRanges] = useState({}); // { metricName: [min, max] } - for aggregated data
  const [sortColumns, setSortColumns] = useState([]); // Array of column names to sort by
  const [sortOrders, setSortOrders] = useState({}); // { columnName: 'asc' | 'desc' }
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [columnSearchFilter, setColumnSearchFilter] = useState('');
  const [configTab, setConfigTab] = useState(0);
  
  // Query editor state
  const [editableQuery, setEditableQuery] = useState(query);
  const [queryRunning, setQueryRunning] = useState(false);
  
  // Separate dialogs for Query and View
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [querySaving, setQuerySaving] = useState(false);
  
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [viewSaving, setViewSaving] = useState(false);
  const [savedQueryId, setSavedQueryId] = useState(existingQueryId); // Track saved query for view

  useEffect(() => {
    if (query) {
      executeQuery();
    }
  }, [query, database]);

  const parseColumnMetadata = (columnName) => {
    // Parse column naming convention: columnname__type__aggregation(s)
    // Examples:
    //   manager__dim
    //   avg_score__metric__avg
    //   avg_score__metric__pct
    //   employee_count__count__sum
    //   total_salary__metricbignumber__sum-avg-max (multi-aggregation)
    //   rank__metricrank__max
    const parts = columnName.split('__');
    const cleanName = parts[0];
    const type = parts[1] || 'text';
    const aggregationPart = parts[2] || null; // 'avg', 'sum-avg-max', 'pct', 'count', 'min', 'max'

    // Parse multi-aggregation (e.g., "sum-avg-max")
    const aggregations = aggregationPart ? aggregationPart.split('-') : [];
    const primaryAggregation = aggregations[0] || 'AVG'; // First one is default
    const availableAggregations = aggregations.length > 1 ? aggregations : [primaryAggregation];

    const isBigNumber = type === 'metricbignumber';
    const isRank = type === 'metricrank';
    const isMetricType = type === 'metric' || type === 'metricbignumber' || type === 'metricrank' || type === 'count';

    return {
      fullName: columnName,
      displayName: cleanName.replace(/_/g, ' '),
      cleanName: cleanName,
      type: type, // 'dim', 'metric', 'metricbignumber', 'metricrank', 'count', 'sum', 'avg', 'hidden'
      isDimension: type === 'dim',
      isMetric: isMetricType,
      hasColorCoding: type === 'metric' || type === 'metricbignumber',
      isBigNumber: isBigNumber, // EUR formatting with gradient
      isRank: isRank, // Rank display (centered, bold, no color)
      aggregationType: primaryAggregation.toUpperCase(),
      availableAggregations: availableAggregations.map(a => a.toUpperCase()), // ['SUM', 'AVG', 'MAX']
    };
  };

  const executeQuery = async () => {
    setLoading(true);
    setError(null);

    try {
      // Always use 'galaxy' as the database
      const result = await apiClient.executeSQL(query, 'trino');
      
      if (result.columns && result.data) {
        // Convert array of arrays to array of objects
        const dataObjects = result.data.map(row => {
          const obj = {};
          result.columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        });

        // Parse column metadata from names
        const parsedColumns = result.columns.map(col => {
          const colName = col.name || col;
          return parseColumnMetadata(colName);
        });

        // Separate dimensions and metrics
        const dims = parsedColumns.filter(c => c.isDimension);
        const mets = parsedColumns.filter(c => c.isMetric);

        setColumns(parsedColumns);
        setDimensions(dims);
        setMetrics(mets);
        
        // Apply initial config if provided, otherwise use defaults
        if (initialConfig) {
          // Apply saved configuration
          setSelectedDimensions(initialConfig.selectedDimensions || (dims.length > 0 ? [dims[0].fullName] : []));
          setVisibleColumns(initialConfig.visibleColumns || mets.slice(0, 3).map(m => m.fullName));
          setDimensionFilters(initialConfig.dimensionFilters || {});
          setDimensionExcludes(initialConfig.dimensionExcludes || {});
          setEnabledFilters(initialConfig.enabledFilters || {});
          setMetricRanges(initialConfig.metricRanges || {});
          setAggMetricRanges(initialConfig.aggMetricRanges || {});
          setSortColumns(initialConfig.sortColumns || []);
          setSortOrders(initialConfig.sortOrders || {});
        } else {
          // Use defaults: FIRST dimension selected for grouping by default
          const defaultGroupBy = dims.length > 0 ? [dims[0].fullName] : [];
          setSelectedDimensions(defaultGroupBy);
          setSelectedMetrics(mets.map(m => m.fullName));
          
          // Set visible columns: first 3 metrics only (dimensions auto-show from group by)
          const defaultVisible = [
            ...mets.slice(0, 3).map(m => m.fullName)
          ];
          setVisibleColumns(defaultVisible);
        }
        
        setData(dataObjects);
      } else {
        setError('No data returned from query');
      }
    } catch (err) {
      setError(err.message || 'Failed to execute query');
      console.error('Query execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunQuery = async () => {
    setQueryRunning(true);
    setError(null);

    try {
      // Always use 'galaxy' as the database
      const result = await apiClient.executeSQL(editableQuery, 'trino');
      
      if (result.columns && result.data) {
        // Convert array of arrays to array of objects
        const dataObjects = result.data.map(row => {
          const obj = {};
          result.columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        });

        // Parse column metadata from names
        const parsedColumns = result.columns.map(col => {
          const colName = col.name || col;
          return parseColumnMetadata(colName);
        });

        // Separate dimensions and metrics
        const dims = parsedColumns.filter(c => c.isDimension);
        const mets = parsedColumns.filter(c => c.isMetric);

        setColumns(parsedColumns);
        setDimensions(dims);
        setMetrics(mets);
        
        // Reset to defaults after query change
        const defaultGroupBy = dims.length > 0 ? [dims[0].fullName] : [];
        setSelectedDimensions(defaultGroupBy);
        setSelectedMetrics(mets.map(m => m.fullName));
        
        const defaultVisible = mets.slice(0, 3).map(m => m.fullName);
        setVisibleColumns(defaultVisible);
        
        // Clear filters when query changes
        setDimensionFilters({});
        setDimensionExcludes({});
        setMetricRanges({});
        setAggMetricRanges({});
        
        setData(dataObjects);
      } else {
        setError('No data returned from query');
      }
    } catch (err) {
      setError(err.message || 'Failed to execute query');
      console.error('Query execution error:', err);
    } finally {
      setQueryRunning(false);
    }
  };

  const handleDimensionToggle = (dim) => {
    setSelectedDimensions(prev =>
      prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]
    );
  };

  const handleMetricToggle = (metric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  const handleFilterChange = (dimensionName, filterValue) => {
    setDimensionFilters(prev => ({
      ...prev,
      [dimensionName]: filterValue
    }));
  };

  const handleExcludeChange = (dimensionName, excludeValue) => {
    setDimensionExcludes(prev => ({
      ...prev,
      [dimensionName]: excludeValue
    }));
  };

  const toggleFilterEnabled = (dimensionName) => {
    setEnabledFilters(prev => ({
      ...prev,
      [dimensionName]: !prev[dimensionName]
    }));
    
    // Clear filters when disabling
    if (enabledFilters[dimensionName]) {
      setDimensionFilters(prev => ({
        ...prev,
        [dimensionName]: ''
      }));
      setDimensionExcludes(prev => ({
        ...prev,
        [dimensionName]: ''
      }));
    }
  };

  const toggleColumnVisibility = (columnName) => {
    setVisibleColumns(prev =>
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  const handleSort = (columnName) => {
    const col = getColumnByName(columnName);
    if (!col?.isMetric) return; // Only sort by metrics

    setSortColumns(prev => {
      if (prev.includes(columnName)) {
        // If already in list, toggle its order
        const currentOrder = sortOrders[columnName] || 'asc';
        setSortOrders(prevOrders => ({
          ...prevOrders,
          [columnName]: currentOrder === 'asc' ? 'desc' : 'asc'
        }));
        return prev;
      } else {
        // Add to sort columns
        setSortOrders(prevOrders => ({
          ...prevOrders,
          [columnName]: 'asc'
        }));
        return [...prev, columnName];
      }
    });
  };

  const getUniqueValuesForDimension = (dimensionName) => {
    const values = new Set();
    data.forEach(row => {
      const value = row[dimensionName];
      if (value !== null && value !== undefined && value !== '') {
        values.add(String(value));
      }
    });
    
    const allValues = Array.from(values);
    const filterText = (dimensionFilters[dimensionName] || '').toLowerCase();
    const excludeText = (dimensionExcludes[dimensionName] || '').toLowerCase();
    
    if (!filterText && !excludeText) {
      return allValues.sort();
    }

    // Split filters and excludes
    const includeFilters = filterText.split(',').map(f => f.trim()).filter(f => f);
    const excludeFilters = excludeText.split(',').map(f => f.trim()).filter(f => f);
    
    // Categorize values
    const matched = [];
    const excluded = [];
    const rest = [];
    
    allValues.forEach(value => {
      const valueLower = value.toLowerCase();
      
      // Check if excluded
      const isExcluded = excludeFilters.some(excl => valueLower.includes(excl));
      if (isExcluded) {
        excluded.push(value);
        return;
      }
      
      // Check if matches include filter
      const isMatched = includeFilters.length === 0 || includeFilters.some(incl => valueLower.includes(incl));
      if (isMatched && includeFilters.length > 0) {
        matched.push(value);
      } else {
        rest.push(value);
      }
    });
    
    // Return: matched first (sorted), then rest (sorted), excluded at end (sorted)
    return [
      ...matched.sort(),
      ...rest.sort(),
      ...excluded.sort()
    ];
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

  const renderMetricCell = (value, column) => {
    if (value === null || value === undefined) {
      return <span className="null-value">—</span>;
    }

    const col = columns.find(c => c.fullName === column);
    
    // If it's a rank metric (centered, bold, no color)
    if (col && col.isRank) {
      return (
        <Box 
          sx={{ 
            textAlign: 'center', 
            fontWeight: 700, 
            fontSize: '1rem',
            color: '#000000',
            py: 0.5
          }}
        >
          {value}
        </Box>
      );
    }
    
    // If it's a count/sum/avg type (no color coding)
    if (col && !col.hasColorCoding) {
      const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
      return <span style={{ fontWeight: 500 }}>{displayValue}</span>;
    }

    // If it's a big number metric (EUR formatting with gradient background)
    if (col && col.isBigNumber) {
      // Get all values for this column to calculate min/max
      const columnValues = getProcessedData()
        .map(row => Number(row[column]))
        .filter(v => !isNaN(v) && v !== null && v !== undefined);
      
      const minVal = Math.min(...columnValues);
      const maxVal = Math.max(...columnValues);
      const range = maxVal - minVal;
      
      // Calculate intensity (0 to 1) based on value position in range
      const intensity = range > 0 ? (Number(value) - minVal) / range : 0.5;
      
      // Create gradient background: light blue (low) to dark blue (high)
      const backgroundColor = `rgba(33, 150, 243, ${0.1 + intensity * 0.7})`; // Material Blue
      const textColor = intensity > 0.5 ? '#ffffff' : '#000000';
      
      const displayValue = typeof value === 'number' 
        ? value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        : value;

      return (
        <Chip
          label={displayValue}
          size="small"
          sx={{
            backgroundColor: backgroundColor,
            color: textColor,
            fontWeight: 600,
            minWidth: '80px',
            '& .MuiChip-label': {
              px: 1.5
            }
          }}
        />
      );
    }

    // If it's a metric with color coding (standard 2 decimals)
    if (col && col.hasColorCoding) {
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

    return value;
  };

  const getVisibleColumns = () => {
    // Always show dimensions that are in the group by, plus selected metrics
    const visibleMetrics = metrics
      .filter(m => visibleColumns.includes(m.fullName))
      .map(m => m.fullName);
    
    // Return: selected dimensions (group by) + visible metrics
    return [...selectedDimensions, ...visibleMetrics];
  };

  const getColumnByName = (colName) => {
    return columns.find(c => c.fullName === colName);
  };

  const aggregateData = (data, visibleDimensions, allColumns) => {
    // Use selectedDimensions for grouping, not visibleDimensions
    // Aggregate when not all dimensions are selected for grouping
    if (selectedDimensions.length === dimensions.length) {
      // All dimensions selected for grouping, no aggregation needed
      return data;
    }

    // Group by SELECTED dimensions (not visible ones)
    const grouped = {};
    
    data.forEach(row => {
      // Create group key from SELECTED dimensions
      const groupKey = selectedDimensions.map(dim => row[dim]).join('|||');
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          rows: [],
          dimensions: {}
        };
        // Store dimension values for selected dimensions
        selectedDimensions.forEach(dim => {
          grouped[groupKey].dimensions[dim] = row[dim];
        });
      }
      
      grouped[groupKey].rows.push(row);
    });

    // Aggregate metrics and non-grouped dimensions for each group
    return Object.values(grouped).map(group => {
      const aggregatedRow = { ...group.dimensions };
      
      // Handle dimensions that are NOT in the group by (string_agg distinct values)
      dimensions.forEach(dim => {
        if (!selectedDimensions.includes(dim.fullName)) {
          // Collect unique values for this dimension across all rows in the group
          const uniqueValues = [...new Set(
            group.rows
              .map(r => r[dim.fullName])
              .filter(v => v !== null && v !== undefined && v !== '')
          )];
          // Join with comma, sorted
          aggregatedRow[dim.fullName] = uniqueValues.sort().join(', ');
        }
      });
      
      // Find the count metric for PCT calculations (employee_count__count__sum)
      const countMetric = metrics.find(m => 
        m.fullName.includes('employee_count') && 
        m.aggregationType === 'SUM' && 
        m.type === 'count'
      );
      
      let totalCount = 0;
      if (countMetric) {
        const countValues = group.rows
          .map(r => r[countMetric.fullName])
          .filter(v => v !== null && v !== undefined && !isNaN(v));
        totalCount = countValues.reduce((sum, v) => sum + Number(v), 0);
      }
      
      // Aggregate each metric
      metrics.forEach(metric => {
        const col = allColumns.find(c => c.fullName === metric.fullName);
        const values = group.rows
          .map(r => r[metric.fullName])
          .filter(v => v !== null && v !== undefined && !isNaN(v));
        
        if (values.length === 0) {
          aggregatedRow[metric.fullName] = null;
          return;
        }

        const aggType = col?.aggregationType || 'AVG';
        
        switch (aggType) {
          case 'SUM':
            aggregatedRow[metric.fullName] = values.reduce((sum, v) => sum + Number(v), 0);
            break;
          case 'AVG':
            aggregatedRow[metric.fullName] = values.reduce((sum, v) => sum + Number(v), 0) / values.length;
            break;
          case 'PCT':
            // Weighted average: sum(metric * count) / sum(count)
            if (countMetric && totalCount > 0) {
              const weightedSum = group.rows.reduce((sum, row) => {
                const metricVal = row[metric.fullName];
                const countVal = row[countMetric.fullName];
                if (metricVal !== null && metricVal !== undefined && !isNaN(metricVal) &&
                    countVal !== null && countVal !== undefined && !isNaN(countVal)) {
                  return sum + (Number(metricVal) * Number(countVal));
                }
                return sum;
              }, 0);
              aggregatedRow[metric.fullName] = weightedSum / totalCount;
            } else {
              // Fallback to simple average if no count metric found
              aggregatedRow[metric.fullName] = values.reduce((sum, v) => sum + Number(v), 0) / values.length;
            }
            break;
          case 'COUNT':
            aggregatedRow[metric.fullName] = values.length;
            break;
          case 'MIN':
            aggregatedRow[metric.fullName] = Math.min(...values.map(v => Number(v)));
            break;
          case 'MAX':
            aggregatedRow[metric.fullName] = Math.max(...values.map(v => Number(v)));
            break;
          default:
            aggregatedRow[metric.fullName] = values.reduce((sum, v) => sum + Number(v), 0) / values.length;
        }
      });
      
      return aggregatedRow;
    });
  };

  const applyDimensionFilters = (data) => {
    return data.filter(row => {
      // Check each dimension filter (INCLUDE - must match at least one)
      const passesIncludes = Object.entries(dimensionFilters).every(([dimName, filterValue]) => {
        if (!filterValue || filterValue.trim() === '') return true;

        const rowValue = String(row[dimName] || '').toLowerCase();
        const filters = filterValue.split(',').map(f => f.trim().toLowerCase()).filter(f => f);

        // Row passes if it matches ANY of the comma-separated filters (OR logic)
        return filters.some(filter => rowValue.includes(filter));
      });

      // Check each dimension exclude (EXCLUDE - must not match any)
      const passesExcludes = Object.entries(dimensionExcludes).every(([dimName, excludeValue]) => {
        if (!excludeValue || excludeValue.trim() === '') return true;

        const rowValue = String(row[dimName] || '').toLowerCase();
        const excludes = excludeValue.split(',').map(f => f.trim().toLowerCase()).filter(f => f);

        // Row passes if it does NOT match ANY of the comma-separated excludes
        return !excludes.some(exclude => rowValue.includes(exclude));
      });

      return passesIncludes && passesExcludes;
    });
  };

  const applyMetricFilters = (data) => {
    return data.filter(row => {
      // Check each metric range filter
      const passesMetricRanges = Object.entries(metricRanges).every(([metricName, range]) => {
        if (!range) return true;
        
        const value = Number(row[metricName]);
        if (isNaN(value)) return true; // Skip null/undefined/non-numeric values
        
        return value >= range[0] && value <= range[1];
      });

      return passesMetricRanges;
    });
  };

  const applyFilters = (data) => {
    // Apply dimension filters first, then metric filters
    let filtered = applyDimensionFilters(data);
    filtered = applyMetricFilters(filtered);
    return filtered;
  };

  const applySorting = (data) => {
    if (!sortColumns || sortColumns.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const column of sortColumns) {
        const aVal = a[column];
        const bVal = b[column];
        const order = sortOrders[column] || 'asc';

        // Handle null/undefined
        if (aVal == null && bVal == null) continue;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let comparison = 0;
        // Numeric comparison for metrics
        const aNum = Number(aVal);
        const bNum = Number(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          // String comparison fallback
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return order === 'asc' ? comparison : -comparison;
        }
        // If equal, continue to next sort column
      }
      return 0;
    });
  };

  const getProcessedData = () => {
    // IMPORTANT: Process in the correct order:
    // 1. Filter raw data first (before aggregation)
    // 2. Aggregate filtered data (if dimensions hidden)
    // 3. Apply aggregated metric filters
    // 4. Sort the final result
    let processed = applyFilters(data);
    processed = aggregateData(processed, selectedDimensions, columns);
    
    // Apply aggregated metric range filters
    if (Object.keys(aggMetricRanges).length > 0) {
      processed = processed.filter(row => {
        return Object.entries(aggMetricRanges).every(([metricName, range]) => {
          if (!range) return true;
          
          const value = Number(row[metricName]);
          if (isNaN(value)) return true;
          
          return value >= range[0] && value <= range[1];
        });
      });
    }
    
    processed = applySorting(processed);
    return processed;
  };

  // Calculate filter ratio: visible records / total records
  const getFilterRatio = () => {
    const totalCount = data.length;
    const visibleCount = applyFilters(data).length;
    
    if (totalCount === 0) return { percentage: 100, visible: 0, total: 0 };
    
    const percentage = ((visibleCount / totalCount) * 100).toFixed(1);
    return { percentage, visible: visibleCount, total: totalCount };
  };

  // Calculate filter funnel: total -> after dim filters -> after fact filters -> after agg filters
  // Shows RAW ROW counts at each filtering stage (before aggregation/grouping)
  // Agg stage shows SUM of employee counts from displayed groups
  const getFilterFunnel = () => {
    // Stage 1: Total raw rows (no filters)
    const total = data.length;
    
    // Stage 2: After dimension filters (raw rows)
    const afterDimFiltersData = applyDimensionFilters(data);
    const afterDimFilters = afterDimFiltersData.length;
    
    // Stage 3: After dimension + metric filters (fact filters on raw data)
    const afterFactFiltersData = applyFilters(data);
    const afterFactFilters = afterFactFiltersData.length;
    
    // Stage 4: Sum of employee counts from final displayed aggregated rows
    const finalDisplayedRows = getProcessedData();
    
    // Find the employee count column
    const countColumn = columns.find(c => c.cleanName === 'employee_count' || c.fullName.includes('employee_count'));
    
    let afterAggFilters;
    if (countColumn && selectedDimensions.length > 0) {
      // Sum the employee_count from all displayed aggregated rows
      afterAggFilters = finalDisplayedRows.reduce((sum, row) => {
        const count = Number(row[countColumn.fullName]) || 0;
        return sum + count;
      }, 0);
    } else {
      // No grouping or no count column, just use row count
      afterAggFilters = finalDisplayedRows.length;
    }
    
    return {
      total,
      afterDimFilters,
      afterFactFilters,
      afterAggFilters,
      dimFilterPct: total > 0 ? ((afterDimFilters / total) * 100).toFixed(1) : 100,
      factFilterPct: afterDimFilters > 0 ? ((afterFactFilters / afterDimFilters) * 100).toFixed(1) : 100,
      aggFilterPct: afterFactFilters > 0 ? ((afterAggFilters / afterFactFilters) * 100).toFixed(1) : 100,
      totalPct: total > 0 ? ((afterAggFilters / total) * 100).toFixed(1) : 100,
    };
  };

  const filterRatio = getFilterRatio();
  const filterFunnel = getFilterFunnel();

  // Handle saving Query (SQL + metadata)
  const handleSaveQuery = async () => {
    if (!queryName) {
      alert('Please provide a Query Name');
      return;
    }

    setQuerySaving(true);

    try {
      const queryPayload = {
        name: queryName,
        description: queryDescription || `Query for ${title}`,
        sql_query: editableQuery, // Use editableQuery from the editor, not the prop
        database: database
      };

      const data = await apiClient.createQuery(queryPayload);
      setSavedQueryId(data.id);
      
      alert(`Query "${queryName}" saved successfully! ID: ${data.id}`);
      setQueryDialogOpen(false);
      setQueryName('');
      setQueryDescription('');

    } catch (error) {
      console.error('Query save error:', error);
      alert(`Error saving query: ${error.data?.name?.[0] || error.message}`);
    } finally {
      setQuerySaving(false);
    }
  };

  // Handle saving View (configuration)
  const handleSaveView = async () => {
    if (!viewName) {
      alert('Please provide a View Name');
      return;
    }

    if (!savedQueryId) {
      alert('Please save the Query first before saving a View');
      return;
    }

    setViewSaving(true);

    try {
      const viewPayload = {
        name: viewName,
        description: viewDescription || `View for ${title}`,
        query: savedQueryId,
        config: {
          title: title,
          thresholds: thresholds,
          dimensionFilters: dimensionFilters,
          dimensionExcludes: dimensionExcludes,
          enabledFilters: enabledFilters,
          metricRanges: metricRanges,
          aggMetricRanges: aggMetricRanges,
          visibleColumns: visibleColumns,
          selectedDimensions: selectedDimensions,
          sortColumns: sortColumns,
          sortOrders: sortOrders
        }
      };

      await apiClient.createQueryView(viewPayload);
      
      alert(`View "${viewName}" saved successfully!`);
      setViewDialogOpen(false);
      setViewName('');
      setViewDescription('');

    } catch (error) {
      console.error('View save error:', error);
      alert(`Error saving view: ${error.data?.name?.[0] || error.message}`);
    } finally {
      setViewSaving(false);
    }
  };

  return (
    <Card className="configurable-metrics-card" elevation={3} sx={{ m: 0 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.1rem' }}>
            {title}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              size="small"
              onClick={handleRunQuery}
              disabled={queryRunning}
              sx={{ 
                p: 0.5,
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'error.dark'
                },
                '&:disabled': {
                  bgcolor: 'grey.400',
                  color: 'white'
                }
              }}
              title="Run edited query"
            >
              {queryRunning ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon fontSize="small" />}
            </IconButton>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setQueryDialogOpen(true)}
              startIcon={<SaveIcon fontSize="small" />}
              sx={{ 
                minWidth: 'auto',
                px: 1,
                py: 0.5,
                fontSize: '0.75rem',
                borderColor: savedQueryId ? 'success.main' : 'grey.400',
                color: savedQueryId ? 'success.main' : 'text.secondary',
                '&:hover': {
                  borderColor: savedQueryId ? 'success.dark' : 'grey.600',
                  bgcolor: savedQueryId ? 'success.50' : 'grey.50'
                }
              }}
              title="Save Query (SQL)"
            >
              {savedQueryId ? `Query #${savedQueryId}` : 'Save Query'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setViewDialogOpen(true)}
              startIcon={<SaveIcon fontSize="small" />}
              disabled={!savedQueryId}
              sx={{ 
                minWidth: 'auto',
                px: 1,
                py: 0.5,
                fontSize: '0.75rem'
              }}
              title="Save View (Configuration)"
              color="primary"
            >
              Save View
            </Button>
            <Chip 
              icon={<StorageIcon />}
              label={database.toUpperCase()} 
              size="small" 
              variant="outlined"
              sx={{ height: 20 }}
            />
          </Box>
        </Box>

        {description && (
          <Typography variant="body2" color="text.secondary" mb={1} sx={{ fontSize: '0.8rem' }}>
            {description}
          </Typography>
        )}

        {/* Configuration Accordion with Tabs */}
        <Accordion sx={{ mb: 1, bgcolor: '#fafafa' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="subtitle2" fontWeight="600">
                ⚙️ Configuration
              </Typography>
              <Chip 
                label={`${Object.values(dimensionFilters).filter(v => v).length + Object.values(dimensionExcludes).filter(v => v).length + Object.keys(metricRanges).length + Object.keys(aggMetricRanges).length} filters`}
                size="small" 
                color="primary"
                sx={{ height: 20 }}
              />
              <Chip 
                label={`Total: ${filterFunnel.total}`}
                size="small" 
                variant="outlined"
                sx={{ height: 20, fontWeight: 600 }}
              />
              <Chip 
                label={`Dim: ${filterFunnel.afterDimFilters} (${filterFunnel.dimFilterPct}%)`}
                size="small" 
                color={filterFunnel.dimFilterPct < 100 ? "warning" : "default"}
                variant="filled"
                sx={{ height: 20, fontWeight: 600 }}
              />
              <Chip 
                label={`Fact: ${filterFunnel.afterFactFilters} (${filterFunnel.factFilterPct}%)`}
                size="small" 
                color={filterFunnel.factFilterPct < 100 ? "warning" : "default"}
                variant="filled"
                sx={{ height: 20, fontWeight: 600 }}
              />
              <Chip 
                label={`Agg: ${filterFunnel.afterAggFilters} (${filterFunnel.aggFilterPct}%)`}
                size="small" 
                color={filterFunnel.aggFilterPct < 100 ? "error" : "default"}
                variant="filled"
                sx={{ height: 20, fontWeight: 600 }}
              />
              <Chip 
                label={`${visibleColumns.filter(c => metrics.some(m => m.fullName === c)).length} metrics visible`}
                size="small" 
                variant="outlined"
                sx={{ height: 20 }}
              />
              <Chip 
                label={`${selectedDimensions.length} grouped`}
                size="small" 
                color="warning"
                variant="outlined"
                sx={{ height: 20 }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Tabs 
              value={configTab} 
              onChange={(e, newValue) => setConfigTab(newValue)} 
              sx={{ 
                borderBottom: 2, 
                borderColor: '#000', 
                mb: 2,
                '& .MuiTab-root': {
                  fontWeight: 700,
                  color: '#666',
                  fontSize: '0.875rem',
                  minHeight: 48,
                  textTransform: 'none',
                },
                '& .Mui-selected': {
                  color: '#000 !important',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#000',
                  height: 3,
                }
              }}
            >
              <Tab label="📝 Query" />
              <Tab label="🔍 Dim Filters" />
              <Tab label="📊 Fact Filters" />
              <Tab label="👁️ Visibility" />
              <Tab label="📈 Group By" />
              <Tab label="📊 Agg Fact Filters" />
            </Tabs>

            {/* Tab 0: Query */}
            {configTab === 0 && (
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={queryRunning ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                    onClick={handleRunQuery}
                    disabled={queryRunning}
                    sx={{ fontWeight: 600 }}
                  >
                    {queryRunning ? 'Running...' : 'Run Query'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Edit the SQL query below and click Run to update the results
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  value={editableQuery}
                  onChange={(e) => setEditableQuery(e.target.value)}
                  variant="outlined"
                  placeholder="Enter your SQL query here..."
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '0.875rem',
                      bgcolor: '#1e1e1e',
                      color: '#d4d4d4',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#404040',
                    },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#007acc',
                    }
                  }}
                />
              </Box>
            )}

            {/* Tab 1: Filters */}
            {configTab === 1 && dimensions.length > 0 && (
              <>
                <Grid container spacing={2}>
                {dimensions.map(dim => {
                  const isEnabled = enabledFilters[dim.fullName];
                  const uniqueValues = isEnabled ? getUniqueValuesForDimension(dim.fullName) : [];
                  const hasIncludeFilter = dimensionFilters[dim.fullName]?.trim();
                  const hasExcludeFilter = dimensionExcludes[dim.fullName]?.trim();
                  const hasAnyFilter = hasIncludeFilter || hasExcludeFilter;
                  
                  // Split for highlighting
                  const includeTerms = hasIncludeFilter ? hasIncludeFilter.toLowerCase().split(',').map(t => t.trim()) : [];
                  const excludeTerms = hasExcludeFilter ? hasExcludeFilter.toLowerCase().split(',').map(t => t.trim()) : [];
                  
                  return (
                    <Grid item xs={12} md={6} key={dim.fullName}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          borderColor: isEnabled ? (hasAnyFilter ? 'primary.main' : 'action.active') : 'divider',
                          borderWidth: isEnabled ? 2 : 1,
                          bgcolor: isEnabled ? (hasAnyFilter ? 'primary.50' : 'action.hover') : 'background.paper',
                          opacity: isEnabled ? 1 : 0.6
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={isEnabled ? 1 : 0}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Checkbox
                              checked={isEnabled || false}
                              onChange={() => toggleFilterEnabled(dim.fullName)}
                              size="small"
                              sx={{ p: 0 }}
                            />
                            <Typography 
                              variant="caption" 
                              fontWeight="600" 
                              color={isEnabled ? (hasAnyFilter ? 'primary' : 'text.primary') : 'text.secondary'}
                              sx={{ cursor: 'pointer' }}
                              onClick={() => toggleFilterEnabled(dim.fullName)}
                            >
                              {dim.displayName}
                            </Typography>
                          </Box>
                          {hasAnyFilter && (
                            <Chip 
                              label="ACTIVE" 
                              size="small" 
                              color="primary"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        
                        {isEnabled && (
                          <>
                            <TextField
                              fullWidth
                              size="small"
                              label="Include (contains)"
                              placeholder="comma-separated values"
                              value={dimensionFilters[dim.fullName] || ''}
                              onChange={(e) => handleFilterChange(dim.fullName, e.target.value)}
                              sx={{ mb: 1 }}
                              InputProps={{
                                sx: { fontSize: '0.875rem', bgcolor: 'background.paper' }
                              }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              label="Exclude (contains)"
                              placeholder="comma-separated values"
                              value={dimensionExcludes[dim.fullName] || ''}
                              onChange={(e) => handleExcludeChange(dim.fullName, e.target.value)}
                              sx={{ mb: 1 }}
                              InputProps={{
                                sx: { fontSize: '0.875rem', bgcolor: 'background.paper' }
                              }}
                            />
                            {hasAnyFilter && (
                              <Box sx={{ maxHeight: '100px', overflow: 'auto', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                  Available values ({uniqueValues.length}):
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {uniqueValues.slice(0, 20).map(value => {
                                    const valueLower = value.toLowerCase();
                                    const isIncluded = includeTerms.some(term => term && valueLower.includes(term));
                                    const isExcluded = excludeTerms.some(term => term && valueLower.includes(term));
                                    
                                    return (
                                      <Chip
                                        key={value}
                                        label={value}
                                        size="small"
                                        variant={isIncluded ? "filled" : "outlined"}
                                        color={isExcluded ? "error" : isIncluded ? "primary" : "default"}
                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                        onClick={() => {
                                          if (isExcluded) {
                                            // Remove from exclude
                                            const current = dimensionExcludes[dim.fullName] || '';
                                            const values = current.split(',').map(v => v.trim()).filter(v => v && v !== value);
                                            handleExcludeChange(dim.fullName, values.join(', '));
                                          } else {
                                            // Add to include
                                            const current = dimensionFilters[dim.fullName] || '';
                                            const values = current.split(',').map(v => v.trim()).filter(v => v);
                                            if (!values.includes(value)) {
                                              handleFilterChange(dim.fullName, [...values, value].join(', '));
                                            }
                                          }
                                        }}
                                      />
                                    );
                                  })}
                                  {uniqueValues.length > 20 && (
                                    <Typography variant="caption" color="text.secondary">
                                      ... +{uniqueValues.length - 20} more
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}                
                </Grid>
              </>
            )}            {/* Tab 2: Fact Filters (Metric Ranges) */}
            {configTab === 2 && metrics.length > 0 && (
              <>
                <Grid container spacing={2}>
                  {getVisibleColumns()
                    .map(colName => columns.find(c => c.fullName === colName))
                    .filter(col => col && col.isMetric)
                    .map(metric => {
                      const values = data.map(row => Number(row[metric.fullName])).filter(v => !isNaN(v));
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} key={metric.fullName}>
                          {enableHistograms ? (
                            <HistogramSlider
                              label={metric.displayName}
                              values={values}
                              range={metricRanges[metric.fullName]}
                              onChange={(newRange) => {
                                setMetricRanges(prev => ({
                                  ...prev,
                                  [metric.fullName]: newRange
                                }));
                              }}
                              onReset={() => {
                                setMetricRanges(prev => {
                                  const updated = { ...prev };
                                  delete updated[metric.fullName];
                                  return updated;
                                });
                              }}
                              bins={20}
                            />
                          ) : (
                            <SimpleRangeSlider
                              label={metric.displayName}
                              values={values}
                              range={metricRanges[metric.fullName]}
                              onChange={(newRange) => {
                                setMetricRanges(prev => ({
                                  ...prev,
                                  [metric.fullName]: newRange
                                }));
                              }}
                              onReset={() => {
                                setMetricRanges(prev => {
                                  const updated = { ...prev };
                                  delete updated[metric.fullName];
                                  return updated;
                                });
                              }}
                            />
                          )}
                        </Grid>
                      );
                    })}
                </Grid>
              </>
            )}

            {/* Tab 3: Column Visibility */}
            {configTab === 3 && (
              <>
                <TextField
              fullWidth
              size="small"
              label="Search hidden metrics"
              placeholder="Filter by metric name..."
              value={columnSearchFilter}
              onChange={(e) => setColumnSearchFilter(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { fontSize: '0.875rem', bgcolor: 'background.paper' }
              }}
            />

            {/* Hidden metrics (not visible) */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" display="block" mb={1}>
                HIDDEN METRICS (click to show):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {metrics
                  .filter(col => !visibleColumns.includes(col.fullName))
                  .filter(col => 
                    columnSearchFilter === '' || 
                    col.displayName.toLowerCase().includes(columnSearchFilter.toLowerCase())
                  )
                  .map(col => (
                    <Chip
                      key={col.fullName}
                      label={col.displayName}
                      size="small"
                      variant="outlined"
                      onClick={() => toggleColumnVisibility(col.fullName)}
                      sx={{ 
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      icon={<span>📈</span>}
                    />
                  ))}
                {metrics
                  .filter(col => !visibleColumns.includes(col.fullName))
                  .filter(col => 
                    columnSearchFilter === '' || 
                    col.displayName.toLowerCase().includes(columnSearchFilter.toLowerCase())
                  ).length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {columnSearchFilter ? 'No matching hidden metrics' : 'All metrics are visible'}
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Visible metrics (currently shown) */}
            <Box>
              <Typography variant="caption" fontWeight="600" color="secondary" display="block" mb={1}>
                VISIBLE METRICS (click to hide):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {metrics
                  .filter(col => visibleColumns.includes(col.fullName))
                  .map(col => (
                    <Chip
                      key={col.fullName}
                      label={col.displayName}
                      size="small"
                      color="secondary"
                      onClick={() => toggleColumnVisibility(col.fullName)}
                      onDelete={() => toggleColumnVisibility(col.fullName)}
                      sx={{ 
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
              </Box>
            </Box>
              </>
            )}

            {/* Tab 4: Group By */}
            {configTab === 4 && (
              <>
                <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
                  Select dimensions to group by. Uncheck dimensions to aggregate data (metrics will be summed/averaged).
                </Alert>
                
                <Box display="flex" flexWrap="wrap" gap={0.5}>
              {dimensions.map(dim => (
                <Chip
                  key={dim.fullName}
                  label={dim.displayName}
                  size="small"
                  color={selectedDimensions.includes(dim.fullName) ? "warning" : "default"}
                  variant={selectedDimensions.includes(dim.fullName) ? "filled" : "outlined"}
                  onClick={() => handleDimensionToggle(dim.fullName)}
                  onDelete={selectedDimensions.includes(dim.fullName) ? () => handleDimensionToggle(dim.fullName) : undefined}
                  sx={{ 
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>
              </>
            )}

            {/* Tab 5: Aggregated Fact Filters */}
            {configTab === 5 && metrics.length > 0 && (() => {
              // Get currently displayed data (after all filters and aggregation, but before agg metric filters)
              let displayedData = applyFilters(data);
              displayedData = aggregateData(displayedData, selectedDimensions, columns);
              
              return (
                <>
                  <Grid container spacing={2}>
                    {getVisibleColumns()
                      .map(colName => columns.find(c => c.fullName === colName))
                      .filter(col => col && col.isMetric)
                      .map(metric => {
                        // Extract values from currently displayed aggregated data
                        const values = displayedData.map(row => Number(row[metric.fullName])).filter(v => !isNaN(v));
                        
                        return (
                          <Grid item xs={12} sm={6} md={4} key={metric.fullName}>
                            {enableHistograms ? (
                              <HistogramSlider
                                label={`${metric.displayName} (Aggregated)`}
                                values={values}
                                range={aggMetricRanges[metric.fullName]}
                                onChange={(newRange) => {
                                  setAggMetricRanges(prev => ({
                                    ...prev,
                                    [metric.fullName]: newRange
                                  }));
                                }}
                                onReset={() => {
                                  setAggMetricRanges(prev => {
                                    const updated = { ...prev };
                                    delete updated[metric.fullName];
                                    return updated;
                                  });
                                }}
                                bins={20}
                              />
                            ) : (
                              <SimpleRangeSlider
                                label={`${metric.displayName} (Aggregated)`}
                                values={values}
                                range={aggMetricRanges[metric.fullName]}
                                onChange={(newRange) => {
                                  setAggMetricRanges(prev => ({
                                    ...prev,
                                    [metric.fullName]: newRange
                                  }));
                                }}
                                onReset={() => {
                                  setAggMetricRanges(prev => {
                                    const updated = { ...prev };
                                    delete updated[metric.fullName];
                                    return updated;
                                  });
                                }}
                              />
                            )}
                          </Grid>
                        );
                      })}
                  </Grid>
                </>
              );
            })()}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ mb: 1 }} />

        {/* Results Table */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data.length === 0 && (
          <Alert severity="info">
            No data to display
          </Alert>
        )}

        {!loading && !error && data.length > 0 && (
          <>
            <TableContainer component={Paper} className="metrics-table-container">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {getVisibleColumns().map(colName => {
                      const col = getColumnByName(colName);
                      const isSortable = col?.isMetric;
                      const isInSortList = sortColumns.includes(colName);
                      const sortIndex = sortColumns.indexOf(colName);
                      
                      return (
                        <TableCell 
                          key={colName}
                          className={col?.isMetric ? 'metric-header' : 'dimension-header'}
                          sx={{ 
                            cursor: isSortable ? 'pointer' : 'default',
                            p: 0.5,
                            fontSize: '0.7rem'
                          }}
                          onClick={() => isSortable && handleSort(colName)}
                        >
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {isSortable ? (
                              <Box display="flex" alignItems="center">
                                <TableSortLabel
                                  active={isInSortList}
                                  direction={isInSortList ? (sortOrders[colName] || 'asc') : 'asc'}
                                  sx={{ '& .MuiTableSortLabel-icon': { fontSize: '0.9rem' } }}
                                >
                                  <span style={{ fontSize: '0.7rem' }}>{col?.displayName || colName}</span>
                                </TableSortLabel>
                                {isInSortList && sortIndex >= 0 && (
                                  <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'primary.main', fontWeight: 'bold', fontSize: '0.65rem' }}>
                                    {sortIndex + 1}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <span style={{ fontSize: '0.7rem' }}>{col?.displayName || colName}</span>
                            )}
                          </Box>
                          {col?.isMetric && (
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
                              ({col.hasColorCoding ? col.aggregationType.toLowerCase() : 'count'})
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {/* Filter Row - under headers */}
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    {getVisibleColumns().map(colName => {
                      const col = getColumnByName(colName);
                      
                      // Only show filter inputs for dimensions
                      if (!col?.isDimension) {
                        return <TableCell key={colName} sx={{ p: 0.5 }} />;
                      }
                      
                      return (
                        <TableCell key={colName} sx={{ p: 0.5 }}>
                          <TextField
                            size="small"
                            placeholder={`Filter ${col.displayName}...`}
                            value={dimensionFilters[col.fullName] || ''}
                            onChange={(e) => {
                              setDimensionFilters(prev => ({
                                ...prev,
                                [col.fullName]: e.target.value
                              }));
                            }}
                            sx={{ 
                              width: '100%',
                              '& .MuiInputBase-root': { 
                                fontSize: '0.7rem',
                                height: '28px'
                              }
                            }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getProcessedData().map((row, rowIndex) => (
                    <TableRow key={rowIndex} hover>
                      {getVisibleColumns().map(colName => {
                        const col = getColumnByName(colName);
                        return (
                          <TableCell 
                            key={colName}
                            sx={{ 
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '250px',
                              p: 0.5,
                              fontSize: '0.75rem'
                            }}
                          >
                            {col?.isMetric
                              ? renderMetricCell(row[colName], colName)
                              : (row[colName] ?? '—')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Legend */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                Legend:
              </Typography>
              <Chip label={`Green ≥ ${thresholds.yellow}`} size="small" className="metric-chip metric-green" />
              <Chip label={`Yellow ${thresholds.red}-${thresholds.yellow - 0.1}`} size="small" className="metric-chip metric-yellow" />
              <Chip label={`Red < ${thresholds.red}`} size="small" className="metric-chip metric-red" />
            </Box>
          </>
        )}
      </CardContent>

      {/* Query Save Dialog */}
      <Dialog open={queryDialogOpen} onClose={() => !querySaving && setQueryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>💾 Save Query (SQL)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Save the SQL query for reuse. After saving, you can create multiple views with different configurations.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Query Name"
            type="text"
            fullWidth
            variant="outlined"
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            disabled={querySaving}
            sx={{ mb: 2 }}
            helperText="Unique name for the SQL query"
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={queryDescription}
            onChange={(e) => setQueryDescription(e.target.value)}
            disabled={querySaving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueryDialogOpen(false)} disabled={querySaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveQuery} 
            variant="contained" 
            disabled={querySaving || !queryName}
            startIcon={querySaving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            Save Query
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Save Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => !viewSaving && setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>⚙️ Save View (Configuration)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Save the current configuration (filters, visibility, grouping) as a reusable view.
            {savedQueryId && <Box component="span" sx={{ fontWeight: 600, color: 'success.main' }}> Query ID: {savedQueryId}</Box>}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="View Name"
            type="text"
            fullWidth
            variant="outlined"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            disabled={viewSaving}
            sx={{ mb: 2 }}
            helperText="Unique name for this view configuration"
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={viewDescription}
            onChange={(e) => setViewDescription(e.target.value)}
            disabled={viewSaving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} disabled={viewSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveView} 
            variant="contained" 
            disabled={viewSaving || !viewName || !savedQueryId}
            startIcon={viewSaving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            Save View
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ConfigurableMetricsCard;
