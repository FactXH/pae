# ConfigurableMetricsCard Component

## Overview

A pre-configured, self-contained card component for displaying metrics. **The query itself defines everything** through column naming conventions - no separate configuration needed!

## Key Concept

**Use `AS` in your SQL query to name columns with special suffixes:**
- `columnname__dim` → Dimension (regular text)
- `columnname__metric__avg` → Metric with color coding, averaged when grouped
- `columnname__metric__sum` → Metric with color coding, summed when grouped
- `columnname__count__sum` → Count without color coding, summed when grouped
- `columnname__count__avg` → Count without color coding, averaged when grouped

The component automatically detects these patterns and handles aggregation when you hide dimensions!

**Aggregation types:** `avg`, `sum`, `count`, `min`, `max`

## Features

- 🎯 **Query defines behavior** - Column names in SQL control everything
- 🔄 **Toggle dimensions/metrics** - Users show/hide columns via checkboxes
- 🎨 **Automatic color coding** - `__metric` columns get green/yellow/red
- 📊 **Count columns** - `__count` columns shown as plain numbers
- 💾 **Database configured in code** - Set database ('trino' or 'sqlite') at component level
- 🚀 **Zero manual configuration** - Everything inferred from query

## Column Naming Convention

| Suffix Pattern | Behavior | Example |
|----------------|----------|---------|
| `__dim` | Dimension (regular text) | `manager_name__dim` |
| `__metric__avg` | Scored metric (color-coded), averaged when grouped | `avg_satisfaction__metric__avg` |
| `__metric__sum` | Scored metric (color-coded), summed when grouped | `total_revenue__metric__sum` |
| `__count__sum` | Count metric (no color), summed when grouped | `employee_count__count__sum` |
| `__count__avg` | Count metric (no color), averaged when grouped | `avg_headcount__count__avg` |
| `__metric__min` | Scored metric, minimum value when grouped | `min_score__metric__min` |
| `__metric__max` | Scored metric, maximum value when grouped | `max_score__metric__max` |

**Default behavior:** If you don't specify aggregation (e.g., `score__metric`), it defaults to `AVG`.

## Usage

### Basic Example

```jsx
import ConfigurableMetricsCard from '../components/ConfigurableMetricsCard';

<ConfigurableMetricsCard
  title="Manager Climate Survey Results"
  query={`
    SELECT 
      manager_full_name AS manager__dim,
      reporting_level AS level__dim,
      level_employee_count AS employee_count__count__sum,
      avg_accomplishments_recognised AS accomplishments__metric__avg,
      avg_great_place_to_work AS workplace__metric__avg
    FROM data_lake_dev_xavi_gold.gold_climate_2025_by_manager
  `}
  database="trino"
  thresholds={{ red: 2.2, yellow: 4.0 }}
/>
```

That's it! The component automatically:
- ✅ Detects `manager__dim` and `level__dim` as dimensions
- ✅ Detects `employee_count__count__sum` as a count to SUM when grouped
- ✅ Detects `accomplishments__metric__avg` and `workplace__metric__avg` as scored metrics to AVERAGE when grouped
- ✅ Creates checkboxes for each
- ✅ Renders the table with proper formatting
- ✅ **When you hide "level__dim", it automatically groups by manager and SUMs employee_count, AVGs the metrics**

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | Yes | - | Card title displayed at top |
| `query` | string | Yes | - | SQL query with `AS columnname__type` |
| `database` | string | No | 'trino' | Database to query ('trino' or 'sqlite') |
| `thresholds` | object | No | `{red: 2.2, yellow: 4.0}` | Color thresholds for `__metric` columns |
| `description` | string | No | '' | Optional description text |

## Query Examples

### Example 1: Mixed Metrics with Aggregations

```sql
SELECT 
  manager_name AS manager__dim,
  team_name AS team__dim,
  employee_count AS count__count__sum,           -- Sum when grouped
  avg_satisfaction AS satisfaction__metric__avg, -- Average when grouped
  avg_engagement AS engagement__metric__avg,     -- Average when grouped
  total_revenue AS revenue__count__sum           -- Sum when grouped
FROM metrics_table
```

**What happens:**
- Show both dimensions → See all rows
- Hide "team__dim" → Groups by manager, SUMs counts and revenue, AVGs satisfaction and engagement

### Example 2: Climate Survey with Aggregation

```sql
SELECT 
  manager_full_name AS manager__dim,
  reporting_level AS level__dim,
  level_employee_count AS employee_count__count__sum,
  avg_accomplishments_recognised AS accomplishments__metric__avg,
  avg_great_place_to_work AS workplace__metric__avg
FROM data_lake_dev_xavi_gold.gold_climate_2025_by_manager
```

**What happens:**
- Both dimensions visible → See manager + level breakdown
- Hide "level__dim" → See totals per manager (SUMs employee counts, AVGs scores)

## Complete Integration Example

```jsx
import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import ConfigurableMetricsCard from '../components/ConfigurableMetricsCard';

function MyAnalyticsPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Analytics Dashboard
        </Typography>

        <ConfigurableMetricsCard
          title="Team Performance"
          description="Performance metrics by team and manager"
          query={`
            SELECT 
              team_name AS team__dim,
              manager_name AS manager__dim,
              headcount AS headcount__count,
              avg_productivity AS productivity__metric,
              avg_satisfaction AS satisfaction__metric
            FROM team_metrics
            WHERE year = 2025
          `}
          thresholds={{ red: 3.0, yellow: 4.5 }}
        />
      </Box>
    </Container>
  );
}
```

## User Experience

### What Users See

1. **Card Header**
   - Title on the left
   - Database badge (Trino/SQLite) on the right - read-only display

2. **Column Selection** (automatically populated from query)
   - Left panel: Dimensions with checkboxes
   - Right panel: Metrics with checkboxes (labeled as "colored" or "count")
   - All checked by default

3. **Results Table**
   - Sticky header for scrolling
   - Color-coded metric chips (for `__metric` columns)
   - Bold numbers (for `__count` columns)
   - Plain text (for `__dim` columns)

4. **Legend**
   - Shows threshold values
   - Helps interpret colors

## Color Coding Logic

For columns with `__metric` suffix:
- 🔴 **Red**: value < 2.2 (or custom threshold)
- 🟡 **Yellow**: 2.2 ≤ value < 4.0
- 🟢 **Green**: value ≥ 4.0

For columns with `__count` suffix:
- No color coding, just displayed as bold number

## Tips

1. **Keep it Simple**: Just use `AS columnname__type` in your SELECT
2. **Readable Names**: Use underscores in column names for spacing (they're converted to spaces)
3. **Mix Types**: Combine `__dim`, `__count`, and `__metric` as needed
4. **Thresholds**: Adjust based on your scale (1-5, 1-10, percentages, etc.)
5. **Order Matters**: Dimensions are shown first, then metrics in the table

## Example Queries

### Simple Query
```sql
SELECT 
  name AS name__dim,
  score AS score__metric
FROM table
```

### Complex Query
```sql
SELECT 
  manager_name AS manager__dim,
  department AS dept__dim,
  region AS region__dim,
  headcount AS people__count,
  avg_score AS score__metric,
  avg_satisfaction AS satisfaction__metric,
  total_revenue AS revenue__count
FROM complex_table
WHERE year = 2025
ORDER BY manager_name
```

## See It In Action

Navigate to:
- **Analytics → Climate 2025** - See manager climate metrics
- **Manager Climate View** (`/manager-climate`) - Dedicated page

Both use the same simple approach: query defines everything!

