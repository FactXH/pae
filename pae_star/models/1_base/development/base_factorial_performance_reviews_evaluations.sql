with 
{{ dedup_not_deleted_source('performance', 'performance_review_evaluations', include_deleted=True) }}

select
    id as evaluation_id,
    target_access_id,
    reviewer_access_id,
    evaluation_type,
    review_process_id,
    performance_review_process_target_id,
    employee_score_questionnaire_answered,
    review_questionnaire_answered,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_performance_review_evaluations
