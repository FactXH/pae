-- Employee Details by Team: Full employee list with team assignments
-- Detailed view of all employees grouped by their lowest level team

select 
    emp.employee_id,
    emp.full_name,
    emp.email,
    emp.lowest_level_team_name as team_name,
    emp.lowest_level_team_level as team_level,
    emp.lowest_level_parent_team_name as parent_team_name,
    mm.market_name,
    emp.last_role_level_name as role_level,
    emp.onboarding_date,
    emp.offboarding_date,
    case 
        when emp.offboarding_date is null then 'Active'
        else 'Inactive'
    end as status,
    date_diff('day', emp.onboarding_date, coalesce(emp.offboarding_date, current_date)) as tenure_days,
    round(date_diff('day', emp.onboarding_date, coalesce(emp.offboarding_date, current_date)) / 365.25, 1) as tenure_years
from {{ ref('fact_employees') }} emp
left join {{ ref('dim_market_memberships') }} mm
    on cast(emp.employee_id as bigint) = mm.employee_id
where emp.lowest_level_team_name is not null
order by emp.lowest_level_team_name, emp.offboarding_date nulls first, emp.onboarding_date
