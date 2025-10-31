
with initial as (SELECT 1),

{{ dedup_not_deleted_source('athena_performance', 'athena_performance_review_evaluations', 'deduplicated_reviews') }}

SELECT
    id,
    target_access_id,
    reviewer_access_id,
    evaluation_type,
    review_process_id,
    performance_review_process_target_id,
    employee_score_questionnaire_answered,
    review_questionnaire_answered
FROM deduplicated_reviews
