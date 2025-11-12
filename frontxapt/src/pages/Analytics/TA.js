import React, { useState } from 'react';
import { Typography, Paper, Box, Chip, Stack, Grid } from '@mui/material';
import ForecastTA from '../../components/ForecastTA';
import ApplicationPipeline from '../../components/ApplicationPipeline';
import PipelineStatus from '../../components/PipelineStatus';
import HireQuality from '../../components/HireQuality';
import TAFilters from '../../components/TAFilters';
import TimeToHire from '../../components/TimeToHire';
import TimeToHireTable from '../../components/TimeToHireTable';
import './TA.css';

function TA() {
  // State to hold active filters
  const [activeFilters, setActiveFilters] = useState({
    team: '',
    sub_team: '',
    market: '',
    manager: '',
    job_role: '',
    seniority: '',
  });
  const initialHeadcount = 100;
  
  // Sample data - replace with actual data from API
  const forecastData = [
    { month: 'Mid Jan 2025', forecast: 125, hires: 28, turnovers: 10 },    // Huge turnover mid-month 1
    { month: 'Mid Feb 2025', forecast: 130, hires: 12, turnovers: 25 },   // Huge turnover mid-month 2
    { month: 'Mid Mar 2025', forecast: 135, hires: 10, turnovers: 20 },   // Huge turnover mid-month 3
    { month: 'End Apr 2025', forecast: 140, hires: 45, turnovers: 8 },    // Compensation hiring end-month
    { month: 'End May 2025', forecast: 155, hires: 45, turnovers: 25 },    // Overhiring end-month 1
    { month: 'End Jun 2025', forecast: 160, hires: 52, turnovers: 6 },    // Overhiring end-month 2
    { month: 'Jul 2025', forecast: 165, hires: 45, turnovers: 17 },        // Normal hiring
    { month: 'Aug 2025', forecast: 165, hires: 0, turnovers: 14 },        // Normal hiring
    { month: 'Sep 2025', forecast: 165, hires: 0, turnovers: 9 },        // Normal hiring
    { month: 'Oct 2025', forecast: 170, hires: 10, turnovers: 6 },        // Normal hiring
    { month: 'Nov 2025', forecast: 185, hires: 16, turnovers: 8 },        // Normal hiring
    { month: 'Dec 2025', forecast: 190, hires: 14, turnovers: 12 },       // Year-end turnover
  ];

  // Calculate totals
  const totalHires = forecastData.reduce((sum, d) => sum + d.hires, 0);
  const totalTurnovers = forecastData.reduce((sum, d) => sum + d.turnovers, 0);
  const netGrowth = totalHires - totalTurnovers;
  const finalHeadcount = initialHeadcount + netGrowth;

  // Sample application pipeline data
  const phaseNames = [
    'Applied', 
    'Phone Screen', 
    'Technical Interview', 
    'Final Interview', 
    'Offer', 
    'Hired', 
    'Turnover',
    'Rejected - Applied',
    'Rejected - Phone Screen',
    'Rejected - Technical',
    'Rejected - Final',
    'Rejected - Offer'
  ];
  
  // Generate more realistic sample data with bigger numbers
  const generateApplications = () => {
    const apps = [];
    let appId = 1;
    
    const createApplication = (startDay, month) => {
      const phases = [];
      let currentDay = startDay;
        
        // Applied phase (1-2 days)
        const appliedDuration = 1 + Math.floor(Math.random() * 2);
        phases.push({
          name: 'Applied',
          effectiveFrom: `2025-${month}-${String(currentDay).padStart(2, '0')}`,
          effectiveTo: `2025-${month}-${String(currentDay + appliedDuration).padStart(2, '0')}`,
        });
        currentDay += appliedDuration + 1;
        
        // 70% pass to Phone Screen
        if (Math.random() < 0.7 && currentDay < 90) {
          const duration = 2 + Math.floor(Math.random() * 3);
          const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
          const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
          phases.push({
            name: 'Phone Screen',
            effectiveFrom: `2025-${currentMonth}-${String(actualDay).padStart(2, '0')}`,
            effectiveTo: `2025-${currentMonth}-${String(Math.min(actualDay + duration, 30)).padStart(2, '0')}`,
          });
          currentDay += duration + 1;
          
          // 60% pass to Technical Interview
          if (Math.random() < 0.6 && currentDay < 90) {
            const duration = 3 + Math.floor(Math.random() * 4);
            const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
            const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
            phases.push({
              name: 'Technical Interview',
              effectiveFrom: `2025-${currentMonth}-${String(actualDay).padStart(2, '0')}`,
              effectiveTo: `2025-${currentMonth}-${String(Math.min(actualDay + duration, 30)).padStart(2, '0')}`,
            });
            currentDay += duration + 1;
            
            // 50% pass to Final Interview
            if (Math.random() < 0.5 && currentDay < 90) {
              const duration = 2 + Math.floor(Math.random() * 3);
              const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
              const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
              phases.push({
                name: 'Final Interview',
                effectiveFrom: `2025-${currentMonth}-${String(actualDay).padStart(2, '0')}`,
                effectiveTo: `2025-${currentMonth}-${String(Math.min(actualDay + duration, 30)).padStart(2, '0')}`,
              });
              currentDay += duration + 1;
              
              // 70% get offer
              if (Math.random() < 0.7 && currentDay < 90) {
                const duration = 3 + Math.floor(Math.random() * 4);
                const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
                const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
                phases.push({
                  name: 'Offer',
                  effectiveFrom: `2025-${currentMonth}-${String(actualDay).padStart(2, '0')}`,
                  effectiveTo: `2025-${currentMonth}-${String(Math.min(actualDay + duration, 30)).padStart(2, '0')}`,
                });
                currentDay += duration + 1;
                
                // 85% accept offer (Hired)
                if (Math.random() < 0.85) {
                  const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
                  const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
                  phases.push({
                    name: 'Hired',
                    effectiveFrom: `2025-${currentMonth}-${String(Math.min(actualDay, 30)).padStart(2, '0')}`,
                    effectiveTo: `2025-04-30`, // Stay until end
                  });
                } else {
                  // Rejected after offer (stays until end)
                  const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
                  const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
                  phases.push({
                    name: 'Rejected - Offer',
                    effectiveFrom: `2025-${currentMonth}-${String(Math.min(actualDay, 30)).padStart(2, '0')}`,
                    effectiveTo: `2025-04-30`, // Stay until end
                  });
                }
              } else {
                // Rejected after final interview (stays until end)
                const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
                const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
                phases.push({
                  name: 'Rejected - Final',
                  effectiveFrom: `2025-${currentMonth}-${String(Math.min(actualDay, 30)).padStart(2, '0')}`,
                  effectiveTo: `2025-04-30`, // Stay until end
                });
              }
            } else {
              // Rejected after technical (stays until end)
              const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
              const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
              phases.push({
                name: 'Rejected - Technical',
                effectiveFrom: `2025-${currentMonth}-${String(Math.min(actualDay, 30)).padStart(2, '0')}`,
                effectiveTo: `2025-04-30`, // Stay until end
              });
            }
          } else {
            // Rejected after phone screen (stays until end)
            const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
            const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
            phases.push({
              name: 'Rejected - Phone Screen',
              effectiveFrom: `2025-${currentMonth}-${String(Math.min(actualDay, 30)).padStart(2, '0')}`,
              effectiveTo: `2025-04-30`, // Stay until end
            });
          }
        } else {
          // Rejected after applied (stays until end)
          const currentMonth = currentDay > 31 ? (currentDay > 59 ? '03' : '02') : month;
          const actualDay = currentDay > 59 ? currentDay - 59 : (currentDay > 31 ? currentDay - 31 : currentDay);
          phases.push({
            name: 'Rejected - Applied',
            effectiveFrom: `2025-${currentMonth}-${String(Math.min(actualDay, 31)).padStart(2, '0')}`,
            effectiveTo: `2025-04-30`, // Stay until end
          });
        }
        
        return phases;
      };
      
    // Big batch in early January (days 1-10) - 300 applications
    for (let i = 0; i < 300; i++) {
      const startDay = 1 + Math.floor(Math.random() * 10);
      const phases = createApplication(startDay, '01');
      
      // Check if hired - 45% of hired people have turnover (3x the original 15%)
      const lastPhase = phases[phases.length - 1];
      if (lastPhase.name === 'Hired' && Math.random() < 0.45) {
        // Add turnover phase starting 30-60 days after hire
        const hireDay = parseInt(lastPhase.effectiveFrom.split('-')[2]);
        const turnoverDay = hireDay + 30 + Math.floor(Math.random() * 30);
        const turnoverMonth = turnoverDay > 31 ? (turnoverDay > 59 ? '03' : '02') : '01';
        const actualDay = turnoverDay > 59 ? turnoverDay - 59 : (turnoverDay > 31 ? turnoverDay - 31 : turnoverDay);
        
        // End the hired phase before turnover starts
        lastPhase.effectiveTo = `2025-${turnoverMonth}-${String(Math.min(actualDay - 1, 30)).padStart(2, '0')}`;
        
        phases.push({
          name: 'Turnover',
          effectiveFrom: `2025-${turnoverMonth}-${String(Math.min(actualDay, 30)).padStart(2, '0')}`,
          effectiveTo: `2025-04-30`,
        });
      }
      
      apps.push({
        id: `app-${appId++}`,
        phases: phases,
      });
    }
    
    // Big batch in early March (days 1-10) - 250 applications
    for (let i = 0; i < 250; i++) {
      const startDay = 1 + Math.floor(Math.random() * 10);
      const phases = createApplication(startDay, '03');
      
      apps.push({
        id: `app-${appId++}`,
        phases: phases,
      });
    }
    
    return apps;
  };
  
  const sampleApplications = generateApplications();

  // Sample hire quality data
  const generateHireData = () => {
    const hires = [];
    
    // Generate hires for Jan-Feb 2025
    for (let month = 1; month <= 2; month++) {
      const hiresInMonth = 8 + Math.floor(Math.random() * 7); // 8-14 hires per month
      
      for (let i = 0; i < hiresInMonth; i++) {
        const day = 1 + Math.floor(Math.random() * 28);
        
        // Weight performance ratings (more good/average)
        const perfRand = Math.random();
        let performanceRating;
        if (perfRand < 0.15) performanceRating = 'Excellent';
        else if (perfRand < 0.50) performanceRating = 'Good';
        else if (perfRand < 0.80) performanceRating = 'Average';
        else if (perfRand < 0.95) performanceRating = 'Below Average';
        else performanceRating = 'Poor';
        
        // Weight probation outcomes (most pass)
        const probRand = Math.random();
        let probationOutcome;
        if (probRand < 0.85) probationOutcome = 'Passed';
        else if (probRand < 0.92) probationOutcome = 'Failed - Company Decision';
        else probationOutcome = 'Failed - Employee Left';
        
        hires.push({
          id: `hire-${month}-${i}`,
          hireDate: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          firstPerformanceRating: performanceRating,
          probationOutcome: probationOutcome,
        });
      }
    }
    
    return hires;
  };
  
  const sampleHires = generateHireData();

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };

  return (
    <div className="analytics-subsection">
      <Typography variant="h4" component="h2" gutterBottom>
        Talent Acquisition (TA)
      </Typography>

      <Typography variant="body1" paragraph>
        Track recruitment metrics and hiring pipeline performance.
      </Typography>

      {/* Filter Component */}
      <TAFilters onFilterChange={handleFilterChange} />

      <Paper elevation={2} className="analytics-card" sx={{ mb: 3 }}>
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Headcount Forecast & Actuals
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={`Initial: ${initialHeadcount}`} 
                color="default" 
                variant="outlined"
              />
              <Chip 
                label={`Final: ${finalHeadcount}`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`Net Growth: ${netGrowth > 0 ? '+' : ''}${netGrowth}`} 
                color={netGrowth >= 0 ? "success" : "error"}
                variant="filled"
              />
            </Stack>
          </Box>
          <Box sx={{ height: '450px', mt: 2 }}>
            <ForecastTA data={forecastData} initialHeadcount={initialHeadcount} />
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} className="analytics-card" sx={{ mb: 3 }}>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Applications Pipeline Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Daily count of applications in each stage
          </Typography>
          <ApplicationPipeline applications={sampleApplications} phaseNames={phaseNames} />
        </Box>
      </Paper>

      <Paper elevation={2} className="analytics-card" sx={{ mb: 3 }}>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Pipeline Status Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Breakdown of applications by phase: Rejected, Passed to Next, or Still Waiting
          </Typography>
          <PipelineStatus 
            applications={sampleApplications} 
            initialStartDate="2025-01-01" 
            initialEndDate="2025-01-15"
            phaseOrder={['Applied', 'Phone Screen', 'Technical Interview', 'Final Interview', 'Offer']}
          />
        </Box>
      </Paper>

      {/* Hire Quality Section */}
      <Box mt={3}>
        <HireQuality hires={sampleHires} />
      </Box>

      {/* Time to Hire Section */}
      <Box mt={3}>
        <TimeToHire filters={activeFilters} />
      </Box>

      {/* Time to Hire Table - Decision Tree */}
      <Box mt={3}>
        <TimeToHireTable filters={activeFilters} />
      </Box>
    </div>
  );
}

export default TA;
