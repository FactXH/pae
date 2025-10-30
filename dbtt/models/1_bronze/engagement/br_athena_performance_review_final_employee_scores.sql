with initial as (SELECT 1),

{{ dedup_not_deleted_source('athena_performance', 'athena_performance_review_final_employee_scores', 'deduplicated_scores') }}

SELECT
    id AS final_score_employee_id,
    performance_review_process_target_id,
    {{ cast_to_float('score') }} AS score,
    {{ cast_to_float('normalized_score') }} AS normalized_score,
    {{ cast_to_date('calculated_at') }} AS calculated_at
FROM deduplicated_scores