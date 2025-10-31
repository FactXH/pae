with initial as (SELECT 1),

{{ dedup_not_deleted_source('athena_performance', 'athena_performance_review_employee_scores', 'deduplicated_scores') }}

SELECT
    id as performance_review_score,
    review_process_id,
    target_access_id,
    reviewer_strategy,
    {{ cast_to_float('score') }} AS score,
    {{ cast_to_float('normalized_score') }} AS normalized_score
FROM deduplicated_scores