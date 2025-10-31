
with initial as (SELECT 1),

{{ dedup_not_deleted_source('athena_performance', 'athena_performance_review_processes', 'deduplicated_performance_review_processes') }}

SELECT
    id as performance_review_process_id,
    name as performance_review_name,
    description,
    created_at,
    starts_at,
    CASE 
        WHEN starts_at IS NOT NULL AND starts_at != '' THEN to_date(starts_at, 'YYYY-MM-DD')
        WHEN created_at IS NOT NULL AND created_at != '' THEN to_date(created_at, 'YYYY-MM-DD')
        ELSE NULL
    END as performance_review_start_date
FROM deduplicated_performance_review_processes
