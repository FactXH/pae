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
        lt.team_name
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
    count(*) as employee_count, 
    array_join(array_agg(full_name), ', ') as employee_names
from active_employees_with_teams
group by 1
order by 2 desc;


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









select * from ats_rejection_reasons limit 1;