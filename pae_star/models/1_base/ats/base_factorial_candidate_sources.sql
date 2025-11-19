with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_candidate_sources', include_deleted=True) }}

select
    id as candidate_source_id,
    name as candidate_source_name,
    category as candidate_source_category,
    company_id,
    created_at as candidate_source_created_at,
    updated_at as candidate_source_updated_at,
    editable as candidate_source_editable,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_ats_candidate_sources