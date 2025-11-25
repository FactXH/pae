    import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Menu,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableChartIcon from '@mui/icons-material/TableChart';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import apiClient from '../services/apiClient';

const QueryView = () => {
  const [query, setQuery] = useState('');
  const [database, setDatabase] = useState('trino');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [columns, setColumns] = useState([]);
  const [schemaInfo, setSchemaInfo] = useState({ tables: [], columns: {} });
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setColumns([]);

    try {
      const response = await apiClient.post('/sql/execute/', {
        query: query.trim(),
        database: database
      });

      console.log('API Response:', response); // Debug log

      // Handle different response formats
      const data = response.data || response;
      
      if (!data) {
        setError('Empty response from server');
        return;
      }

      if (data.status === 'error') {
        setError(data.message || data.error || 'Query execution failed');
        return;
      }

      if (data.status === 'success') {
        const { columns: cols, rows } = data;
        
        if (!cols || !rows) {
          setError('Invalid response format: missing columns or rows');
          return;
        }
        
        if (rows && rows.length > 0) {
          // Convert rows array to array of objects
          const resultData = rows.map(row => {
            const obj = {};
            cols.forEach((col, idx) => {
              obj[col] = row[idx];
            });
            return obj;
          });
          
          setColumns(cols);
          // Show only first 4 columns by default
          setVisibleColumns(cols.slice(0, 4));
          setResults(resultData);
        } else {
          setResults([]);
          setColumns([]);
          setVisibleColumns([]);
          setError('Query returned no results');
        }
      } else {
        setError(`Unexpected response status: ${data.status || 'unknown'}`);
      }
    } catch (err) {
      console.error('Query execution error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to execute query';
      setError(errorMessage);
      
      // Log full error for debugging
      if (err.response?.data) {
        console.error('Server error details:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    // Execute on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      executeQuery();
    }
    // Fullscreen on F11
    if (e.key === 'F11') {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    }
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(c => c !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  const showAllColumns = () => {
    setVisibleColumns(columns);
    setColumnMenuAnchor(null);
  };

  const hideAllColumns = () => {
    setVisibleColumns([]);
    setColumnMenuAnchor(null);
  };

  const containerSx = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#ffffff',
    overflow: 'auto',
    p: 2
  } : {};

  return (
    <Box sx={containerSx}>
      <Grid container spacing={2}>
        {/* Schema Browser - Left Side */}
        {database === 'trino' && !isFullscreen && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 1.5, maxHeight: '80vh', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TableChartIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Schema Browser
                </Typography>
              </Box>

              {loadingSchema ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <Box>
                  {schemaInfo.tables.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No tables found
                    </Typography>
                  ) : (
                    <Box>
                      {/* Group tables by schema */}
                      {[...new Set(schemaInfo.tables.map(t => t.schema))].map(schema => (
                        <Accordion key={schema} defaultExpanded={schema.includes('silver')}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {schema}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 0 }}>
                            <List dense>
                              {schemaInfo.tables
                                .filter(t => t.schema === schema)
                                .map(table => (
                                  <Accordion key={table.fullName} elevation={0}>
                                    <AccordionSummary 
                                      expandIcon={<ExpandMoreIcon fontSize="small" />}
                                      sx={{ 
                                        minHeight: 36,
                                        '& .MuiAccordionSummary-content': { my: 0.5 }
                                      }}
                                    >
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          fontFamily: 'monospace',
                                          fontSize: '0.85rem',
                                          cursor: 'pointer',
                                          '&:hover': { color: 'primary.main' }
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setQuery(`SELECT * FROM ${table.fullName} LIMIT 10`);
                                        }}
                                      >
                                        {table.name}
                                      </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pl: 3, pt: 0, pb: 1 }}>
                                      <List dense disablePadding>
                                        {(schemaInfo.columns[table.fullName] || []).map(col => (
                                          <ListItem key={col.name} sx={{ py: 0, pl: 1 }}>
                                            <ListItemText
                                              primary={
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.75rem'
                                                  }}
                                                >
                                                  {col.name}
                                                  <Typography
                                                    component="span"
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ ml: 1, fontSize: '0.7rem' }}
                                                  >
                                                    {col.type}
                                                  </Typography>
                                                </Typography>
                                              }
                                            />
                                          </ListItem>
                                        ))}
                                      </List>
                                    </AccordionDetails>
                                  </Accordion>
                                ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {/* Query Editor - Right Side */}
        <Grid item xs={12} md={database === 'trino' && !isFullscreen ? 9 : 12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="h6">
                  Query View
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Execute SQL queries • Ctrl+Enter to run • F11 for fullscreen
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setIsFullscreen(!isFullscreen)}
                color="primary"
                size="small"
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>Database</InputLabel>
                <Select
                  value={database}
                  label="Database"
                  onChange={(e) => setDatabase(e.target.value)}
                >
                  <MenuItem value="trino">Trino</MenuItem>
                  <MenuItem value="sqlite">SQLite</MenuItem>
                  <MenuItem value="postgres">PostgreSQL</MenuItem>
                  <MenuItem value="athena">Athena</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={isFullscreen ? 15 : 8}
                variant="outlined"
                placeholder="Enter your SQL query here...&#10;&#10;Example:&#10;SELECT * FROM data_lake_dev_xavi_silver.dim_teams LIMIT 10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                sx={{ fontFamily: 'monospace', fontSize: '0.9rem', mb: 1.5 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  onClick={executeQuery}
                  disabled={loading || !query.trim()}
                >
                  {loading ? 'Executing...' : 'Execute Query'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<SaveIcon />}
                  disabled={!query.trim()}
                  onClick={() => {
                    // TODO: Implement save functionality
                    alert('Save Query functionality - To be implemented');
                  }}
                >
                  Save Query
                </Button>
              </Box>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {results !== null && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Results
                  </Typography>
                  <Chip 
                    label={`${results.length} row${results.length !== 1 ? 's' : ''}`} 
                    color="primary" 
                    size="small" 
                  />
                  <Chip 
                    label={`${visibleColumns.length}/${columns.length} columns`} 
                    color="secondary" 
                    size="small" 
                  />
                </Box>
                <Tooltip title="Toggle Columns">
                  <IconButton
                    size="small"
                    onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
                  >
                    <ViewColumnIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Menu
                anchorEl={columnMenuAnchor}
                open={Boolean(columnMenuAnchor)}
                onClose={() => setColumnMenuAnchor(null)}
                PaperProps={{
                  style: {
                    maxHeight: 400,
                    width: '300px',
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Button size="small" onClick={showAllColumns} sx={{ mr: 1 }}>
                    Show All
                  </Button>
                  <Button size="small" onClick={hideAllColumns}>
                    Hide All
                  </Button>
                </Box>
                {columns.map((col) => (
                  <MenuItem key={col} dense onClick={() => toggleColumnVisibility(col)}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={visibleColumns.includes(col)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{col}</Typography>}
                    />
                  </MenuItem>
                ))}
              </Menu>

              {results.length > 0 ? (
                <TableContainer sx={{ maxHeight: isFullscreen ? 'calc(100vh - 400px)' : 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {visibleColumns.map((col) => (
                          <TableCell 
                            key={col}
                            sx={{ 
                              fontWeight: 'bold',
                              backgroundColor: 'primary.main',
                              color: 'white',
                              whiteSpace: 'nowrap',
                              py: 1,
                              fontSize: '0.85rem'
                            }}
                          >
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.map((row, idx) => (
                        <TableRow 
                          key={idx}
                          sx={{ 
                            '&:hover': { backgroundColor: 'action.hover' },
                            height: 36
                          }}
                        >
                          {visibleColumns.map((col) => (
                            <TableCell 
                              key={col}
                              sx={{ 
                                maxWidth: 300,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                py: 0.5,
                                fontSize: '0.85rem'
                              }}
                              title={row[col]?.toString() || ''}
                            >
                              {row[col] !== null && row[col] !== undefined ? row[col].toString() : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No results to display
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default QueryView;
