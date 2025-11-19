with 
{{ dedup_not_deleted_source('performance', 'performance_review_final_employee_scores', include_deleted=True) }}

select
    id as final_score_employee_id,
    performance_review_process_target_id,
    {{ cast_to_float('score') }} as score,
    {{ cast_to_float('normalized_score') }} as normalized_score,
    {{ cast_to_date('calculated_at') }} as calculated_at,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_performance_review_final_employee_scores
