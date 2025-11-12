import React from 'react';
import { Typography, Box } from '@mui/material';
import './PageLayout.css';

function PageLayout({ title, subtitle, children }) {
  return (
    <div className="page-layout">
      <Box className="page-header">
        <Typography variant="h3" component="h1" className="page-title">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" className="page-subtitle">
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box className="page-content">
        {children}
      </Box>
    </div>
  );
}

export default PageLayout;
