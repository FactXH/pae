
with initial as (SELECT 1),

{{ dedup_not_deleted_source('athena_performance', 'athena_performance_review_process_targets', 'deduplicated_performance_review_process_targets') }}

SELECT
    id as performance_review_process_target_id,
    access_id as target_access_id,
    performance_review_process_id
FROM deduplicated_performance_review_process_targets
