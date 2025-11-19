with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_applications', include_deleted=True) }}

select
    id as application_id,
    ats_candidate_id,
    ats_job_posting_id,
    ats_application_phase_id,
    created_at as application_created_at,
    updated_at as application_updated_at,
    disqualified_reason as application_disqualified_reason,
    cover_letter as application_cover_letter,
    phone as application_phone,
    source as application_source,
    medium as application_medium,
    employee_id,
    rating_average as application_rating_average,
    embedding_score as application_embedding_score,
    ats_rejection_reason_id,
    source_id as application_source_id,
    company_id,
    integrations_join_order_id,
    qualified as application_qualified,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_ats_applications