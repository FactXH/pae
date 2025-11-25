-- Team Hierarchy Full: Complete organizational structure with all levels
-- Shows the full team tree with parent-child relationships and metrics

select 
    team_id,
    team_name,
    team_level,
    parent_team_id,
    parent_team_name,
    team_type,
    active_employees,
    inactive_employees,
    total_current_headcount,
    is_last_team,
    is_empty_team,
    is_small_team,
    is_large_team,
    active_roles
from {{ ref('fact_teams') }}
order by team_level, parent_team_name, team_name
