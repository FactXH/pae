-- TODO: Make sure dates are aligned and define priority and tests of alignment across sources

with athena_employees as (
    select
        cast(emp.employee_id as varchar) as employee_id,
        emp.access_id,
        cast(emp.manager_id as varchar) as manager_id,
        emp.tenure_start_date,
        emp.terminated_on
    from {{ ref("base_factorial_employees") }} emp
),

airtable_employees as (
    select
        at_emp.employee_id,
        at_emp.first_name,
        at_emp.last_name,
        CONCAT(at_emp.first_name, ' ', at_emp.last_name) as full_name,
        at_emp.email,
        at_emp.main_team,
        at_emp.onboarding_date,
        at_emp.offboarding_date,
        at_emp.airtable_manager_email
    from {{ ref("base_airtable_employees") }} at_emp
),

base_employees as (
    select 
        coalesce(athena.employee_id, airt.employee_id) as employee_id,
        athena.access_id,
        airt.email,
        airt.first_name,
        airt.last_name,
        airt.full_name,
        airt.onboarding_date,
        airt.offboarding_date,
        athena.tenure_start_date,

        case 
            when airt.offboarding_date is null then true
            when airt.offboarding_date >= current_date then true
            else false
        end as is_active,

        case 
            when athena.employee_id is not null and airt.employee_id is not null then 'Matched'
            when athena.employee_id is not null and airt.employee_id is null then 'Only in Factorial'
            when athena.employee_id is null and airt.employee_id is not null then 'Only in Airtable'
            else 'Unknown'
        end as match_status,

        athena.manager_id as athena_manager_id,
        manager_employee.full_name as athena_manager_full_name,
        manager_employee.email as athena_manager_email,
        airt.airtable_manager_email,
        airt.main_team as airtable_main_team

    from athena_employees athena
    full outer join airtable_employees airt
        on athena.employee_id = airt.employee_id
    left join airtable_employees manager_employee
        on athena.manager_id = manager_employee.employee_id
)

select
    row_number() over (order by onboarding_date asc, employee_id asc) as xapt_id,
    *
from base_employees