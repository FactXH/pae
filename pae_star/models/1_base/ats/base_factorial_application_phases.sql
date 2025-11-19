with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_application_phases', include_deleted=True) }}

select
    id as application_phase_id,
    created_at as application_phase_created_at,
    updated_at as application_phase_updated_at,
    phase_type as application_phase_type,
    applications_count,
    active_applications_count,
    ats_hiring_stage_id,
    company_id,
    editable as application_phase_editable,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_ats_application_phases