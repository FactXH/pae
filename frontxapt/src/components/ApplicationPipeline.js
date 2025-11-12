import React, { useState } from 'react';
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
import { Box, FormGroup, FormControlLabel, Checkbox, Stack } from '@mui/material';

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
 * ApplicationPipeline Component
 * 
 * Displays a timeline showing how many applications were in each phase per day.
 * Uses area charts (line with shadow below) for each phase, including Hired and Rejected.
 * 
 * @param {Array} applications - Array of application objects with structure:
 *   {
 *     id: 'app-1',
 *     phases: [
 *       { name: 'Applied', effectiveFrom: '2025-01-01', effectiveTo: '2025-01-05' },
 *       { name: 'Phone Screen', effectiveFrom: '2025-01-06', effectiveTo: '2025-01-10' },
 *       // ... phases
 *       { name: 'Hired', effectiveFrom: '2025-01-20', effectiveTo: '2025-01-20' },
 *     ]
 *   }
 * @param {Array} phaseNames - Array of phase names in order (e.g., ['Applied', 'Phone Screen', ..., 'Hired', 'Rejected'])
 */
function ApplicationPipeline({ applications = [], phaseNames = [] }) {
  // State to track which phases are visible
  const [visiblePhases, setVisiblePhases] = useState(
    phaseNames.reduce((acc, phase) => {
      acc[phase] = true;
      return acc;
    }, {})
  );

  // Toggle phase visibility
  const handleTogglePhase = (phaseName) => {
    setVisiblePhases(prev => ({
      ...prev,
      [phaseName]: !prev[phaseName]
    }));
  };

  // Calculate date range
  const getAllDates = () => {
    const dates = new Set();
    applications.forEach(app => {
      app.phases.forEach(phase => {
        const from = new Date(phase.effectiveFrom);
        const to = new Date(phase.effectiveTo);
        
        // Add all dates in the range
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          dates.add(d.toISOString().split('T')[0]);
        }
      });
    });
    
    return Array.from(dates).sort();
  };

  const allDates = getAllDates();
  
  if (allDates.length === 0) {
    return (
      <Box height={400} display="flex" alignItems="center" justifyContent="center">
        <p>No application data available</p>
      </Box>
    );
  }

  // Count applications per phase per day
  const countByPhaseAndDay = {};
  
  phaseNames.forEach(phaseName => {
    countByPhaseAndDay[phaseName] = {};
    allDates.forEach(date => {
      countByPhaseAndDay[phaseName][date] = 0;
    });
  });

  // Count applications
  applications.forEach(app => {
    app.phases.forEach(phase => {
      const from = new Date(phase.effectiveFrom);
      const to = new Date(phase.effectiveTo);
      
      allDates.forEach(dateStr => {
        const date = new Date(dateStr);
        if (date >= from && date <= to) {
          if (countByPhaseAndDay[phase.name]) {
            countByPhaseAndDay[phase.name][dateStr]++;
          }
        }
      });
    });
  });

  // Color palette for phases
  // Define colors for each phase
  const colors = {
    'Applied': { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)' },         // Blue
    'Phone Screen': { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)' },    // Teal
    'Technical Interview': { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.2)' }, // Purple
    'Final Interview': { border: 'rgb(255, 159, 64)', bg: 'rgba(255, 159, 64, 0.2)' }, // Orange
    'Offer': { border: 'rgb(255, 205, 86)', bg: 'rgba(255, 205, 86, 0.2)' },           // Yellow
    'Hired': { border: 'rgb(76, 175, 80)', bg: 'rgba(76, 175, 80, 0.2)' },             // Green
    'Turnover': { border: 'rgb(141, 110, 99)', bg: 'rgba(141, 110, 99, 0.25)' },       // Brown - for attrition
    
    // Rejection phases - shades of red, getting darker as rejection happens later
    'Rejected - Applied': { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.25)' },       // Red - lightest
    'Rejected - Phone Screen': { border: 'rgb(239, 83, 80)', bg: 'rgba(239, 83, 80, 0.28)' },    // Red - lighter
    'Rejected - Technical': { border: 'rgb(229, 57, 53)', bg: 'rgba(229, 57, 53, 0.30)' },       // Red - medium
    'Rejected - Final': { border: 'rgb(211, 47, 47)', bg: 'rgba(211, 47, 47, 0.32)' },           // Red - darker
    'Rejected - Offer': { border: 'rgb(183, 28, 28)', bg: 'rgba(183, 28, 28, 0.35)' },   // Red - darkest
  };
  
  const defaultColor = { border: 'rgb(201, 203, 207)', bg: 'rgba(201, 203, 207, 0.2)' }; // Grey

  // Create datasets - only include visible phases
  const datasets = phaseNames
    .filter(phaseName => visiblePhases[phaseName])
    .map((phaseName) => {
      const color = colors[phaseName] || defaultColor;
      return {
        label: phaseName,
        data: allDates.map(date => countByPhaseAndDay[phaseName][date]),
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.4,
      };
    });

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
            return `${context.dataset.label}: ${context.parsed.y} applications`;
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
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Applications',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <Box>
      {/* Phase toggle controls */}
      <Box mb={2}>
        <FormGroup>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {phaseNames.map((phaseName) => {
              const color = colors[phaseName] || defaultColor;
              return (
                <FormControlLabel
                  key={phaseName}
                  control={
                    <Checkbox
                      checked={visiblePhases[phaseName]}
                      onChange={() => handleTogglePhase(phaseName)}
                      sx={{
                        color: color.border,
                        '&.Mui-checked': {
                          color: color.border,
                        },
                      }}
                    />
                  }
                  label={phaseName}
                />
              );
            })}
          </Stack>
        </FormGroup>
      </Box>

      {/* Chart */}
      <Box height={400}>
        <Line data={chartData} options={options} />
      </Box>
    </Box>
  );
}

export default ApplicationPipeline;
