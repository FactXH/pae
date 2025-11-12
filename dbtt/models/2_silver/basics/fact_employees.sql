with dim_employees as (
    select
        employee_id,
        xapt_id,
        access_id,
        email,
        first_name,
        last_name,
        onboarding_date,
        offboarding_date,
        tenure_start_date,
        match_status,
        athena_manager_id,
        manager_email,
        airtable_manager_email
    from {{ ref("dim_employees") }}
),

contracts_enriched as (
    select 
        cont.employee_id,
        cont.effective_date,
        cont.effective_to_date,
        job_catalog.role_level_name,
        cont.salary_amount,
        cont.contract_rank,
        cont.is_last_contract
    from {{ ref("dim_contracts") }} cont
    left join {{ ref("dim_job_catalog") }} job_catalog
        on job_catalog.job_catalog_level_id = cont.job_catalog_level_id
),

contracts_aggregated as (
    select 
        cont.employee_id,
        string_agg(job_catalog.role_level_name, ' / ' order by cont.effective_date) as all_roles,
        string_agg(cast(cont.salary_amount as text), ' - ' order by cont.effective_date asc) as all_salaries,
        count(*) as nr_contracts
    from {{ ref("dim_contracts") }} cont
    left join {{ ref("dim_job_catalog") }} job_catalog
        on job_catalog.job_catalog_level_id = cont.job_catalog_level_id
    group by 1
),

first_contracts as (
    select distinct on (employee_id)
        employee_id,
        effective_date as first_effective_date,
        role_level_name as first_role_level_name
    from contracts_enriched
    where contract_rank = 1
    order by employee_id, effective_date asc
),

last_or_current_contracts as (
    select distinct on (employee_id)
        employee_id,
        effective_to_date as last_effective_to,
        role_level_name as last_role_level_name,
        salary_amount as current_salary_amount
    from contracts_enriched
    where is_last_contract = true
    order by employee_id, effective_date desc
),

base_employees as (
    select 
        emp.*,
        
        -- First contract information
        first_contract.first_effective_date,
        first_contract.first_role_level_name,
        
        -- Last contract information
        last_contract.last_effective_to,
        last_contract.last_role_level_name,
        last_contract.current_salary_amount,
        
        -- Aggregated contract information
        agg_contract.all_roles,
        agg_contract.all_salaries,
        agg_contract.nr_contracts
        
    from dim_employees emp
    left join first_contracts first_contract
        on first_contract.employee_id = emp.employee_id
    left join last_or_current_contracts last_contract
        on last_contract.employee_id = emp.employee_id
    left join contracts_aggregated agg_contract
        on agg_contract.employee_id = emp.employee_id
)

select
    *,
    
    -- Ranking metrics for currently active employees only
    case 
        when offboarding_date is null then 
            dense_rank() over (
                order by coalesce(onboarding_date, tenure_start_date, first_effective_date) asc
            )
        else null
    end as antiquity_rank,
    
    case 
        when offboarding_date is null then 
            case 
                when current_salary_amount is null then 9999
                else dense_rank() over (
                    order by current_salary_amount desc
                )
            end
        else null
    end as salary_rank

from base_employees