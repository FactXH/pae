with source as (
    select * from {{ ref("base_factorial_teams") }}
),

-- Find all potential parent relationships
all_parent_relationships as (
    select 
        t1.team_id,
        t1.team_name,
        t1.team_level,
        t1.team_type,
        t2.team_id as parent_team_id,
        t2.team_name as parent_team_name,
        t2.team_level as parent_team_level,
        row_number() over (
            partition by t1.team_id 
            order by t2.team_level desc
        ) as parent_rank
    from source t1
    left join source t2
        on t1.team_name like t2.team_name || '/%'
        and t1.team_id != t2.team_id
),

-- Get only the immediate parent (highest level)
teams_with_parents as (
    select 
        team_id,
        team_name,
        team_level,
        team_type,
        parent_team_id,
        parent_team_name
    from all_parent_relationships
    where parent_rank = 1 or parent_team_id is null
),

-- Calculate actual team level based on parent hierarchy (up to 4 levels deep)
teams_with_calculated_level as (
    select 
        t0.team_id,
        t0.team_name,
        t0.team_type,
        t0.parent_team_id,
        t0.parent_team_name,
        -- Count how many parents exist (level = number of ancestors)
        case 
            when t3.team_id is not null then 3
            when t2.team_id is not null then 2
            when t1.team_id is not null then 1
            else 0
        end as calculated_level
    from teams_with_parents t0
    left join teams_with_parents t1 on t0.parent_team_id = t1.team_id
    left join teams_with_parents t2 on t1.parent_team_id = t2.team_id
    left join teams_with_parents t3 on t2.parent_team_id = t3.team_id
),

-- Check if each team has any children
teams_with_children as (
    select
        t1.team_id,
        count(t2.team_id) as child_count
    from source t1
    left join source t2 
        on t2.team_name like t1.team_name || '/%'
        and t2.team_id != t1.team_id
    group by t1.team_id
),

-- Get Engineering team ID for Squad teams without parent
engineering_team as (
    select team_id, team_name
    from source
    where team_name = 'Engineering'
)

select 
    twcl.team_id,
    twcl.team_name,
    case 
        when twcl.parent_team_id is null and LOWER(twcl.team_name) like '%squad%' then twcl.calculated_level + 1
        else twcl.calculated_level
    end as team_level,
    twcl.team_type,
    case 
        when twcl.parent_team_id is null and LOWER(twcl.team_name) like '%squad%' then eng.team_id
        else twcl.parent_team_id
    end as parent_team_id,
    case 
        when twcl.parent_team_id is null and LOWER(twcl.team_name) like '%squad%' then eng.team_name
        else twcl.parent_team_name
    end as parent_team_name,
    case when twc.child_count = 0 then true else false end as is_last_team
from teams_with_calculated_level twcl
left join teams_with_children twc
    on twcl.team_id = twc.team_id
left join engineering_team eng
    on twcl.parent_team_id is null and LOWER(twcl.team_name) like '%squad%'
where twcl.team_type = 'Team'
order by 
    case 
        when twcl.parent_team_id is null and LOWER(twcl.team_name) like '%squad%' then twcl.calculated_level + 1
        else twcl.calculated_level
    end, 
    twcl.team_name