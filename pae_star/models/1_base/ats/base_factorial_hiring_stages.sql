with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_hiring_stages', include_deleted=True) }}

select
    id as hiring_stage_id,
    name as hiring_stage_name,
    position as hiring_stage_position,
    company_id,
    created_at as hiring_stage_created_at,
    updated_at as hiring_stage_updated_at,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_ats_hiring_stages