import React, { useMemo, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Slider,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { mockEmployeeData } from '../data/mockEmployeeData';

const OverviewFiltersV2 = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Date handling functions
  const minDate = new Date('2022-10-01');
  const maxDate = new Date('2025-11-30');
  
  const dateToValue = (date) => {
    const diffTime = date.getTime() - minDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const valueToDate = (value) => {
    const date = new Date(minDate);
    date.setDate(date.getDate() + value);
    return date;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const minValue = 0;
  const maxValue = dateToValue(maxDate);

  // Calculate available options based on current filters
  const availableOptions = useMemo(() => {
    let filteredData = [...mockEmployeeData];

    // Filter by selected teams
    if (filters.team && filters.team.length > 0) {
      filteredData = filteredData.filter(emp => filters.team.includes(emp.team));
    }

    return {
      teams: [...new Set(mockEmployeeData.map(emp => emp.team))].sort(),
      sub_teams: [...new Set(filteredData.map(emp => emp.sub_team))].sort(),
      levels: [...new Set(mockEmployeeData.map(emp => emp.level))].sort(),
      job_roles: [...new Set(mockEmployeeData.map(emp => emp.job_role))].sort(),
      domains: [...new Set(mockEmployeeData.map(emp => emp.domain))].sort(),
    };
  }, [filters.team]);

  const handleChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    
    // Clear dependent filters when team changes
    if (filterName === 'team') {
      newFilters.sub_team = [];
    }
    
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (event, newValue) => {
    onFilterChange({
      ...filters,
      date_range: newValue
    });
  };

  const handleTimeTravelChange = (event, newValue) => {
    onFilterChange({
      ...filters,
      time_travel: newValue
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.team?.length > 0) count++;
    if (filters.sub_team?.length > 0) count++;
    if (filters.level?.length > 0) count++;
    if (filters.job_role?.length > 0) count++;
    if (filters.domain?.length > 0) count++;
    if (filters.date_range && (filters.date_range[0] !== minValue || filters.date_range[1] !== maxValue)) count++;
    if (filters.time_travel !== maxValue) count++;
    return count;
  }, [filters, minValue, maxValue]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 1000,
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Floating Filter Button */}
      {!isExpanded && (
        <Tooltip title="Filters" placement="left">
          <Paper
            elevation={4}
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              bgcolor: activeFilterCount > 0 ? 'primary.main' : 'background.paper',
              color: activeFilterCount > 0 ? 'white' : 'text.primary',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <FilterListIcon fontSize="large" />
              {activeFilterCount > 0 && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    height: 20,
                    minWidth: 20,
                    fontSize: '0.7rem',
                    bgcolor: 'error.main',
                    color: 'white',
                  }}
                />
              )}
            </Box>
          </Paper>
        </Tooltip>
      )}

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <Paper
          elevation={8}
          sx={{
            p: 2,
            width: 420,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            transition: 'all 0.3s ease',
            animation: 'slideIn 0.3s ease',
            '@keyframes slideIn': {
              from: {
                opacity: 0,
                transform: 'translateX(20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateX(0)',
              },
            },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <FilterListIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
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

          {/* Multi-select Filters */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
            {/* Team Filter */}
            <FormControl sx={{ width: '100%' }} size="small">
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
            <FormControl sx={{ width: '100%' }} size="small">
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
            <FormControl sx={{ width: '100%' }} size="small">
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
            <FormControl sx={{ width: '100%' }} size="small">
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
            <FormControl sx={{ width: '100%' }} size="small">
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
                {formatDate(valueToDate(filters.date_range?.[0] || minValue))} - {formatDate(valueToDate(filters.date_range?.[1] || maxValue))}
              </Typography>
            </Stack>
            <Slider
              value={filters.date_range || [minValue, maxValue]}
              onChange={handleDateRangeChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => formatDate(valueToDate(value))}
              min={minValue}
              max={maxValue}
              size="small"
              marks={[
                { value: minValue, label: <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{formatDate(minDate)}</Typography> },
                { value: maxValue, label: <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{formatDate(maxDate)}</Typography> },
              ]}
            />
          </Box>

          {/* Time Travel Slider */}
          <Box sx={{ mt: 1.5, px: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 70, color: '#2e7d32' }}>
                Time Travel
              </Typography>
              <Typography variant="caption" sx={{ color: '#2e7d32' }}>
                {formatDate(valueToDate(filters.time_travel || maxValue))}
              </Typography>
            </Stack>
            <Slider
              value={filters.time_travel || maxValue}
              onChange={handleTimeTravelChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => formatDate(valueToDate(value))}
              min={minValue}
              max={maxValue}
              size="small"
              sx={{
                color: '#4caf50',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#2e7d32',
                },
                '& .MuiSlider-track': {
                  backgroundColor: '#4caf50',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: '#c8e6c9',
                },
              }}
              marks={[
                { value: minValue, label: <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#2e7d32' }}>{formatDate(minDate)}</Typography> },
                { value: maxValue, label: <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#2e7d32' }}>{formatDate(maxDate)}</Typography> },
              ]}
            />
          </Box>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
                Active Filters:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {filters.team?.length > 0 && (
                  <Chip label={`Team: ${filters.team.length}`} size="small" onDelete={() => handleChange('team', [])} />
                )}
                {filters.sub_team?.length > 0 && (
                  <Chip label={`Sub Team: ${filters.sub_team.length}`} size="small" onDelete={() => handleChange('sub_team', [])} />
                )}
                {filters.level?.length > 0 && (
                  <Chip label={`Level: ${filters.level.length}`} size="small" onDelete={() => handleChange('level', [])} />
                )}
                {filters.job_role?.length > 0 && (
                  <Chip label={`Job Role: ${filters.job_role.length}`} size="small" onDelete={() => handleChange('job_role', [])} />
                )}
                {filters.domain?.length > 0 && (
                  <Chip label={`Domain: ${filters.domain.length}`} size="small" onDelete={() => handleChange('domain', [])} />
                )}
                {filters.date_range && (filters.date_range[0] !== minValue || filters.date_range[1] !== maxValue) && (
                  <Chip label="Date Range" size="small" onDelete={() => handleChange('date_range', [minValue, maxValue])} />
                )}
                {filters.time_travel !== maxValue && (
                  <Chip 
                    label="Time Travel" 
                    size="small" 
                    sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}
                    onDelete={() => handleChange('time_travel', maxValue)} 
                  />
                )}
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default OverviewFiltersV2;
