import React, { useState } from 'react';
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
import { Box, Stack, Typography, Slider } from '@mui/material';

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
 * PipelineStatus Component
 * 
 * Shows a snapshot of applications in each phase during a given period,
 * broken down by status: Rejected, Passed to Next, Still Waiting
 * 
 * @param {Array} applications - Array of application objects with phases
 * @param {String} startDate - Start date of period (YYYY-MM-DD)
 * @param {String} endDate - End date of period (YYYY-MM-DD)
 * @param {Array} phaseOrder - Array of phase names in order (excluding rejection phases)
 */
function PipelineStatus({ 
  applications = [], 
  initialStartDate = '', 
  initialEndDate = '',
  phaseOrder = ['Applied', 'Phone Screen', 'Technical Interview', 'Final Interview', 'Offer']
}) {
  // Get all unique dates from applications
  const getAllDates = () => {
    const dates = new Set();
    applications.forEach(app => {
      app.phases.forEach(phase => {
        dates.add(phase.effectiveFrom);
        dates.add(phase.effectiveTo);
      });
    });
    return Array.from(dates).sort();
  };

  const allDates = getAllDates();
  const minDate = allDates[0] || '2025-01-01';
  const maxDate = allDates[allDates.length - 1] || '2025-04-30';

  // Convert dates to numeric values for slider
  const dateToValue = (dateStr) => {
    return new Date(dateStr).getTime();
  };

  const valueToDate = (value) => {
    return new Date(value).toISOString().split('T')[0];
  };

  const [dateRange, setDateRange] = useState([
    dateToValue(initialStartDate || minDate),
    dateToValue(initialEndDate || maxDate)
  ]);

  const startDate = valueToDate(dateRange[0]);
  const endDate = valueToDate(dateRange[1]);

  const periodStart = new Date(startDate);
  const periodEnd = new Date(endDate);

  const handleSliderChange = (event, newValue) => {
    setDateRange(newValue);
  };

  // Analyze each phase
  const analyzePhase = (phaseName) => {
    let rejected = 0;
    let passed = 0;
    let waiting = 0;

    applications.forEach(app => {
      // Find this phase in the application
      const phaseIndex = app.phases.findIndex(p => p.name === phaseName);
      
      if (phaseIndex === -1) return; // Application never reached this phase

      const phase = app.phases[phaseIndex];
      const phaseStart = new Date(phase.effectiveFrom);
      const phaseEnd = new Date(phase.effectiveTo);

      // Check if phase was active during our period
      // Phase is active if it starts before period ends AND ends after period starts
      if (phaseEnd < periodStart || phaseStart > periodEnd) return;

      // Check what happened after this phase
      const nextPhaseIndex = phaseIndex + 1;
      const nextPhase = app.phases[nextPhaseIndex];
      
      if (!nextPhase) {
        // No next phase exists at all - still waiting
        waiting++;
      } else {
        const nextPhaseStart = new Date(nextPhase.effectiveFrom);
        
        // If next phase hasn't started yet by period end, still waiting
        if (nextPhaseStart > periodEnd) {
          waiting++;
        } else if (nextPhase.name.startsWith('Rejected')) {
          // Rejected after this phase
          rejected++;
        } else if (nextPhase.name === 'Hired') {
          // Successfully hired - count as passed
          passed++;
        } else {
          // Passed to next phase
          passed++;
        }
      }
    });

    return { rejected, passed, waiting };
  };

  // Calculate stats for each phase
  const phaseStats = phaseOrder.map(phaseName => ({
    phase: phaseName,
    ...analyzePhase(phaseName)
  }));

  const chartData = {
    labels: phaseOrder,
    datasets: [
      {
        label: 'Rejected',
        data: phaseStats.map(s => s.rejected),
        backgroundColor: 'rgba(244, 67, 54, 0.8)',
        borderColor: 'rgb(244, 67, 54)',
        borderWidth: 1,
      },
      {
        label: 'Passed to Next',
        data: phaseStats.map(s => s.passed),
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgb(76, 175, 80)',
        borderWidth: 1,
      },
      {
        label: 'Still Waiting',
        data: phaseStats.map(s => s.waiting),
        backgroundColor: 'rgba(255, 193, 7, 0.8)',
        borderColor: 'rgb(255, 193, 7)',
        borderWidth: 1,
      },
    ],
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
          footer: function(tooltipItems) {
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return `Total: ${total} applications`;
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
          text: 'Pipeline Phase',
        },
      },
      y: {
        stacked: true,
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
      {/* Date range slider */}
      <Box mb={4} px={2}>
        <Typography variant="subtitle2" gutterBottom>
          Date Range: {startDate} to {endDate}
        </Typography>
        <Slider
          value={dateRange}
          onChange={handleSliderChange}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => valueToDate(value)}
          min={dateToValue(minDate)}
          max={dateToValue(maxDate)}
          sx={{
            '& .MuiSlider-valueLabel': {
              fontSize: 12,
              fontWeight: 'normal',
              top: -6,
              backgroundColor: 'unset',
              color: 'text.primary',
              '&:before': {
                display: 'none',
              },
              '& *': {
                background: 'transparent',
                color: 'text.primary',
              },
            },
          }}
        />
      </Box>

      {/* Chart */}
      <Box height={400}>
        <Bar data={chartData} options={options} />
      </Box>
    </Box>
  );
}

export default PipelineStatus;
