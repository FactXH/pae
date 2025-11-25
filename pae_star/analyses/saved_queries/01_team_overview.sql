-- Team Overview: Complete team metrics with headcount and hierarchy
-- Use this query to get a comprehensive view of all teams with their current state

select 
    team_name,
    team_level,
    team_type,
    parent_team_name,
    active_employees,
    inactive_employees,
    total_current_headcount,
    avg_tenure_years_active,
    round(avg_salary_active, 2) as avg_salary_active,
    active_roles,
    is_empty_team,
    is_small_team,
    is_large_team
from {{ ref('fact_teams') }}
where team_type = 'Team'
order by team_level, team_name
