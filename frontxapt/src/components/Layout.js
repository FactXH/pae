import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Xapt Dashboard
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/employees">
            Employees
          </Button>
          <Button color="inherit" component={Link} to="/analytics">
            Analytics
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box>
          <Outlet />
        </Box>
      </Container>

      <footer className="footer">
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 Xapt Dashboard. All rights reserved.
          </Typography>
        </Container>
      </footer>
    </div>
  );
}

export default Layout;
