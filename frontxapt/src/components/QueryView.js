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
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableChartIcon from '@mui/icons-material/TableChart';
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

      if (response.data && response.data.status === 'success') {
        const { columns: cols, rows } = response.data;
        
        if (rows && rows.length > 0) {
          // Convert rows array to array of objects
          const data = rows.map(row => {
            const obj = {};
            cols.forEach((col, idx) => {
              obj[col] = row[idx];
            });
            return obj;
          });
          
          setColumns(cols);
          setResults(data);
        } else {
          setResults([]);
          setColumns([]);
          setError('Query returned no results');
        }
      } else {
        setError(response.data?.message || 'Invalid response format from server');
      }
    } catch (err) {
      console.error('Query execution error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    // Execute on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      executeQuery();
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Schema Browser - Left Side */}
        {database === 'trino' && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, maxHeight: '80vh', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TableChartIcon color="primary" />
                <Typography variant="h6">
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
        <Grid item xs={12} md={database === 'trino' ? 9 : 12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Query View
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Execute SQL queries and view results in a table
            </Typography>

            <Box sx={{ mt: 3 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
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
                rows={10}
                variant="outlined"
                placeholder="Enter your SQL query here...&#10;&#10;Example:&#10;SELECT * FROM data_lake_dev_xavi_silver.dim_teams LIMIT 10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                sx={{ fontFamily: 'monospace', mb: 2 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                  onClick={executeQuery}
                  disabled={loading || !query.trim()}
                >
                  {loading ? 'Executing...' : 'Execute Query'}
                </Button>

                <Typography variant="caption" color="text.secondary">
                  Tip: Press Ctrl+Enter (or Cmd+Enter) to execute
                </Typography>
              </Box>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {results !== null && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Results
                </Typography>
                <Chip 
                  label={`${results.length} row${results.length !== 1 ? 's' : ''}`} 
                  color="primary" 
                  size="small" 
                />
              </Box>

              {results.length > 0 ? (
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {columns.map((col) => (
                          <TableCell 
                            key={col}
                            sx={{ 
                              fontWeight: 'bold',
                              backgroundColor: 'primary.main',
                              color: 'white',
                              whiteSpace: 'nowrap'
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
                          sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                        >
                          {columns.map((col) => (
                            <TableCell 
                              key={col}
                              sx={{ 
                                maxWidth: 300,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
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
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
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
