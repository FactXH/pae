with 
{{ dedup_not_deleted_source('performance', 'performance_review_employee_scores', include_deleted=True) }}

select
    id as performance_review_score_id,
    review_process_id,
    target_access_id,
    reviewer_strategy,
    {{ cast_to_float('score') }} as score,
    {{ cast_to_float('normalized_score') }} as normalized_score,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_performance_review_employee_scores
