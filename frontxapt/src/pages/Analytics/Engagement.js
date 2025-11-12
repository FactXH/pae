import React from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';
import './Engagement.css';

function Engagement() {
  return (
    <div className="analytics-subsection">
      <Typography variant="h4" component="h2" gutterBottom>
        Employee Engagement
      </Typography>

      <Typography variant="body1" paragraph>
        Monitor employee satisfaction, performance reviews, and engagement metrics.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Performance Reviews
              </Typography>
              <Box className="chart-placeholder">
                <Typography variant="body2" color="text.secondary">
                  Review completion rate
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Contract Status
              </Typography>
              <Box className="chart-placeholder">
                <Typography variant="body2" color="text.secondary">
                  Active vs. historical contracts
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Team Distribution
              </Typography>
              <Box className="chart-placeholder">
                <Typography variant="body2" color="text.secondary">
                  Employees by team
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Tenure Analysis
              </Typography>
              <Box className="chart-placeholder" sx={{ height: '300px' }}>
                <Typography variant="body2" color="text.secondary">
                  Employee tenure distribution
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

export default Engagement;
