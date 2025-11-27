import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Box, Grid, Typography, Paper } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * HireQuality Component
 * 
 * Shows hire quality metrics:
 * 1. Distribution of first performance ratings
 * 2. Monthly hires with probation outcomes (passed, failed-company, failed-employee)
 * 
 * @param {Array} hires - Array of hire objects with structure:
 *   {
 *     id: 'hire-1',
 *     hireDate: '2025-01-15',
 *     firstPerformanceRating: 'Excellent', // or 'Good', 'Average', 'Below Average', 'Poor'
 *     probationOutcome: 'Passed', // or 'Failed - Company Decision', 'Failed - Employee Left'
 *   }
 */
function HireQuality({ hires = [] }) {
  // Group hires by month
  const hiresByMonth = {};
  
  hires.forEach(hire => {
    const date = new Date(hire.hireDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!hiresByMonth[monthKey]) {
      hiresByMonth[monthKey] = {
        total: 0,
        passed: 0,
        failedCompany: 0,
        failedEmployee: 0,
      };
    }
    
    hiresByMonth[monthKey].total++;
    
    if (hire.probationOutcome === 'Passed') {
      hiresByMonth[monthKey].passed++;
    } else if (hire.probationOutcome === 'Failed - Company Decision') {
      hiresByMonth[monthKey].failedCompany++;
    } else if (hire.probationOutcome === 'Failed - Employee Left') {
      hiresByMonth[monthKey].failedEmployee++;
    }
  });

  const months = Object.keys(hiresByMonth).sort();

  // Performance rating distribution
  const performanceRatings = {
    'Excellent': 0,
    'Good': 0,
    'Average': 0,
    'Below Average': 0,
    'Poor': 0,
  };

  hires.forEach(hire => {
    if (hire.firstPerformanceRating && performanceRatings.hasOwnProperty(hire.firstPerformanceRating)) {
      performanceRatings[hire.firstPerformanceRating]++;
    }
  });

  // Pie chart for performance distribution
  const performanceData = {
    labels: Object.keys(performanceRatings),
    datasets: [
      {
        label: 'Number of Hires',
        data: Object.values(performanceRatings),
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',   // Excellent - Green
          'rgba(139, 195, 74, 0.8)',  // Good - Light Green
          'rgba(255, 193, 7, 0.8)',   // Average - Yellow
          'rgba(255, 152, 0, 0.8)',   // Below Average - Orange
          'rgba(244, 67, 54, 0.8)',   // Poor - Red
        ],
        borderColor: [
          'rgb(76, 175, 80)',
          'rgb(139, 195, 74)',
          'rgb(255, 193, 7)',
          'rgb(255, 152, 0)',
          'rgb(244, 67, 54)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        animation: false,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Stacked bar chart for probation outcomes
  const probationData = {
    labels: months.map(m => {
      const [year, month] = m.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Passed Probation',
        data: months.map(m => hiresByMonth[m].passed),
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgb(76, 175, 80)',
        borderWidth: 1,
      },
      {
        label: 'Failed - Company Decision',
        data: months.map(m => hiresByMonth[m].failedCompany),
        backgroundColor: 'rgba(244, 67, 54, 0.8)',
        borderColor: 'rgb(244, 67, 54)',
        borderWidth: 1,
      },
      {
        label: 'Failed - Employee Left',
        data: months.map(m => hiresByMonth[m].failedEmployee),
        backgroundColor: 'rgba(255, 152, 0, 0.8)',
        borderColor: 'rgb(255, 152, 0)',
        borderWidth: 1,
      },
    ],
  };

  const probationOptions = {
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
      tooltip: {
        animation: false,
        callbacks: {
          footer: function(tooltipItems) {
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return `Total Hires: ${total}`;
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
          text: 'Month',
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

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            First Performance Rating Distribution
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Distribution of first performance review ratings for new hires
          </Typography>
          <Box height={350}>
            <Pie data={performanceData} options={performanceOptions} />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Probation Outcomes by Month
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Monthly breakdown of probation period results
          </Typography>
          <Box height={350}>
            <Bar data={probationData} options={probationOptions} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default HireQuality;
