import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import PageLayout from '../components/PageLayout';
import './Analytics.css';

function Analytics() {
  const location = useLocation();
  
  // Determine active tab based on route
  const getActiveTab = () => {
    if (location.pathname.includes('/analytics/ta')) return '/analytics/ta';
    if (location.pathname.includes('/analytics/engagement')) return '/analytics/engagement';
    if (location.pathname.includes('/analytics/overview')) return '/analytics/overview';
    return '/analytics/overview'; // default
  };

  return (
    <PageLayout 
      title="Analytics"
      subtitle="Insights and metrics about your workforce."
    >
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs value={getActiveTab()} aria-label="analytics sections">
          <Tab 
            label="Overview" 
            value="/analytics/overview"
            component={NavLink}
            to="/analytics/overview"
          />
          <Tab 
            label="Talent Acquisition" 
            value="/analytics/ta"
            component={NavLink}
            to="/analytics/ta"
          />
          <Tab 
            label="Engagement" 
            value="/analytics/engagement"
            component={NavLink}
            to="/analytics/engagement"
          />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Outlet />
      </Box>
    </PageLayout>
  );
}

export default Analytics;
