import React, { useState, useMemo } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Chip, Stack, Paper } from '@mui/material';

// Mock dataset for filters
const mockData = [
  { team: 'Engineering', sub_team: 'Backend', market: 'US', manager: 'Alice Johnson', job_role: 'Software Engineer', seniority: 'Senior' },
  { team: 'Engineering', sub_team: 'Backend', market: 'US', manager: 'Alice Johnson', job_role: 'Software Engineer', seniority: 'Mid' },
  { team: 'Engineering', sub_team: 'Backend', market: 'EU', manager: 'Bob Smith', job_role: 'DevOps Engineer', seniority: 'Senior' },
  { team: 'Engineering', sub_team: 'Frontend', market: 'US', manager: 'Carol White', job_role: 'Frontend Developer', seniority: 'Mid' },
  { team: 'Engineering', sub_team: 'Frontend', market: 'US', manager: 'Carol White', job_role: 'Frontend Developer', seniority: 'Junior' },
  { team: 'Engineering', sub_team: 'Frontend', market: 'LATAM', manager: 'Carol White', job_role: 'UI/UX Designer', seniority: 'Mid' },
  { team: 'Engineering', sub_team: 'QA', market: 'EU', manager: 'David Lee', job_role: 'QA Engineer', seniority: 'Senior' },
  { team: 'Engineering', sub_team: 'QA', market: 'US', manager: 'David Lee', job_role: 'QA Engineer', seniority: 'Mid' },
  { team: 'Product', sub_team: 'Product Management', market: 'US', manager: 'Emma Davis', job_role: 'Product Manager', seniority: 'Senior' },
  { team: 'Product', sub_team: 'Product Management', market: 'EU', manager: 'Emma Davis', job_role: 'Product Manager', seniority: 'Mid' },
  { team: 'Product', sub_team: 'Product Design', market: 'US', manager: 'Frank Wilson', job_role: 'Product Designer', seniority: 'Senior' },
  { team: 'Product', sub_team: 'Product Design', market: 'LATAM', manager: 'Frank Wilson', job_role: 'Product Designer', seniority: 'Junior' },
  { team: 'Sales', sub_team: 'Enterprise Sales', market: 'US', manager: 'Grace Taylor', job_role: 'Account Executive', seniority: 'Senior' },
  { team: 'Sales', sub_team: 'Enterprise Sales', market: 'US', manager: 'Grace Taylor', job_role: 'Account Executive', seniority: 'Mid' },
  { team: 'Sales', sub_team: 'SMB Sales', market: 'EU', manager: 'Henry Brown', job_role: 'Sales Representative', seniority: 'Junior' },
  { team: 'Sales', sub_team: 'SMB Sales', market: 'LATAM', manager: 'Henry Brown', job_role: 'Sales Representative', seniority: 'Mid' },
  { team: 'Marketing', sub_team: 'Digital Marketing', market: 'US', manager: 'Iris Martinez', job_role: 'Marketing Specialist', seniority: 'Mid' },
  { team: 'Marketing', sub_team: 'Digital Marketing', market: 'EU', manager: 'Iris Martinez', job_role: 'SEO Specialist', seniority: 'Senior' },
  { team: 'Marketing', sub_team: 'Content', market: 'US', manager: 'Jack Anderson', job_role: 'Content Writer', seniority: 'Junior' },
  { team: 'Marketing', sub_team: 'Content', market: 'LATAM', manager: 'Jack Anderson', job_role: 'Content Strategist', seniority: 'Mid' },
  { team: 'Data', sub_team: 'Data Engineering', market: 'US', manager: 'Kate Robinson', job_role: 'Data Engineer', seniority: 'Senior' },
  { team: 'Data', sub_team: 'Data Engineering', market: 'EU', manager: 'Kate Robinson', job_role: 'Data Engineer', seniority: 'Mid' },
  { team: 'Data', sub_team: 'Analytics', market: 'US', manager: 'Leo Clark', job_role: 'Data Analyst', seniority: 'Mid' },
  { team: 'Data', sub_team: 'Analytics', market: 'LATAM', manager: 'Leo Clark', job_role: 'Business Analyst', seniority: 'Junior' },
];

/**
 * TAFilters Component
 * 
 * Provides filtering controls for TA analytics by team, sub_team, market, manager, job_role, and seniority.
 * Intelligently updates available options based on current selections.
 * 
 * @param {Function} onFilterChange - Callback when filters change, receives filter object
 */
function TAFilters({ onFilterChange }) {

  const [filters, setFilters] = useState({
    team: '',
    sub_team: '',
    market: '',
    manager: '',
    job_role: '',
    seniority: '',
  });

  // Get available options based on current filters
  const availableOptions = useMemo(() => {
    // Filter dataset based on current selections
    let filteredData = mockData;
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filteredData = filteredData.filter(item => item[key] === filters[key]);
      }
    });

    // Extract unique values for each field
    const getUniqueValues = (field) => {
      return [...new Set(filteredData.map(item => item[field]))].sort();
    };

    return {
      team: getUniqueValues('team'),
      sub_team: getUniqueValues('sub_team'),
      market: getUniqueValues('market'),
      manager: getUniqueValues('manager'),
      job_role: getUniqueValues('job_role'),
      seniority: getUniqueValues('seniority'),
    };
  }, [filters]);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    
    // Reset dependent filters when a parent filter changes
    if (field === 'team') {
      newFilters.sub_team = '';
      newFilters.manager = '';
    }
    
    setFilters(newFilters);
    
    // Notify parent component
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClearFilter = (field) => {
    handleFilterChange(field, '');
  };

  const handleClearAll = () => {
    const clearedFilters = {
      team: '',
      sub_team: '',
      market: '',
      manager: '',
      job_role: '',
      seniority: '',
    };
    setFilters(clearedFilters);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box mb={2}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <Chip 
            label={`Active Filters: ${activeFiltersCount}`} 
            color={activeFiltersCount > 0 ? "primary" : "default"}
            size="small"
          />
          {activeFiltersCount > 0 && (
            <Chip 
              label="Clear All" 
              size="small"
              onClick={handleClearAll}
              onDelete={handleClearAll}
              color="secondary"
            />
          )}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
        {/* Team Filter */}
        <FormControl size="small" sx={{ minWidth: 110, maxWidth: 130 }}>
          <InputLabel sx={{ fontSize: '0.875rem' }}>Team</InputLabel>
          <Select
            value={filters.team}
            label="Team"
            onChange={(e) => handleFilterChange('team', e.target.value)}
            sx={{ fontSize: '0.875rem' }}
          >
            <MenuItem value="">
              <em>All Teams</em>
            </MenuItem>
            {availableOptions.team.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sub Team Filter */}
        <FormControl size="small" sx={{ minWidth: 130, maxWidth: 150 }} disabled={!filters.team && availableOptions.sub_team.length === 0}>
          <InputLabel sx={{ fontSize: '0.875rem' }}>Sub Team</InputLabel>
          <Select
            value={filters.sub_team}
            label="Sub Team"
            onChange={(e) => handleFilterChange('sub_team', e.target.value)}
            sx={{ fontSize: '0.875rem' }}
          >
            <MenuItem value="">
              <em>All Sub Teams</em>
            </MenuItem>
            {availableOptions.sub_team.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Market Filter */}
        <FormControl size="small" sx={{ minWidth: 90, maxWidth: 110 }}>
          <InputLabel sx={{ fontSize: '0.875rem' }}>Market</InputLabel>
          <Select
            value={filters.market}
            label="Market"
            onChange={(e) => handleFilterChange('market', e.target.value)}
            sx={{ fontSize: '0.875rem' }}
          >
            <MenuItem value="">
              <em>All Markets</em>
            </MenuItem>
            {availableOptions.market.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Manager Filter */}
        <FormControl size="small" sx={{ minWidth: 130, maxWidth: 150 }}>
          <InputLabel sx={{ fontSize: '0.875rem' }}>Manager</InputLabel>
          <Select
            value={filters.manager}
            label="Manager"
            onChange={(e) => handleFilterChange('manager', e.target.value)}
            sx={{ fontSize: '0.875rem' }}
          >
            <MenuItem value="">
              <em>All Managers</em>
            </MenuItem>
            {availableOptions.manager.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Job Role Filter */}
        <FormControl size="small" sx={{ minWidth: 130, maxWidth: 150 }}>
          <InputLabel sx={{ fontSize: '0.875rem' }}>Job Role</InputLabel>
          <Select
            value={filters.job_role}
            label="Job Role"
            onChange={(e) => handleFilterChange('job_role', e.target.value)}
            sx={{ fontSize: '0.875rem' }}
          >
            <MenuItem value="">
              <em>All Job Roles</em>
            </MenuItem>
            {availableOptions.job_role.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Seniority Filter */}
        <FormControl size="small" sx={{ minWidth: 100, maxWidth: 120 }}>
          <InputLabel sx={{ fontSize: '0.875rem' }}>Seniority</InputLabel>
          <Select
            value={filters.seniority}
            label="Seniority"
            onChange={(e) => handleFilterChange('seniority', e.target.value)}
            sx={{ fontSize: '0.875rem' }}
          >
            <MenuItem value="">
              <em>All Levels</em>
            </MenuItem>
            {availableOptions.seniority.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Active filter chips */}
      {activeFiltersCount > 0 && (
        <Box mt={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <Chip
                  key={key}
                  label={`${key.replace('_', ' ')}: ${value}`}
                  onDelete={() => handleClearFilter(key)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              );
            })}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

export default TAFilters;
