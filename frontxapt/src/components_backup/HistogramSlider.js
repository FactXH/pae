import React, { useMemo } from 'react';
import { Box, Typography, Slider, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

/**
 * HistogramSlider Component
 * 
 * A slider with a histogram visualization showing the distribution of values
 * 
 * @param {string} label - Label for the slider
 * @param {Array<number>} values - Array of all values for this metric
 * @param {Array<number>} range - Current [min, max] range selection
 * @param {function} onChange - Callback when range changes: (newRange) => void
 * @param {function} onReset - Callback when reset button clicked to clear filter
 * @param {number} bins - Number of histogram bins (default: 20)
 */
const HistogramSlider = ({ label, values, range, onChange, onReset, bins = 20 }) => {
  const { histogram, min, max, step } = useMemo(() => {
    if (!values || values.length === 0) {
      return { histogram: [], min: 0, max: 100, step: 1 };
    }

    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (validValues.length === 0) {
      return { histogram: [], min: 0, max: 100, step: 1 };
    }

    // Sort values to calculate percentiles
    const sortedValues = [...validValues].sort((a, b) => a - b);
    const length = sortedValues.length;
    
    // Calculate 2.5th and 97.5th percentiles (95% of data in middle)
    const p2_5_index = Math.floor(length * 0.025);
    const p97_5_index = Math.ceil(length * 0.975) - 1;
    
    const minVal = sortedValues[p2_5_index];
    const maxVal = sortedValues[p97_5_index];
    const rangeSize = maxVal - minVal;
    
    // If range is too small, fall back to full range
    if (rangeSize === 0 || !isFinite(rangeSize)) {
      const fallbackMin = Math.min(...validValues);
      const fallbackMax = Math.max(...validValues);
      const fallbackRange = fallbackMax - fallbackMin;
      
      return {
        histogram: [1],
        min: fallbackMin,
        max: fallbackMax,
        step: fallbackRange > 0 ? fallbackRange / 100 : 1
      };
    }
    
    const binSize = rangeSize / bins;
    
    // Calculate step (round to reasonable precision)
    let calculatedStep = rangeSize / 100;
    if (calculatedStep < 0.01) calculatedStep = 0.01;
    else if (calculatedStep < 0.1) calculatedStep = 0.1;
    else if (calculatedStep < 1) calculatedStep = 1;
    else calculatedStep = Math.ceil(calculatedStep);

    // Create histogram bins (only for values within 95% range)
    const hist = new Array(bins).fill(0);
    validValues.forEach(val => {
      if (val >= minVal && val <= maxVal) {
        const binIndex = Math.min(Math.floor((val - minVal) / binSize), bins - 1);
        hist[binIndex]++;
      }
    });

    // Normalize histogram to 0-1 for display
    const maxCount = Math.max(...hist);
    const normalizedHist = hist.map(count => maxCount > 0 ? count / maxCount : 0);

    return {
      histogram: normalizedHist,
      min: minVal,
      max: maxVal,
      step: calculatedStep
    };
  }, [values, bins]);

  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  if (histogram.length === 0) {
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
      
      {/* Histogram visualization */}
      <Box 
        sx={{ 
          position: 'relative',
          height: '50px',
          mb: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1px',
          px: 1
        }}
      >
        {histogram.map((height, index) => {
          const binMin = min + (index * (max - min) / bins);
          const binMax = min + ((index + 1) * (max - min) / bins);
          const isInRange = range && binMax >= range[0] && binMin <= range[1];
          
          return (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: `${height * 100}%`,
                bgcolor: isInRange ? 'primary.main' : 'action.disabled',
                opacity: isInRange ? 0.8 : 0.3,
                transition: 'all 0.2s ease',
                borderRadius: '2px 2px 0 0',
                minHeight: height > 0 ? '2px' : '0px'
              }}
            />
          );
        })}
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
          {range ? range[0].toFixed(2) : min.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {range ? range[1].toFixed(2) : max.toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
};

export default HistogramSlider;
