with engineering_postings as (
    select * from {{ ref('dim_enginering_postings') }}
),

job_postings as (
    select * from {{ ref('dim_job_postings') }}
),

hires as (
    select * from {{ ref("dim_hires") }} hires
    left join job_postings
        on hires.job_posting_id = job_postings.job_posting_id
),

applications as (
    select * from {{ ref("dim_applications") }}
)

select
    ep.team,
    ep.sub_classification,
    ep.status,
    jp.job_posting_id,
    jp.job_posting_title,
    applications.application_created_at,
    case when hires.application_id is not null then 'HIRED' else 'NOT HIRED' end as is_hired,
    applications.application_id,
    applications.ats_candidate_id,
    applications.application_source,
    applications.application_medium,
    applications.application_qualified,
    applications.current_phase_type,
    applications.current_hiring_stage_name,
    applications.current_hiring_stage_position,
    applications.all_phases,
    applications.all_hiring_stages,
    coalesce(applications.rejection_reason, applications.rejection_reason_code, 'N/A') as rejection_reason,
    applications.rejection_decision_maker,
    applications.last_operation

from engineering_postings ep
left join job_postings jp
    on ep.job_posting_id = jp.job_posting_id
left join applications
    on jp.job_posting_id = applications.ats_job_posting_id
left join hires
    on hires.application_id = applications.application_id