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
import apiClient from '../services/apiClient';
import HistogramSlider from './HistogramSlider';
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
 * - 'columnname__count__sum' → Count metric (no color), summed when dimension hidden
 * - 'columnname__count__avg' → Count metric (no color), averaged when dimension hidden
 * 
 * Aggregation types: avg, sum, pct, count, min, max
 * 
 * Example query:
 * SELECT 
 *   manager_full_name AS manager__dim,
 *   reporting_level AS level__dim,
 *   1 AS employee_count__count__sum,
 *   avg_accomplishments_recognised AS accomplishments__metric__pct,
 *   avg_great_place_to_work AS workplace__metric__pct
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
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [columnSearchFilter, setColumnSearchFilter] = useState('');
  const [configTab, setConfigTab] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportQueryName, setExportQueryName] = useState('');
  const [exportViewName, setExportViewName] = useState('');
  const [exportDescription, setExportDescription] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (query) {
      executeQuery();
    }
  }, [query, database]);

  const parseColumnMetadata = (columnName) => {
    // Parse column naming convention: columnname__type__aggregation
    // Examples:
    //   manager__dim
    //   avg_score__metric__avg
    //   avg_score__metric__pct
    //   employee_count__count__sum
    const parts = columnName.split('__');
    const cleanName = parts[0];
    const type = parts[1] || 'text';
    const aggregation = parts[2] || null; // 'avg', 'sum', 'pct', 'count', 'min', 'max'

    return {
      fullName: columnName,
      displayName: cleanName.replace(/_/g, ' '),
      cleanName: cleanName,
      type: type, // 'dim', 'metric', 'count', 'sum', 'avg', 'hidden'
      isDimension: type === 'dim',
      isMetric: type === 'metric' || type === 'count',
      hasColorCoding: type === 'metric',
      aggregationType: aggregation ? aggregation.toUpperCase() : 'AVG',
    };
  };

  const executeQuery = async () => {
    setLoading(true);
    setError(null);

    try {
      // Always use 'galaxy' as the database regardless of prop value
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
        
        // Start with FIRST dimension selected for grouping by default
        const defaultGroupBy = dims.length > 0 ? [dims[0].fullName] : [];
        setSelectedDimensions(defaultGroupBy);
        setSelectedMetrics(mets.map(m => m.fullName));
        
        // Set visible columns: first 3 metrics only (dimensions auto-show from group by)
        const defaultVisible = [
          ...mets.slice(0, 3).map(m => m.fullName)
        ];
        setVisibleColumns(defaultVisible);
        
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

    setSortConfig(prev => ({
      column: columnName,
      direction: prev.column === columnName && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
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
    
    // If it's a count/sum/avg type (no color coding)
    if (col && !col.hasColorCoding) {
      const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
      return <span style={{ fontWeight: 500 }}>{displayValue}</span>;
    }

    // If it's a metric with color coding
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
    if (!sortConfig.column) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Numeric comparison for metrics
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // String comparison fallback
      return sortConfig.direction === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
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

  // Handle exporting query and view configuration to backend
  const handleExport = async () => {
    if (!exportQueryName || !exportViewName) {
      alert('Please provide both Query Name and View Name');
      return;
    }

    setExportLoading(true);
    setExportSuccess(false);

    try {
      // 1. Create or get Query
      const queryPayload = {
        name: exportQueryName,
        description: exportDescription || `Query for ${title}`,
        sql_query: query,
        database: database
      };

      let queryResponse = await apiClient.post('/queries/', queryPayload);
      const queryId = queryResponse.data.id;

      // 2. Create QueryView with current configuration
      const viewPayload = {
        name: exportViewName,
        description: exportDescription || `View for ${title}`,
        query: queryId,
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
          sortConfig: sortConfig
        }
      };

      await apiClient.post('/query-views/', viewPayload);
      
      setExportSuccess(true);
      setTimeout(() => {
        setExportDialogOpen(false);
        setExportQueryName('');
        setExportViewName('');
        setExportDescription('');
        setExportSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Error exporting: ${error.response?.data?.name?.[0] || error.message}`);
    } finally {
      setExportLoading(false);
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
              onClick={() => setExportDialogOpen(true)}
              sx={{ p: 0.5 }}
              title="Save query configuration"
            >
              <SaveIcon fontSize="small" />
            </IconButton>
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
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                bgcolor: '#1e1e1e', 
                color: '#d4d4d4',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflow: 'auto',
                maxHeight: '400px'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {query}
              </pre>
            </Paper>
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
                      const isCurrentSort = sortConfig.column === colName;
                      
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
                              <TableSortLabel
                                active={isCurrentSort}
                                direction={isCurrentSort ? sortConfig.direction : 'asc'}
                                sx={{ '& .MuiTableSortLabel-icon': { fontSize: '0.9rem' } }}
                              >
                                <span style={{ fontSize: '0.7rem' }}>{col?.displayName || colName}</span>
                              </TableSortLabel>
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

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Query Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Query Name"
              value={exportQueryName}
              onChange={(e) => setExportQueryName(e.target.value)}
              fullWidth
              required
              helperText="Unique name for the SQL query"
            />
            <TextField
              label="View Name"
              value={exportViewName}
              onChange={(e) => setExportViewName(e.target.value)}
              fullWidth
              required
              helperText="Unique name for this specific configuration"
            />
            <TextField
              label="Description (Optional)"
              value={exportDescription}
              onChange={(e) => setExportDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            {exportSuccess && (
              <Alert severity="success">Successfully saved!</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)} disabled={exportLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            variant="contained" 
            disabled={exportLoading || !exportQueryName || !exportViewName}
            startIcon={exportLoading ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ConfigurableMetricsCard;
