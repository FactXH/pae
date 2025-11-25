-- Employee Distribution by Team: Shows employee count and details per team
-- Use this query to get employee assignments with lowest level team granularity
-- Markets are shown as subdivisions under teams

with employee_team_assignments as (
    select 
        emp.employee_id,
        emp.full_name,
        emp.email,
        emp.lowest_level_team_name,
        emp.lowest_level_team_level,
        emp.lowest_level_parent_team_name,
        emp.last_role_level_name,
        emp.onboarding_date,
        emp.offboarding_date,
        -- Get market info from current market memberships
        mm.market_name,
        case 
            when emp.offboarding_date is null then 'Active'
            else 'Inactive'
        end as status,
        date_diff('day', emp.onboarding_date, coalesce(emp.offboarding_date, current_date)) as tenure_days
    from {{ ref('fact_employees') }} emp
    left join {{ ref('dim_market_memberships') }} mm
        on cast(emp.employee_id as bigint) = mm.employee_id
    where emp.lowest_level_team_name is not null
),

-- Team level aggregation (without market breakdown)
team_summary as (
    select 
        lowest_level_team_name as team_name,
        lowest_level_team_level as team_level,
        lowest_level_parent_team_name as parent_team_name,
        cast(null as varchar) as market_name,
        false as is_market_row,
        count(*) as total_employees,
        count(case when status = 'Active' then 1 end) as active_employees,
        count(case when status = 'Inactive' then 1 end) as inactive_employees
    from employee_team_assignments
    group by 
        lowest_level_team_name,
        lowest_level_team_level,
        lowest_level_parent_team_name
),

-- Market level aggregation (markets under teams)
market_summary as (
    select 
        lowest_level_team_name as team_name,
        lowest_level_team_level as team_level,
        lowest_level_parent_team_name as parent_team_name,
        market_name,
        true as is_market_row,
        count(*) as total_employees,
        count(case when status = 'Active' then 1 end) as active_employees,
        count(case when status = 'Inactive' then 1 end) as inactive_employees
    from employee_team_assignments
    where market_name is not null
    group by 
        lowest_level_team_name,
        lowest_level_team_level,
        lowest_level_parent_team_name,
        market_name
),

combined as (
    select * from team_summary
    union all
    select * from market_summary
)

select 
    team_name,
    team_level,
    parent_team_name,
    market_name,
    is_market_row,
    total_employees,
    active_employees,
    inactive_employees
from combined
order by team_level, team_name, is_market_row, market_name
