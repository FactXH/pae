import React, { useMemo, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import { ExpandMore, ChevronRight } from '@mui/icons-material';
import { mockTimeToHireData } from '../data/mockTimeToHireData';

/**
 * TimeToHireTable Component
 * 
 * Displays average time to hire in a hierarchical decision tree table format
 * Hierarchy: Team -> Sub Team -> Job Role -> Seniority
 * 
 * @param {Object} filters - Filter object from TAFilters component
 */
function TimeToHireTable({ filters = {} }) {
  // State to track expanded nodes
  const [expanded, setExpanded] = useState({});

  // Toggle expansion for a specific node
  const toggleExpand = (path) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    let data = mockTimeToHireData;
    
    if (filters.team) data = data.filter(d => d.team === filters.team);
    if (filters.sub_team) data = data.filter(d => d.sub_team === filters.sub_team);
    if (filters.job_role) data = data.filter(d => d.job_role === filters.job_role);
    if (filters.seniority) data = data.filter(d => d.seniority === filters.seniority);
    if (filters.market) data = data.filter(d => d.market === filters.market);
    if (filters.manager) data = data.filter(d => d.manager === filters.manager);
    
    return data;
  }, [filters]);

  // Build hierarchical structure with averages
  const treeData = useMemo(() => {
    const tree = {};
    
    filteredData.forEach(item => {
      // Initialize team
      if (!tree[item.team]) {
        tree[item.team] = {
          days: [],
          subTeams: {},
        };
      }
      tree[item.team].days.push(item.daysToHire);
      
      // Initialize sub team
      if (!tree[item.team].subTeams[item.sub_team]) {
        tree[item.team].subTeams[item.sub_team] = {
          days: [],
          jobRoles: {},
        };
      }
      tree[item.team].subTeams[item.sub_team].days.push(item.daysToHire);
      
      // Initialize job role
      if (!tree[item.team].subTeams[item.sub_team].jobRoles[item.job_role]) {
        tree[item.team].subTeams[item.sub_team].jobRoles[item.job_role] = {
          days: [],
          seniorities: {},
        };
      }
      tree[item.team].subTeams[item.sub_team].jobRoles[item.job_role].days.push(item.daysToHire);
      
      // Initialize seniority
      if (!tree[item.team].subTeams[item.sub_team].jobRoles[item.job_role].seniorities[item.seniority]) {
        tree[item.team].subTeams[item.sub_team].jobRoles[item.job_role].seniorities[item.seniority] = {
          days: [],
        };
      }
      tree[item.team].subTeams[item.sub_team].jobRoles[item.job_role].seniorities[item.seniority].days.push(item.daysToHire);
    });
    
    return tree;
  }, [filteredData]);

  // Calculate average
  const calculateAverage = (days) => {
    if (days.length === 0) return 0;
    const sum = days.reduce((acc, d) => acc + d, 0);
    return Math.round(sum / days.length);
  };

  // Get color based on days
  const getColorForDays = (days) => {
    if (days <= 20) return '#4caf50'; // Green - Fast
    if (days <= 35) return '#8bc34a'; // Light green
    if (days <= 45) return '#ffc107'; // Yellow - Average
    if (days <= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red - Slow
  };

  const rows = [];
  
  // Build table rows
  Object.keys(treeData).sort().forEach(team => {
    const teamData = treeData[team];
    const teamAvg = calculateAverage(teamData.days);
    const teamPath = `team-${team}`;
    const hasSubTeams = Object.keys(teamData.subTeams).length > 0;
    
    // Team row
    rows.push({
      level: 0,
      label: team,
      count: teamData.days.length,
      average: teamAvg,
      key: teamPath,
      hasChildren: hasSubTeams,
      path: teamPath,
    });
    
    // Only show sub teams if team is expanded
    if (expanded[teamPath]) {
      // Sub team rows
      Object.keys(teamData.subTeams).sort().forEach(subTeam => {
        const subTeamData = teamData.subTeams[subTeam];
        const subTeamAvg = calculateAverage(subTeamData.days);
        const subTeamPath = `subteam-${team}-${subTeam}`;
        const hasJobRoles = Object.keys(subTeamData.jobRoles).length > 0;
        
        rows.push({
          level: 1,
          label: subTeam,
          count: subTeamData.days.length,
          average: subTeamAvg,
          key: subTeamPath,
          hasChildren: hasJobRoles,
          path: subTeamPath,
        });
        
        // Only show job roles if sub team is expanded
        if (expanded[subTeamPath]) {
          // Job role rows
          Object.keys(subTeamData.jobRoles).sort().forEach(jobRole => {
            const jobRoleData = subTeamData.jobRoles[jobRole];
            const jobRoleAvg = calculateAverage(jobRoleData.days);
            const jobRolePath = `jobrole-${team}-${subTeam}-${jobRole}`;
            const hasSeniorities = Object.keys(jobRoleData.seniorities).length > 0;
            
            rows.push({
              level: 2,
              label: jobRole,
              count: jobRoleData.days.length,
              average: jobRoleAvg,
              key: jobRolePath,
              hasChildren: hasSeniorities,
              path: jobRolePath,
            });
            
            // Only show seniorities if job role is expanded
            if (expanded[jobRolePath]) {
              // Seniority rows
              Object.keys(jobRoleData.seniorities).sort().forEach(seniority => {
                const seniorityData = jobRoleData.seniorities[seniority];
                const seniorityAvg = calculateAverage(seniorityData.days);
                const seniorityPath = `seniority-${team}-${subTeam}-${jobRole}-${seniority}`;
                
                rows.push({
                  level: 3,
                  label: seniority,
                  count: seniorityData.days.length,
                  average: seniorityAvg,
                  key: seniorityPath,
                  hasChildren: false,
                  path: seniorityPath,
                });
              });
            }
          });
        }
      });
    }
  });

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Average Time to Hire - Decision Tree
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Hierarchical breakdown: Team → Sub Team → Job Role → Seniority
        </Typography>
      </Box>

      {filteredData.length === 0 ? (
        <Box height={200} display="flex" alignItems="center" justifyContent="center">
          <Typography color="text.secondary">
            No data available for selected filters
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Segment</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '15%' }}>Hires</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '20%' }}>Avg Days</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '15%' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const indent = row.level * 30;
                const bgColor = row.level === 0 ? '#f5f5f5' : 
                                row.level === 1 ? '#fafafa' : 
                                row.level === 2 ? '#fcfcfc' : 'white';
                const fontWeight = row.level === 0 ? 'bold' : 
                                   row.level === 1 ? 600 : 
                                   row.level === 2 ? 500 : 'normal';
                
                const isExpanded = expanded[row.path];
                
                return (
                  <TableRow 
                    key={row.key}
                    sx={{ 
                      backgroundColor: bgColor,
                      '&:hover': { backgroundColor: row.level === 0 ? '#eeeeee' : '#f0f0f0' }
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        paddingLeft: `${8 + indent}px`,
                        fontWeight: fontWeight,
                        fontSize: row.level === 0 ? '0.95rem' : '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {row.hasChildren ? (
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(row.path)}
                          sx={{ mr: 1, padding: '4px' }}
                        >
                          {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                        </IconButton>
                      ) : (
                        <Box sx={{ width: 32, mr: 1 }} />
                      )}
                      {row.label}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={row.count} 
                        size="small" 
                        variant="outlined"
                        sx={{ minWidth: 40 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`${row.average} days`}
                        size="small"
                        sx={{ 
                          backgroundColor: getColorForDays(row.average),
                          color: 'white',
                          fontWeight: 'bold',
                          minWidth: 80,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: getColorForDays(row.average),
                          fontWeight: 'bold',
                        }}
                      >
                        {row.average <= 20 ? '🚀 Fast' :
                         row.average <= 35 ? '✓ Good' :
                         row.average <= 45 ? '⚡ Average' :
                         row.average <= 60 ? '⚠️ Slow' : '🐌 Very Slow'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

export default TimeToHireTable;
