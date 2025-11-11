with athena_job_postings as (
    select * from {{ source("athena_ats", "athena_ats_job_postings") }}
)

select 1