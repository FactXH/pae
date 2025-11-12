import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import './ChartCard.css';

function ChartCard({ title, children, height = '300px' }) {
  return (
    <Paper elevation={2} className="chart-card">
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box className="chart-content" sx={{ height }}>
          {children || (
            <Typography variant="body2" color="text.secondary">
              Chart placeholder - Add your visualization here
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default ChartCard;
