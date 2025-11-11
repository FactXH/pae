with candidates as (
    select * from {{ ref("br_athena_candidates") }}
),

candidate_sources as (
    select * from {{ ref("br_athena_sources") }}
)

select 1