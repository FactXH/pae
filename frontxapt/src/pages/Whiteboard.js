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
 * 
 * URL params:
 * - ?view={viewId} - Load view (automatically includes query)
 * - ?query={queryId} - Load query with default configuration
 */
function Whiteboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [queries, setQueries] = useState([]);
  const [views, setViews] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState('');
  const [selectedViewId, setSelectedViewId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [renderData, setRenderData] = useState(null); // { query, config, viewId }

  // Load queries and views on mount
  useEffect(() => {
    loadQueries();
    loadAllViews();
  }, []);

  // Handle URL parameters on mount and changes
  useEffect(() => {
    const viewId = searchParams.get('view');
    const queryId = searchParams.get('query');
    
    if (viewId) {
      // View ID takes priority - load view (which includes query)
      setSelectedViewId(viewId);
      loadFromViewId(viewId);
    } else if (queryId) {
      // Query ID only - load query with default config
      setSelectedQueryId(queryId);
      loadFromQueryId(queryId);
    } else {
      // No params - reset
      setRenderData(null);
      setSelectedQueryId('');
      setSelectedViewId('');
    }
  }, [searchParams]);

  const loadQueries = async () => {
    try {
      const data = await apiClient.getQueries();
      setQueries(data);
    } catch (err) {
      console.error('Error loading queries:', err);
    }
  };

  const loadAllViews = async () => {
    try {
      const data = await apiClient.getQueryViews();
      setViews(data);
    } catch (err) {
      console.error('Error loading views:', err);
    }
  };

  const loadFromViewId = async (viewId) => {
    setLoading(true);
    setError(null);
    setRenderData(null);

    try {
      const viewData = await apiClient.getQueryView(viewId);
      
      // View includes the full query object and config
      setRenderData({
        query: viewData.query, // Full query object with sql_query, database, etc.
        config: viewData.config,
        viewId: viewData.id,
        viewName: viewData.name,
        viewDescription: viewData.description
      });
      
      setSelectedQueryId(viewData.query.id.toString());
    } catch (err) {
      setError(`Failed to load view: ${err.message}`);
      console.error('Error loading view:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFromQueryId = async (queryId) => {
    setLoading(true);
    setError(null);
    setRenderData(null);

    try {
      const queryData = await apiClient.getQuery(queryId);
      
      // Query only - use default config (no view)
      setRenderData({
        query: queryData, // Full query object with sql_query, database, etc.
        config: null, // No config - will use defaults
        viewId: null,
        viewName: null,
        viewDescription: null
      });
    } catch (err) {
      setError(`Failed to load query: ${err.message}`);
      console.error('Error loading query:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuerySelect = (queryId) => {
    setSelectedQueryId(queryId);
    setSelectedViewId('');
    if (queryId) {
      setSearchParams({ query: queryId });
    } else {
      setSearchParams({});
    }
  };

  const handleViewSelect = (viewId) => {
    setSelectedViewId(viewId);
    if (viewId) {
      setSearchParams({ view: viewId });
    } else if (selectedQueryId) {
      setSearchParams({ query: selectedQueryId });
    } else {
      setSearchParams({});
    }
  };

  const selectedQuery = queries?.find(q => q.id === parseInt(selectedQueryId));
  const selectedView = views?.find(v => v.id === parseInt(selectedViewId));
  const filteredViews = selectedQueryId 
    ? views?.filter(v => v.query === parseInt(selectedQueryId)) 
    : [];

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
              onChange={(e) => handleQuerySelect(e.target.value)}
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
            <InputLabel>Select View (Optional)</InputLabel>
            <Select
              value={selectedViewId}
              onChange={(e) => handleViewSelect(e.target.value)}
              label="Select View (Optional)"
              disabled={loading || !selectedQueryId}
            >
              <MenuItem value="">
                <em>Default View</em>
              </MenuItem>
              {filteredViews?.map((view) => (
                <MenuItem key={view.id} value={view.id}>
                  {view.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Refresh Button */}
          <Button
            variant="outlined"
            onClick={() => {
              loadQueries();
              loadAllViews();
            }}
            disabled={loading}
            startIcon={<RefreshIcon />}
            sx={{ height: 56 }}
          >
            Refresh
          </Button>
        </Box>

        {/* Selected Info */}
        {renderData && (
          <Box mt={2}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              <strong>Query:</strong> {renderData.query.name}
            </Typography>
            {renderData.query.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {renderData.query.description}
              </Typography>
            )}
            <Box display="flex" gap={1} mt={1}>
              <Chip label={`Database: ${renderData.query.database}`} size="small" />
              <Chip label={`Query ID: ${renderData.query.id}`} size="small" variant="outlined" />
              {renderData.viewId && (
                <>
                  <Chip label={`View: ${renderData.viewName}`} size="small" color="primary" />
                  <Chip label={`View ID: ${renderData.viewId}`} size="small" color="primary" variant="outlined" />
                </>
              )}
              {!renderData.viewId && (
                <Chip label="Default View" size="small" color="default" />
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

      {/* Render the Component */}
      {renderData && renderData.query && (
        <Box>
          <Divider sx={{ mb: 3 }} />
          <ConfigurableMetricsCard
            title={renderData.config?.title || renderData.viewName || renderData.query.name}
            query={renderData.query.sql_query}
            database={renderData.query.database}
            thresholds={renderData.config?.thresholds || { red: 2.2, yellow: 4.0 }}
            description={renderData.viewDescription || renderData.query.description || ''}
            initialConfig={renderData.config} // null if no view selected (uses defaults)
            existingQueryId={renderData.query.id}
          />
        </Box>
      )}

      {!renderData && !loading && (
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
                ⚙️ All Available Views
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {views?.map((view) => {
                  const viewQuery = queries?.find(q => q.id === view.query);
                  return (
                    <Paper 
                      key={view.id} 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                      onClick={() => setSearchParams({ view: view.id })}
                    >
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
                          {viewQuery && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              Query: {viewQuery.name}
                            </Typography>
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <Chip label={`View ID: ${view.id}`} size="small" color="primary" variant="outlined" />
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default Whiteboard;
