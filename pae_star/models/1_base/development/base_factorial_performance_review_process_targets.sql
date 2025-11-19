with 
{{ dedup_not_deleted_source('performance', 'performance_review_process_targets', include_deleted=True) }}

select
    id as performance_review_process_target_id,
    access_id as target_access_id,
    performance_review_process_id,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_performance_review_process_targets
