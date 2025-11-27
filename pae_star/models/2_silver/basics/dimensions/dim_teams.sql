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

-- Get Engineering team ID for top-level Squad teams
engineering_team as (
    select team_id, team_name
    from source
    where team_name = 'Engineering'
),

-- Create synthetic intermediate Squad teams (Squad/Finance, Squad/Talent, etc.)
intermediate_squad_teams as (
    select 
        10000000 + row_number() over (order by intermediate_name) as team_id,
        intermediate_name as team_name,
        'Team' as team_type,
        1 as calculated_level
    from (
        select distinct
            'Squad/' || substr(team_name, 7, position('/' in substr(team_name, 7)) - 1) as intermediate_name
        from source
        where team_name like 'Squad/%/%'
            and team_type = 'Team'
            and position('/' in substr(team_name, 7)) > 0
    )
),

-- Add Engineering parent to intermediate squads
intermediate_squad_teams_with_parent as (
    select 
        ist.team_id,
        ist.team_name,
        ist.team_type,
        eng.team_id as parent_team_id,
        eng.team_name as parent_team_name,
        ist.calculated_level
    from intermediate_squad_teams ist
    cross join engineering_team eng
),

-- Union all teams with synthetic intermediate teams
all_teams_with_intermediates as (
    select 
        team_id,
        team_name,
        team_type,
        parent_team_id,
        parent_team_name,
        calculated_level
    from teams_with_calculated_level
    
    union all
    
    select 
        team_id,
        team_name,
        team_type,
        parent_team_id,
        parent_team_name,
        calculated_level
    from intermediate_squad_teams_with_parent
),

-- Update parent references for teams that should point to intermediate squads
teams_with_intermediate_parents as (
    select 
        t.team_id,
        t.team_name,
        t.team_type,
        coalesce(ist.team_id, t.parent_team_id) as parent_team_id,
        coalesce(ist.team_name, t.parent_team_name) as parent_team_name,
        case 
            when ist.team_id is not null then t.calculated_level + 2
            else t.calculated_level
        end as calculated_level
    from all_teams_with_intermediates t
    left join intermediate_squad_teams_with_parent ist
        on t.team_name like ist.team_name || '/%'
        and t.team_name like 'Squad/%/%'
),

-- Recalculate children count including synthetic teams
teams_with_children_updated as (
    select
        t1.team_id,
        count(t2.team_id) as child_count
    from teams_with_intermediate_parents t1
    left join teams_with_intermediate_parents t2 
        on t2.parent_team_id = t1.team_id
    group by t1.team_id
),

-- Identify which Squad teams should get Engineering as parent
-- Only top-level Squad teams (Squad/X without further slashes) or teams without a parent
squads_needing_engineering as (
    select 
        twip.team_id,
        twip.team_name,
        twip.parent_team_id,
        -- Only assign Engineering if:
        -- 1. It's a synthetic intermediate Squad team (team_id >= 10000000)
        -- 2. It's a Squad team without a parent and no intermediate squad was found
        case 
            when twip.team_id >= 10000000 then true
            when twip.parent_team_id is null 
                and twip.team_name like 'Squad/%'
                and not exists (
                    select 1 
                    from teams_with_intermediate_parents potential_parent
                    where potential_parent.team_name like 'Squad/%'
                        and twip.team_name like potential_parent.team_name || '/%'
                        and potential_parent.team_id != twip.team_id
                ) then true
            else false
        end as should_use_engineering
    from teams_with_intermediate_parents twip
)

select 
    twip.team_id,
    twip.team_name,
    case 
        when sne.should_use_engineering then twip.calculated_level + 1
        else twip.calculated_level
    end as team_level,
    twip.team_type,
    case 
        when sne.should_use_engineering then eng.team_id
        else twip.parent_team_id
    end as parent_team_id,
    case 
        when sne.should_use_engineering then eng.team_name
        else twip.parent_team_name
    end as parent_team_name,
    case when twcu.child_count = 0 or twcu.child_count is null then true else false end as is_last_team
from teams_with_intermediate_parents twip
left join teams_with_children_updated twcu
    on twip.team_id = twcu.team_id
left join squads_needing_engineering sne
    on twip.team_id = sne.team_id
left join engineering_team eng
    on sne.should_use_engineering = true
where twip.team_type = 'Team'
order by 
    case 
        when sne.should_use_engineering then twip.calculated_level + 1
        else twip.calculated_level
    end, 
    twip.team_name