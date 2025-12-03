select * from {{ ref('base_factorial_teams')}};


;
SELECT * 
FROM hive.information_schema.tables
WHERE table_type = 'BASE TABLE';


SELECT column_name
FROM factorial_datalake_production.information_schema.columns
WHERE table_name = 'ats_applications'
and table_schema = 'data_lake_bronze';


SELECT column_name
FROM factorial_datalake_production.information_schema.columns
WHERE table_name = 'ats_candidate_sources'
and table_schema = 'data_lake_bronze';


SELECT column_name
FROM factorial_datalake_production.information_schema.columns
WHERE table_name = 'ats_job_postings'
and table_schema = 'data_lake_bronze';


select match_status, count(*) from {{ ref('dim_employees') }}
group by match_status;




SELECT column_name
FROM factorial_datalake_production.information_schema.columns
WHERE table_name = 'airbyte_airtable_recruitment_2022_tbl0mlnobj9gg8c0v'
and table_schema = 'data_lake_bronze';


airbyte_airtable_recruitment_2024_tblld6hnk2b5lwzcm

airbyte_airtable_recruitment_2023_tbldkfmlloxr6rj8z

airbyte_airtable_recruitment_2022_tbl0mlnobj9gg8c0v
;



create table data_lake_dev_xavi_silver.test_xavier as
select 1 as hola ,2 as adios;

-- Performance review analysis with historical patterns
with performance_reviews_ranked as (
    select 
        performance_review_process_id,
        performance_review_name,
        performance_review_start_date,
        employee_id,
        final_employee_score,
        row_number() over (partition by employee_id order by performance_review_start_date asc) as review_number,
        row_number() over (partition by employee_id order by performance_review_start_date desc) as reverse_review_number
    from data_lake_dev_xavi_silver.dim_performance_reviews
    where final_employee_score is not null
),

employees as (
    select * from data_lake_dev_xavi_silver.fact_employees
)

select 
    prr.performance_review_process_id,
    prr.performance_review_name,
    prr.performance_review_start_date,
    prr.employee_id,
    fe.full_name,
    prr.final_employee_score,
    prr.review_number,
    
    -- First review patterns
    case when prr.review_number = 1 and prr.final_employee_score <= 2 then true else false end as first_review_low,
    case when prr.review_number = 1 and prr.final_employee_score >= 4 then true else false end as first_review_high,
    
    -- Last 2 reviews patterns
    max(case when prr.reverse_review_number <= 2 and prr.final_employee_score <= 2 then 1 else 0 end) 
        over (partition by prr.employee_id) = 
        count(case when prr.reverse_review_number <= 2 then 1 end) 
        over (partition by prr.employee_id) as last_2_all_low,
    
    max(case when prr.reverse_review_number <= 2 and prr.final_employee_score >= 4 then 1 else 0 end) 
        over (partition by prr.employee_id) = 
        count(case when prr.reverse_review_number <= 2 then 1 end) 
        over (partition by prr.employee_id) as last_2_all_high,
    
    -- Last 3 reviews patterns  
    max(case when prr.reverse_review_number <= 3 and prr.final_employee_score <= 2 then 1 else 0 end) 
        over (partition by prr.employee_id) = 
        count(case when prr.reverse_review_number <= 3 then 1 end) 
        over (partition by prr.employee_id) as last_3_all_low,
    
    max(case when prr.reverse_review_number <= 3 and prr.final_employee_score >= 4 then 1 else 0 end) 
        over (partition by prr.employee_id) = 
        count(case when prr.reverse_review_number <= 3 then 1 end) 
        over (partition by prr.employee_id) as last_3_all_high
wait
from performance_reviews_ranked prr
left join employees fe
    on prr.employee_id = fe.employee_id
order by prr.employee_id, prr.performance_review_start_date;


select * from data_lake_dev_xavi_silver.dim_employees where email like 'xavier%';



select * from data_lake_dev_xavi_silver.dim_employees where lower(full_name) like 'xavier h%';



;
select * from airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7
;

select *
from data_lake_dev_xavi_silver.dim_memberships_scd
left join data_lake_dev_xavi_silver.base_factorial_teams teams 
    on dim_memberships_scd.team_id = teams.team_id
where employee_id = 2306420;
;

select * from data_lake_dev_xavi_silver.fact_employees
where employee_id = '2306420';



select full_name, antiquity_rank, antiquity_rank_unique, antiquity_rank_all_time, antiquity_rank_all_time_unique, coalesce(onboarding_date, tenure_start_date, first_effective_date) 
from data_lake_dev_xavi_silver.fact_employees
order by 3 asc;



select salary_rank, array_join(array_agg(first_name), '-') as names, count(*) as cnt
from data_lake_dev_xavi_silver.fact_employees 
group by 1
order by 1 asc;



select role_last_operation,
    level_last_operation,
    count(*)
from data_lake_dev_xavi_silver.fact_employees emp
where 
group by 1,
    2;



select role_name, level_name, count(*), array_join(array_agg(full_name), ',') as employee_ids
from data_lake_dev_xavi_silver.fact_employees emp
left join data_lake_dev_xavi_silver.dim_job_catalog job_cat
    on emp.last_job_catalog_level_id = job_cat.job_catalog_level_id
where emp.is_active = true
group by 1, 2
order by 3 desc;







from data_lake_dev_xavi_silver.dim_job_catalog job_cat
left join data_lake_dev_xavi_silver.dim_contracts cont
    on job_cat.job_catalog_level_id = cont.job_catalog_level_id
    where cont.is_current_contract = true
group by 1,
    2
;


select 
    team_id,
    team_name,
    parent_team_name,
    is_last_team
from data_lake_dev_xavi_silver.dim_teams;



with last_teams as (
    select 
        team_id,
        team_name,
        parent_team_name,
        is_last_team
    from data_lake_dev_xavi_silver.dim_teams
    where team_type = 'Team'
),

active_employees_with_teams as (
    select 
        emp.employee_id,
        emp.full_name,
        lt.team_name,
        lt.parent_team_name
    from data_lake_dev_xavi_silver.dim_employees emp
    left join data_lake_dev_xavi_silver.dim_memberships_scd mem
        on emp.employee_id = cast(mem.employee_id as varchar)
        and mem.is_current = true
    left join last_teams lt
        on mem.team_id = lt.team_id
    where emp.is_active = true
    and lt.team_id is not null
)

select 
    coalesce(team_name, 'No Team Assigned') as team_name,
    coalesce(parent_team_name, 'No Parent Team Assigned') as parent_team_name,
    count(*) as employee_count, 
    array_join(array_agg(full_name), ', ') as employee_names
from active_employees_with_teams
group by 1, 2
order by 3 desc;


select * from data_lake_dev_xavi_silver.fact_employees where LOWER(full_name) like '%edaille%';

-- Check column types for hiring tables
SELECT 
    table_name,
    column_name,
    data_type,
    ordinal_position
FROM factorial_datalake_production.information_schema.columns
WHERE table_schema = 'data_lake_bronze'
    AND table_name IN (
        'airbyte_airtable_recruitment_2022_tbl0mlnobj9gg8c0v',
        'airbyte_airtable_recruitment_2023_tbldkfmlloxr6rj8z',
        'airbyte_airtable_recruitment_2024_tblld6hnk2b5lwzcm',
        'airbyte_airtable_recruitment_2025_tblprsagyxeegmnpl'
    )
and data_type like '%rray%'
ORDER BY table_name, ordinal_position;





select * from airbyte_airtable_recruitment_2025_tblprsagyxeegmnpl;



select file_hiring_year, talent_specialist, count(*) from data_lake_dev_xavi_silver.dim_job_positions
group by file_hiring_year, talent_specialist
order by file_hiring_year desc, talent_specialist;



select position_id, file_hiring_year, talent_specialist, position_name, seniority, team, specific_team, market, manager from data_lake_dev_xavi_silver.dim_job_positions
order by file_hiring_year desc, talent_specialist;


select * from data_lake_dev_xavi_silver.dim_job_postings limit 10

;
select * from data_lake_dev_xavi_silver.dim_applications
where all_hiring_stages like '%hire%'
    and  employee_id = 2306420;
    ;


select * from data_lake_dev_xavi_silver.dim_performance_reviews
where employee_id = '2306420';


select * from data_lake_dev_xavi_silver.fact_employees where full_name like 'Flor%';



select * from ats_rejection_reasons limit 1;



with distinct performance_review_processes as (
    select distinct performance_review_process_id, performance_review_name, performance_review_start_date, min(final_employee_score))
    from data_lake_dev_xavi_silver.dim_performance_reviews
    group by 1,2,3,4
),

employees as (
    select * from data_lake_dev_xavi_silver.fact_employees
)

select 
    dpr.performance_review_process_id,
    dpr.performance_review_name,
    dpr.performance_review_start_date,
    dpr.employee_id,
    fe.full_name,
    dpr.final_employee_score
from distinct_performance_review_processes dpr






;


select email from data_lake_bronze.airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7
;



select distinct performance_review_name, employee_id from data_lake_dev_xavi_silver.dim_performance_reviews
;

with 
pr_q4y24 as (
    select employee_id, max(final_employee_score) as score from data_lake_dev_xavi_silver.dim_performance_reviews
    where performance_review_name like '%Q4Y24%'
    GROUP BY employee_id
),

pf_q1y25 as (
    select employee_id, max(final_employee_score) as score from data_lake_dev_xavi_silver.dim_performance_reviews
    where performance_review_name like '%Q1Y25%'
    GROUP BY employee_id
),
pf_q2y25 as (
    select employee_id, max(final_employee_score) as score from data_lake_dev_xavi_silver.dim_performance_reviews
    where performance_review_name like '%Q2Y25%'
    GROUP BY employee_id
),
pf_q3y25 as (
    select employee_id, max(final_employee_score) as score from data_lake_dev_xavi_silver.dim_performance_reviews
    where performance_review_name like '%Q3Y25%'
    GROUP BY employee_id
),

dim_memberships_scd as (
    select * from data_lake_dev_xavi_silver.dim_memberships_scd
    where is_current = true
),

dim_teams as (
    select * from data_lake_dev_xavi_silver.dim_teams
    where team_type = 'Team' 
),

emp_performance as (
    select 
        emp.full_name,
        emp.airtable_main_team,
        emp.all_current_teams,
        mgr_emp.full_name as manager_full_name,
        distinct_salaries_2025,
        salary_increase_pct_2025,
        roles_2025,
        case 
             when p25q3.score is null then 'No Q3Y25 Score'   
             when p25q3.score <= 2 and p25q2.score <= 2 then 'Underperforming'
             when p25q3.score >= 4 and p25q2.score >= 4 then 'Overperforming'
             else 'Meeting Expectations' end as recent_performance_trend,
        p25q3.employee_id,
        p25q3.score as q3y25_score,
        p25q2.score as q2y25_score,
        p25q1.score as q1y25_score,
        p24.score as q4y24_score,
        round((coalesce(p25q3.score, 0) + coalesce(p25q2.score, 0) + coalesce(p25q1.score, 0) + coalesce(p24.score, 0)) / 
        nullif((case when p25q3.score is not null then 1 else 0 end + 
                case when p25q2.score is not null then 1 else 0 end + 
                case when p25q1.score is not null then 1 else 0 end + 
                case when p24.score is not null then 1 else 0 end), 0), 1) as sustained_performance_score
    from
        data_lake_dev_xavi_silver.fact_employees emp

    left join data_lake_dev_xavi_silver.base_factorial_employee_managers_scd mgr
        on emp.employee_id = cast(mgr.employee_id as varchar) and mgr.is_current = true
    left JOIN
        data_lake_dev_xavi_silver.dim_employees mgr_emp
        on cast(mgr.manager_id as varchar) = mgr_emp.employee_id

    left join pr_q4y24 p24
        on emp.employee_id = cast(p24.employee_id as varchar)
    left join pf_q1y25 p25q1
        on emp.employee_id = cast(p25q1.employee_id as varchar)
    left join pf_q2y25 p25q2
        on emp.employee_id = cast(p25q2.employee_id as varchar)
    left join pf_q3y25 p25q3
        on emp.employee_id = cast(p25q3.employee_id as varchar)
    where  emp.is_active = true
)

select * from emp_performance
where full_name is not null;




select * from data_lake_dev_xavi_silver.dim_job_postings limit 10;
select * from data_lake_dev_xavi_silver.base_factorial_job_postings limit 10;


select * from data_lake_dev_xavi_silver.dim_job_postings limit 100;



select distinct email from ats_candidates limit 10;
select distinct title from ats_job_postings limit 10;


select * from 

;
select apellido from airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7 limit 1000;



SELECT 
        xapt_position_id,
        position_id,
        hiring_process_role,
        market,
        seniority,
        team,
        specific_team,
        talent_specialist,
        opened_date,
        manager
    FROM data_lake_dev_xavi_silver.dim_job_positions
    WHERE hiring_process_role IS NOT NULL
    and position_id like '2025_771';



select * from data_lake_dev_xavi_silver.dim_job_postings_2 limit 10;


select distinct team, specific_team from data_lake_dev_xavi_silver.dim_job_positions
where position_id like '2025_%'
order by 1,2;


select distinct manager from data_lake_dev_xavi_silver.dim_job_positions
where manager is not null
;


select distinct team from data_lake_dev_xavi_silver.dim_job_positions
where team is not null and position_id like '2025_%' or position_id like '2024_%';


select distinct new_hire_name from data_lake_dev_xavi_silver.dim_job_positions;


select position_id, new_hire_name from data_lake_dev_xavi_silver.dim_job_positions
where closed_date is not null and new_hire_name is null;


select file_hiring_year, count(*) from data_lake_dev_xavi_silver.dim_job_positions
where closed_date is not null and new_hire_name is null
group by file_hiring_year;


select * from data_lake_dev_xavi_silver.dim_applications
where application_id = 4846015;


select team, specific_team, count(*) from data_lake_dev_xavi_silver.dim_job_positions
group by 1, 2;



select distinct main_team from 
airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7




;

SELECT DISTINCT
  CASE
    WHEN cardinality(main_team) > 1 AND (contains(main_team, 'management') OR contains(main_team, 'Management'))
      THEN array_remove(array_remove(main_team, 'management'), 'Management')
    ELSE main_team
  END AS main_team_cleaned
FROM airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7
;



SELECT table_name
FROM factorial_datalake_production.information_schema.tables
where table_schema = 'data_lake_dev_xavi_silver';




select * from data_lake_dev_xavi_silver.dim_teams;

;
WITH RECURSIVE team_hierarchy AS (
  -- Start with root teams (no parent)
  SELECT
    team_id,
    team_name,
    parent_team_id,
    parent_team_name,
    1 AS hierarchy_level
  FROM data_lake_dev_xavi_silver.dim_teams
  WHERE parent_team_id IS NULL OR parent_team_id = '' -- adjust if empty string is used

  UNION ALL

  -- Recursively add children
  SELECT
    t.team_id,
    t.team_name,
    t.parent_team_id,
    t.parent_team_name,
    th.hierarchy_level + 1
  FROM data_lake_dev_xavi_silver.dim_teams t
  JOIN team_hierarchy th ON t.parent_team_id = th.team_id
)
SELECT
  team_id,
  team_name,
  parent_team_id,
  parent_team_name,
  hierarchy_level
FROM team_hierarchy
ORDER BY hierarchy_level, parent_team_name, team_name;;



WITH RECURSIVE team_hierarchy (
    team_id,
    team_name,
    parent_team_id,
    parent_team_name,
    hierarchy_level
) AS (
  -- Root teams (no parent)
  SELECT
    team_id,
    team_name,
    parent_team_id,
    parent_team_name,
    1 AS hierarchy_level
  FROM data_lake_dev_xavi_silver.dim_teams
  WHERE parent_team_id IS NULL OR parent_team_id is null

  UNION ALL

  -- Recursively add children
  SELECT
    t.team_id,
    t.team_name,
    t.parent_team_id,
    t.parent_team_name,
    th.hierarchy_level + 1
  FROM data_lake_dev_xavi_silver.dim_teams t
  JOIN team_hierarchy th ON t.parent_team_id = th.team_id
)
SELECT
  team_id,
  team_name,
  parent_team_id,
  parent_team_name,
  hierarchy_level
FROM team_hierarchy
ORDER BY hierarchy_level, parent_team_name, team_name;


;
select id_empleado from data_lake_bronze.airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7
where email like 'xavier.hita%';



      WITH source_data AS (
        SELECT *, row_number() OVER (PARTITION BY id ORDER BY _event_ts DESC) rn
        FROM "data_lake_bronze"."employees"
        WHERE company_id = 1
      ),
      dedup_employees AS (
        SELECT * FROM source_data WHERE rn = 1 AND (_cdc IS NULL OR _cdc.op != 'D')
      )
      SELECT
        id AS employee_id,
        access_id,
        country,
        nationality,
        gender,
        termination_reason,
        tenure_start_date,
        terminated_on,
        termination_reason_type,
        manager_id
      FROM dedup_employees
      WHERE id = 2306420;



select * from data_lake_bronze.airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7
where id_empleado = '2306420';
;



select * from ats_candidates
where company_id = 1
and id = 7835555
;


select * from data_lake_dev_xavi_silver.fact_employees
where full_name like 'Kevin%';


select * from data_lake_dev_xavi_silver.dim_hires
where candidate_first_name like 'Amel%';
;


select * from 
data_lake_dev_xavi_silver.dim_hires
;



select * from data_lake_dev_xavi_silver.dim_memberships_scd
where employee_id = 2306420
;

select * from data_lake_dev_xavi_silver.dim_memberships_climate_2025
left join data_lake_dev_xavi_silver.dim_teams
    on dim_memberships_climate_2025.team_id = dim_teams.team_id
left join data_lake_dev_xavi_silver.fact_employees 
    on dim_memberships_climate_2025.employee_id = cast(fact_employees.employee_id as bigint)
where fact_employees.full_name like 'Xavier Hita';


select * from data_lake_dev_xavi_gold.gold_climate_2025_answers;


select * from data_lake_dev_xavi_silver.dim_climate_2025_questions;




select * from data_lake_dev_xavi_silver.dim_teams_climate_2025;
select * from data_lake_dev_xavi_silver.dim_teams_climate_2024;

;
select * from data_lake_dev_xavi_silver.dim_memberships_scd;



select distinct year(created_at) from data_lake_bronze.memberships limit 1;
select distinct year(_event_ts) from data_lake_bronze.memberships;







select employee_id, full_name from data_lake_dev_xavi_silver.fact_employees
;

select * from data_lake_dev_xavi_silver.base_factorial_memberships_scd
where employee_id = 97225;



select * from data_lake_bronze.memberships
left join data_lake_dev_xavi_silver.dim_teams
    on memberships.team_id = dim_teams.team_id
where employee_id = 97225



select distinct year(effective_from) from data_lake_dev_xavi_silver.base_factorial_employee_managers_scd


;

select * from data_lake_dev_xavi_silver.dim_manager_reports
;

select * from data_lake_dev_xavi_silver.dim_managers_climate_2025;



;
select * from data_lake_dev_xavi_silver.base_factorial_employee_managers_scd
where employee_id = 743571
;


SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema LIKE 'data_lake_dev_xavi_%';




select * from data_lake_dev_xavi_silver.dim_hires;



"table_schema","table_name"

drop table if exists data_lake_dev_xavi_silver.base_airtable_employees;
drop table if exists data_lake_dev_xavi_silver.base_airtable_hiring_2025__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_application_phases;
drop table if exists data_lake_dev_xavi_silver.base_factorial_application_phases__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_applications;
drop table if exists data_lake_dev_xavi_silver.base_factorial_applications__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_applications_scd;
drop table if exists data_lake_dev_xavi_silver.base_factorial_applications_scd__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_candidates;
drop table if exists data_lake_dev_xavi_silver.base_factorial_candidates__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_climate_2024_answers;
drop table if exists data_lake_dev_xavi_silver.base_factorial_climate_2025_answers;
drop table if exists data_lake_dev_xavi_silver.base_factorial_contracts;
drop table if exists data_lake_dev_xavi_silver.base_factorial_employee_managers_scd;
drop table if exists data_lake_dev_xavi_silver.base_factorial_employees;
drop table if exists data_lake_dev_xavi_silver.base_factorial_hiring_managers;
drop table if exists data_lake_dev_xavi_silver.base_factorial_hiring_managers__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_hiring_stages;
drop table if exists data_lake_dev_xavi_silver.base_factorial_hiring_stages__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_job_catalog_levels;
drop table if exists data_lake_dev_xavi_silver.base_factorial_job_catalog_roles;
drop table if exists data_lake_dev_xavi_silver.base_factorial_job_posting_sdc;
drop table if exists data_lake_dev_xavi_silver.base_factorial_job_posting_sdc__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_job_postings;
drop table if exists data_lake_dev_xavi_silver.base_factorial_job_postings__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_memberships_scd;
drop table if exists data_lake_dev_xavi_silver.base_factorial_rejection_reasons;
drop table if exists data_lake_dev_xavi_silver.base_factorial_rejection_reasons__dbt_tmp;
drop table if exists data_lake_dev_xavi_silver.base_factorial_teams;
drop table if exists data_lake_dev_xavi_silver.dim_application_phases;
drop table if exists data_lake_dev_xavi_silver.dim_applications;
drop table if exists data_lake_dev_xavi_silver.dim_candidates;
drop table if exists data_lake_dev_xavi_silver.dim_climate_2025_questions;
drop table if exists data_lake_dev_xavi_silver.dim_contracts;
drop table if exists data_lake_dev_xavi_silver.dim_employees;
drop table if exists data_lake_dev_xavi_silver.dim_hiring_stages;
drop table if exists data_lake_dev_xavi_silver.dim_job_catalog;
drop table if exists data_lake_dev_xavi_silver.dim_job_postings;
drop table if exists data_lake_dev_xavi_silver.dim_manager_reports;
drop table if exists data_lake_dev_xavi_silver.dim_managers_climate_2025;
drop table if exists data_lake_dev_xavi_silver.dim_memberships_climate_2024;
drop table if exists data_lake_dev_xavi_silver.dim_memberships_climate_2025;
drop table if exists data_lake_dev_xavi_silver.dim_memberships_scd;
drop table if exists data_lake_dev_xavi_silver.dim_teams;
drop table if exists data_lake_dev_xavi_silver.dim_teams_climate_2024;
drop table if exists data_lake_dev_xavi_silver.dim_teams_climate_2025;
drop table if exists data_lake_dev_xavi_silver.fact_climate_2024;
drop table if exists data_lake_dev_xavi_silver.fact_climate_2025;
drop table if exists data_lake_dev_xavi_silver.fact_employees;
drop table if exists data_lake_dev_xavi_silver.finance_teams;
drop table if exists data_lake_dev_xavi_silver.finance_teams_2;
drop table if exists data_lake_dev_xavi_silver.people_teams;
drop table if exists data_lake_dev_xavi_silver.people_teams_2;
drop table if exists data_lake_dev_xavi_silver.recruitment_teams;
drop table if exists data_lake_dev_xavi_silver.recruitment_teams_2;
drop table if exists data_lake_dev_xavi_gold.gold_climate_2024_answers;
drop table if exists data_lake_dev_xavi_gold.gold_climate_2025_answers;






select 
    candidate_id,
    candidate_first_name,
    candidate_last_name,
    candidate_email,
    candidate_all_names,
    application_id,
    job_posting_id,
    job_posting_title,
    hired_date,
    hiring_stage_id,
    hiring_stage_name,
    application_phase_id,
    application_phase_type,
    company_id
 from data_lake_dev_xavi_silver.dim_hires


;
Select
    first_name,
    last_name,
    full_name,
    employee_id,
    onboarding_date,
    offboarding_date
from data_lake_dev_xavi_silver.dim_employees;

select 
    position_id,
    position_name,
    new_hire_name
from data_lake_dev_xavi_silver.dim_job_positions



;
select * from data_lake_dev_xavi_silver.dim_employees where full_name like '%Rusi%';



select * from data



select * from data_lake_dev_xavi_gold.gold_climate_2025_answers; -equips i subequips
select * from data_lake_dev_xavi_gold.gold_climate_2025_by_managers; -- manager i subnivell
;

select * from data_lake_bronze.ats_applications where id = 9527841;



      SELECT 
        team_name, 
        parent_team_name
      FROM data_lake_dev_xavi_silver.dim_teams
      WHERE team_type = 'Team'
      ORDER BY parent_team_name, team_name

;

select * from
data_lake_dev_xavi_silver.fact_teams
;





select * from data_lake_dev_xavi_gold.gold_climate_2025_answers;
;


;
select 
    manager_full_name, --dim
    reporting_level,  --dim
    level_employee_count,  --metric no format
    avg_accomplishments_recognised, --metric green yellow red format defining the thresholds
    avg_great_place_to_work -- metric green yellow red format defining the thresholds
from data_lake_dev_xavi_gold.gold_climate_2025_by_manager;


select *
from data_lake_dev_xavi_gold.gold_climate_2025_by_manager
limit 1;

;



select * from data_lake_dev_xavi_silver.fact_employees limit 1




;
        SELECT
            CAST(candidate_id AS BIGINT) as candidate_id,
            candidate_first_name,
            candidate_last_name,
            candidate_email,
            candidate_all_names,
            CAST(application_id AS BIGINT) as application_id,
            -- application_updated_at,
            CAST(job_posting_id AS BIGINT) as job_posting_id,
            job_posting_title,
            hired_date,
            CAST(hiring_stage_id AS BIGINT) as hiring_stage_id,
            hiring_stage_name,
            CAST(application_phase_id AS BIGINT) as application_phase_id,
            application_phase_type,
            CAST(company_id AS BIGINT) as company_id
        FROM data_lake_dev_xavi_silver.dim_hires
        WHERE 1=1
;




select * from data_lake_dev_xavi_silver.aux_job_position_matching
limit 105;





SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema LIKE 'data_lake_dev_xavi_%';



"table_schema","table_name"
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.aux_job_position_matching SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_airtable_employees__dbt_backup SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_airtable_employees__dbt_tmp SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_airtable_hiring_2023 SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_airtable_hiring_2024 SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_airtable_hiring_2025 SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_application_phases SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_applications SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_applications_scd SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_candidates SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_climate_2025_answers SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_contracts SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_employee_managers_scd SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_employees SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_hiring_managers SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_hiring_stages SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_job_catalog_levels SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_job_catalog_roles SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_job_posting_sdc SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_job_postings SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_memberships SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_memberships_scd SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_performance_review_final_employee_scores SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_performance_review_process_targets SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_performance_review_processes SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_performance_reviews_evaluations SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_performance_scores SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_rejection_reasons SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.base_factorial_teams SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_application_phases SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_applications SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_candidates SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_climate_2024_questions SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_climate_2025_questions SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_contracts SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_employees SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_hires SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_hiring_stages SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_job_catalog SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_job_positions SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_job_postings SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_manager_reports_scd SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_managers_climate_2025 SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_market_memberships SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_markets SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_memberships_climate_2025 SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_memberships_scd SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_performance_reviews SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_teams SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.dim_teams_climate_2025 SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.fact_climate_2025 SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.fact_employees SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_silver.fact_teams SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_gold.gold_climate_2025_answers SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_gold.gold_climate_2025_by_manager SET AUTHORIZATION ROLE analytics_role;
ALTER TABLE aws_dev_data_glue_catalog.data_lake_dev_xavi_gold.gold_climate_2025_employees SET AUTHORIZATION ROLE analytics_role;



;

SELECT table_schema, table_name
FROM information_schema.columns
WHERE 
table_name like 'airbyte_airtable_people_people_tod%'
-- table_schema LIKE 'data_lake_dev_xavi_%';

;

SELECT *
FROM information_schema.columns

;

select * from airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7
limit 1



"_airbyte_raw_id","_airbyte_extracted_at","_airbyte_meta","_airbyte_generation_id","nss","onb","city","irpf","role","team","creat","email","level","match","teams","market","nombre","office","squads","status","género","id_type","apellido","approval","benefits","birthday","no_entra","zip_code","come_back","esmanager","lusha_(h)","main_team","recibido?","reporters","introw_(h)","team_check","travelperk","aircall_(h)","employee_id","hubspot_(e)","id_empleado","meet_jordi!","_airtable_id","a&r_comments","centro_coste","compensation","job_position","lmt_noborrar","prl_check_on","t&c_comments","asistencia_ob","bitwarden_(y)","entidad_legal","manager_email","prl_check_off","team_comments","address_line_1","email_personal","email_temporal","employee_group","rol_(new_hire)","asignar_equipos","conteo_managers","market_specific","nombre_completo","script_managers","culture_comments","employee_trigger","fecha_onboarding","level_(new_hire)","manager_comments","product_comments","benefits_comments","email_last_(auto)","factorial_product","fecha_offboarding","rate_team_members","rate_your_manager","terminated_reason","work-life_balance","equipment_delivery","varios_last_(auto)","días_en_la_empresa","posicion_(new_hire)","prof._dev._comments","_airtable_table_name","afterworks_&_rituals","owner_exit_interview","permanencia_(months)","rate_overall_culture","room_for_improvement","w-l_balance_comments","where_are_you_going?","chivato_equipos_auto_","compensation_comments","email_personal_(temp)","most_positive_aspects","recommend_to_a_friend","última_modificación","_airtable_created_time","last_modified_calendar","main_reason_of_leaving","come_back_circumstances","periodo_de_prueba_status","professional_development","equipment_delivery_update","fecha_onboarding_(save)_2","fin_del_periodo_de_prueba","jira_(poyecto_attila)_(y)","tipo_de_baja_simplificada","invitaciones_calendar_work","is_your_salary_increasing?","comment_reasons_for_leaving","secondary_reason_of_leaving","transparency_&_communication","where_will_be_the_onboarding","mail_created_(automatizacion)","mail_creation_(automatizacion)","preferred_job_title_(new_hire)","state_/_province_/_region_/_county","email_temporal_last_modified_(automatizacion)","automatización_(coordinar_equipos_kpi_con_it_employees)","no_entra_(last)","bo_(i)","akiles_(alvaro)","motivation","recognition_","motivation_comments","recognition_comments","qobra_(a)","modjo","onb_oficial"


;


select * from (
    values
        -- Engineer Manager
        ('Engineer Manager', null, '134399', '248463'),

        -- Finance
        ('Finance', 'Senior', '227422', '248488'),
        ('Finance', 'Staff',  '235705', '248493'),

        -- Talent
        ('Talent', null, '41921', '248312'),

        -- Operations
        ('Operations', 'Payroll', '238793', '248304'),
        ('Operations', 'Time',    '248310', '248304'),

        -- Platform (old)
        ('Platform', 'Backoffice (Senior, old)', '248466', null),
        ('Platform', 'DX (old)', '231526', null),
        ('Platform', 'DX (old 2)', '239670', null),
        ('Platform', 'CIAM (old)', '235148', null),
        ('Platform', 'Foundations (old)', '228957', null),

        -- Platform (actual)
        ('Platform', 'API', null, '258829'),
        ('Platform', 'DX', null, '261530'),
        ('Platform', 'CIAM (new)', null, '265724'),
        ('Platform', 'Backoffice (Mid/Senior)', null, '273662')
) as t(domain, role, old_id, new_id);;



with raw_data as (

    -- ENGINEERING MANAGER
    select 'ENGINEERING' as team, 'MANAGER' as sub_classification, 'OLD' as status, 134399 as id
    union all
    select 'ENGINEERING', 'MANAGER', 'NEW', 248463

    -- FINANCE - SENIOR
    union all
    select 'FINANCE', 'SENIOR', 'OLD', 227422
    union all
    select 'FINANCE', 'SENIOR', 'NEW', 248488

    -- FINANCE - STAFF
    union all
    select 'FINANCE', 'STAFF', 'OLD', 235705
    union all
    select 'FINANCE', 'STAFF', 'NEW', 248493

    -- TALENT
    union all
    select 'TALENT', null, 'OLD', 41921
    union all
    select 'TALENT', null, 'NEW', 248312

    -- OPERATIONS - PAYROLL
    union all
    select 'OPERATIONS', 'PAYROLL', 'OLD', 238793
    union all
    select 'OPERATIONS', 'PAYROLL', 'NEW', 248304

    -- OPERATIONS - TIME
    union all
    select 'OPERATIONS', 'TIME', 'OLD', 248310
    union all
    select 'OPERATIONS', 'TIME', 'NEW', 248304

    -- PLATFORM - BACKOFFICE (SENIOR)
    union all
    select 'PLATFORM', 'BACKOFFICE (SENIOR)', 'OLD', 248466

    -- PLATFORM - DX (two OLD IDs)
    union all
    select 'PLATFORM', 'DX', 'OLD', 231526
    union all
    select 'PLATFORM', 'DX', 'OLD', 239670
    union all
    select 'PLATFORM', 'DX', 'NEW', 261530

    -- PLATFORM - CIAM
    union all
    select 'PLATFORM', 'CIAM', 'OLD', 235148
    union all
    select 'PLATFORM', 'CIAM', 'NEW', 265724

    -- PLATFORM - FOUNDATIONS
    union all
    select 'PLATFORM', 'FOUNDATIONS', 'OLD', 228957

)

select * from raw_data


;
select * from data_lake_dev_xavi_gold.fact_engineering_applications;


;

select 
    team as team__dim,
    sub_classification as sub_classification__dim,
    status as job_posting_status__dim,
    job_posting_title as job_posting_title__dim,
    year(application_created_at) as application_year__dim,
    month(application_created_at) as application_month__dim,
    concat(
        cast(year(application_created_at) AS varchar), 
        '-', 
        lpad(CAST(month(application_created_at) AS varchar), 2, '0')
        ) as application_year_month__dim,
    application_source as application_source__dim,
    1 as count__metric__sum,
    case when is_hired = 'HIRED' then 1 else 0 end as count_hired__metric__sum
from data_lake_dev_xavi_gold.fact_engineering_applications;




select * from data_lake_dev_xavi_gold.gold_climate_2025_by_manager 

;

select * from data_lake_dev_xavi_gold.fact_engineering_applications;



select distinct concat('https://app.factorialhr.com/recruitment/jobs/', cast(job_posting_id as varchar),  '/applications') from data_lake_dev_xavi_gold.fact_engineering_applications;


"_col0"
"https://app.factorialhr.com/recruitment/jobs/265724/applications"
"https://app.factorialhr.com/recruitment/jobs/248493/applications"
"https://app.factorialhr.com/recruitment/jobs/239670/applications"
"https://app.factorialhr.com/recruitment/jobs/238793/applications"
"https://app.factorialhr.com/recruitment/jobs/235705/applications"
"https://app.factorialhr.com/recruitment/jobs/235148/applications"
"https://app.factorialhr.com/recruitment/jobs/248466/applications"
"https://app.factorialhr.com/recruitment/jobs/248488/applications"
"https://app.factorialhr.com/recruitment/jobs/227422/applications"
"https://app.factorialhr.com/recruitment/jobs/248312/applications"
"https://app.factorialhr.com/recruitment/jobs/261530/applications"
"https://app.factorialhr.com/recruitment/jobs/41921/applications"
"https://app.factorialhr.com/recruitment/jobs/248463/applications"
"https://app.factorialhr.com/recruitment/jobs/231526/applications"
"https://app.factorialhr.com/recruitment/jobs/228957/applications"
"https://app.factorialhr.com/recruitment/jobs/248310/applications"
"https://app.factorialhr.com/recruitment/jobs/248304/applications"
"https://app.factorialhr.com/recruitment/jobs/134399/applications"


;

select hires.job_posting_title, count(*), array_join(array_agg(candidate_first_name), '-') as first_names from data_lake_dev_xavi_silver.dim_hires hires 
left join data_lake_dev_xavi_silver.dim_job_postings postings
on hires.job_posting_id = postings.job_posting_id
group by 1
order by 2 desc;



select * from data_lake_dev_xavi_gold.


select * from data_lake_dev_xavi_gold.gold_climate_2025_by_manager;


select * from data_lake_dev_xavi_silver.fact_employees;


;

select * from data_lake_dev_xavi_silver.dim_climate_2025_questions




"question_label","column_name"
"Policies and processes at Factorial are transparent and aligned with our values","policies_transparent"
"Social events (Facts by Factorial, End of Year Dinner, Afterworks) provide great opportunities for bonding and sharing a fun time together","social_events"
"Which team are you in?","team"
"My leaders share information in a clear, transparent and consistent way","leaders_communication"
"Write single words that express what you are grateful for at Factorial","grateful_for"
"Write single words that express what you would like to see more at Factorial","would_like_to_see_more"
"I am confident that I can grow and develop myself at Factorial","growth_confidence"
"My workspace and office offer an excellent environment for working and recreation","workspace_environment"
"I feel my contributions are valuable and make a differenceI feel my contributions are valuable and make a difference","contributions_valuable"
"I am proud to be part of Factorial","proud_to_be_part"
"My leaders inspire teamwork, make good decisions and effectively guide others towards common goals","leaders_inspire"
"I believe Factorial offers competitive benefits (e.g., Alan, Wellhub, )","competitive_benefits"
"The flexibility Factorial provides enables me to maintain a positive work/life balance","work_life_balance"
"Feel free to share any feedback here!","additional_feedback"
"How long have you been working in Factorial?","tenure"
"What is your gender?","gender"
"My leads and I have meaningful conversations that help me improve my performance","meaningful_conversations"
"As far as I can see, I envision myself growing and staying at Factorial","envision_staying"
"I feel I can trust my leaders","trust_leaders"
"I consider Factorial's culture and values are put into practice daily","culture_and_values_practiced"
"I consider Factorial a great place to work","great_place_to_work"
"On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?","nps_score"
"I feel my accomplishments are recognised","accomplishments_recognised"
"I believe that performance evaluations are fair, consistent, and reflect my contributions and achievements","performance_evaluations_fair"
"Factorial provides clear and transparent information about compensation and career plans","compensation_transparency"
"I feel there is a reasonable balance between what I contribute to the company and what I receive in return","contribution_balance"
"The communications I receive from Factorial (via Slack, Factorial platform, All Hands), help me understand more about the company's culture, its context, and business vision","company_communications"
"I strive to achieve goals and take initiative even when faced with challenges","initiative_and_goals"
"I believe joining Factorial was a good decision","good_decision_to_join"



;
select * from data_lake_dev_xavi_silver.aux_job_position_matching;


;
select * from data_lake_bronze.ats_candidates limit 1


;
select * from data_lake_dev_xavi_silver.aux_job_position_matching limit 1;



select * from data_lake_dev_xavi_gold.gold_hires limit 1;


;
select employee_id, full_name, onboarding_date, count(*) from data_lake_dev_xavi_silver.fact_employees group by 1, 2, 3 order by 4 desc limit 100

;
with repeated_employees as (
    select 
        employee_id,
        count(*)
    from data_lake_dev_xavi_silver.fact_employees
    group by employee_id
    having count(*) > 1
)


select * from data_lake_dev_xavi_silver.fact_employees where employee_id in (
    select distinct employee_id from repeated_employees
);


    select 
        employee_id,
        count(*)
    from data_lake_dev_xavi_silver.fact_employees
    group by employee_id
    order by 2 desc

;


select * from 
data_lake_dev_xavi_gold.gold_orphan_positions;

select 
    file_hiring_year,
    is_orphan,
    count(*)
from data_lake_dev_xavi_gold.gold_orphan_positions
group by 1, 2
order by 1, 2;







select * from data_lake_dev_xavi_gold.gold_orphan_positions
where is_orphan = 1;


;
select
    year(onboarding_date),
    count(*) as total_employee_hires,
    SUM(case when matched_application_id is null then 0 else 1 end) as total_employee_with_application,
    SUM(case when matched_position_id is null then 0 else 1 end) as total_employee_with_position
from data_lake_dev_xavi_gold.gold_hires
group by 1
limit 100;
;




select position_matching_status,
        CASE WHEN new_hire_name is null THEN 'NO_NEW_HIRE_NAME' ELSE 'HIRE NAME' END AS has_new_hire_name,
        count(*)
from data_lake_dev_xavi_gold.gold_orphan_positions
where file_hiring_year = '2025'
and position_status = 'CLOSED'
group by 1,2
order by 1;


select
    hire_matching_status,
    case when matched_position_id is null then 'POSITION NOT FOUND' else 'POSITION FOUND' end as position_matching_status,
    count(*)
from data_lake_dev_xavi_gold.gold_orphan_hires
where year(hired_date) = 2025
group by 1,2;


select * from 




select * from data_lake_dev_xavi_gold.gold_orphan_positions limit 10




select full_name, job_posting_title, position_name
from data_lake_dev_xavi_gold.gold_hires


;

select 
        is_closed,
        new_hire_name,
        count(*)
from data_lake_dev_xavi_silver.dim_job_positions
where file_hiring_year = '2025'
and new_hire_name is null
group by 1,2




select * from data_lake_dev_xavi_gold.gold_orphan_hires;
select * from data_lake_dev_xavi_gold.gold_orphan_positions;