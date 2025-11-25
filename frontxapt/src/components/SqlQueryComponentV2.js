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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableChartIcon from '@mui/icons-material/TableChart';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import apiClient from '../services/apiClient';

const SqlQueryComponentV2 = () => {
  const [tabs, setTabs] = useState([
    { id: 1, name: 'Query 1', query: '', result: null, loading: false, error: null, executionTime: null }
  ]);
  const [activeTab, setActiveTab] = useState(0);
  const [nextTabId, setNextTabId] = useState(2);
  const [selectedDatabase, setSelectedDatabase] = useState('trino');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [schemaInfo, setSchemaInfo] = useState({ tables: [], columns: {} });
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [expandedSchemas, setExpandedSchemas] = useState({});
  const [schemaBrowserOpen, setSchemaBrowserOpen] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState('');

  const databases = [
    { id: 'sqlite', name: 'SQLite (Local)' },
    { id: 'trino', name: 'Trino' },
    { id: 'athena', name: 'Athena' },
    { id: 'postgres', name: 'PostgreSQL' },
  ];

  useEffect(() => {
    if (selectedDatabase === 'trino') {
      loadTrinoSchemaInfo();
    } else if (selectedDatabase === 'sqlite') {
      loadSqliteSchemaInfo();
    }
  }, [selectedDatabase]);

  const loadTrinoSchemaInfo = async () => {
    setLoadingSchema(true);
    try {
      const schemasQuery = `
        SELECT DISTINCT table_schema 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema
      `;
      console.log('Loading Trino schemas...');
      const schemasData = await apiClient.post('/sql/execute/', {
        query: schemasQuery,
        database: 'trino'
      });

      console.log('Trino schemas response:', schemasData);

      if (schemasData.status === 'success' && schemasData.rows) {
        const schemas = {};
        for (const row of schemasData.rows) {
          const schemaName = row[0];
          console.log('Loading tables for schema:', schemaName);
          const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = '${schemaName}'
            ORDER BY table_name
          `;
          const tablesData = await apiClient.post('/sql/execute/', {
            query: tablesQuery,
            database: 'trino'
          });

          console.log(`Tables for ${schemaName}:`, tablesData);

          if (tablesData.status === 'success' && tablesData.rows) {
            schemas[schemaName] = tablesData.rows.map(r => ({
              name: r[0],
              fullName: `${schemaName}.${r[0]}`
            }));
          }
        }
        console.log('Final schemas object:', schemas);
        setSchemaInfo({ tables: schemas, columns: {} });
      }
    } catch (err) {
      console.error('Failed to load schema:', err);
    } finally {
      setLoadingSchema(false);
    }
  };

  const loadSqliteSchemaInfo = async () => {
    setLoadingSchema(true);
    try {
      const data = await apiClient.get('/sql/tables/');
      if (data.status === 'success' && data.tables) {
        const sqliteSchema = {
          sqlite: data.tables.map(tableName => ({
            name: tableName,
            fullName: tableName
          }))
        };
        setSchemaInfo({ tables: sqliteSchema, columns: {} });
      }
    } catch (err) {
      console.error('Failed to load SQLite tables:', err);
    } finally {
      setLoadingSchema(false);
    }
  };

  const loadTableColumns = async (schemaName, tableName) => {
    const fullName = `${schemaName}.${tableName}`;
    const tableKey = selectedDatabase === 'sqlite' ? tableName : fullName;
    
    if (schemaInfo.columns[tableKey]) return;

    try {
      if (selectedDatabase === 'trino') {
        const columnsQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = '${schemaName}' AND table_name = '${tableName}'
          ORDER BY ordinal_position
        `;
        console.log('Loading columns for:', fullName);
        const data = await apiClient.post('/sql/execute/', {
          query: columnsQuery,
          database: 'trino'
        });

        console.log('Columns response:', data);

        if (data.status === 'success' && data.rows) {
          setSchemaInfo(prev => ({
            ...prev,
            columns: {
              ...prev.columns,
              [fullName]: data.rows.map(r => ({ name: r[0], type: r[1] }))
            }
          }));
        }
      } else if (selectedDatabase === 'sqlite') {
        const data = await apiClient.getTableColumns(tableName);
        if (data.status === 'success' && data.columns) {
          setSchemaInfo(prev => ({
            ...prev,
            columns: {
              ...prev.columns,
              [tableName]: data.columns.map(col => ({ name: col.name, type: col.type }))
            }
          }));
        }
      }
    } catch (err) {
      console.error(`Failed to load columns for ${tableKey}:`, err);
    }
  };

  const executeQuery = async () => {
    const currentTab = tabs[activeTab];
    if (!currentTab.query.trim()) return;

    const updatedTabs = [...tabs];
    updatedTabs[activeTab] = {
      ...currentTab,
      loading: true,
      error: null,
      result: null,
      executionTime: null
    };
    setTabs(updatedTabs);

    const startTime = Date.now();

    try {
      const data = await apiClient.post('/sql/execute/', {
        query: currentTab.query,
        database: selectedDatabase
      });
      const endTime = Date.now();

      updatedTabs[activeTab] = {
        ...updatedTabs[activeTab],
        loading: false,
        executionTime: endTime - startTime,
        result: data.status === 'success' ? data : null,
        error: data.status !== 'success' ? data.message : null
      };

      if (data.status === 'success' && data.columns) {
        setVisibleColumns(data.columns);
      }
    } catch (err) {
      const endTime = Date.now();
      updatedTabs[activeTab] = {
        ...updatedTabs[activeTab],
        loading: false,
        executionTime: endTime - startTime,
        error: err.message || 'An error occurred'
      };
    }

    setTabs(updatedTabs);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  const addTab = () => {
    const newTab = {
      id: nextTabId,
      name: `Query ${nextTabId}`,
      query: '',
      result: null,
      loading: false,
      error: null,
      executionTime: null
    };
    setTabs([...tabs, newTab]);
    setActiveTab(tabs.length);
    setNextTabId(nextTabId + 1);
  };

  const closeTab = (index, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;

    const newTabs = tabs.filter((_, i) => i !== index);
    setTabs(newTabs);
    if (activeTab >= index && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const updateQuery = (value) => {
    const updatedTabs = [...tabs];
    updatedTabs[activeTab].query = value;
    setTabs(updatedTabs);
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

  const handleSaveQuery = () => {
    // TODO: Implement save functionality
    alert('Save Query functionality - To be implemented');
  };

  const currentTab = tabs[activeTab];

  const containerSx = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#ffffff',
    overflow: 'auto',
    p: 1
  } : { p: 1 };

  return (
    <Box sx={containerSx}>
      <Box sx={{ display: 'flex', height: isFullscreen ? '100vh' : 'calc(100vh - 120px)', gap: 1 }}>
        {/* Schema Browser - Left Sidebar */}
        {(selectedDatabase === 'trino' || selectedDatabase === 'sqlite') && !isFullscreen && schemaBrowserOpen && (
          <Paper sx={{ width: 280, p: 1, overflow: 'auto', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TableChartIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Schema Browser
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setSchemaBrowserOpen(false)}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Table Filter */}
            <TextField
              fullWidth
              size="small"
              placeholder="Filter tables..."
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
            />

            {/* Column Filter */}
            <TextField
              fullWidth
              size="small"
              placeholder="Filter columns..."
              value={columnFilter}
              onChange={(e) => setColumnFilter(e.target.value)}
              sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
            />

            {loadingSchema ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Loading schema...
                </Typography>
              </Box>
            ) : (
              <Box>
                {Object.keys(schemaInfo.tables).length === 0 ? (
                  <Box sx={{ p: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      No schemas found
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Try executing a query first or check console for errors
                    </Typography>
                  </Box>
                ) : (
                  Object.entries(schemaInfo.tables).map(([schemaName, tables]) => {
                    // Filter tables based on tableFilter
                    const filteredTables = tables.filter(table =>
                      table.name.toLowerCase().includes(tableFilter.toLowerCase())
                    );

                    if (filteredTables.length === 0) return null;

                    return (
                      <Accordion
                        key={schemaName}
                        disableGutters
                        elevation={0}
                        sx={{ '&:before': { display: 'none' }, mb: 0.5 }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon fontSize="small" />}
                          sx={{ minHeight: 32, '& .MuiAccordionSummary-content': { my: 0.5 } }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            {schemaName} ({filteredTables.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, pl: 2 }}>
                          {filteredTables.map((table) => {
                            const tableKey = selectedDatabase === 'sqlite' ? table.name : table.fullName;
                            const columns = schemaInfo.columns[tableKey] || [];
                            
                            // Filter columns based on columnFilter
                            const filteredColumns = columns.filter(col =>
                              col.name.toLowerCase().includes(columnFilter.toLowerCase())
                            );

                            return (
                              <Accordion
                                key={table.fullName}
                                disableGutters
                                elevation={0}
                                sx={{ '&:before': { display: 'none' } }}
                              >
                                <AccordionSummary
                                  expandIcon={<ExpandMoreIcon fontSize="small" />}
                                  onClick={() => loadTableColumns(schemaName, table.name)}
                                  sx={{ minHeight: 28, '& .MuiAccordionSummary-content': { my: 0.3 } }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontFamily: 'monospace',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      '&:hover': { color: 'primary.main' }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuery(currentTab.query + (selectedDatabase === 'sqlite' ? table.name : table.fullName));
                                    }}
                                  >
                                    {table.name}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0, pl: 2 }}>
                                  <List dense disablePadding>
                                    {filteredColumns.map(col => (
                                      <ListItem
                                        key={col.name}
                                        sx={{ py: 0, pl: 1, cursor: 'pointer' }}
                                        onClick={() => updateQuery(currentTab.query + col.name)}
                                      >
                                        <ListItemText
                                          primary={
                                            <Typography
                                              variant="caption"
                                              sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                                            >
                                              {col.name}
                                              <Typography
                                                component="span"
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ ml: 0.5, fontSize: '0.65rem' }}
                                              >
                                                {col.type}
                                              </Typography>
                                            </Typography>
                                          }
                                        />
                                      </ListItem>
                                    ))}
                                    {filteredColumns.length === 0 && columns.length > 0 && (
                                      <ListItem sx={{ py: 0, pl: 1 }}>
                                        <ListItemText
                                          primary={
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                              No matching columns
                                            </Typography>
                                          }
                                        />
                                      </ListItem>
                                    )}
                                  </List>
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })
                )}
              </Box>
            )}
          </Paper>
        )}

        {/* Collapse Button when sidebar is closed */}
        {(selectedDatabase === 'trino' || selectedDatabase === 'sqlite') && !isFullscreen && !schemaBrowserOpen && (
          <Box
            sx={{
              width: 32,
              display: 'flex',
              alignItems: 'flex-start',
              pt: 1,
              flexShrink: 0
            }}
          >
            <IconButton
              size="small"
              onClick={() => setSchemaBrowserOpen(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                borderRadius: '0 4px 4px 0'
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Main Editor Area */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              SQL Editor
            </Typography>
            <Box sx={{ flex: 1 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: '0.85rem' }}>Database</InputLabel>
              <Select
                value={selectedDatabase}
                label="Database"
                onChange={(e) => setSelectedDatabase(e.target.value)}
                sx={{ fontSize: '0.85rem' }}
              >
                {databases.map(db => (
                  <MenuItem key={db.id} value={db.id} sx={{ fontSize: '0.85rem' }}>
                    {db.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={() => setIsFullscreen(!isFullscreen)}
              color="primary"
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ flex: 1, minHeight: 36 }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                        {tab.name}
                      </Typography>
                      {tabs.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={(e) => closeTab(index, e)}
                          sx={{ p: 0.25 }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </Box>
                  }
                  sx={{ minHeight: 36, py: 0.5, px: 1.5, textTransform: 'none' }}
                />
              ))}
            </Tabs>
            <Tooltip title="New Query Tab">
              <IconButton size="small" onClick={addTab} sx={{ mx: 0.5 }}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Query Editor */}
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              placeholder="Enter your SQL query here..."
              value={currentTab.query}
              onChange={(e) => updateQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                '& .MuiInputBase-root': { p: 1 }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={currentTab.loading ? <CircularProgress size={14} /> : <PlayArrowIcon />}
                onClick={executeQuery}
                disabled={currentTab.loading || !currentTab.query.trim()}
                sx={{ fontSize: '0.8rem', py: 0.5 }}
              >
                {currentTab.loading ? 'Executing...' : 'Execute'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SaveIcon />}
                disabled={!currentTab.query.trim()}
                onClick={handleSaveQuery}
                sx={{ fontSize: '0.8rem', py: 0.5 }}
              >
                Save Query
              </Button>
              {currentTab.executionTime !== null && (
                <Chip
                  label={`${currentTab.executionTime}ms`}
                  size="small"
                  color="success"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
          </Box>

          {/* Results */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {currentTab.error && (
              <Alert severity="error" sx={{ mb: 1, fontSize: '0.85rem' }}>
                {currentTab.error}
              </Alert>
            )}

            {currentTab.result && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Results ({currentTab.result.row_count} rows)
                  </Typography>
                  {currentTab.result.columns && currentTab.result.columns.length > 0 && (
                    <>
                      <IconButton
                        size="small"
                        onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
                      >
                        <ViewColumnIcon fontSize="small" />
                      </IconButton>
                      <Menu
                        anchorEl={columnMenuAnchor}
                        open={Boolean(columnMenuAnchor)}
                        onClose={() => setColumnMenuAnchor(null)}
                      >
                        {currentTab.result.columns.map((col, idx) => (
                          <MenuItem key={idx} dense onClick={() => toggleColumnVisibility(col)}>
                            <Checkbox
                              checked={visibleColumns.includes(col)}
                              size="small"
                            />
                            <Typography variant="caption">{col}</Typography>
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}
                </Box>

                <TableContainer sx={{ maxHeight: 'calc(100% - 40px)' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {currentTab.result.columns
                          ?.filter(col => visibleColumns.includes(col))
                          .map((col, idx) => (
                            <TableCell
                              key={idx}
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1,
                                backgroundColor: 'grey.100'
                              }}
                            >
                              {col}
                            </TableCell>
                          ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentTab.result.rows?.map((row, rowIdx) => (
                        <TableRow key={rowIdx} hover>
                          {row
                            .filter((_, cellIdx) => visibleColumns.includes(currentTab.result.columns[cellIdx]))
                            .map((cell, cellIdx) => (
                              <TableCell
                                key={cellIdx}
                                sx={{
                                  fontSize: '0.75rem',
                                  py: 0.5,
                                  px: 1,
                                  fontFamily: cell === null ? 'inherit' : 'monospace'
                                }}
                              >
                                {cell === null ? (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                                  >
                                    NULL
                                  </Typography>
                                ) : (
                                  String(cell)
                                )}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default SqlQueryComponentV2;
