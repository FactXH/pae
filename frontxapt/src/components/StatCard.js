import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import './StatCard.css';

function StatCard({ title, value, subtitle, color = 'primary' }) {
  return (
    <Card className={`stat-card stat-card-${color}`}>
      <CardContent>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" component="div" className="stat-value">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
