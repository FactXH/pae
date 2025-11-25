import React, { useState, useMemo } from 'react';
import { Typography, Paper, Grid, Box, Card, CardContent } from '@mui/material';
// import OverviewFilters from '../../components/OverviewFilters'; // Old version
import OverviewFiltersV2 from '../../components/OverviewFiltersV2'; // New floating version
import HeadcountTable from '../../components/HeadcountTable';
import HeadcountTimeline from '../../components/HeadcountTimeline';
import CurrentTeams from '../../components/CurrentTeams';
import EmployeeOverview from '../../components/EmployeeOverview';
import { mockEmployeeData } from '../../data/mockEmployeeData';
import './Overview.css';

function Overview() {
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
  };

  // Calculate metrics based on filtered data
  const metrics = useMemo(() => {
    let employees = mockEmployeeData;
    
    // Time travel filter takes precedence - shows snapshot at specific date
    if (activeFilters.time_travel !== undefined) {
      const minDate = new Date('2022-10-01');
      const timeTravelDate = new Date(minDate);
      timeTravelDate.setDate(timeTravelDate.getDate() + activeFilters.time_travel);
      const timeTravelDateStr = timeTravelDate.toISOString().split('T')[0];
      
      employees = employees.filter(emp => {
        const onboarded = emp.onboarding_date <= timeTravelDateStr;
        const notOffboarded = !emp.offboarding_date || emp.offboarding_date >= timeTravelDateStr;
        return onboarded && notOffboarded;
      });
    }
    // Otherwise use date range filter
    else if (activeFilters.date_range && activeFilters.date_range.length === 2) {
      const [startValue, endValue] = activeFilters.date_range;
      
      // Convert slider values to dates (assuming minDate is October 1, 2022)
      const minDate = new Date('2022-10-01');
      const startDate = new Date(minDate);
      startDate.setDate(startDate.getDate() + startValue);
      const endDate = new Date(minDate);
      endDate.setDate(endDate.getDate() + endValue);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      employees = employees.filter(emp => {
        const onboarded = emp.onboarding_date <= endDateStr;
        const notOffboarded = !emp.offboarding_date || emp.offboarding_date >= startDateStr;
        return onboarded && notOffboarded;
      });
    }
    
    // Apply filters (now arrays)
    if (activeFilters.team && activeFilters.team.length > 0) {
      employees = employees.filter(e => activeFilters.team.includes(e.team));
    }
    if (activeFilters.sub_team && activeFilters.sub_team.length > 0) {
      employees = employees.filter(e => activeFilters.sub_team.includes(e.sub_team));
    }
    if (activeFilters.level && activeFilters.level.length > 0) {
      employees = employees.filter(e => activeFilters.level.includes(e.level));
    }
    if (activeFilters.job_role && activeFilters.job_role.length > 0) {
      employees = employees.filter(e => activeFilters.job_role.includes(e.job_role));
    }
    if (activeFilters.domain && activeFilters.domain.length > 0) {
      employees = employees.filter(e => activeFilters.domain.includes(e.domain));
    }
    
    const activeEmployees = employees.filter(e => !e.offboarding_date);
    const offboardedEmployees = employees.filter(e => e.offboarding_date);
    
    // Calculate turnover rate
    const totalEmployees = employees.length;
    const turnoverRate = totalEmployees > 0 
      ? ((offboardedEmployees.length / totalEmployees) * 100).toFixed(1)
      : 0;
    
    // Calculate YTD hires (2023 onwards)
    const ytdHires = employees.filter(e => {
      const onboardingYear = new Date(e.onboarding_date).getFullYear();
      return onboardingYear >= 2023;
    }).length;
    
    return {
      activeEmployees: activeEmployees.length,
      ytdHires,
      turnoverRate,
    };
  }, [activeFilters]);

  return (
    <div className="analytics-subsection">
      {/* <Typography variant="h4" component="h2" gutterBottom>
        Analytics Overview
      </Typography> */}

      {/* <Typography variant="body1" paragraph>
        High-level view of key metrics across all areas.
      </Typography> */}

      {/* Filters - New Floating Version */}
      <OverviewFiltersV2 
        filters={activeFilters} 
        onFilterChange={handleFilterChange} 
      />

      {/* Current Teams */}
      <Box mt={3} mb={3}>
        <CurrentTeams />
      </Box>

      {/* Employee Overview */}
      <Box mt={3} mb={3}>
        <EmployeeOverview />
      </Box>

      {/* Headcount Timeline Chart */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Headcount Evolution Timeline
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Historical view of active and inactive headcount by team over time
        </Typography>
        <HeadcountTimeline filters={activeFilters} />
      </Paper>

      {/* Headcount Decision Tree */}
      <Box mt={3}>
        <HeadcountTable filters={activeFilters} />
      </Box>
    </div>
  );
}

export default Overview;
