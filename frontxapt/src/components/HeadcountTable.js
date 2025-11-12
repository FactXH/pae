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
import { mockEmployeeData } from '../data/mockEmployeeData';

/**
 * HeadcountTable Component
 * 
 * Displays current headcount in a hierarchical decision tree table format
 * Hierarchy: Team -> Sub Team -> Job Role -> Level
 * 
 * @param {Object} filters - Filter object from OverviewFilters component
 */
function HeadcountTable({ filters = {} }) {
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
    let data = mockEmployeeData; // Include all employees
    
    // Filter by time travel - exclude employees not yet onboarded
    if (filters.time_travel !== undefined) {
      const minDate = new Date('2022-10-01');
      const timeTravelDate = new Date(minDate);
      timeTravelDate.setDate(timeTravelDate.getDate() + filters.time_travel);
      const timeTravelDateStr = timeTravelDate.toISOString().split('T')[0];
      
      // Only include employees who have been onboarded by the time travel date
      data = data.filter(emp => emp.onboarding_date <= timeTravelDateStr);
    }
    
    // Apply attribute filters
    if (filters.team && filters.team.length > 0) data = data.filter(d => filters.team.includes(d.team));
    if (filters.sub_team && filters.sub_team.length > 0) data = data.filter(d => filters.sub_team.includes(d.sub_team));
    if (filters.level && filters.level.length > 0) data = data.filter(d => filters.level.includes(d.level));
    if (filters.job_role && filters.job_role.length > 0) data = data.filter(d => filters.job_role.includes(d.job_role));
    if (filters.domain && filters.domain.length > 0) data = data.filter(d => filters.domain.includes(d.domain));
    
    return data;
  }, [filters]);

  // Calculate active and inactive counts based on time travel or current state
  // Note: filteredData already excludes employees not yet onboarded
  const { activeCount, inactiveCount } = useMemo(() => {
    if (filters.time_travel !== undefined) {
      const minDate = new Date('2022-10-01');
      const timeTravelDate = new Date(minDate);
      timeTravelDate.setDate(timeTravelDate.getDate() + filters.time_travel);
      const timeTravelDateStr = timeTravelDate.toISOString().split('T')[0];
      
      // Active: no offboarding OR offboarded after time_travel
      const active = filteredData.filter(emp => 
        !emp.offboarding_date || emp.offboarding_date > timeTravelDateStr
      ).length;
      
      // Inactive: already offboarded by time_travel date
      const inactive = filteredData.filter(emp => 
        emp.offboarding_date && emp.offboarding_date <= timeTravelDateStr
      ).length;
      
      return { activeCount: active, inactiveCount: inactive };
    }
    
    // Default behavior (current state)
    const active = filteredData.filter(emp => !emp.offboarding_date).length;
    const inactive = filteredData.filter(emp => emp.offboarding_date).length;
    
    return { activeCount: active, inactiveCount: inactive };
  }, [filteredData, filters.time_travel]);

  // Build hierarchical structure with active/inactive breakdown
  const treeData = useMemo(() => {
    const tree = {};
    
    // Determine if employee is active or inactive based on time travel
    // Note: employees not yet onboarded are already filtered out in filteredData
    const getEmployeeStatus = (emp) => {
      if (filters.time_travel !== undefined) {
        const minDate = new Date('2022-10-01');
        const timeTravelDate = new Date(minDate);
        timeTravelDate.setDate(timeTravelDate.getDate() + filters.time_travel);
        const timeTravelDateStr = timeTravelDate.toISOString().split('T')[0];
        
        // Employee is active if not offboarded OR offboarded after time travel date
        const stillActive = !emp.offboarding_date || emp.offboarding_date > timeTravelDateStr;
        return stillActive ? 'active' : 'inactive';
      }
      return emp.offboarding_date ? 'inactive' : 'active';
    };
    
    filteredData.forEach(emp => {
      const status = getEmployeeStatus(emp);
      
      // Initialize team
      if (!tree[emp.team]) {
        tree[emp.team] = {
          count: 0,
          active: 0,
          inactive: 0,
          subTeams: {},
        };
      }
      tree[emp.team].count++;
      tree[emp.team][status]++;
      
      // Initialize sub team
      if (!tree[emp.team].subTeams[emp.sub_team]) {
        tree[emp.team].subTeams[emp.sub_team] = {
          count: 0,
          active: 0,
          inactive: 0,
          jobRoles: {},
        };
      }
      tree[emp.team].subTeams[emp.sub_team].count++;
      tree[emp.team].subTeams[emp.sub_team][status]++;
      
      // Initialize job role
      if (!tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role]) {
        tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role] = {
          count: 0,
          active: 0,
          inactive: 0,
          levels: {},
        };
      }
      tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role].count++;
      tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role][status]++;
      
      // Initialize level
      if (!tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role].levels[emp.level]) {
        tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role].levels[emp.level] = {
          count: 0,
          active: 0,
          inactive: 0,
          employees: [],
        };
      }
      tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role].levels[emp.level].count++;
      tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role].levels[emp.level][status]++;
      
      // Add employee to the level
      tree[emp.team].subTeams[emp.sub_team].jobRoles[emp.job_role].levels[emp.level].employees.push({
        email: emp.email,
        first_name: emp.first_name,
        last_name: emp.last_name,
        isActive: status === 'active',
      });
    });
    
    return tree;
  }, [filteredData, filters.time_travel]);

  // Helper function to get color based on headcount
  const getColorForCount = (count) => {
    if (count >= 10) return '#4caf50'; // Green - Large team
    if (count >= 5) return '#8bc34a'; // Light green
    if (count >= 3) return '#ffc107'; // Yellow - Medium team
    if (count >= 2) return '#ff9800'; // Orange
    return '#f44336'; // Red - Small team
  };

  // Helper function to get size indicator
  const getSizeIndicator = (count) => {
    if (count >= 10) return '🏢 Large';
    if (count >= 5) return '🏪 Medium';
    if (count >= 3) return '🏠 Small';
    return '👤 Minimal';
  };

  const rows = [];
  
  // Build table rows
  Object.keys(treeData).sort().forEach(team => {
    const teamData = treeData[team];
    const teamPath = `team-${team}`;
    const hasSubTeams = Object.keys(teamData.subTeams).length > 0;
    
    // Team row
    rows.push({
      level: 0,
      label: team,
      count: teamData.count,
      active: teamData.active,
      inactive: teamData.inactive,
      key: teamPath,
      hasChildren: hasSubTeams,
      path: teamPath,
    });
    
    // Only show sub teams if team is expanded
    if (expanded[teamPath]) {
      // Sub team rows
      Object.keys(teamData.subTeams).sort().forEach(subTeam => {
        const subTeamData = teamData.subTeams[subTeam];
        const subTeamPath = `subteam-${team}-${subTeam}`;
        const hasJobRoles = Object.keys(subTeamData.jobRoles).length > 0;
        
        rows.push({
          level: 1,
          label: subTeam,
          count: subTeamData.count,
          active: subTeamData.active,
          inactive: subTeamData.inactive,
          key: subTeamPath,
          hasChildren: hasJobRoles,
          path: subTeamPath,
        });
        
        // Only show job roles if sub team is expanded
        if (expanded[subTeamPath]) {
          // Job Role rows
          Object.keys(subTeamData.jobRoles).sort().forEach(jobRole => {
            const jobRoleData = subTeamData.jobRoles[jobRole];
            const jobRolePath = `jobrole-${team}-${subTeam}-${jobRole}`;
            const hasLevels = Object.keys(jobRoleData.levels).length > 0;
            
            rows.push({
              level: 2,
              label: jobRole,
              count: jobRoleData.count,
              active: jobRoleData.active,
              inactive: jobRoleData.inactive,
              key: jobRolePath,
              hasChildren: hasLevels,
              path: jobRolePath,
            });
            
            // Only show levels if job role is expanded
            if (expanded[jobRolePath]) {
              // Level rows
              Object.keys(jobRoleData.levels).sort().forEach(level => {
                const levelData = jobRoleData.levels[level];
                const levelPath = `level-${team}-${subTeam}-${jobRole}-${level}`;
                const hasEmployees = levelData.employees && levelData.employees.length > 0;
                
                rows.push({
                  level: 3,
                  label: level,
                  count: levelData.count,
                  active: levelData.active,
                  inactive: levelData.inactive,
                  key: levelPath,
                  hasChildren: hasEmployees,
                  path: levelPath,
                });
                
                // Only show employees if level is expanded
                if (expanded[levelPath] && hasEmployees) {
                  // Employee rows
                  levelData.employees.sort((a, b) => a.email.localeCompare(b.email)).forEach(employee => {
                    const employeePath = `employee-${team}-${subTeam}-${jobRole}-${level}-${employee.email}`;
                    
                    rows.push({
                      level: 4,
                      label: `${employee.first_name} ${employee.last_name}`,
                      email: employee.email,
                      isActive: employee.isActive,
                      key: employeePath,
                      hasChildren: false,
                      path: employeePath,
                      isEmployee: true,
                    });
                  });
                }
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
          Headcount & Turnover - Decision Tree
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Hierarchical breakdown: Team → Sub Team → Job Role → Level
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Chip 
            label={`Total Employees: ${filteredData.length}`} 
            color="primary" 
            size="small"
          />
          <Chip 
            label={`Active: ${activeCount}`} 
            color="success" 
            size="small"
          />
          <Chip 
            label={`Inactive: ${inactiveCount}`} 
            color="warning" 
            size="small"
          />
        </Box>
      </Box>

      {filteredData.length === 0 ? (
        <Box height={200} display="flex" alignItems="center" justifyContent="center">
          <Typography color="text.secondary">
            No employees for selected filters
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Segment</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '20%' }}>Headcount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '30%' }}>Size</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const indent = row.level * 30;
                const bgColor = row.level === 0 ? '#e3f2fd' : 
                                row.level === 1 ? '#f5f5f5' : 
                                row.level === 2 ? '#fafafa' : 
                                row.level === 3 ? 'white' :
                                '#f9f9f9'; // Employee rows
                const fontWeight = row.level === 0 ? 'bold' : 
                                   row.level === 1 ? 600 : 
                                   row.level === 2 ? 500 : 
                                   row.level === 3 ? 'normal' : 300;
                const isExpanded = expanded[row.path];
                const cellPaddingLeft = row.level === 0 ? 8 : 16 + indent;
                const valuePaddingLeft = row.level === 0 ? '16px' : `${40 + (row.level * 16)}px`;
                
                // Determine if this is a leaf node (most granular visible level)
                // A node is a leaf if: it has no children OR it has children but is not expanded
                const isLeafNode = !row.hasChildren || (row.hasChildren && !isExpanded);
                
                // Employee row has different rendering
                if (row.isEmployee) {
                  return (
                    <TableRow 
                      key={row.key}
                      sx={{ 
                        backgroundColor: bgColor,
                        '&:hover': { backgroundColor: '#e8f5e9' }
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          paddingLeft: `${cellPaddingLeft}px`,
                          fontWeight: fontWeight,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ width: 32, mr: 1 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {row.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {row.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ paddingLeft: valuePaddingLeft }}>
                        <Chip 
                          label={row.isActive ? 'Active' : 'Inactive'} 
                          size="small" 
                          color={row.isActive ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ minWidth: 80, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ paddingLeft: valuePaddingLeft }}>
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                }
                
                return (
                  <TableRow 
                    key={row.key}
                    sx={{ 
                      backgroundColor: bgColor,
                      '&:hover': { backgroundColor: row.level === 0 ? '#bbdefb' : '#eeeeee' }
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        paddingLeft: `${cellPaddingLeft}px`,
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
                    <TableCell align="center" sx={{ paddingLeft: valuePaddingLeft }}>
                      <Box display="flex" gap={0.5} justifyContent="center" alignItems="center">
                        <Chip 
                          label={row.count} 
                          size="small" 
                          variant="filled"
                          sx={{ 
                            minWidth: 50,
                            backgroundColor: isLeafNode ? '#1976d2' : '#e0e0e0',
                            color: isLeafNode ? 'white' : 'text.secondary',
                            fontWeight: isLeafNode ? 'bold' : 'normal',
                          }}
                        />
                        <Chip 
                          label={`✓ ${row.active}`} 
                          size="small" 
                          color="success"
                          variant="outlined"
                          sx={{ minWidth: 50, fontSize: '0.75rem' }}
                        />
                        <Chip 
                          label={`⊗ ${row.inactive}`} 
                          size="small" 
                          color="warning"
                          variant="outlined"
                          sx={{ minWidth: 50, fontSize: '0.75rem' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ paddingLeft: valuePaddingLeft }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: row.level === 0 ? 600 : 'normal' }}>
                        {getSizeIndicator(row.count)}
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

export default HeadcountTable;
