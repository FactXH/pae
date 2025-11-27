import React, { useState, useEffect, useMemo } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import { ExpandMore, ChevronRight, PeopleIcon } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import apiClient from '../services/apiClient';

function EmployeeOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamSummary, setTeamSummary] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState([]);
  const [expanded, setExpanded] = useState({});
  
  // Filter states
  const [teamFilter, setTeamFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load team summary
      const summaryResponse = await apiClient.post('/sql/saved-queries/execute/', {
        query_name: '10_employee_distribution_by_team',
        database: 'trino'
      });

      // Load employee details
      const detailsResponse = await apiClient.post('/sql/saved-queries/execute/', {
        query_name: '11_employee_details_by_team',
        database: 'trino'
      });

      if (summaryResponse?.status === 'success' && detailsResponse?.status === 'success') {
        // Transform summary data
        const summaryData = summaryResponse.rows.map(row => ({
          team_name: row[0],
          team_level: row[1],
          parent_team_name: row[2],
          market_name: row[3],
          is_market_row: row[4],
          total_employees: row[5],
          active_employees: row[6],
          inactive_employees: row[7]
        }));

        // Transform details data
        const detailsData = detailsResponse.rows.map(row => ({
          employee_id: row[0],
          full_name: row[1],
          email: row[2],
          team_name: row[3],
          team_level: row[4],
          parent_team_name: row[5],
          market_name: row[6],
          current_role: row[7],
          onboarding_date: row[8],
          offboarding_date: row[9],
          status: row[10],
          tenure_days: row[11],
          tenure_years: row[12]
        }));

        setTeamSummary(summaryData);
        setEmployeeDetails(detailsData);
      } else {
        setError('Failed to load employee data');
      }
    } catch (err) {
      console.error('Error loading employee overview:', err);
      setError(err.message || 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  // Toggle expansion for a specific team
  const toggleExpand = (teamName) => {
    setExpanded(prev => ({
      ...prev,
      [teamName]: !prev[teamName]
    }));
  };

  // Filter employees based on filters
  const filteredEmployees = useMemo(() => {
    return employeeDetails.filter(emp => {
      // Status filter
      if (statusFilter !== 'all' && emp.status.toLowerCase() !== statusFilter) {
        return false;
      }
      
      // Market filter
      if (marketFilter !== 'all' && emp.market_name !== marketFilter) {
        return false;
      }
      
      // Employee name filter
      if (employeeFilter) {
        const nameMatch = emp.full_name?.toLowerCase().includes(employeeFilter.toLowerCase());
        const emailMatch = emp.email?.toLowerCase().includes(employeeFilter.toLowerCase());
        if (!nameMatch && !emailMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [employeeDetails, employeeFilter, statusFilter, marketFilter]);

  // Filter teams based on filters
  const filteredTeamSummary = useMemo(() => {
    return teamSummary.filter(team => {
      // Level filter
      if (levelFilter !== 'all' && String(team.team_level) !== levelFilter) {
        return false;
      }
      
      // Market filter
      if (marketFilter !== 'all' && team.market_name !== marketFilter) {
        return false;
      }
      
      // Team name filter
      if (teamFilter && !team.team_name.toLowerCase().includes(teamFilter.toLowerCase())) {
        return false;
      }
      
      // Check if team has any matching employees
      const teamEmployees = filteredEmployees.filter(emp => emp.team_name === team.team_name);
      if (employeeFilter || statusFilter !== 'all') {
        return teamEmployees.length > 0;
      }
      
      return true;
    });
  }, [teamSummary, teamFilter, levelFilter, marketFilter, filteredEmployees, employeeFilter, statusFilter]);

  // Build hierarchical tree structure with filtered data
  const buildTeamTree = useMemo(() => {
    if (filteredTeamSummary.length === 0) return [];
    
    // Separate team rows and market rows
    const teamRows = filteredTeamSummary.filter(item => !item.is_market_row);
    const marketRows = filteredTeamSummary.filter(item => item.is_market_row);
    
    // Create a map for quick lookup
    const teamMap = {};
    teamRows.forEach(team => {
      teamMap[team.team_name] = {
        ...team,
        children: [],
        markets: []
      };
    });
    
    // Add markets as sub-items under their teams
    marketRows.forEach(market => {
      if (teamMap[market.team_name]) {
        teamMap[market.team_name].markets.push(market);
      }
    });
    
    // Build the tree by connecting children to parents
    const rootTeams = [];
    teamRows.forEach(team => {
      if (team.parent_team_name && teamMap[team.parent_team_name]) {
        teamMap[team.parent_team_name].children.push(teamMap[team.team_name]);
      } else {
        rootTeams.push(teamMap[team.team_name]);
      }
    });
    
    return rootTeams;
  }, [filteredTeamSummary]);

  // Get unique markets for the filter dropdown
  const availableMarkets = useMemo(() => {
    const markets = new Set();
    employeeDetails.forEach(emp => {
      if (emp.market_name) {
        markets.add(emp.market_name);
      }
    });
    return Array.from(markets).sort();
  }, [employeeDetails]);

  // Get employees for a specific team and optionally market
  const getTeamEmployees = (teamName, marketName = null) => {
    return filteredEmployees.filter(emp => {
      if (emp.team_name !== teamName) return false;
      if (marketName && emp.market_name !== marketName) return false;
      if (marketName === null && emp.market_name) return false; // Only get employees without market when no market specified
      return true;
    });
  };

  // Render a team row recursively
  const renderTeamRow = (team, level = 0) => {
    const teamPath = `team-${team.team_name}`;
    const isExpanded = expanded[teamPath];
    const hasChildren = team.children && team.children.length > 0;
    const hasMarkets = team.markets && team.markets.length > 0;
    const teamEmployees = getTeamEmployees(team.team_name);
    const showEmployees = expanded[`${teamPath}-employees`];
    
    // Calculate totals including all child teams and markets
    const calculateTotals = (node) => {
      let totals = {
        total: 0,  // Start from 0 - only count hidden sub-levels
        active: 0,
        inactive: 0
      };
      
      // Add markets (these are hidden when collapsed)
      if (node.markets) {
        node.markets.forEach(market => {
          totals.total += market.total_employees || 0;
          totals.active += market.active_employees || 0;
          totals.inactive += market.inactive_employees || 0;
        });
      }
      
      // Add children recursively (these are hidden when collapsed)
      if (node.children) {
        node.children.forEach(child => {
          const childTotals = calculateTotals(child);
          // Add the child's direct employees
          totals.total += (child.total_employees || 0);
          totals.active += (child.active_employees || 0);
          totals.inactive += (child.inactive_employees || 0);
          // Add the child's nested totals
          totals.total += childTotals.total;
          totals.active += childTotals.active;
          totals.inactive += childTotals.inactive;
        });
      }
      
      return totals;
    };
    
    const subtotals = calculateTotals(team);
    const hasHiddenEmployees = subtotals.total > 0;
    
    // Calculate grand totals (direct + all nested)
    const grandTotal = (team.total_employees || 0) + subtotals.total;
    const grandActive = (team.active_employees || 0) + subtotals.active;
    const grandInactive = (team.inactive_employees || 0) + subtotals.inactive;
    
    const levelColors = {
      '0': 'error',
      '1': 'primary',
      '2': 'secondary', 
      '3': 'default',
    };
    const levelColor = levelColors[String(team.team_level)] || 'default';
    const indent = level * 40;
    
    return (
      <React.Fragment key={teamPath}>
        <TableRow 
          sx={{ 
            '&:hover': { backgroundColor: 'action.hover' },
            backgroundColor: level === 0 ? '#f5f5f5' : 'white'
          }}
        >
          <TableCell sx={{ width: '50%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: `${indent}px` }}>
              {(hasChildren || hasMarkets) ? (
                <IconButton
                  size="small"
                  onClick={() => toggleExpand(teamPath)}
                  sx={{ mr: 1 }}
                >
                  {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                </IconButton>
              ) : (
                <Box sx={{ width: 32, mr: 1 }} />
              )}
              <Chip 
                label={`L${team.team_level}`} 
                size="small"
                color={levelColor}
                sx={{ mr: 1, minWidth: 40 }}
              />
              <Typography variant="body2" fontWeight={level === 0 ? 600 : 400}>
                {team.team_name}
              </Typography>
              {!isExpanded && hasHiddenEmployees && (
                <Chip 
                  label={`+${subtotals.total} hidden`}
                  size="small"
                  color="default"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: '0.7rem', fontStyle: 'italic' }}
                />
              )}
            </Box>
          </TableCell>
          <TableCell align="center" sx={{ width: '15%' }}>
            <Chip 
              label={hasHiddenEmployees ? `${grandActive} (${team.active_employees})` : team.active_employees}
              size="small"
              color="success"
            />
          </TableCell>
          {showInactive && (
            <TableCell align="center" sx={{ width: '15%' }}>
              <Chip 
                label={hasHiddenEmployees ? `${grandInactive} (${team.inactive_employees})` : team.inactive_employees}
                size="small"
                color="warning"
              />
            </TableCell>
          )}
          <TableCell align="center" sx={{ width: '5%' }}>
            {teamEmployees.length > 0 && (
              <Tooltip 
                title={showEmployees ? "Hide employees" : "Show employees"}
                placement="left"
              >
                <IconButton
                  size="small"
                  onClick={() => toggleExpand(`${teamPath}-employees`)}
                  color="primary"
                >
                  <PersonIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </TableCell>
        </TableRow>
        
        {/* Employee details row */}
        {showEmployees && teamEmployees.length > 0 && (
          <TableRow>
            <TableCell colSpan={showInactive ? 4 : 3} sx={{ py: 0, backgroundColor: '#fafafa' }}>
              <Collapse in={showEmployees} timeout="auto">
                <Box sx={{ py: 2, pl: `${indent + 80}px`, pr: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Team Members ({teamEmployees.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {teamEmployees.map((emp) => (
                      <Tooltip
                        key={emp.employee_id}
                        title={
                          <Box>
                            <Typography variant="caption" display="block">
                              <strong>{emp.full_name}</strong>
                            </Typography>
                            <Typography variant="caption" display="block">
                              {emp.email}
                            </Typography>
                            {emp.market_name && (
                              <Typography variant="caption" display="block">
                                Market: {emp.market_name}
                              </Typography>
                            )}
                            <Typography variant="caption" display="block">
                              Role: {emp.current_role || 'N/A'}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Tenure: {emp.tenure_years} years
                            </Typography>
                            <Typography variant="caption" display="block">
                              Onboarded: {emp.onboarding_date}
                            </Typography>
                            {emp.offboarding_date && (
                              <Typography variant="caption" display="block">
                                Left: {emp.offboarding_date}
                              </Typography>
                            )}
                          </Box>
                        }
                        placement="top"
                        arrow
                      >
                        <Chip
                          label={emp.full_name}
                          size="small"
                          color={emp.status === 'Active' ? 'success' : 'default'}
                          variant={emp.status === 'Active' ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        )}
        
        {/* Render markets if expanded */}
        {isExpanded && hasMarkets && team.markets.map(market => 
          renderMarketRow(market, team.team_name, level + 1)
        )}
        
        {/* Render children if expanded */}
        {isExpanded && hasChildren && team.children.map(child => 
          renderTeamRow(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  // Render a market row under a team
  const renderMarketRow = (market, teamName, level) => {
    const marketPath = `market-${teamName}-${market.market_name}`;
    const marketEmployees = getTeamEmployees(teamName, market.market_name);
    const showEmployees = expanded[`${marketPath}-employees`];
    const indent = level * 40;
    
    return (
      <React.Fragment key={marketPath}>
        <TableRow 
          sx={{ 
            '&:hover': { backgroundColor: 'action.hover' },
            backgroundColor: '#f9f9f9'
          }}
        >
          <TableCell sx={{ width: '50%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: `${indent}px` }}>
              <Box sx={{ width: 32, mr: 1 }} />
              <Chip 
                label="Market"
                size="small"
                color="info"
                sx={{ mr: 1, minWidth: 60, fontSize: '0.7rem' }}
              />
              <Typography variant="body2" fontStyle="italic" color="text.secondary">
                {market.market_name}
              </Typography>
            </Box>
          </TableCell>
          <TableCell align="center" sx={{ width: '15%' }}>
            <Chip 
              label={market.active_employees}
              size="small"
              color="success"
              variant="outlined"
            />
          </TableCell>
          {showInactive && (
            <TableCell align="center" sx={{ width: '15%' }}>
              <Chip 
                label={market.inactive_employees}
                size="small"
                color="warning"
                variant="outlined"
              />
            </TableCell>
          )}
          <TableCell align="center" sx={{ width: '5%' }}>
            <Tooltip 
              title={showEmployees ? "Hide employees" : "Show employees"}
              placement="left"
            >
              <IconButton
                size="small"
                onClick={() => toggleExpand(`${marketPath}-employees`)}
                color="info"
              >
                <PersonIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
        
        {/* Market employee details row */}
        {showEmployees && (
          <TableRow>
            <TableCell colSpan={showInactive ? 4 : 3} sx={{ py: 0, backgroundColor: '#f0f4ff' }}>
              <Collapse in={showEmployees} timeout="auto">
                <Box sx={{ py: 2, pl: `${indent + 80}px`, pr: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="info.main">
                    {market.market_name} Members ({marketEmployees.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {marketEmployees.map((emp) => (
                      <Tooltip
                        key={emp.employee_id}
                        title={
                          <Box>
                            <Typography variant="caption" display="block">
                              <strong>{emp.full_name}</strong>
                            </Typography>
                            <Typography variant="caption" display="block">
                              {emp.email}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Market: {emp.market_name}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Role: {emp.current_role || 'N/A'}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Tenure: {emp.tenure_years} years
                            </Typography>
                            <Typography variant="caption" display="block">
                              Onboarded: {emp.onboarding_date}
                            </Typography>
                            {emp.offboarding_date && (
                              <Typography variant="caption" display="block">
                                Left: {emp.offboarding_date}
                              </Typography>
                            )}
                          </Box>
                        }
                        placement="top"
                        arrow
                      >
                        <Chip
                          label={emp.full_name}
                          size="small"
                          color={emp.status === 'Active' ? 'success' : 'default'}
                          variant={emp.status === 'Active' ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Employee Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Team hierarchy with employee distribution and details
      </Typography>

      {/* Filters Section */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f9f9f9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon color="primary" />
          <Typography variant="subtitle2" fontWeight="bold">
            Filters
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              label="Search Teams"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              placeholder="Filter by team name..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              label="Search Employees"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              placeholder="Filter by name or email..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Market</InputLabel>
              <Select
                value={marketFilter}
                label="Market"
                onChange={(e) => setMarketFilter(e.target.value)}
              >
                <MenuItem value="all">All Markets</MenuItem>
                {availableMarkets.map(market => (
                  <MenuItem key={market} value={market}>{market}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Team Level</InputLabel>
              <Select
                value={levelFilter}
                label="Team Level"
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="0">Level 0</MenuItem>
                <MenuItem value="1">Level 1</MenuItem>
                <MenuItem value="2">Level 2</MenuItem>
                <MenuItem value="3">Level 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  color="primary"
                />
              }
              label="Show Inactive"
            />
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Error:</strong> {error}
          </Typography>
        </Alert>
      )}

      {!loading && !error && teamSummary.length === 0 && (
        <Alert severity="info">
          No team data found
        </Alert>
      )}

      {!loading && !error && filteredTeamSummary.length > 0 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Chip 
              label={`Filtered Teams: ${filteredTeamSummary.length} / ${teamSummary.length}`} 
              color="primary" 
              size="small"
            />
            <Chip 
              label={`Filtered Employees: ${filteredEmployees.length} / ${employeeDetails.length}`} 
              color="default" 
              size="small"
            />
            <Chip 
              label={`Active: ${filteredEmployees.filter(e => e.status === 'Active').length}`} 
              color="success" 
              size="small"
            />
            <Chip 
              label={`Inactive: ${filteredEmployees.filter(e => e.status === 'Inactive').length}`} 
              color="warning" 
              size="small"
            />
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Team Hierarchy</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Active</TableCell>
                  {showInactive && (
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Inactive</TableCell>
                  )}
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {buildTeamTree.map(rootTeam => renderTeamRow(rootTeam, 0))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
}

export default EmployeeOverview;
