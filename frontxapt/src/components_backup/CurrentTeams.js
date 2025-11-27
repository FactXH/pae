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
  IconButton
} from '@mui/material';
import { ExpandMore, ChevronRight } from '@mui/icons-material';
import apiClient from '../services/apiClient';

function CurrentTeams() {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadTeams();
  }, []);

  // Toggle expansion for a specific level
  const toggleExpand = (level) => {
    setExpanded(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const loadTeams = async () => {
    setLoading(true);
    setError(null);

    const query = `
      SELECT 
        team_name, 
        parent_team_name,
        team_level AS level
      FROM data_lake_dev_xavi_silver.dim_teams
      WHERE team_type = 'Team'
      ORDER BY level, parent_team_name, team_name
    `;

    try {
      const response = await apiClient.post('/sql/execute/', { 
        query,
        database: 'trino'
      });

      console.log('=== CurrentTeams API Response ===');
      console.log('Full response:', response);
      console.log('response.status:', response.status);
      console.log('response.columns:', response.columns);
      console.log('response.rows:', response.rows);
      console.log('================================');

      // The response itself contains the data, not response.data
      if (response && response.status === 'success') {
        const { columns, rows } = response;
        
        console.log('Processing data - columns:', columns, 'rows count:', rows?.length);
        
        if (rows && columns && rows.length > 0) {
          // Transform rows array to array of objects using column names as keys
          const teamsData = rows.map(row => {
            const teamObj = {};
            columns.forEach((colName, idx) => {
              teamObj[colName] = row[idx];
            });
            return teamObj;
          });

          console.log('Transformed teams data:', teamsData);
          console.log('Setting teams state with', teamsData.length, 'teams');
          setTeams(teamsData);
        } else {
          console.log('No rows in response or missing columns');
          setTeams([]);
          setError({ message: 'No data returned from query' });
        }
      } else {
        console.log('Response not successful:', response?.message);
        setTeams([]);
        setError({ message: response?.message || 'Failed to execute query' });
      }
    } catch (err) {
      console.error('Query execution error:', err);
      console.error('Error details:', err.response || err);
      setTeams([]);
      setError({ 
        message: err.message || 'Failed to load teams',
        details: err.response?.data?.traceback || err.traceback || ''
      });
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical tree structure
  const buildTeamTree = useMemo(() => {
    if (teams.length === 0) return [];
    
    // Create a map for quick lookup
    const teamMap = {};
    teams.forEach(team => {
      teamMap[team.team_name] = {
        ...team,
        children: []
      };
    });
    
    // Build the tree by connecting children to parents
    const rootTeams = [];
    teams.forEach(team => {
      if (team.parent_team_name && teamMap[team.parent_team_name]) {
        // This team has a parent, add it to parent's children
        teamMap[team.parent_team_name].children.push(teamMap[team.team_name]);
      } else {
        // This is a root team (no parent or parent doesn't exist)
        rootTeams.push(teamMap[team.team_name]);
      }
    });
    
    return rootTeams;
  }, [teams]);

  // Render a team row recursively
  const renderTeamRow = (team, level = 0) => {
    const teamPath = `team-${team.team_name}`;
    const isExpanded = expanded[teamPath];
    const hasChildren = team.children && team.children.length > 0;
    
    const levelColors = {
      '0': 'error',
      '1': 'primary',
      '2': 'secondary', 
      '3': 'default',
    };
    const levelColor = levelColors[String(team.level)] || 'default';
    const indent = level * 40;
    
    return (
      <React.Fragment key={teamPath}>
        <TableRow 
          sx={{ 
            '&:hover': { backgroundColor: 'action.hover' },
            backgroundColor: level === 0 ? '#f5f5f5' : 'white'
          }}
        >
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: `${indent}px` }}>
              {hasChildren ? (
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
                label={`L${team.level}`} 
                size="small"
                color={levelColor}
                sx={{ mr: 1, minWidth: 40 }}
              />
              <Typography variant="body2">
                {team.team_name}
              </Typography>
            </Box>
          </TableCell>
          <TableCell>
            {team.parent_team_name ? (
              <Chip 
                label={team.parent_team_name} 
                size="small" 
                variant="outlined"
                color={levelColor}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                —
              </Typography>
            )}
          </TableCell>
        </TableRow>
        
        {/* Render children if expanded */}
        {isExpanded && hasChildren && team.children.map(child => 
          renderTeamRow(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Current Teams
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Organization team structure from dim_teams
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Error:</strong> {error.message}
          </Typography>
          {error.details && (
            <Typography variant="caption" component="div" sx={{ mt: 1 }}>
              {error.details}
            </Typography>
          )}
        </Alert>
      )}

      {!loading && !error && teams.length === 0 && (
        <Alert severity="info">
          No teams found
        </Alert>
      )}

      {!loading && !error && teams.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '60%' }}>Team Hierarchy</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Parent Team</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {buildTeamTree.map(rootTeam => renderTeamRow(rootTeam, 0))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Total teams: {teams.length}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Source: data_lake_dev_xavi_silver.dim_teams
        </Typography>
      </Box>
    </Paper>
  );
}

export default CurrentTeams;
