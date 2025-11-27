import React, { useMemo } from 'react';
import { Box, Typography, Slider, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

/**
 * SimpleRangeSlider Component
 * 
 * A simple range slider without histogram (performance optimized)
 * 
 * @param {string} label - Label for the slider
 * @param {Array<number>} values - Array of all values for this metric
 * @param {Array<number>} range - Current [min, max] range selection
 * @param {function} onChange - Callback when range changes: (newRange) => void
 * @param {function} onReset - Callback when reset button clicked to clear filter
 */
const SimpleRangeSlider = ({ label, values, range, onChange, onReset }) => {
  const { min, max, step } = useMemo(() => {
    if (!values || values.length === 0) {
      return { min: 0, max: 100, step: 1 };
    }

    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (validValues.length === 0) {
      return { min: 0, max: 100, step: 1 };
    }

    const minVal = Math.min(...validValues);
    const maxVal = Math.max(...validValues);
    const rangeSize = maxVal - minVal;
    
    // Calculate step (round to reasonable precision)
    let calculatedStep = rangeSize / 100;
    if (calculatedStep < 0.01) calculatedStep = 0.01;
    else if (calculatedStep < 0.1) calculatedStep = 0.1;
    else if (calculatedStep < 1) calculatedStep = 1;
    else calculatedStep = Math.ceil(calculatedStep);

    return {
      min: minVal,
      max: maxVal,
      step: calculatedStep
    };
  }, [values]);

  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  if (values.length === 0) {
    return (
      <Box sx={{ mb: 1, opacity: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {label}: No data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ fontSize: '0.8rem' }}>
          {label}
        </Typography>
        {range && onReset && (
          <IconButton 
            size="small" 
            onClick={onReset}
            sx={{ 
              p: 0.3,
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': { bgcolor: 'error.dark' }
            }}
          >
            <ClearIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        )}
      </Box>

      {/* Slider */}
      <Slider
        value={range || [min, max]}
        onChange={handleChange}
        valueLabelDisplay="auto"
        min={min}
        max={max}
        step={step}
        sx={{
          mt: 2,
          '& .MuiSlider-thumb': {
            width: 14,
            height: 14,
          },
          '& .MuiSlider-valueLabel': {
            fontSize: '0.75rem',
            padding: '2px 6px',
          }
        }}
      />
      
      {/* Range labels */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Min: {min.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="primary.main" fontWeight="600" sx={{ fontSize: '0.75rem' }}>
          {range ? `${range[0].toFixed(2)} - ${range[1].toFixed(2)}` : 'No filter'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Max: {max.toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleRangeSlider;
