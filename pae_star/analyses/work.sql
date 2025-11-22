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

