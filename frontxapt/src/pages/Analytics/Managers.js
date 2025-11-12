import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import './Managers.css';

function Managers() {
  return (
    <div className="analytics-subsection">
      <Typography variant="h4" component="h2" gutterBottom>
        Managers Analytics
      </Typography>

      <Typography variant="body1" paragraph>
        Insights into management effectiveness, team health, and leadership metrics.
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This section will include:
        </Typography>
        <Box component="ul" sx={{ mt: 2 }}>
          <Typography component="li" variant="body2">Manager span of control</Typography>
          <Typography component="li" variant="body2">Team retention rates by manager</Typography>
          <Typography component="li" variant="body2">1-on-1 meeting frequency</Typography>
          <Typography component="li" variant="body2">Team engagement scores</Typography>
          <Typography component="li" variant="body2">Performance distribution by team</Typography>
        </Box>
      </Paper>
    </div>
  );
}

export default Managers;
