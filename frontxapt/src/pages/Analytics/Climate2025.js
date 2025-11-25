import React from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';
import './Climate2025.css';

function Climate2025() {
  return (
    <div className="analytics-subsection">
      <Typography variant="h4" component="h2" gutterBottom>
        Climate Survey 2025
      </Typography>

      <Typography variant="body1" paragraph>
        Insights from the 2025 Climate Survey: team satisfaction, engagement scores, and participation metrics.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Participation Rate
              </Typography>
              <Box className="chart-placeholder">
                <Typography variant="body2" color="text.secondary">
                  Survey completion by team
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Overall Satisfaction
              </Typography>
              <Box className="chart-placeholder">
                <Typography variant="body2" color="text.secondary">
                  Average satisfaction scores
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Team Insights
              </Typography>
              <Box className="chart-placeholder">
                <Typography variant="body2" color="text.secondary">
                  Team-level climate metrics
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Question Analysis
              </Typography>
              <Box className="chart-placeholder" sx={{ height: '300px' }}>
                <Typography variant="body2" color="text.secondary">
                  Detailed breakdown by survey questions
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Manager-Level Climate
              </Typography>
              <Box className="chart-placeholder" sx={{ height: '250px' }}>
                <Typography variant="body2" color="text.secondary">
                  Climate metrics by manager hierarchy
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Trend Comparison
              </Typography>
              <Box className="chart-placeholder" sx={{ height: '250px' }}>
                <Typography variant="body2" color="text.secondary">
                  2025 vs previous surveys
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

export default Climate2025;
