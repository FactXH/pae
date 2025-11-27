import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import ConfigurableMetricsCard from '../components/ConfigurableMetricsCard';

/**
 * Manager Climate Metrics View
 * Shows pre-configured metrics cards with dimension/metric toggles
 */
const ManagerClimateView = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="700">
          Manager Climate Metrics
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View and analyze climate survey results by manager. Column naming in the query defines dimensions and metrics automatically.
        </Typography>

        <ConfigurableMetricsCard
          title="Manager Climate Survey 2025"
          description="Climate survey results aggregated by manager and reporting level. Toggle dimensions and metrics to customize the view."
          query={`
            SELECT 
              manager_full_name AS manager__dim,
              manager_full_name AS mmmanager__dim,
              reporting_level AS level__dim,
              level_employee_count AS employee_count__count,
              avg_accomplishments_recognised AS accomplishments__metric,
              avg_great_place_to_work AS workplace__metric,
              avg_workspace_environment AS workspace__metric,
              avg_culture_and_values_practiced AS culture__metric,
              avg_trust_leaders AS trust__metric,
              avg_leaders_inspire AS inspire__metric
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
      </Box>
    </Container>
  );
};

export default ManagerClimateView;
