import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import * as d3 from 'd3';
import apiClient from '../services/apiClient';

function TeamBubbleChart() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamSummary, setTeamSummary] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState([]);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  
  // Filter states
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (teamSummary.length > 0) {
      renderBubbleChart();
    }
  }, [teamSummary, expandedTeams, teamFilter, statusFilter, levelFilter, marketFilter, dimensions]);

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

  // Filter team data
  const filteredTeamSummary = useMemo(() => {
    return teamSummary.filter(team => {
      // Only show team rows (not market rows) for the bubble chart
      if (team.is_market_row) return false;
      
      // Level filter
      if (levelFilter !== 'all' && String(team.team_level) !== levelFilter) {
        return false;
      }
      
      // Team name filter
      if (teamFilter && !team.team_name.toLowerCase().includes(teamFilter.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [teamSummary, teamFilter, levelFilter]);

  // Build hierarchical structure
  const hierarchyData = useMemo(() => {
    if (filteredTeamSummary.length === 0) return null;
    
    const teamMap = {};
    
    // Create nodes
    filteredTeamSummary.forEach(team => {
      teamMap[team.team_name] = {
        ...team,
        children: []
      };
    });
    
    // Build tree
    const rootTeams = [];
    filteredTeamSummary.forEach(team => {
      if (team.parent_team_name && teamMap[team.parent_team_name]) {
        teamMap[team.parent_team_name].children.push(teamMap[team.team_name]);
      } else {
        rootTeams.push(teamMap[team.team_name]);
      }
    });
    
    // Create root node
    return {
      team_name: 'Organization',
      team_level: -1,
      total_employees: rootTeams.reduce((sum, t) => sum + (t.total_employees || 0), 0),
      active_employees: rootTeams.reduce((sum, t) => sum + (t.active_employees || 0), 0),
      inactive_employees: rootTeams.reduce((sum, t) => sum + (t.inactive_employees || 0), 0),
      children: rootTeams
    };
  }, [filteredTeamSummary]);

  // Color palette for parent teams
  const colorPalette = [
    '#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2',
    '#0097a7', '#c2185b', '#512da8', '#00796b', '#e64a19'
  ];

  const getTeamColor = (teamName, parentName) => {
    // For root teams, use index-based color
    const rootTeams = filteredTeamSummary.filter(t => !t.parent_team_name);
    const rootIndex = rootTeams.findIndex(t => t.team_name === teamName);
    if (rootIndex !== -1) {
      return colorPalette[rootIndex % colorPalette.length];
    }
    
    // For child teams, find their root parent and use that color with lighter shade
    const findRoot = (name) => {
      const team = filteredTeamSummary.find(t => t.team_name === name);
      if (!team || !team.parent_team_name) return name;
      return findRoot(team.parent_team_name);
    };
    
    const rootName = findRoot(teamName);
    const rootIdx = rootTeams.findIndex(t => t.team_name === rootName);
    
    // If root not found, return a default color
    if (rootIdx === -1) {
      return colorPalette[0];
    }
    
    return colorPalette[rootIdx % colorPalette.length];
  };

  const toggleTeam = (teamName) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamName)) {
        newSet.delete(teamName);
      } else {
        newSet.add(teamName);
      }
      return newSet;
    });
  };

  const renderBubbleChart = () => {
    if (!hierarchyData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Create hierarchy
    const root = d3.hierarchy(hierarchyData);
    
    // Filter nodes based on expanded state
    const visibleNodes = [];
    const traverse = (node, shouldShow = true) => {
      if (shouldShow) {
        visibleNodes.push(node);
        if (expandedTeams.has(node.data.team_name) && node.children) {
          node.children.forEach(child => traverse(child, true));
        }
      }
    };
    traverse(root);

    // Create links
    const links = [];
    visibleNodes.forEach(node => {
      if (node.parent && visibleNodes.includes(node.parent)) {
        links.push({
          source: node.parent,
          target: node
        });
      }
    });

    // Calculate bubble size based on employee count
    const maxEmployees = d3.max(visibleNodes, d => d.data.total_employees || 1);
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxEmployees])
      .range([20, 80]);

    // Assign positions and radius to nodes
    visibleNodes.forEach(node => {
      node.radius = radiusScale(node.data.total_employees || 1);
    });

    // Set initial positions to prevent overlap
    // Position root nodes
    const rootNodes = visibleNodes.filter(n => !n.parent || !visibleNodes.includes(n.parent));
    rootNodes.forEach((node, i) => {
      const angle = (i / rootNodes.length) * 2 * Math.PI;
      const distance = 150;
      node.x = width / 2 + Math.cos(angle) * distance;
      node.y = height / 2 + Math.sin(angle) * distance;
    });

    // Position child nodes around their parents
    visibleNodes.forEach(node => {
      if (node.parent && visibleNodes.includes(node.parent)) {
        const siblings = visibleNodes.filter(n => n.parent === node.parent);
        const index = siblings.indexOf(node);
        const angle = (index / siblings.length) * 2 * Math.PI;
        const distance = node.parent.radius + node.radius + 100;
        
        if (node.parent.x && node.parent.y) {
          node.x = node.parent.x + Math.cos(angle) * distance;
          node.y = node.parent.y + Math.sin(angle) * distance;
        } else {
          node.x = width / 2 + Math.random() * 100 - 50;
          node.y = height / 2 + Math.random() * 100 - 50;
        }
      }
    });

    // Create force simulation
    const simulation = d3.forceSimulation(visibleNodes)
      .force('link', d3.forceLink(links)
        .distance(d => {
          // Increase distance between parent and child
          return d.source.radius + d.target.radius + 80;
        })
        .strength(0.8))
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // Stronger repulsion for larger bubbles
          return -500 - (d.radius * 8);
        })
        .distanceMax(400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => d.radius + 25)
        .strength(1)
        .iterations(3))
      .force('x', d3.forceX(width / 2).strength(0.03))
      .force('y', d3.forceY(height / 2).strength(0.03))
      .force('radial', d3.forceRadial(d => {
        // Push child nodes outward from their parent
        if (d.parent && visibleNodes.includes(d.parent)) {
          return d.parent.radius + d.radius + 120;
        }
        return 0;
      }, d => d.parent ? d.parent.x || width / 2 : width / 2, 
         d => d.parent ? d.parent.y || height / 2 : height / 2)
        .strength(d => d.parent ? 0.3 : 0))
      .alphaDecay(0.015)
      .velocityDecay(0.4);

    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Draw nodes (bubbles)
    const node = g.append('g')
      .selectAll('g')
      .data(visibleNodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        const color = getTeamColor(d.data.team_name, d.data.parent_team_name);
        const baseColor = d3.color(color);
        // Make lighter for child teams
        if (baseColor && d.depth > 1) {
          baseColor.opacity = 0.7 - (d.depth - 1) * 0.15;
        }
        return baseColor ? baseColor.toString() : color;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add expand/collapse button
    node.filter(d => d.children && d.children.length > 0)
      .append('circle')
      .attr('class', 'toggle-button')
      .attr('r', 15)
      .attr('cx', d => d.radius * 0.7)
      .attr('cy', d => -d.radius * 0.7)
      .attr('fill', '#fff')
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        toggleTeam(d.data.team_name);
      });

    // Add +/- symbol
    node.filter(d => d.children && d.children.length > 0)
      .append('text')
      .attr('class', 'toggle-symbol')
      .attr('x', d => d.radius * 0.7)
      .attr('y', d => -d.radius * 0.7)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .style('pointer-events', 'none')
      .text(d => expandedTeams.has(d.data.team_name) ? '−' : '+');

    // Add team name
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', d => Math.min(d.radius / 3, 14) + 'px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text(d => {
        const name = d.data.team_name;
        const maxLen = Math.floor(d.radius / 5);
        return name.length > maxLen ? name.substring(0, maxLen) + '...' : name;
      });

    // Add employee count
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('dy', '1.2em')
      .attr('font-size', d => Math.min(d.radius / 4, 12) + 'px')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text(d => `${d.data.total_employees || 0} employees`);

    // Add tooltip
    node.append('title')
      .text(d => {
        return `${d.data.team_name}\n` +
               `Level: ${d.data.team_level}\n` +
               `Total: ${d.data.total_employees || 0}\n` +
               `Active: ${d.data.active_employees || 0}\n` +
               `Inactive: ${d.data.inactive_employees || 0}` +
               (d.children ? `\n\nClick + to expand` : '');
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Team Organization Bubble Chart
        </Typography>
        <Tooltip title="Reload data">
          <IconButton onClick={loadData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Search Team"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Team Level</InputLabel>
            <Select
              value={levelFilter}
              label="Team Level"
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="0">L0</MenuItem>
              <MenuItem value="1">L1</MenuItem>
              <MenuItem value="2">L2</MenuItem>
              <MenuItem value="3">L3</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              icon={<FilterListIcon />}
              label={`${filteredTeamSummary.length} teams`}
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={`${expandedTeams.size} expanded`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Grid>
      </Grid>

      {/* Legend */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          💡 Drag bubbles to reposition • Scroll to zoom • Click + to expand/collapse teams
        </Typography>
      </Box>

      {/* SVG Container */}
      <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ backgroundColor: '#fafafa' }}
        />
      </Box>
    </Paper>
  );
}

export default TeamBubbleChart;
