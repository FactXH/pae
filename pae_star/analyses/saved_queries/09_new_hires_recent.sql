-- New Hires Recent: Recently onboarded employees (last 6 months)
-- Track new talent and onboarding patterns

select 
    emp.employee_id,
    emp.full_name,
    emp.email,
    emp.onboarding_date,
    date_diff('day', emp.onboarding_date, current_date) as days_since_onboarding,
    emp.lowest_level_team_name as team,
    emp.lowest_level_parent_team_name as parent_team,
    emp.last_role_level_name as role,
    emp.current_salary_amount,
    emp.first_role_level_name as starting_role,
    case 
        when emp.offboarding_date is null then 'Active'
        else 'Already Left'
    end as status
from {{ ref('fact_employees') }} emp
where emp.onboarding_date >= date_add('month', -6, current_date)
order by emp.onboarding_date desc
