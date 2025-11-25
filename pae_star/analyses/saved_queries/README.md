# Saved Queries - XAPT Analytics

This folder contains curated SQL queries for common analytics use cases. These queries are designed to work with the silver layer models in the dbt project.

## Available Queries

### 1. Team Overview (`01_team_overview.sql`)
- **Purpose**: Complete team metrics with headcount and hierarchy
- **Use Case**: Executive dashboards, team planning
- **Key Metrics**: Active employees, tenure, salary averages, team flags

### 2. Active Employees by Team (`02_active_employees_by_team.sql`)
- **Purpose**: Current active headcount with employee details
- **Use Case**: Headcount reports, team roster
- **Key Metrics**: Employee details, team assignment, tenure, seniority rank

### 3. Salary Analysis by Team (`03_salary_analysis_by_team.sql`)
- **Purpose**: Salary metrics and distribution per team
- **Use Case**: Compensation analysis, budget planning
- **Key Metrics**: Avg/min/max salary, salary range, total cost, 2025 increases

### 4. Employee Career Progression (`04_employee_career_progression.sql`)
- **Purpose**: Track role and salary changes over time
- **Use Case**: Career development, promotion analysis
- **Key Metrics**: Role history, contract count, salary progression, seniority

### 5. Turnover Analysis (`05_turnover_analysis.sql`)
- **Purpose**: Offboarding trends and patterns
- **Use Case**: Retention strategy, team health assessment
- **Key Metrics**: Churn rate, avg tenure before exit, active vs churned counts

### 6. Market and Office Distribution (`06_market_and_office_distribution.sql`)
- **Purpose**: Employee distribution across markets and offices
- **Use Case**: Geographic planning, office utilization
- **Key Metrics**: Employee count by location, avg salary by market/office

### 7. Team Hierarchy Full (`07_team_hierarchy_full.sql`)
- **Purpose**: Complete organizational structure with all levels
- **Use Case**: Org charts, hierarchy visualization
- **Key Metrics**: Full team tree with parent-child relationships

### 8. Top Performers by Salary (`08_top_performers_by_salary.sql`)
- **Purpose**: Highest paid active employees
- **Use Case**: Talent retention, compensation benchmarking
- **Key Metrics**: Top 50 earners with tenure and team info

### 9. New Hires Recent (`09_new_hires_recent.sql`)
- **Purpose**: Recently onboarded employees (last 6 months)
- **Use Case**: Onboarding tracking, new hire analysis
- **Key Metrics**: Days since onboarding, starting role, current status

## How to Use

### In dbt
```bash
# Run queries directly in dbt
dbt compile -s analyses/saved_queries/01_team_overview.sql
```

### In Trino/Athena
Copy the compiled SQL from `target/compiled/` after running dbt compile, or manually replace `{{ ref('model_name') }}` with your schema references.

### In Frontend (Query View)
Paste the compiled SQL into the Query View component in the analytics frontend.

## Query Patterns

All queries follow these conventions:
- Use `{{ ref('model_name') }}` for dbt model references
- Include descriptive comments at the top
- Order results logically (usually by date, team, or rank)
- Filter out noise (e.g., small teams with <3 employees in aggregate queries)
- Use consistent naming (team, role, salary, tenure)

## Adding New Queries

When adding new queries:
1. Follow the naming convention: `##_descriptive_name.sql`
2. Add a header comment explaining purpose and use case
3. Document key metrics in this README
4. Test the query against actual data
5. Consider adding filters for data quality (nulls, small samples, etc.)
