with application_phases as (
    select * from {{ ref("base_factorial_application_phases") }}
)

select
    application_phase_id,
    application_phase_created_at,
    application_phase_updated_at,
    application_phase_type,
    applications_count,
    active_applications_count,
    ats_hiring_stage_id,
    company_id,
    application_phase_editable,
    last_operation
from application_phases
