with hiring_stages as (
    select * from {{ ref('dim_hiring_stages') }}
),

application_phases as (
    select * from {{ ref('dim_application_phases') }}
),

applications as (
    select * from {{ ref('dim_applications') }}
),

candidates as (
    select * from {{ ref('dim_candidates') }}
),

job_postings as (
    select * from {{ ref('dim_job_postings') }}
)

select distinct
    can.candidate_id,
    can.candidate_first_name,
    can.candidate_last_name,
    can.candidate_email,
    can.candidate_all_names,
    app.application_id,
    job.job_posting_id,
    job.job_posting_title,
    date(app.application_updated_at) as hired_date,
    stg.hiring_stage_id,
    stg.hiring_stage_name,
    phases.application_phase_id,
    phases.application_phase_type,
    app.company_id
from hiring_stages stg
left join application_phases phases
    on stg.hiring_stage_id = phases.ats_hiring_stage_id
left join applications app
    on phases.application_phase_id = app.ats_application_phase_id
left join candidates can
    on app.ats_candidate_id = can.candidate_id
left join job_postings job
    on app.ats_job_posting_id = job.job_posting_id
where stg.hiring_stage_id = 33318
    and app.company_id = 1
