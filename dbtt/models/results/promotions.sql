with employee_teams as (
    select
        team.name as team,
        team.team_level,
        team.team_type,
        emp.employee_id,
        emp.onboarding_date,
        emp.offboarding_date
    from 
        {{ ref("br_airtable_employees") }} emp
    left join {{ ref("br_athena_memberships") }} memb
        on emp.employee_id = memb.employee_id
    left join {{ ref("br_athena_teams") }} team
        on memb.team_id = team.team_id
    where emp.offboarding_date > '2025-01-01' or emp.offboarding_date is null
),

contracts_2025 as (
    select
        *
    from 
        {{ ref("dim_contracts") }}
    where 
        (effective_date <= '2025-10-15' and (effective_to_date is null or effective_to_date >= '2025-01-01'))
),

salary_raises as (
    select
        employee_id,
        count(DISTINCT salary_amount) - 1 as salary_promotions
    from 
        contracts_2025
    group by
        employee_id
    HAVING count(DISTINCT salary_amount) > 1
),

role_changes as (
    select
        employee_id,
        count(DISTINCT job_catalog_level_id) - 1 as role_changes
    from 
        contracts_2025
    where effective_date != '2024-07-01'
    group by
        employee_id
    HAVING count(DISTINCT job_catalog_level_id) > 1
),


select 
    team,
    team_level,
    team_type,
    count(DISTINCT employee_teams.employee_id) as total_employees,
    count(DISTINCT salary_raises.employee_id) as employees_with_salary_promotion, 
    sum(salary_promotions) as total_salary_promotions,
    round((count(DISTINCT salary_raises.employee_id) * 100.0 / NULLIF(count(DISTINCT employee_teams.employee_id), 0)), 2) as percentage_of_employees_with_salary_promotion
from
    employee_teams
left join salary_raises
    on employee_teams.employee_id = salary_raises.employee_id
group by
    team, team_level, team_type


;

select
    employee_id,
    string_agg(regexp_replace(cast(salary_amount as text), '\.?0+$', ''), ' - ') as all_salaries
from dim_contracts
where effective_date >= '2025-01-01'
group by employee_id

;
with salary_role_changes_2025 as (
    select 
        employee_id,
        count(distinct salary_amount) as nr_salary_changes,
        count(distinct job_catalog_level_id) as nr_role_changes,
        least(count(distinct salary_amount), count(distinct job_catalog_level_id)) as min_changes
    from dim_contracts
    where effective_date >= '2025-01-01'
    and start_date <= '2025-01-01'
    and effective_date != '2024-07-01'
    group by employee_id
)

select sum(min_changes) from salary_role_changes_2025;
;




