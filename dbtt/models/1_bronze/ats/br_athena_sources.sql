with athena_sources as (
    select * from {{ source("athena_ats", "athena_ats_candidate_sources") }}
)

select 1