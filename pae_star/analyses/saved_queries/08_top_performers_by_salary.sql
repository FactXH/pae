-- Top Performers by Salary: Highest paid active employees
-- Identify top earners across the organization

select 
    emp.salary_rank_unique as rank,
    emp.full_name,
    emp.email,
    emp.lowest_level_team_name as team,
    emp.last_role_level_name as role,
    emp.current_salary_amount as salary,
    round(date_diff('day', emp.onboarding_date, current_date) / 365.25, 1) as tenure_years,
    emp.salary_increase_pct_2025 as increase_2025_pct,
    emp.all_current_teams
from {{ ref('fact_employees') }} emp
where emp.offboarding_date is null
    and emp.current_salary_amount is not null
order by emp.salary_rank_unique
limit 50
