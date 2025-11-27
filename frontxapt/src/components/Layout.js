import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Button, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import './Layout.css';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sqlEditorAnchor, setSqlEditorAnchor] = React.useState(null);

  const handleSqlEditorClick = (event) => {
    setSqlEditorAnchor(event.currentTarget);
  };

  const handleSqlEditorClose = () => {
    setSqlEditorAnchor(null);
  };

  const handleVersionSelect = (version) => {
    navigate(`/sql-editor?v=${version}`);
    handleSqlEditorClose();
  };

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
          <Button color="inherit" component={Link} to="/metrics">
            Metrics
          </Button>
          <Button
            color="inherit"
            onClick={handleSqlEditorClick}
            endIcon={<ArrowDropDownIcon />}
          >
            SQL Editor
          </Button>
          <Menu
            anchorEl={sqlEditorAnchor}
            open={Boolean(sqlEditorAnchor)}
            onClose={handleSqlEditorClose}
          >
            <MenuItem onClick={() => handleVersionSelect('v1')}>
              SQL Editor V1 (Classic)
            </MenuItem>
            <MenuItem onClick={() => handleVersionSelect('v2')}>
              SQL Editor V2 (Tabs)
            </MenuItem>
          </Menu>
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
            © 2025 Xapt Dashboard. All rights reserved to TopTalend.
          </Typography>
        </Container>
      </footer>
    </div>
  );
}

export default Layout;
