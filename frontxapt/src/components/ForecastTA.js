import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Box } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * ForecastTA Component
 * 
 * Displays a proper waterfall chart for headcount:
 * - Line: Forecast headcount
 * - Line: Actual headcount
 * - Bars: Hires (green) and Turnovers (red), starting at previous headcount
 */
function ForecastTA({ data = [], initialHeadcount = 0 }) {
  // Add initial month as starting point
  const months = ['Start', ...data.map(d => d.month)];

  // Calculate actual headcount and base for bars
  let currentHeadcount = initialHeadcount;
  const hiresData = [null]; // No hires at start
  const turnoversData = [null]; // No turnovers at start
  const baseData = [null]; // No bar at start
  const actualHeadcounts = [initialHeadcount]; // Show initial headcount
  const forecastData = [null]; // No forecast at start

  data.forEach(d => {
    baseData.push(currentHeadcount);
    hiresData.push(d.hires);
    turnoversData.push(-d.turnovers); // negative for red bars
    forecastData.push(d.forecast);
    currentHeadcount = currentHeadcount + d.hires - d.turnovers;
    actualHeadcounts.push(currentHeadcount);
  });

  // Calculate min and max for y-axis (include both actual and forecast)
  const allValues = [
    ...actualHeadcounts.filter(h => h !== null),
    ...forecastData.filter(f => f !== null)
  ];
  const minHeadcount = Math.min(...allValues);
  const maxHeadcount = Math.max(...allValues);

  const chartData = {
    labels: months,
    datasets: [
      // Forecast line
      {
        type: 'line',
        label: 'Forecast Headcount',
        data: forecastData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.2,
        order: 1,
        spanGaps: true,
      },
      // Actual headcount line
      {
        type: 'line',
        label: 'Actual Headcount',
        data: actualHeadcounts,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.2,
        order: 2,
        spanGaps: true,
      },
      // Hires bars (green) - floating bars from base to base+hires
      {
        type: 'bar',
        label: 'Hires',
        data: hiresData.map((val, i) => [baseData[i], baseData[i] + val]),
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgb(76, 175, 80)',
        borderWidth: 2,
        barPercentage: 0.7,
        order: 3,
      },
      // Turnovers bars (red) - floating bars from base+hires down
      {
        type: 'bar',
        label: 'Turnovers',
        data: turnoversData.map((val, i) => [baseData[i] + hiresData[i], baseData[i] + hiresData[i] + val]),
        backgroundColor: 'rgba(244, 67, 54, 0.8)',
        borderColor: 'rgb(244, 67, 54)',
        borderWidth: 2,
        barPercentage: 0.7,
        order: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable all animations
    transitions: {
      active: {
        animation: {
          duration: 0 // No animation on hover
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        animation: false, // No tooltip animation
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            const value = context.parsed.y;
            label += Math.abs(value);
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
        offset: true,
      },
      y: {
        stacked: false,
        beginAtZero: false,
        min: minHeadcount - 10,
        max: maxHeadcount + 10,
        title: { display: true, text: 'Headcount' },
      },
    },
  };

  return (
    <Box height={400}>
      <Chart type="bar" data={chartData} options={options} />
    </Box>
  );
}

export default ForecastTA;
