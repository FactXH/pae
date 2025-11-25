-- Active Employees by Team: Current active headcount with employee details
-- Shows all active employees with their team assignments and key info

select 
    emp.employee_id,
    emp.full_name,
    emp.email,
    emp.lowest_level_team_name as team,
    emp.lowest_level_team_level as team_level,
    emp.lowest_level_parent_team_name as parent_team,
    emp.last_role_level_name as current_role,
    emp.current_salary_amount,
    emp.onboarding_date,
    date_diff('day', emp.onboarding_date, current_date) as tenure_days,
    round(date_diff('day', emp.onboarding_date, current_date) / 365.25, 1) as tenure_years,
    emp.antiquity_rank_unique
from {{ ref('fact_employees') }} emp
where emp.offboarding_date is null
order by emp.lowest_level_team_name, emp.onboarding_date
