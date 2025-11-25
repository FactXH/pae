-- Employee Career Progression: Track role and salary changes over time
-- Shows employee history with contracts, roles, and teams

select 
    emp.employee_id,
    emp.full_name,
    emp.email,
    emp.onboarding_date,
    emp.offboarding_date,
    emp.first_role_level_name as starting_role,
    emp.last_role_level_name as current_role,
    emp.all_roles as role_history,
    emp.nr_contracts,
    emp.all_current_teams,
    emp.lowest_level_team_name as primary_team,
    emp.salary_increase_pct_2025,
    emp.antiquity_rank_unique as seniority_rank,
    emp.salary_rank_unique as salary_rank,
    case 
        when emp.offboarding_date is null then 'Active'
        else 'Inactive'
    end as status
from {{ ref('fact_employees') }} emp
order by emp.onboarding_date
