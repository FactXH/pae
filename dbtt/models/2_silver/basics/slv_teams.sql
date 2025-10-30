with source as (
    select * from {{ ref("br_athena_teams") }}
),

-- Find parent team by matching name prefixes
teams_with_parents as (
    select 
        t1.team_id,
        t1.team_name,
        t1.team_level,
        t1.team_type,
        t2.team_id as parent_team_id,
        t2.team_name as parent_team_name
    from source t1
    left join source t2
        on t1.team_name like t2.team_name || '/%'  -- t1's name starts with t2's name followed by /
        and t1.team_id != t2.team_id  -- not the same team
        and t2.team_level = (
            -- Get the highest level (most immediate parent)
            select max(t3.team_level)
            from source t3
            where t1.team_name like t3.team_name || '/%'
            and t1.team_id != t3.team_id
        )
)

select 
    team_id,
    team_name,
    team_level,
    team_type,
    parent_team_id,
    parent_team_name
from teams_with_parents
order by team_level, team_name