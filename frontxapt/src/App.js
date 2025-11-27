import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Home from './pages/Home';
import Employees from './pages/Employees';
import Analytics from './pages/Analytics';
import Overview from './pages/Analytics/Overview';
import TA from './pages/Analytics/TA';
import TalentDevelopment from './pages/Analytics/TalentDevelopment';
import Managers from './pages/Analytics/Managers';
import Equality from './pages/Analytics/Equality';
import Engagement from './pages/Analytics/Engagement';
import Climate2025 from './pages/Analytics/Climate2025';
import EmployeeFacts from './pages/Analytics/EmployeeFacts';
import WhiteboardProd from './pages/Analytics/WhiteboardProd';
import WhiteboardDev from './pages/Analytics/WhiteboardDev';
import SqlQueryRouter from './components/SqlQueryRouter';
import SavedQueriesView from './components/SavedQueriesView';
import ApiTestComponent from './components/ApiTestComponent';
import MetricsQueryBuilder from './components/MetricsQueryBuilder';
import ManagerClimateView from './pages/ManagerClimateView';
import Whiteboard from './pages/Whiteboard';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  // Use /pae basename only in production (GitHub Pages)
  const basename = process.env.NODE_ENV === 'production' ? '/pae' : '';
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={basename}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="employees" element={<Employees />} />
            <Route path="api-test" element={<ApiTestComponent />} />
            <Route path="sql-query" element={<SqlQueryRouter />} />
            <Route path="analytics" element={<Analytics />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="ta" element={<TA />} />
              <Route path="talent-development" element={<TalentDevelopment />} />
              <Route path="managers" element={<Managers />} />
              <Route path="equality" element={<Equality />} />
              <Route path="engagement" element={<Engagement />} />
              <Route path="climate-2025" element={<Climate2025 />} />
              <Route path="employee-facts" element={<EmployeeFacts />} />
              <Route path="whiteboard-prod" element={<WhiteboardProd />} />
              <Route path="whiteboard-dev" element={<WhiteboardDev />} />
            </Route>
            <Route path="sql-editor" element={<SqlQueryRouter />} />
            <Route path="saved-queries" element={<SavedQueriesView />} />
            <Route path="metrics" element={<MetricsQueryBuilder />} />
            <Route path="manager-climate" element={<ManagerClimateView />} />
            <Route path="whiteboard" element={<Whiteboard />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
