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
    if (location.pathname.includes('/analytics/talent-development')) return '/analytics/talent-development';
    if (location.pathname.includes('/analytics/managers')) return '/analytics/managers';
    if (location.pathname.includes('/analytics/equality')) return '/analytics/equality';
    if (location.pathname.includes('/analytics/overview')) return '/analytics/overview';
    return '/analytics/overview'; // default
  };

  return (
    <PageLayout 
      title="Analytics"
      subtitle="Insights and metrics about your workforce."
    >
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs value={getActiveTab()} aria-label="analytics sections" variant="scrollable" scrollButtons="auto">
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
            label="Talent Development" 
            value="/analytics/talent-development"
            component={NavLink}
            to="/analytics/talent-development"
          />
          <Tab 
            label="Managers" 
            value="/analytics/managers"
            component={NavLink}
            to="/analytics/managers"
          />
          <Tab 
            label="Equality & DEI" 
            value="/analytics/equality"
            component={NavLink}
            to="/analytics/equality"
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
