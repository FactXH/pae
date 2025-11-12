import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import './TalentDevelopment.css';

function TalentDevelopment() {
  return (
    <div className="analytics-subsection">
      <Typography variant="h4" component="h2" gutterBottom>
        Talent Development
      </Typography>

      <Typography variant="body1" paragraph>
        Track employee growth, skills development, training programs, and career progression.
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This section will include:
        </Typography>
        <Box component="ul" sx={{ mt: 2 }}>
          <Typography component="li" variant="body2">Skills matrix and competency tracking</Typography>
          <Typography component="li" variant="body2">Training completion rates</Typography>
          <Typography component="li" variant="body2">Career path progression</Typography>
          <Typography component="li" variant="body2">Performance review trends</Typography>
          <Typography component="li" variant="body2">Internal mobility analytics</Typography>
        </Box>
      </Paper>
    </div>
  );
}

export default TalentDevelopment;
