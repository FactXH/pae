with ranked_scores as (
    select
        *
    from {{ source('athena', 'athena_employees_performance_scores') }}
)

select
    employee_id,
    evaluation_type as performance_evaluation_type,
    score as performance_score,
    name as performance_name,
    CASE
        WHEN evaluation_type = 'PERFORMANCE REVIEW Q3Y24' THEN 20243
        WHEN evaluation_type = 'PERFORMANCE REVIEW Q4Y24' THEN Q4 20244
        WHEN evaluation_type = 'PERFORMANCE REVIEW Q1Y25' THEN Q1 20251
        WHEN evaluation_type = 'PERFORMANCE REVIEW Q2Y25' THEN Q2 20252
    END as performance_review_quarter

from {{ source('athena', 'athena_employees_performance_scores') }}
