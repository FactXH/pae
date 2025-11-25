-- Salary Analysis by Team: Salary metrics and distribution per team
-- Useful for compensation analysis and budget planning

select 
    t.team_name,
    t.team_level,
    t.parent_team_name,
    t.active_employees,
    round(t.avg_salary_active, 2) as avg_salary,
    t.min_salary_active,
    t.max_salary_active,
    round(t.max_salary_active - t.min_salary_active, 2) as salary_range,
    round(t.avg_salary_increase_pct_2025, 2) as avg_increase_pct_2025,
    round(t.avg_salary_active * t.active_employees, 2) as total_salary_cost
from {{ ref('fact_teams') }} t
where t.team_type = 'Team'
    and t.active_employees > 0
order by total_salary_cost desc
