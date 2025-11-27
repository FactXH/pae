import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { mockTimeToHireData } from '../data/mockTimeToHireData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * TimeToHire Component
 * 
 * Displays time to hire distribution with hierarchical filtering
 * Decision tree structure: Team -> Sub Team -> Job Role -> Job Role + Seniority
 * 
 * @param {Object} filters - Filter object from TAFilters component
 */
function TimeToHire({ filters = {} }) {
  const [groupBy, setGroupBy] = useState('team'); // 'team', 'sub_team', 'job_role', 'job_role_seniority'

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

  // Create bins for time to hire (0-15, 16-30, 31-45, 46-60, 61+)
  const bins = [
    { label: '0-15 days', min: 0, max: 15 },
    { label: '16-30 days', min: 16, max: 30 },
    { label: '31-45 days', min: 31, max: 45 },
    { label: '46-60 days', min: 46, max: 60 },
    { label: '61+ days', min: 61, max: Infinity },
  ];

  // Group data and calculate distributions
  const { distributionData, averageByGroup } = useMemo(() => {
    const groups = {};
    const groupDays = {}; // Track all days for average calculation
    
    filteredData.forEach(item => {
      let groupKey;
      
      switch (groupBy) {
        case 'team':
          groupKey = item.team;
          break;
        case 'sub_team':
          groupKey = `${item.team} - ${item.sub_team}`;
          break;
        case 'job_role':
          groupKey = `${item.sub_team} - ${item.job_role}`;
          break;
        case 'job_role_seniority':
          groupKey = `${item.job_role} (${item.seniority})`;
          break;
        default:
          groupKey = item.team;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = bins.map(() => 0);
        groupDays[groupKey] = [];
      }
      
      // Track days for average calculation
      groupDays[groupKey].push(item.daysToHire);
      
      // Find which bin this hire falls into
      const binIndex = bins.findIndex(bin => 
        item.daysToHire >= bin.min && item.daysToHire <= bin.max
      );
      
      if (binIndex !== -1) {
        groups[groupKey][binIndex]++;
      }
    });
    
    // Calculate averages
    const averages = {};
    Object.keys(groupDays).forEach(groupKey => {
      const days = groupDays[groupKey];
      const avg = days.reduce((sum, d) => sum + d, 0) / days.length;
      averages[groupKey] = Math.round(avg);
    });
    
    return { distributionData: groups, averageByGroup: averages };
  }, [filteredData, groupBy]);

  // Restructure data: x-axis = groups, datasets = bins (stacked)
  const groupNames = Object.keys(distributionData).sort();
  
  const chartData = {
    labels: groupNames,
    datasets: bins.map((bin, binIndex) => {
      const binColors = [
        'rgba(76, 175, 80, 0.8)',   // Green for fastest (0-15)
        'rgba(139, 195, 74, 0.8)',  // Light green (16-30)
        'rgba(255, 193, 7, 0.8)',   // Yellow (31-45)
        'rgba(255, 152, 0, 0.8)',   // Orange (46-60)
        'rgba(244, 67, 54, 0.8)',   // Red for slowest (61+)
      ];
      
      return {
        label: bin.label,
        data: groupNames.map(groupName => distributionData[groupName][binIndex]),
        backgroundColor: binColors[binIndex],
        borderColor: binColors[binIndex].replace('0.8', '1'),
        borderWidth: 1,
      };
    }),
  };

  // Plugin to display average above each bar
  const averageLabelPlugin = useMemo(() => ({
    id: 'averageLabel',
    afterDatasetsDraw(chart) {
      const { ctx, scales: { x, y } } = chart;
      
      ctx.save();
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Use chart labels directly to ensure we're iterating over all visible groups
      chart.data.labels.forEach((groupName, index) => {
        const average = averageByGroup[groupName];
        if (average) {
          // Calculate total height of stacked bars for this group
          let totalHeight = 0;
          chart.data.datasets.forEach(dataset => {
            totalHeight += dataset.data[index] || 0;
          });
          
          if (totalHeight > 0) {
            const xPos = x.getPixelForValue(index);
            const yPos = y.getPixelForValue(totalHeight);
            
            // Draw average label above the bar
            ctx.fillText(`${average}d`, xPos, yPos - 5);
          }
        }
      });
      
      ctx.restore();
    }
  }), [averageByGroup]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        animation: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} hires`;
          },
          footer: function(tooltipItems) {
            const groupName = tooltipItems[0].label;
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            const avg = averageByGroup[groupName];
            return [`Total: ${total} hires`, `Average: ${avg} days`];
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: groupBy === 'team' ? 'Team' : 
                groupBy === 'sub_team' ? 'Sub Team' :
                groupBy === 'job_role' ? 'Job Role' : 'Job Role & Seniority',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Hires',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const handleGroupByChange = (event, newGroupBy) => {
    if (newGroupBy !== null) {
      setGroupBy(newGroupBy);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Time to Fill - Distribution
        </Typography>
        
        <ToggleButtonGroup
          value={groupBy}
          exclusive
          onChange={handleGroupByChange}
          size="small"
        >
          <ToggleButton value="team">
            By Team
          </ToggleButton>
          <ToggleButton value="sub_team">
            By Sub Team
          </ToggleButton>
          <ToggleButton value="job_role">
            By Job Role
          </ToggleButton>
          <ToggleButton value="job_role_seniority">
            By Role + Seniority
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Distribution of time taken to hire across different segments
      </Typography>

      {filteredData.length === 0 ? (
        <Box height={400} display="flex" alignItems="center" justifyContent="center">
          <Typography color="text.secondary">
            No data available for selected filters
          </Typography>
        </Box>
      ) : (
        <Box height={400}>
          <Bar data={chartData} options={options} plugins={[averageLabelPlugin]} />
        </Box>
      )}
    </Paper>
  );
}

export default TimeToHire;
