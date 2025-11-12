import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Box, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Stack, 
  Button, 
  Popover, 
  Typography,
  Divider,
  Grid,
  IconButton,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { mockEmployeeData } from '../data/mockEmployeeData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

/**
 * HeadcountTimeline Component
 * 
 * Displays timeline charts showing team headcount evolution over time
 * Shows active and inactive headcount for each team
 * 
 * @param {Object} filters - Filter object from OverviewFilters component
 */
function HeadcountTimeline({ filters = {} }) {
  // Get unique teams from filtered employees
  const teams = useMemo(() => {
    let data = mockEmployeeData;
    
    // Apply team filter to get only selected teams
    if (filters.team && filters.team.length > 0) {
      data = data.filter(d => filters.team.includes(d.team));
    }
    
    return [...new Set(data.map(emp => emp.team))].sort();
  }, [filters.team]);

  // Initialize visibility state - all teams visible, inactive hidden by default
  const [visibleLines, setVisibleLines] = useState(() => {
    const initial = {};
    teams.forEach(team => {
      initial[`${team} - Active`] = true;
      initial[`${team} - Inactive`] = false;
    });
    return initial;
  });

  // Toggle line visibility
  const handleToggleLine = (lineName) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineName]: !prev[lineName]
    }));
  };

  // Toggle all inactive lines at once
  const handleToggleAllInactive = () => {
    const inactiveLines = Object.keys(visibleLines).filter(name => name.includes('Inactive'));
    const allInactiveVisible = inactiveLines.every(line => visibleLines[line]);
    
    setVisibleLines(prev => {
      const updated = { ...prev };
      inactiveLines.forEach(line => {
        updated[line] = !allInactiveVisible;
      });
      return updated;
    });
  };

  // Popover state
  const [anchorEl, setAnchorEl] = useState(null);
  const handleOpenPopover = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClosePopover = () => {
    setAnchorEl(null);
  };
  const openPopover = Boolean(anchorEl);

  // Filter employees based on filters
  const filteredEmployees = useMemo(() => {
    let data = mockEmployeeData;
    
    if (filters.team && filters.team.length > 0) data = data.filter(d => filters.team.includes(d.team));
    if (filters.sub_team && filters.sub_team.length > 0) data = data.filter(d => filters.sub_team.includes(d.sub_team));
    if (filters.level && filters.level.length > 0) data = data.filter(d => filters.level.includes(d.level));
    if (filters.job_role && filters.job_role.length > 0) data = data.filter(d => filters.job_role.includes(d.job_role));
    if (filters.domain && filters.domain.length > 0) data = data.filter(d => filters.domain.includes(d.domain));
    
    return data;
  }, [filters]);

  // Generate date range (monthly intervals from Oct 2022 to Nov 2025)
  // Respects date_range filter if present
  const generateDateRange = () => {
    const dates = [];
    let start = new Date('2022-10-01');
    let end = new Date('2025-11-30');
    
    // Apply date_range filter if present
    if (filters.date_range && filters.date_range.length === 2) {
      const minDate = new Date('2022-10-01');
      const startValue = filters.date_range[0];
      const endValue = filters.date_range[1];
      
      start = new Date(minDate);
      start.setDate(start.getDate() + startValue);
      end = new Date(minDate);
      end.setDate(end.getDate() + endValue);
    }
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + 1);
    }
    
    return dates;
  };

  const allDates = generateDateRange();

  // Calculate headcount per team per date
  const calculateHeadcountByTeamAndDate = () => {
    const data = {};
    
    teams.forEach(team => {
      data[team] = {
        active: {},
        inactive: {},
      };
      
      allDates.forEach(date => {
        const employeesInTeam = filteredEmployees.filter(emp => emp.team === team);
        
        let active = 0;
        let inactive = 0;
        
        employeesInTeam.forEach(emp => {
          const onboarded = emp.onboarding_date <= date;
          const stillActive = !emp.offboarding_date || emp.offboarding_date > date;
          
          if (onboarded) {
            if (stillActive) {
              active++;
            } else {
              inactive++;
            }
          }
        });
        
        data[team].active[date] = active;
        data[team].inactive[date] = inactive;
      });
    });
    
    return data;
  };

  const headcountData = useMemo(() => calculateHeadcountByTeamAndDate(), [filteredEmployees, allDates]);

  // Color palette for teams
  const teamColors = {
    'Engineering': { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.15)' },      // Blue
    'Product': { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.15)' },        // Purple
    'Sales': { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.15)' },            // Teal
    'Marketing': { border: 'rgb(255, 159, 64)', bg: 'rgba(255, 159, 64, 0.15)' },        // Orange
    'Data': { border: 'rgb(255, 205, 86)', bg: 'rgba(255, 205, 86, 0.15)' },             // Yellow
  };
  
  const defaultColor = { border: 'rgb(201, 203, 207)', bg: 'rgba(201, 203, 207, 0.15)' }; // Grey

  // Create datasets with separate Y-axes
  const datasets = [];
  
  teams.forEach(team => {
    const color = teamColors[team] || defaultColor;
    
    // Active dataset - uses y-axis 'y'
    if (visibleLines[`${team} - Active`]) {
      datasets.push({
        label: `${team} - Active`,
        data: allDates.map(date => headcountData[team].active[date]),
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      });
    }
    
    // Inactive dataset (darker shade) - uses y-axis 'y1'
    if (visibleLines[`${team} - Inactive`]) {
      const inactiveBorder = color.border.replace('rgb', 'rgba').replace(')', ', 0.6)');
      const inactiveBg = color.bg.replace(/[\d.]+\)/, '0.08)');
      
      datasets.push({
        label: `${team} - Inactive`,
        data: allDates.map(date => headcountData[team].inactive[date]),
        borderColor: inactiveBorder,
        backgroundColor: inactiveBg,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      });
    }
  });

  // Calculate max values for each axis to ensure equal unit heights
  const maxActiveValue = Math.max(
    ...datasets
      .filter(ds => ds.yAxisID === 'y')
      .flatMap(ds => ds.data),
    1 // minimum 1 to avoid division by zero
  );
  
  const maxInactiveValue = Math.max(
    ...datasets
      .filter(ds => ds.yAxisID === 'y1')
      .flatMap(ds => ds.data),
    1 // minimum 1 to avoid division by zero
  );
  
  // Use the larger max to ensure equal unit heights
  const globalMax = Math.max(maxActiveValue, maxInactiveValue);
  // Add 10% padding
  const axisMax = Math.ceil(globalMax * 1.1);

  const chartData = {
    labels: allDates,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          generateLabels: function(chart) {
            const labels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            labels.forEach(label => {
              if (label.text.includes('Inactive')) {
                label.lineDash = [5, 5];
              }
            });
            return labels;
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        animation: false,
        callbacks: {
          title: function(context) {
            return `Date: ${context[0].label}`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} employees`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 15,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: axisMax,
        title: {
          display: true,
          text: 'Active Headcount',
        },
        ticks: {
          precision: 0,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: axisMax,
        title: {
          display: true,
          text: 'Inactive Headcount',
        },
        ticks: {
          precision: 0,
        },
        grid: {
          drawOnChartArea: false, // Don't draw grid lines for this axis
        },
      },
    },
  };

  // Count visible lines
  const visibleCount = Object.values(visibleLines).filter(v => v).length;

  return (
    <Box>
      {/* Line toggle controls - Compact button with popover */}
      <Box mb={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            size="medium"
            startIcon={<TuneIcon />}
            onClick={handleOpenPopover}
            sx={{ textTransform: 'none' }}
          >
            Configure Lines ({visibleCount} visible)
          </Button>
          <Button 
            variant="outlined" 
            size="medium"
            onClick={handleToggleAllInactive}
            sx={{ textTransform: 'none' }}
          >
            Toggle All Inactive
          </Button>
        </Stack>

        {/* Popover with team selections */}
        <Popover
          open={openPopover}
          anchorEl={anchorEl}
          onClose={handleClosePopover}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 3, minWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              Select Team Lines
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              {/* Left column - Active */}
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                  Active Headcount
                </Typography>
                <FormGroup>
                  {teams.map((team) => {
                    const color = teamColors[team] || defaultColor;
                    return (
                      <FormControlLabel
                        key={`${team}-active`}
                        control={
                          <Checkbox
                            checked={visibleLines[`${team} - Active`]}
                            onChange={() => handleToggleLine(`${team} - Active`)}
                            size="small"
                            sx={{
                              color: color.border,
                              '&.Mui-checked': {
                                color: color.border,
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {team}
                          </Typography>
                        }
                      />
                    );
                  })}
                </FormGroup>
              </Grid>

              {/* Right column - Inactive */}
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                  Inactive Headcount
                </Typography>
                <FormGroup>
                  {teams.map((team) => {
                    const color = teamColors[team] || defaultColor;
                    return (
                      <FormControlLabel
                        key={`${team}-inactive`}
                        control={
                          <Checkbox
                            checked={visibleLines[`${team} - Inactive`]}
                            onChange={() => handleToggleLine(`${team} - Inactive`)}
                            size="small"
                            sx={{
                              color: color.border,
                              '&.Mui-checked': {
                                color: color.border,
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {team}
                          </Typography>
                        }
                      />
                    );
                  })}
                </FormGroup>
              </Grid>
            </Grid>
          </Box>
        </Popover>
      </Box>

      {/* Chart */}
      <Box height={400}>
        <Line data={chartData} options={options} />
      </Box>
    </Box>
  );
}

export default HeadcountTimeline;
