import React from 'react';
import { Typography, Paper, Grid, Box, Card, CardContent } from '@mui/material';
import './Overview.css';

function Overview() {
  return (
    <div className="analytics-subsection">
      <Typography variant="h4" component="h2" gutterBottom>
        Analytics Overview
      </Typography>

      <Typography variant="body1" paragraph>
        High-level view of key metrics across all areas.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Hires (YTD)
              </Typography>
              <Typography variant="h3" component="div">
                --
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Employees
              </Typography>
              <Typography variant="h3" component="div">
                --
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Avg. Time to Hire
              </Typography>
              <Typography variant="h3" component="div">
                -- days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Turnover Rate
              </Typography>
              <Typography variant="h3" component="div">
                --%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Headcount Trend
              </Typography>
              <Box className="chart-placeholder" sx={{ height: '300px' }}>
                <Typography variant="body2" color="text.secondary">
                  Employee count over time
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} className="analytics-card">
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Department Breakdown
              </Typography>
              <Box className="chart-placeholder" sx={{ height: '300px' }}>
                <Typography variant="body2" color="text.secondary">
                  Employees by department
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

export default Overview;
