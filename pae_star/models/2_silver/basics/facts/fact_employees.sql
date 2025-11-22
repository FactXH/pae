with dim_employees as (
    select
        employee_id,
        xapt_id,
        access_id,
        email,
        first_name,
        last_name,
        full_name,
        onboarding_date,
        offboarding_date,
        tenure_start_date,
        match_status,
        athena_manager_id,
        athena_manager_email,
        airtable_manager_email,
        airtable_main_team,
        is_active
    from {{ ref("dim_employees") }}
),

contracts_enriched as (
    select 
        cont.employee_id,
        cont.effective_date,
        cont.effective_to_date,
        job_catalog.job_catalog_level_id,
        job_catalog.role_level_name,
        cont.salary_amount,
        cont.contract_rank,
        cont.is_current_contract
    from {{ ref("dim_contracts") }} cont
    left join {{ ref("dim_job_catalog") }} job_catalog
        on job_catalog.job_catalog_level_id = cont.job_catalog_level_id
),

contracts_aggregated as (
    select 
        cont.employee_id,
        array_join(array_agg(job_catalog.role_level_name order by cont.effective_date), ' / ') as all_roles,
        array_join(array_agg(cast(cont.salary_amount as varchar) order by cont.effective_date asc), ' - ') as all_salaries,
        count(*) as nr_contracts
    from {{ ref("dim_contracts") }} cont
    left join {{ ref("dim_job_catalog") }} job_catalog
        on job_catalog.job_catalog_level_id = cont.job_catalog_level_id
    group by 1
),

first_contracts as (
    select 
        employee_id,
        effective_date as first_effective_date,
        role_level_name as first_role_level_name,
        job_catalog_level_id as first_job_catalog_level_id
    from (
        select *,
            row_number() over (partition by employee_id order by effective_date asc) as rn
        from contracts_enriched
        where contract_rank = 1
    )
    where rn = 1
),

last_or_current_contracts as (
    select 
        employee_id,
        effective_to_date as last_effective_to,
        role_level_name as last_role_level_name,
        job_catalog_level_id as last_job_catalog_level_id,
        salary_amount as current_salary_amount
    from (
        select *,
            row_number() over (partition by employee_id order by effective_date desc) as rn
        from contracts_enriched
        where is_current_contract = true
    )
    where rn = 1
),

current_teams_aggregated as (
    select 
        mem.employee_id,
        array_join(array_agg(teams.team_name), ', ') as all_current_teams
    from {{ ref("dim_memberships_scd") }} mem
    left join {{ ref("dim_teams") }} teams
        on mem.team_id = teams.team_id
    where mem.is_current = true -- !!!!
    group by mem.employee_id
),

salary_changes_2025 as (
    select 
        cont.employee_id,
        count(distinct cont.salary_amount) as distinct_salaries_2025,
        case 
            when min(cont.salary_amount) > 0 then
                round(((max(cont.salary_amount) - min(cont.salary_amount)) / min(cont.salary_amount)) * 100, 2)
            else null
        end as salary_increase_pct_2025
    from {{ ref("dim_contracts") }} cont
    where 
        -- Contract was active at least one day in 2025
        (cont.effective_date <= date '2025-12-31' 
         and (cont.effective_to_date >= date '2025-01-01' or cont.effective_to_date is null))
    group by cont.employee_id
),

roles_2025 as (
    select 
        cont.employee_id,
        array_join(array_agg(distinct job_catalog.role_level_name order by job_catalog.role_level_name), ' / ') as roles_2025
    from {{ ref("dim_contracts") }} cont
    left join {{ ref("dim_job_catalog") }} job_catalog
        on job_catalog.job_catalog_level_id = cont.job_catalog_level_id
    where 
        -- Contract was active at least one day in 2025
        (cont.effective_date <= date '2025-12-31' 
         and (cont.effective_to_date >= date '2025-01-01' or cont.effective_to_date is null))
        and job_catalog.role_level_name is not null
    group by cont.employee_id
),

base_employees as (
    select 
        emp.*,
        
        -- First contract information
        first_contract.first_effective_date,
        first_contract.first_role_level_name,
        first_contract.first_job_catalog_level_id,
        
        -- Last contract information
        last_contract.last_effective_to,
        last_contract.last_role_level_name,
        last_contract.last_job_catalog_level_id,
        last_contract.current_salary_amount,
        
        -- Aggregated contract information
        agg_contract.all_roles,
        agg_contract.all_salaries,
        agg_contract.nr_contracts,
        
        -- Current teams information
        teams.all_current_teams,
        
        -- 2025 salary changes
        sal_2025.distinct_salaries_2025,
        sal_2025.salary_increase_pct_2025,
        
        -- 2025 roles
        roles_2025.roles_2025
        
    from dim_employees emp
    left join first_contracts first_contract
        on cast(first_contract.employee_id as varchar) = emp.employee_id
    left join last_or_current_contracts last_contract
        on cast(last_contract.employee_id as varchar) = emp.employee_id
    left join contracts_aggregated agg_contract
        on cast(agg_contract.employee_id as varchar) = emp.employee_id
    left join current_teams_aggregated teams
        on cast(teams.employee_id as varchar) = emp.employee_id
    left join salary_changes_2025 sal_2025
        on cast(sal_2025.employee_id as varchar) = emp.employee_id
    left join roles_2025
        on cast(roles_2025.employee_id as varchar) = emp.employee_id
)

select
    *,
    
    -- Ranking metrics for currently active employees only
    case 
        when offboarding_date is null then 
            rank() over (
                partition by case when offboarding_date is null then 1 else 0 end
                order by coalesce(onboarding_date, tenure_start_date, first_effective_date) asc
            )
        else null
    end as antiquity_rank,
    
    case 
        when offboarding_date is null then 
            row_number() over (
                partition by case when offboarding_date is null then 1 else 0 end
                order by coalesce(onboarding_date, tenure_start_date, first_effective_date) asc
            )
        else null
    end as antiquity_rank_unique,
    
    -- Ranking metrics for all employees (active and inactive)
    rank() over (
        order by coalesce(onboarding_date, tenure_start_date, first_effective_date) asc
    ) as antiquity_rank_all_time,
    
    -- Unique ranking with no ties (using row_number)
    row_number() over (
        order by coalesce(onboarding_date, tenure_start_date, first_effective_date) asc
    ) as antiquity_rank_all_time_unique,
    
    case 
        when offboarding_date is null then 
            case 
                when current_salary_amount is null then 9999
                else dense_rank() over (
                    partition by case when offboarding_date is null then 1 else 0 end
                    order by current_salary_amount desc
                )
            end
        else null
    end as salary_rank,
    
    case 
        when offboarding_date is null then 
            case 
                when current_salary_amount is null then 9999
                else row_number() over (
                    partition by case when offboarding_date is null then 1 else 0 end
                    order by current_salary_amount desc
                )
            end
        else null
    end as salary_rank_unique

from base_employees
