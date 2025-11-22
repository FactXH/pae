with applications as (
    select * from {{ ref("base_factorial_applications") }}
),

applications_scd as (
    select * from {{ ref("base_factorial_applications_scd") }}
),

application_phases as (
    select * from {{ ref("base_factorial_application_phases") }}
),

hiring_stages as (
    select * from {{ ref("base_factorial_hiring_stages") }}
),

rejection_reasons as (
    select * from {{ ref("base_factorial_rejection_reasons") }}
),

-- Get all phases and stages for each application from SCD history
application_phase_history as (
    select
        app_scd.application_id,
        array_join(array_agg(ap.application_phase_type order by app_scd.effective_from), ' -> ') as all_phases,
        array_join(array_agg(hs.hiring_stage_name order by app_scd.effective_from), ' -> ') as all_hiring_stages
    from applications_scd app_scd
    left join application_phases ap
        on app_scd.ats_application_phase_id = ap.application_phase_id
    left join hiring_stages hs
        on ap.ats_hiring_stage_id = hs.hiring_stage_id
    group by app_scd.application_id
),

-- Get current phase and stage information
current_phase_info as (
    select
        app.application_id,
        ap.application_phase_type as current_phase_type,
        hs.hiring_stage_name as current_hiring_stage_name,
        hs.hiring_stage_position as current_hiring_stage_position
    from applications app
    left join application_phases ap
        on app.ats_application_phase_id = ap.application_phase_id
    left join hiring_stages hs
        on ap.ats_hiring_stage_id = hs.hiring_stage_id
)

select
    app.application_id,
    app.ats_candidate_id,
    app.ats_job_posting_id,
    app.ats_application_phase_id,
    app.application_created_at,
    app.application_updated_at,
    -- app.application_disqualified_reason as rejection_reason, -- removed duplicate
    app.application_cover_letter,
    app.application_phone,
    app.application_source,
    app.application_medium,
    app.employee_id,
    app.application_rating_average,
    app.application_embedding_score,
    app.ats_rejection_reason_id,
    app.application_source_id,
    app.company_id,
    app.integrations_join_order_id,
    app.application_qualified,
    cpi.current_phase_type,
    cpi.current_hiring_stage_name,
    cpi.current_hiring_stage_position,
    aph.all_phases,
    aph.all_hiring_stages,
    rr.rejection_reason,
    rr.rejection_decision_maker,
    rr.rejection_reason_code,
    app.last_operation
from applications app
left join application_phase_history aph
    on app.application_id = aph.application_id
left join current_phase_info cpi
    on app.application_id = cpi.application_id
left join rejection_reasons rr
    on app.ats_rejection_reason_id = rr.rejection_reason_id