import React, { useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Slider,
} from '@mui/material';

/**
 * OverviewFilters Component
 * 
 * Provides filter controls for Overview analytics page
 * Filters: team, sub_team, level, job_role, domain (all multi-select), date range (slider)
 * 
 * @param {Function} onFilterChange - Callback function to update filters
 * @param {Object} filters - Current filter values (arrays + date_range)
 */
function OverviewFilters({ onFilterChange, filters = {} }) {
  // Date range for slider (from Oct 2022 to Nov 2025)
  const minDate = new Date('2022-10-01');
  const maxDate = new Date('2025-11-30');
  const minValue = 0;
  const maxValue = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)); // Days between dates

  // Convert date to slider value
  const dateToValue = (date) => {
    return Math.floor((new Date(date) - minDate) / (1000 * 60 * 60 * 24));
  };

  // Convert slider value to date
  const valueToDate = (value) => {
    const date = new Date(minDate);
    date.setDate(date.getDate() + value);
    return date.toISOString().split('T')[0];
  };

  // Get current date range values
  const currentDateRange = filters.date_range || [minValue, maxValue];
  const startDate = valueToDate(currentDateRange[0]);
  const endDate = valueToDate(currentDateRange[1]);

  // Time travel slider - default to current date (Nov 12, 2025)
  const currentTimeTravel = filters.time_travel !== undefined ? filters.time_travel : maxValue;
  const timeTravelDate = valueToDate(currentTimeTravel);
  // Mock data for available filter options (this would come from your employee data)
  const mockData = [
    { team: 'Engineering', sub_team: 'Backend', level: 'Senior', job_role: 'Software Engineer', domain: 'API Development' },
    { team: 'Engineering', sub_team: 'Frontend', level: 'Mid', job_role: 'Frontend Developer', domain: 'UI/UX' },
    { team: 'Engineering', sub_team: 'DevOps', level: 'Lead', job_role: 'DevOps Engineer', domain: 'Infrastructure' },
    { team: 'Engineering', sub_team: 'Mobile', level: 'Junior', job_role: 'Mobile Developer', domain: 'Mobile Apps' },
    { team: 'Product', sub_team: 'Product Management', level: 'Lead', job_role: 'Product Manager', domain: 'Strategy' },
    { team: 'Product', sub_team: 'UX Design', level: 'Senior', job_role: 'UX Designer', domain: 'Design' },
    { team: 'Product', sub_team: 'Product Analytics', level: 'Mid', job_role: 'Product Analyst', domain: 'Analytics' },
    { team: 'Sales', sub_team: 'Enterprise Sales', level: 'Senior', job_role: 'Account Executive', domain: 'B2B Sales' },
    { team: 'Sales', sub_team: 'SMB Sales', level: 'Mid', job_role: 'Sales Representative', domain: 'B2B Sales' },
    { team: 'Sales', sub_team: 'Sales Ops', level: 'Senior', job_role: 'Sales Operations Manager', domain: 'Operations' },
    { team: 'Marketing', sub_team: 'Content Marketing', level: 'Lead', job_role: 'Content Marketing Manager', domain: 'Content' },
    { team: 'Marketing', sub_team: 'Digital Marketing', level: 'Mid', job_role: 'Digital Marketing Specialist', domain: 'Digital' },
    { team: 'Marketing', sub_team: 'Brand', level: 'Senior', job_role: 'Brand Manager', domain: 'Branding' },
    { team: 'Data', sub_team: 'Data Engineering', level: 'Lead', job_role: 'Data Engineer', domain: 'Engineering' },
    { team: 'Data', sub_team: 'Data Science', level: 'Senior', job_role: 'Data Scientist', domain: 'Science' },
    { team: 'Data', sub_team: 'Analytics', level: 'Mid', job_role: 'Data Analyst', domain: 'Analytics' },
  ];

  // Calculate available options based on current filter selections
  const availableOptions = useMemo(() => {
    let filtered = mockData;

    // Apply existing filters to determine available options
    if (filters.team && filters.team.length > 0) {
      filtered = filtered.filter(item => filters.team.includes(item.team));
    }
    if (filters.sub_team && filters.sub_team.length > 0) {
      filtered = filtered.filter(item => filters.sub_team.includes(item.sub_team));
    }
    if (filters.level && filters.level.length > 0) {
      filtered = filtered.filter(item => filters.level.includes(item.level));
    }
    if (filters.job_role && filters.job_role.length > 0) {
      filtered = filtered.filter(item => filters.job_role.includes(item.job_role));
    }
    if (filters.domain && filters.domain.length > 0) {
      filtered = filtered.filter(item => filters.domain.includes(item.domain));
    }

    return {
      teams: [...new Set(mockData.map(item => item.team))].sort(),
      sub_teams: [...new Set(filtered.map(item => item.sub_team))].sort(),
      levels: [...new Set(mockData.map(item => item.level))].sort(),
      job_roles: [...new Set(mockData.map(item => item.job_role))].sort(),
      domains: [...new Set(filtered.map(item => item.domain))].sort(),
    };
  }, [filters]);

  const handleChange = (filterName, value) => {
    const newFilters = { ...filters };
    
    if (Array.isArray(value) && value.length === 0) {
      // Clear the filter
      delete newFilters[filterName];
      
      // Clear dependent filters
      if (filterName === 'team') {
        delete newFilters.sub_team;
      }
    } else {
      newFilters[filterName] = value;
    }
    
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (event, newValue) => {
    const newFilters = { ...filters };
    newFilters.date_range = newValue;
    onFilterChange(newFilters);
  };

  const handleTimeTravelChange = (event, newValue) => {
    const newFilters = { ...filters };
    newFilters.time_travel = newValue;
    onFilterChange(newFilters);
  };

  const handleClearFilter = (filterName) => {
    const newFilters = { ...filters };
    delete newFilters[filterName];
    
    // Clear dependent filters
    if (filterName === 'team') {
      delete newFilters.sub_team;
    }
    
    onFilterChange(newFilters);
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    if (key === 'date_range') {
      return filters[key] && (filters[key][0] !== minValue || filters[key][1] !== maxValue);
    }
    if (key === 'time_travel') {
      return filters[key] !== undefined && filters[key] !== maxValue;
    }
    return filters[key] && filters[key].length > 0;
  }).length;

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 'fit-content' }}>
          Filters
        </Typography>
        {activeFilterCount > 0 && (
          <Chip 
            label={`${activeFilterCount} active`} 
            size="small" 
            color="primary"
          />
        )}
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        {/* Team Filter */}
        <FormControl sx={{ minWidth: 140, flex: '1 1 140px' }} size="small">
          <InputLabel sx={{ fontSize: '0.875rem' }}>Team</InputLabel>
          <Select
            multiple
            value={filters.team || []}
            label="Team"
            onChange={(e) => handleChange('team', e.target.value)}
            input={<OutlinedInput label="Team" />}
            renderValue={(selected) => selected.length === 0 ? 'All' : selected.join(', ')}
            sx={{ fontSize: '0.875rem' }}
          >
            {availableOptions.teams.map(team => (
              <MenuItem key={team} value={team} dense>
                <Checkbox checked={(filters.team || []).includes(team)} size="small" />
                <ListItemText primary={team} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sub Team Filter */}
        <FormControl sx={{ minWidth: 140, flex: '1 1 140px' }} size="small">
          <InputLabel sx={{ fontSize: '0.875rem' }}>Sub Team</InputLabel>
          <Select
            multiple
            value={filters.sub_team || []}
            label="Sub Team"
            onChange={(e) => handleChange('sub_team', e.target.value)}
            input={<OutlinedInput label="Sub Team" />}
            renderValue={(selected) => selected.length === 0 ? 'All' : selected.join(', ')}
            disabled={!filters.team || filters.team.length === 0}
            sx={{ fontSize: '0.875rem' }}
          >
            {availableOptions.sub_teams.map(subTeam => (
              <MenuItem key={subTeam} value={subTeam} dense>
                <Checkbox checked={(filters.sub_team || []).includes(subTeam)} size="small" />
                <ListItemText primary={subTeam} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Level Filter */}
        <FormControl sx={{ minWidth: 120, flex: '1 1 120px' }} size="small">
          <InputLabel sx={{ fontSize: '0.875rem' }}>Level</InputLabel>
          <Select
            multiple
            value={filters.level || []}
            label="Level"
            onChange={(e) => handleChange('level', e.target.value)}
            input={<OutlinedInput label="Level" />}
            renderValue={(selected) => selected.length === 0 ? 'All' : selected.join(', ')}
            sx={{ fontSize: '0.875rem' }}
          >
            {availableOptions.levels.map(level => (
              <MenuItem key={level} value={level} dense>
                <Checkbox checked={(filters.level || []).includes(level)} size="small" />
                <ListItemText primary={level} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Job Role Filter */}
        <FormControl sx={{ minWidth: 140, flex: '1 1 140px' }} size="small">
          <InputLabel sx={{ fontSize: '0.875rem' }}>Job Role</InputLabel>
          <Select
            multiple
            value={filters.job_role || []}
            label="Job Role"
            onChange={(e) => handleChange('job_role', e.target.value)}
            input={<OutlinedInput label="Job Role" />}
            renderValue={(selected) => selected.length === 0 ? 'All' : selected.join(', ')}
            sx={{ fontSize: '0.875rem' }}
          >
            {availableOptions.job_roles.map(jobRole => (
              <MenuItem key={jobRole} value={jobRole} dense>
                <Checkbox checked={(filters.job_role || []).includes(jobRole)} size="small" />
                <ListItemText primary={jobRole} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Domain Filter */}
        <FormControl sx={{ minWidth: 130, flex: '1 1 130px' }} size="small">
          <InputLabel sx={{ fontSize: '0.875rem' }}>Domain</InputLabel>
          <Select
            multiple
            value={filters.domain || []}
            label="Domain"
            onChange={(e) => handleChange('domain', e.target.value)}
            input={<OutlinedInput label="Domain" />}
            renderValue={(selected) => selected.length === 0 ? 'All' : selected.join(', ')}
            sx={{ fontSize: '0.875rem' }}
          >
            {availableOptions.domains.map(domain => (
              <MenuItem key={domain} value={domain} dense>
                <Checkbox checked={(filters.domain || []).includes(domain)} size="small" />
                <ListItemText primary={domain} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Date Range Filter */}
      <Box sx={{ mt: 1.5, mb: 1, px: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
          <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 70 }}>
            Date Range
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {startDate} to {endDate}
          </Typography>
        </Stack>
        <Slider
          value={currentDateRange}
          onChange={handleDateRangeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => valueToDate(value)}
          min={minValue}
          max={maxValue}
          size="small"
          sx={{ mt: 0.5 }}
        />
      </Box>

      {/* Time Travel Filter */}
      <Box sx={{ mt: 1.5, mb: 1, px: 1, borderTop: '1px solid #e0e0e0', pt: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
          <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600, minWidth: 70 }}>
            ⏰ Time Travel
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {timeTravelDate} {currentTimeTravel === maxValue && '(Current)'}
          </Typography>
        </Stack>
        <Slider
          value={currentTimeTravel}
          onChange={handleTimeTravelChange}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => valueToDate(value)}
          min={minValue}
          max={maxValue}
          size="small"
          marks={[
            { value: minValue, label: <Typography variant="caption" fontSize="0.65rem">{valueToDate(minValue)}</Typography> },
            { value: maxValue, label: <Typography variant="caption" fontSize="0.65rem">{valueToDate(maxValue)}</Typography> }
          ]}
          sx={{ 
            mt: 1.5, 
            mb: 0.5,
            color: '#4caf50',
            '& .MuiSlider-thumb': {
              backgroundColor: '#2e7d32',
            },
            '& .MuiSlider-track': {
              backgroundColor: '#4caf50',
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#c8e6c9',
            }
          }}
        />
      </Box>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          {filters.team && filters.team.length > 0 && filters.team.map(team => (
            <Chip
              key={team}
              label={`Team: ${team}`}
              onDelete={() => {
                const newTeams = filters.team.filter(t => t !== team);
                handleChange('team', newTeams);
              }}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          {filters.sub_team && filters.sub_team.length > 0 && filters.sub_team.map(subTeam => (
            <Chip
              key={subTeam}
              label={`Sub Team: ${subTeam}`}
              onDelete={() => {
                const newSubTeams = filters.sub_team.filter(st => st !== subTeam);
                handleChange('sub_team', newSubTeams);
              }}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          {filters.level && filters.level.length > 0 && filters.level.map(level => (
            <Chip
              key={level}
              label={`Level: ${level}`}
              onDelete={() => {
                const newLevels = filters.level.filter(l => l !== level);
                handleChange('level', newLevels);
              }}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          {filters.job_role && filters.job_role.length > 0 && filters.job_role.map(jobRole => (
            <Chip
              key={jobRole}
              label={`Job Role: ${jobRole}`}
              onDelete={() => {
                const newJobRoles = filters.job_role.filter(jr => jr !== jobRole);
                handleChange('job_role', newJobRoles);
              }}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          {filters.domain && filters.domain.length > 0 && filters.domain.map(domain => (
            <Chip
              key={domain}
              label={`Domain: ${domain}`}
              onDelete={() => {
                const newDomains = filters.domain.filter(d => d !== domain);
                handleChange('domain', newDomains);
              }}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          {filters.date_range && (filters.date_range[0] !== minValue || filters.date_range[1] !== maxValue) && (
            <Chip
              label={`Date: ${startDate} to ${endDate}`}
              onDelete={() => {
                handleChange('date_range', [minValue, maxValue]);
              }}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          {filters.time_travel !== undefined && filters.time_travel !== maxValue && (
            <Chip
              label={`⏰ As of: ${timeTravelDate}`}
              onDelete={() => {
                handleChange('time_travel', maxValue);
              }}
              color="success"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      )}
    </Paper>
  );
}

export default OverviewFilters;
