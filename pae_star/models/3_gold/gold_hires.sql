-- GOLD: gold_hires
-- Dashboard for hires, job positions, and related job roles

with aux_matches as (
    select * from {{ source('aux_tables', 'aux_job_position_matching') }}
),

fact_employees as (
    select 
        employee_id,
        full_name as employee_name,
        onboarding_date,
        offboarding_date,
        first_salary_amount
    from {{ ref('fact_employees') }}
),

job_posting_info as (
    select 
        job_posting_id,
        job_posting_title,
        job_catalog_level_id
    from {{ ref('dim_job_postings') }}
),

job_role_info as (
    select 
        job_catalog_level_id,
        role_level_name
    from {{ ref('dim_job_catalog') }}
),



all_job_roles as (
    select 
        employee_id,
        array_join(array_agg(distinct job_catalog.role_level_name order by job_catalog.role_level_name), ' / ') as all_job_roles
    from {{ ref('dim_contracts') }} cont
    left join {{ ref('dim_job_catalog') }} job_catalog
        on cont.job_catalog_level_id = job_catalog.job_catalog_level_id
    group by employee_id
)

select
    aux.employee_id,
    emp.employee_name,
    emp.first_salary_amount,
    aux.position_id as job_posting_id,
    jp.job_posting_title,
    emp.first_role_level_name as first_job_role,
    ajr.all_job_roles,
    aux.application_id,
    aux.application_updated_at,
    aux.hire_match_score,
    aux.position_match_score
from aux_matches aux
left join fact_employees emp
    on aux.employee_id = emp.employee_id
left join job_posting_info jp
    on aux.position_id = jp.job_posting_id
left join job_role_info jr
    on emp.first_job_catalog_level_id = jr.job_catalog_level_id
left join all_job_roles ajr
    on aux.employee_id = ajr.employee_id
