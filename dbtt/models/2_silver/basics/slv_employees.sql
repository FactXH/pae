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

contracts_enriched as (
    select 
        employee_id,
        effective_date,
        effective_to_date,
        role_level_name,
        salary_amount,
        contract_rank,
        is_last_contract
    from
        {{ ref("slv_contracts") }} cont
    left join
        {{ ref("slv_job_catalog") }} job_catalog
    ON job_catalog.job_catalog_level_id = cont.job_catalog_level_id
),

contracts_aggregated as (
    select 
        cont.employee_id,
        string_agg(job_catalog.role_level_name, ' / ') as all_roles,
        string_agg(cast(cont.salary_amount as text), ' - ') as all_salaries,
        count(*) as nr_contracts
    from {{ ref("slv_contracts") }} cont
    left join
        {{ ref("slv_job_catalog") }} job_catalog
    ON job_catalog.job_catalog_level_id = cont.job_catalog_level_id
    group by 1
)


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
    
    -- start_end.start_date,
    -- start_end.end_date,

    athena.manager_id as athena_manager_id,
    manager_employee.email as manager_email,
    airt.airtable_manager_email,

    first_contract.effective_date as first_effective_date,
    first_contract.role_level_name as first_role_level_name,

    last_contract.effective_to_date as last_effective_to,
    last_contract.role_level_name as last_role_level_name,

    agg_contract.all_roles,
    agg_contract.all_salaries,
    agg_contract.nr_contracts

from athena_employees athena
left join airtable_employees airt
    on athena.employee_id = airt.employee_id
-- left join start_end_date start_end
--     on athena.employee_id = start_end.employee_id
left join br_airtable_employees manager_employee
    on athena.manager_id = manager_employee.employee_id
left join contracts_enriched first_contract
    on first_contract.employee_id = athena.employee_id and first_contract.contract_rank = 1
left join contracts_enriched last_contract

    -- TODO: Fix Join
    on last_contract.employee_id = athena.employee_id and last_contract.contract_rank = 5
left join contracts_aggregated agg_contract
    on agg_contract.employee_id = athena.employee_id