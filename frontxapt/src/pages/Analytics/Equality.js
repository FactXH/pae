import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import './Equality.css';

function Equality() {
  return (
    <div className="analytics-subsection">
      <Typography variant="h4" component="h2" gutterBottom>
        Diversity, Equity & Inclusion
      </Typography>

      <Typography variant="body1" paragraph>
        Measure and track diversity metrics, pay equity, and inclusion initiatives.
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This section will include:
        </Typography>
        <Box component="ul" sx={{ mt: 2 }}>
          <Typography component="li" variant="body2">Gender and ethnicity distribution</Typography>
          <Typography component="li" variant="body2">Pay equity analysis by demographics</Typography>
          <Typography component="li" variant="body2">Representation at leadership levels</Typography>
          <Typography component="li" variant="body2">Hiring diversity metrics</Typography>
          <Typography component="li" variant="body2">Promotion rates by demographic groups</Typography>
        </Box>
      </Paper>
    </div>
  );
}

export default Equality;
