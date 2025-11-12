-- TODO: Make sure dates are aligned and define priority and tests of alignment across sources

with athena_employees as (
    select
        emp.employee_id,
        emp.access_id,
        emp.manager_id,
        emp.tenure_start_date,
        emp.terminated_on
    from {{ ref("br_athena_employees") }} emp
),

airtable_employees as (
    select
        at_emp.employee_id,
        at_emp.first_name,
        at_emp.last_name,
        at_emp.email,
        at_emp.onboarding_date,
        at_emp.offboarding_date,
        at_emp.airtable_manager_email
    from {{ ref("br_airtable_employees") }} at_emp
),

base_employees as (
    select 
        athena.employee_id,
        athena.access_id,
        airt.email,
        airt.first_name,
        airt.last_name,
        airt.onboarding_date,
        airt.offboarding_date,
        athena.tenure_start_date,

        case 
            when airt.employee_id is not null then 'Matched'
            else 'Not Matched'
        end as match_status,    

        athena.manager_id as athena_manager_id,
        manager_employee.email as manager_email,
        airt.airtable_manager_email

    from athena_employees athena
    left join airtable_employees airt
        on athena.employee_id = airt.employee_id
    left join {{ ref("br_airtable_employees") }} manager_employee
        on athena.manager_id = manager_employee.employee_id
)

select
    row_number() over (order by onboarding_date asc, employee_id asc) as xapt_id,
    *
from base_employees