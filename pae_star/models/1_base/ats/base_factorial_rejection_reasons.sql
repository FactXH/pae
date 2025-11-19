with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_rejection_reasons', include_deleted=True) }}

select
    id as rejection_reason_id,
    reason as rejection_reason,
    decision_maker as rejection_decision_maker,
    rr_code as rejection_reason_code,
    company_id,
    created_at as rejection_reason_created_at,
    updated_at as rejection_reason_updated_at,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_ats_rejection_reasons
