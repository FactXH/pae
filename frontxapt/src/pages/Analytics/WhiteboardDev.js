import React from 'react';
import { Typography, Paper, Box, Grid } from '@mui/material';

function WhiteboardDev() {
  return (
    <div className="analytics-subsection">
      <Typography variant="h5" gutterBottom>
        Development Whiteboard
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Experimental components and features in development
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Development Area
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is your sandbox for testing new components and features.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Add your experimental components here...
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </div>
  );
}

export default WhiteboardDev;
