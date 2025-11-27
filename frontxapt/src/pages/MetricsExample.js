import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import MetricsTable from '../components/MetricsTable';

/**
 * Example page showing how to use MetricsTable component
 */
const MetricsExample = () => {
  // Example 1: Manager Climate Metrics
  const managerClimateQuery = `
    SELECT 
      manager_full_name AS manager__dim,
      reporting_level AS level__dim,
      level_employee_count AS employee_count__metric,
      avg_accomplishments_recognised AS accomplishments__metric,
      avg_great_place_to_work AS workplace__metric
    FROM data_lake_dev_xavi_gold.gold_climate_2025_by_manager
    LIMIT 20
  `;

  // Example 2: Custom thresholds
  const customThresholdsQuery = `
    SELECT 
      manager_full_name AS manager__dim,
      reporting_level AS level__dim,
      avg_accomplishments_recognised AS score__metric
    FROM data_lake_dev_xavi_gold.gold_climate_2025_by_manager
    WHERE reporting_level = 'all_levels'
    ORDER BY avg_accomplishments_recognised DESC
    LIMIT 10
  `;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Metrics Table Examples
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Usage Example
        </Typography>
        <Typography variant="body2" paragraph>
          The <strong>MetricsTable</strong> component automatically color-codes metrics based on thresholds:
        </Typography>
        <Box component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto' }}>
{`<MetricsTable
  query="SELECT 
    name AS name__dim,
    score AS score__metric
  FROM table"
  title="My Metrics"
  thresholds={{ red: 2.2, yellow: 4.0 }}
/>`}
        </Box>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Example 1 */}
      <MetricsTable
        query={managerClimateQuery}
        title="Example 1: Manager Climate Survey Results"
        thresholds={{ red: 2.2, yellow: 4.0 }}
      />

      <Divider sx={{ my: 4 }} />

      {/* Example 2 */}
      <MetricsTable
        query={customThresholdsQuery}
        title="Example 2: Top Performers (Custom Thresholds)"
        thresholds={{ red: 3.0, yellow: 4.5 }}
      />
    </Box>
  );
};

export default MetricsExample;
