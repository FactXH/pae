import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MetricsTable from './MetricsTable';
import apiClient from '../services/apiClient';

/**
 * MetricsQueryBuilder Component
 * 
 * Provides an interface to build and execute SQL queries with metrics visualization
 * 
 * Example queries with column naming:
 * 
 * SELECT 
 *   manager_full_name AS manager__dim,
 *   reporting_level AS level__dim,
 *   level_employee_count AS employee_count__metric,
 *   avg_accomplishments_recognised AS accomplishments__metric,
 *   avg_great_place_to_work AS workplace__metric
 * FROM data_lake_dev_xavi_gold.gold_climate_2025_by_manager
 */
const MetricsQueryBuilder = () => {
  const [query, setQuery] = useState('');
  const [executedQuery, setExecutedQuery] = useState('');
    // Sorting configuration
    const [sortColumns, setSortColumns] = useState([]);
    const [sortOrders, setSortOrders] = useState({});
  const [title, setTitle] = useState('Query Results');
  const [redThreshold, setRedThreshold] = useState(2.2);
  const [yellowThreshold, setYellowThreshold] = useState(4.0);
  
  // Column configuration
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedDimensions, setSelectedDimensions] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [metricAggregations, setMetricAggregations] = useState({});
  const [useGroupBy, setUseGroupBy] = useState(false);

  // Example queries
  const examples = [
    {
      name: 'Manager Climate Metrics',
      query: `SELECT 
  manager_full_name,
  reporting_level,
  level_employee_count,
  avg_accomplishments_recognised,
  avg_great_place_to_work
FROM data_lake_dev_xavi_gold.gold_climate_2025_by_manager`,
      title: 'Manager Climate Survey Results',
    },
    {
      name: 'Custom Query',
      query: '',
      title: 'Custom Query Results',
    },
  ];

  // Detect columns from query
  useEffect(() => {
    if (query) {
      detectColumnsFromQuery();
    }
  }, [query]);

  const detectColumnsFromQuery = async () => {
    try {
      // Try to execute query with LIMIT 1 to get column names
      const limitQuery = query.replace(/;?\s*$/i, '') + ' LIMIT 1';
      const result = await apiClient.executeSQL(limitQuery);
      
      if (result.columns) {
        const cols = result.columns.map(col => {
          const colName = col.name || col;
          // Guess if it's a metric or dimension based on common patterns
          const isMetric = colName.includes('avg_') || 
                          colName.includes('sum_') || 
                          colName.includes('count') ||
                          colName.includes('total') ||
                          colName.includes('_count') ||
                          !isNaN(result.data?.[0]?.[colName]);
          
          return {
            name: colName,
            type: isMetric ? 'metric' : 'dimension',
          };
        });
        setAvailableColumns(cols);
        
        // Auto-select all by default
        setSelectedDimensions(cols.filter(c => c.type === 'dimension').map(c => c.name));
        setSelectedMetrics(cols.filter(c => c.type === 'metric').map(c => c.name));
        
        // Set default aggregations
        const defaultAggs = {};
        cols.filter(c => c.type === 'metric').forEach(col => {
          defaultAggs[col.name] = 'AVG';
        });
        setMetricAggregations(defaultAggs);
      }
    } catch (err) {
      console.error('Failed to detect columns:', err);
    }
  };

  const handleLoadExample = (example) => {
    setQuery(example.query);
    setTitle(example.title);
  };

  const handleDimensionToggle = (dimName) => {
    setSelectedDimensions(prev => 
      prev.includes(dimName) 
        ? prev.filter(d => d !== dimName)
        : [...prev, dimName]
    );
  };

  const handleMetricToggle = (metricName) => {
    setSelectedMetrics(prev => 
      prev.includes(metricName)
        ? prev.filter(m => m !== metricName)
        : [...prev, metricName]
    );
  };

  const handleAggregationChange = (metricName, aggType) => {
    setMetricAggregations(prev => ({
      ...prev,
      [metricName]: aggType,
    }));
  };

  const handleSortColumnToggle = (colName) => {
    setSortColumns(prev =>
      prev.includes(colName)
        ? prev.filter(c => c !== colName)
        : [...prev, colName]
    );
  };

  const handleSortOrderChange = (colName, order) => {
    setSortOrders(prev => ({ ...prev, [colName]: order }));
  };

  const handleExecute = () => {
    if (query.trim()) {
      setExecutedQuery(query);
    }
  };

  const getVisibleColumns = () => {
    const dims = selectedDimensions.map(d => d + '__dim');
    const metrics = selectedMetrics.map(m => m + '__metric');
    return [...dims, ...metrics];
  };

  const getGroupByDimensions = () => {
    return useGroupBy ? selectedDimensions.map(d => d + '__dim') : null;
  };

  const getMetricAggregationsFormatted = () => {
    if (!useGroupBy) return {};
    
    const formatted = {};
    selectedMetrics.forEach(metric => {
      formatted[metric + '__metric'] = metricAggregations[metric] || 'AVG';
    });
    return formatted;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Metrics Query Builder
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Query Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Load Example</InputLabel>
                  <Select
                    label="Load Example"
                    onChange={(e) => handleLoadExample(examples[e.target.value])}
                  >
                    {examples.map((ex, idx) => (
                      <MenuItem key={idx} value={idx}>
                        {ex.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Query Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Red Threshold (< value)"
                  type="number"
                  value={redThreshold}
                  onChange={(e) => setRedThreshold(Number(e.target.value))}
                  size="small"
                  inputProps={{ step: 0.1 }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Yellow Threshold (< value)"
                  type="number"
                  value={yellowThreshold}
                  onChange={(e) => setYellowThreshold(Number(e.target.value))}
                  size="small"
                  inputProps={{ step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  label="SQL Query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your SQL query here.

Example:
SELECT 
  manager_name,
  avg_score,
  count_employees
FROM your_table"
                  sx={{ 
                    fontFamily: 'monospace',
                    '& textarea': { fontFamily: 'monospace' }
                  }}
                />
              </Grid>

              {availableColumns.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      Column Selection
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={useGroupBy}
                          onChange={(e) => setUseGroupBy(e.target.checked)}
                        />
                      }
                      label="Apply GROUP BY (aggregate metrics by selected dimensions)"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        Dimensions (Group By)
                      </Typography>
                      <FormGroup>
                        {availableColumns
                          .filter(col => col.type === 'dimension')
                          .map(col => (
                            <FormControlLabel
                              key={col.name}
                              control={
                                <Checkbox
                                  checked={selectedDimensions.includes(col.name)}
                                  onChange={() => handleDimensionToggle(col.name)}
                                />
                              }
                              label={col.name}
                            />
                          ))}
                      </FormGroup>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        Metrics {useGroupBy && '(with Aggregation)'}
                      </Typography>
                      {availableColumns
                        .filter(col => col.type === 'metric')
                        .map(col => (
                          <Box key={col.name} sx={{ mb: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedMetrics.includes(col.name)}
                                  onChange={() => handleMetricToggle(col.name)}
                                />
                              }
                              label={col.name}
                            />
                            {useGroupBy && selectedMetrics.includes(col.name) && (
                              <RadioGroup
                                row
                                value={metricAggregations[col.name] || 'AVG'}
                                onChange={(e) => handleAggregationChange(col.name, e.target.value)}
                                sx={{ ml: 4, mt: -1 }}
                              >
                                <FormControlLabel value="AVG" control={<Radio size="small" />} label="AVG" />
                                <FormControlLabel value="SUM" control={<Radio size="small" />} label="SUM" />
                                <FormControlLabel value="COUNT" control={<Radio size="small" />} label="COUNT" />
                                <FormControlLabel value="MIN" control={<Radio size="small" />} label="MIN" />
                                <FormControlLabel value="MAX" control={<Radio size="small" />} label="MAX" />
                              </RadioGroup>
                            )}
                          </Box>
                        ))}
                    </Paper>
                  </Grid>
                </>
              )}

              {availableColumns.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      Sorting Options
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        Select columns to sort and their order
                      </Typography>
                      <FormGroup row>
                        {[...selectedDimensions, ...selectedMetrics].map(col => (
                          <FormControlLabel
                            key={col}
                            control={
                              <Checkbox
                                checked={sortColumns.includes(col)}
                                onChange={() => handleSortColumnToggle(col)}
                              />
                            }
                            label={col}
                          />
                        ))}
                      </FormGroup>
                      {sortColumns.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          {sortColumns.map(colName => (
                            <FormControl key={colName} sx={{ mr: 2, mb: 1, minWidth: 150 }} size="small">
                              <InputLabel>{colName} Order</InputLabel>
                              <Select
                                value={sortOrders[colName] || 'ASC'}
                                label={`${colName} Order`}
                                onChange={e => handleSortOrderChange(colName, e.target.value)}
                              >
                                <MenuItem value="ASC">Ascending</MenuItem>
                                <MenuItem value="DESC">Descending</MenuItem>
                              </Select>
                            </FormControl>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleExecute}
                  disabled={!query.trim()}
                  fullWidth
                >
                  Execute Query
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="600">
            How it works:
          </Typography>
          <Typography variant="body2" component="div">
            1. Enter your SQL query above<br />
            2. The system will auto-detect dimensions and metrics<br />
            3. Select which columns to display<br />
            4. (Optional) Enable GROUP BY to aggregate metrics<br />
            5. Choose aggregation type (AVG, SUM, etc.) for each metric<br />
            6. Click Execute to see results with color-coded metrics
          </Typography>
        </Box>
      </Paper>

      {executedQuery && (
        <MetricsTable
          query={executedQuery}
          title={title}
          thresholds={{ red: redThreshold, yellow: yellowThreshold }}
          visibleColumns={getVisibleColumns()}
          groupByDimensions={getGroupByDimensions()}
          metricAggregations={getMetricAggregationsFormatted()}
            sortColumns={sortColumns}
            sortOrders={sortOrders}
          />
      )}
    </Box>
  );
};

export default MetricsQueryBuilder;
