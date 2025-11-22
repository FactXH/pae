select column_name from information_schema.columns where table_name = 'file_hiring_process_2025';
;
select * from file_hiring_process_2025;



select manager, count(*) from file_hiring_process_2025
group by 1

;
select * from file_hiring_process_2025 where manager like 'Atti%'Z

;
select distinct relocation_pack from file_hiring_process_2025

;


select * from athena_ats_job_postings_dedup

;
select column_name from information_schema.columns where table_name = 'athena_ats_job_postings_dedup';

select count(*), job_catalog_level_uuid from athena_ats_job_postings_dedup
group by job_catalog_level_uuid
;


select column_name from information_schema.columns where table_name = 'athena_ats_candidates_dedup';
;
select count(*), source_id from athena_ats_candidates_dedup
    group by source_id
;

select searchable from athena_ats_candidates_dedup
where searchable is not null
limit 10

;
select * from athena_ats_candidate_sources_dedup
;
select count(*), source_id, name
from athena_ats_candidates_dedup
left join athena_ats_candidate_sources_dedup
on athena_ats_candidates_dedup.source_id = athena_ats_candidate_sources_dedup.id
    group by source_id, name
;

select inactive_since, count(*) from athena_ats_candidates_dedup
group by inactive_since;



select * from athena_ats_applications_dedup limit 10;


select column_name from information_schema.columns where table_name = 'athena_ats_applications_dedup';
;

select id, ats_application_phase_id, count(*)
 from athena_ats_applications_dedup
group by 1, 2 
order by 3 desc;



select * from athena_ats_application_phases_dedup limit 10;

select * from athena_ats_hiring_phases_dedup limit 10;

select distinct disqualified_reason from athena_ats_applications_dedup;
select distinct employee_id from athena_ats_applications_dedup;


select * from athena_ats_applications_dedup where employee_id = '2306420'


select * from dim_employees where first_name = 'Xavier'


select * from athena_ats_rejection_reasons_dedup

select application_id, count(*) from file_application_steps group by application_id;



select * from athena_ats_application_phases_dedup where id = '152655';

select 
    steps.*,
    phases.name,
    app.*
from file_application_steps steps
left join athena_ats_application_phases_dedup phases
on steps.ats_application_phase_id = cast(phases.id as integer)
left join athena_ats_applications_dedup app
    on cast(app.id as integer) = steps.application_id
where steps.application_id in (
        select distinct cast(id as integer)
        from athena_ats_applications_dedup
        where ats_job_posting_id = '246134'
    )
    order by app.id, steps.effective_from asc
;

select * from athena_ats_job_postings_dedup where lower(title) like '%design%'


select * from athena_ats_job_postings_dedup where id = '246134'




;


select 


select distinct title from athena_ats_job_postings_dedup;



--- ----
--- ----
--- ---- --- ---- --- ---- --- ---- --- ---- --- ------- ----
--- ----
--- ----
--- ---- --- ------- ------- ------- ------- ------- ------- ------- ----
--- ----
   -- SILVER LAYER

    WITH source_applications AS (
        SELECT 
            id AS application_id,
            ats_application_phase_id,
            date(_cdc.ts) AS cdc_date
        FROM ats_applications
    ),

    -- Get the first date for each application-phase
    application_phases AS ( 
        SELECT
            application_id,
            ats_application_phase_id,
            min(cdc_date) AS effective_from
        FROM source_applications
        GROUP BY 1, 2
    ),

    -- Calculate effective_to as the day before the next phase starts
    application_phase_periods AS (
        SELECT
            application_id,
            ats_application_phase_id,
            effective_from,
            date_add(
                'day', -1,
                lead(effective_from) OVER (
                    PARTITION BY application_id
                    ORDER BY effective_from
                )
            ) AS effective_to
        FROM application_phases
    )

    SELECT
        application_id,
        ats_application_phase_id,
        effective_from,
        cast(effective_to AS date) AS effective_to,
        CASE 
            WHEN effective_to IS NULL THEN true 
            ELSE false 
        END AS is_current
    FROM application_phase_periods
    WHERE ats_application_phase_id IS NOT NULL
    ORDER BY application_id, effective_from;



select distinct status from athena_ats_job_postings_status limit 10;


select title, job_posting_id, athena_ats_job_postings_status.status, count(*), string_agg(cast(effective_from AS varchar), ', ') from athena_ats_job_postings_status
left join athena_ats_job_postings_dedup
on athena_ats_job_postings_dedup.id = athena_ats_job_postings_status.job_posting_id
group by 1,2, 3
order by 3 desc
;

select * from athena_ats_job_postings_status where job_posting_id = '261000'



;
select distinct team, specific_team from file_hiring_process_2025;
select distinct team, teams, main_team from athena_airtable_people_todo 
;

select distinct name, seniority, market, team, specific_team, count(*) from file_hiring_process_2025
group by 1,2,3,4, 5
order by 4, 5, 1;



select distinct job_posting_id, athena_ats_job_postings_dedup.title, athena_ats_job_postings_dedup.team_id, teams.team_name
from athena_ats_job_postings_status
left join athena_ats_job_postings_dedup
on athena_ats_job_postings_status.job_posting_id = athena_ats_job_postings_dedup.id
left join dim_teams teams
on athena_ats_job_postings_dedup.team_id = teams.team_id
where athena_ats_job_postings_status.status = 'published' and date_part('year', date(effective_from)) = 2025
order by 4, 2
;














select column_name 
from information_schema.columns 
where table_name = 'athena_airtable_people_todo';
;







select * from data_lake_bronze.ats_job_postings limit 10;



-- ATHENA