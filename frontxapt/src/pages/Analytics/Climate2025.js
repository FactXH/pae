import React from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';
import ConfigurableMetricsCard from '../../components/ConfigurableMetricsCard';
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

        {/* Manager Climate Metrics Card */}
        <Grid item xs={12}>
          <ConfigurableMetricsCard
            title="Manager Climate Survey Results"
            description="Climate survey results aggregated by manager and reporting level. Column names define behavior automatically."
            query={`
              SELECT 
                manager_full_name AS manager__dim,
                reporting_level AS level__dim,
                level_employee_count AS employee_count__count__sum,
                avg_accomplishments_recognised AS accomplishments__metric__avg,
                avg_great_place_to_work AS workplace__metric__avg,
                avg_workspace_environment AS workspace__metric__avg,
                avg_culture_and_values_practiced AS culture__metric__avg,
                avg_trust_leaders AS trust__metric__avg,
                avg_leaders_inspire AS inspire__metric__avg
              FROM data_lake_dev_xavi_gold.gold_climate_2025_by_manager
              ORDER BY manager_full_name, reporting_level
              limit 10000000
            `}
            database="trino"
            thresholds={{
              red: 2.2,
              yellow: 4.0,
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default Climate2025;
