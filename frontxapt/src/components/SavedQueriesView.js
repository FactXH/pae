import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionIcon from '@mui/icons-material/Description';
import apiClient from '../services/apiClient';

const SavedQueriesView = () => {
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/sql/saved-queries/');

      if (response && response.status === 'success') {
        setQueries(response.queries || []);
      } else {
        setError(response?.message || 'Failed to load saved queries');
      }
    } catch (err) {
      console.error('Error loading saved queries:', err);
      setError(err.message || 'Failed to load saved queries');
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async (queryName) => {
    setExecuting(true);
    setError(null);
    setResults(null);
    setColumns([]);

    try {
      const response = await apiClient.post('/sql/saved-queries/execute/', {
        query_name: queryName,
        database: 'trino'
      });

      if (response && response.status === 'success') {
        const { columns: cols, rows } = response;

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
        setError(response?.message || 'Failed to execute query');
      }
    } catch (err) {
      console.error('Query execution error:', err);
      setError(err.message || 'Failed to execute query');
    } finally {
      setExecuting(false);
    }
  };

  const handleQuerySelect = (query) => {
    setSelectedQuery(query);
    executeQuery(query.name);
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
      {/* Left sidebar - Query list */}
      <Paper sx={{ width: 350, p: 2, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Saved Queries
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Pre-built analytics queries from dbt
        </Typography>

        <Divider sx={{ my: 2 }} />

        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={30} />
          </Box>
        )}

        {!loading && queries.length === 0 && (
          <Alert severity="info">No saved queries found</Alert>
        )}

        <List>
          {queries.map((query) => (
            <ListItem key={query.name} disablePadding>
              <ListItemButton
                selected={selectedQuery?.name === query.name}
                onClick={() => handleQuerySelect(query)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <DescriptionIcon sx={{ mr: 1, fontSize: 20, color: 'action.active' }} />
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {query.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {query.description.substring(0, 60)}...
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Total queries:</strong> {queries.length}
          </Typography>
        </Box>
      </Paper>

      {/* Right content - Results */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {selectedQuery ? selectedQuery.name : 'Saved Queries'}
          </Typography>
          {selectedQuery && (
            <Typography variant="body2" color="text.secondary">
              {selectedQuery.description}
            </Typography>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {executing && (
          <Box display="flex" justifyContent="center" alignItems="center" p={5}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Executing query...
            </Typography>
          </Box>
        )}

        {!executing && !selectedQuery && (
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <PlayArrowIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Select a query to view results
            </Typography>
          </Paper>
        )}

        {!executing && results !== null && selectedQuery && (
          <Paper sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Results</Typography>
              <Chip
                label={`${results.length} row${results.length !== 1 ? 's' : ''}`}
                color="primary"
                size="small"
              />
            </Box>

            {results.length > 0 ? (
              <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
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
                            whiteSpace: 'nowrap',
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
                              whiteSpace: 'nowrap',
                            }}
                            title={row[col]?.toString() || ''}
                          >
                            {row[col] !== null && row[col] !== undefined
                              ? row[col].toString()
                              : ''}
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
      </Box>
    </Box>
  );
};

export default SavedQueriesView;
