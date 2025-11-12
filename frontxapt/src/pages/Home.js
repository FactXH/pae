import React from 'react';
import { Paper, Grid, Card, CardContent, Typography } from '@mui/material';
import PageLayout from '../components/PageLayout';
import './Home.css';

function Home() {
  return (
    <PageLayout 
      title="Welcome to Xapt Dashboard"
      subtitle="Your comprehensive people analytics and engagement platform."
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card className="stat-card">
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Employees
              </Typography>
              <Typography variant="h3" component="div">
                --
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="stat-card">
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Contracts
              </Typography>
              <Typography variant="h3" component="div">
                --
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="stat-card">
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Departments
              </Typography>
              <Typography variant="h3" component="div">
                --
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body1">
          Navigate using the menu above to explore employee data and analytics.
        </Typography>
      </Paper>
    </PageLayout>
  );
}

export default Home;
