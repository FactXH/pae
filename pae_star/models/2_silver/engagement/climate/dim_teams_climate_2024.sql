with memberships_scd as (
    select * from {{ ref("dim_memberships_climate_2024") }}
),

teams as (
    select * from {{ ref("dim_teams") }}
),

employees as (
    select * from {{ ref("dim_employees") }}
),

team_counts as (
    select 
        ms.team_id,
        count(distinct ms.employee_id) as employee_count,
        array_join(array_agg(distinct e.full_name), ' | ') as employee_names
    from memberships_scd ms
    inner join employees e on ms.employee_id = cast(e.employee_id as bigint)
    where
        e.onboarding_date <= date '2024-09-10'
        and (offboarding_date is null or offboarding_date > date '2024-09-10')
    group by ms.team_id
),

valid_teams as (
    select 
        t.team_id,
        t.team_name,
        t.team_level,
        t.team_type,
        t.parent_team_id,
        t.parent_team_name,
        t.is_last_team,
        tc.employee_count,
        tc.employee_names
    from teams t
    inner join team_counts tc
        on t.team_id = tc.team_id
    where tc.employee_count > 4
)

select * from valid_teams
