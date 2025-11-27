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
    if (location.pathname.includes('/analytics/climate-2025')) return '/analytics/climate-2025';
    if (location.pathname.includes('/analytics/employee-facts')) return '/analytics/employee-facts';
    if (location.pathname.includes('/analytics/whiteboard-prod')) return '/analytics/whiteboard-prod';
    if (location.pathname.includes('/analytics/whiteboard-dev')) return '/analytics/whiteboard-dev';
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
            label="Climate 2025" 
            value="/analytics/climate-2025"
            component={NavLink}
            to="/analytics/climate-2025"
          />
          <Tab 
            label="Employee Facts" 
            value="/analytics/employee-facts"
            component={NavLink}
            to="/analytics/employee-facts"
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
          <Tab 
            label="Whiteboard Prod" 
            value="/analytics/whiteboard-prod"
            component={NavLink}
            to="/analytics/whiteboard-prod"
          />
          <Tab 
            label="Whiteboard Dev" 
            value="/analytics/whiteboard-dev"
            component={NavLink}
            to="/analytics/whiteboard-dev"
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
