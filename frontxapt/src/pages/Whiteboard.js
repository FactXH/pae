import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import apiClient from '../services/apiClient';
import ConfigurableMetricsCard from '../components/ConfigurableMetricsCard';

/**
 * Whiteboard Page
 * Select saved queries and views to render them with their configurations
 * URL params: ?query={queryId}&view={viewId}
 */
function Whiteboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [queries, setQueries] = useState([]);
  const [views, setViews] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState(searchParams.get('query') || '');
  const [selectedViewId, setSelectedViewId] = useState(searchParams.get('view') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewData, setViewData] = useState(null);

  // Load queries on mount
  useEffect(() => {
    loadQueries();
  }, []);

  // Load view directly from URL if both query and view IDs are present
  useEffect(() => {
    const queryId = searchParams.get('query');
    const viewId = searchParams.get('view');
    
    if (queryId && viewId) {
      setSelectedQueryId(queryId);
      setSelectedViewId(viewId);
      loadViewData(viewId);
    }
  }, [searchParams]);

  // Load views when query is selected
  useEffect(() => {
    if (selectedQueryId) {
      loadViews(selectedQueryId);
    } else {
      setViews([]);
      setSelectedViewId('');
    }
  }, [selectedQueryId]);

  // Update URL when selections change
  useEffect(() => {
    if (selectedQueryId && selectedViewId) {
      setSearchParams({ query: selectedQueryId, view: selectedViewId });
    } else if (selectedQueryId) {
      setSearchParams({ query: selectedQueryId });
    } else {
      setSearchParams({});
    }
  }, [selectedQueryId, selectedViewId, setSearchParams]);

  const loadQueries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getQueries();
      setQueries(data);
    } catch (err) {
      setError(`Failed to load queries: ${err.message}`);
      console.error('Error loading queries:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadViews = async (queryId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getQueryViews();
      // Filter views for the selected query
      const filteredViews = data.filter(view => view.query === parseInt(queryId));
      setViews(filteredViews);
    } catch (err) {
      setError(`Failed to load views: ${err.message}`);
      console.error('Error loading views:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadViewData = async (viewId = selectedViewId) => {
    if (!viewId) return;

    setLoading(true);
    setError(null);
    setViewData(null);

    try {
      const data = await apiClient.getQueryView(viewId);
      setViewData(data);
    } catch (err) {
      setError(`Failed to load view data: ${err.message}`);
      console.error('Error loading view data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedQuery = queries?.find(q => q.id === parseInt(selectedQueryId));
  const selectedView = views?.find(v => v.id === parseInt(selectedViewId));

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="600">
        🎨 Whiteboard - Query & View Explorer
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select a saved query and view to render it with its configuration
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="flex-start" flexWrap="wrap">
          {/* Query Selector */}
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Select Query</InputLabel>
            <Select
              value={selectedQueryId}
              onChange={(e) => setSelectedQueryId(e.target.value)}
              label="Select Query"
              disabled={loading}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {queries?.map((query) => (
                <MenuItem key={query.id} value={query.id}>
                  {query.name} - {query.database.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* View Selector */}
          <FormControl sx={{ minWidth: 300 }} disabled={!selectedQueryId}>
            <InputLabel>Select View</InputLabel>
            <Select
              value={selectedViewId}
              onChange={(e) => setSelectedViewId(e.target.value)}
              label="Select View"
              disabled={loading || !selectedQueryId}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {views?.map((view) => (
                <MenuItem key={view.id} value={view.id}>
                  {view.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Load Button */}
          <Button
            variant="contained"
            onClick={loadViewData}
            disabled={!selectedViewId || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            sx={{ height: 56 }}
          >
            Load View
          </Button>

          {/* Refresh Queries Button */}
          <Button
            variant="outlined"
            onClick={loadQueries}
            disabled={loading}
            startIcon={<RefreshIcon />}
            sx={{ height: 56 }}
          >
            Refresh
          </Button>
        </Box>

        {/* Selected Info */}
        {selectedQuery && (
          <Box mt={2}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              <strong>Query:</strong> {selectedQuery.name}
            </Typography>
            {selectedQuery.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedQuery.description}
              </Typography>
            )}
            <Box display="flex" gap={1} mt={1}>
              <Chip label={`Database: ${selectedQuery.database}`} size="small" />
              <Chip label={`ID: ${selectedQuery.id}`} size="small" variant="outlined" />
              {selectedView && (
                <>
                  <Chip label={`View: ${selectedView.name}`} size="small" color="primary" />
                  <Chip label={`View ID: ${selectedView.id}`} size="small" color="primary" variant="outlined" />
                </>
              )}
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Render the View */}
      {viewData && viewData.query && viewData.config && (
        <Box>
          <Divider sx={{ mb: 3 }} />
          <ConfigurableMetricsCard
            title={viewData.config.title || viewData.name}
            query={viewData.query.sql_query}
            database={viewData.query.database}
            thresholds={viewData.config.thresholds || { red: 2.2, yellow: 4.0 }}
            description={viewData.description}
            initialConfig={viewData.config}
            existingQueryId={viewData.query.id}
          />
        </Box>
      )}

      {!viewData && !loading && (
        <Paper elevation={1} sx={{ p: 4, bgcolor: '#f9f9f9' }}>
          <Typography variant="h6" gutterBottom fontWeight="600">
            📋 Available Queries
          </Typography>
          {!queries || queries.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No saved queries yet. Create a query from any analytics page!
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {queries?.map((query) => (
                <Paper key={query.id} elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600">
                        {query.name}
                      </Typography>
                      {query.description && (
                        <Typography variant="body2" color="text.secondary">
                          {query.description}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" gap={1}>
                      <Chip label={query.database.toUpperCase()} size="small" />
                      <Chip label={`ID: ${query.id}`} size="small" variant="outlined" />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

          {views && views.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom fontWeight="600">
                ⚙️ Available Views for Selected Query
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {views?.map((view) => (
                  <Paper key={view.id} elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {view.name}
                        </Typography>
                        {view.description && (
                          <Typography variant="body2" color="text.secondary">
                            {view.description}
                          </Typography>
                        )}
                      </Box>
                      <Chip label={`View ID: ${view.id}`} size="small" color="primary" variant="outlined" />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default Whiteboard;
