with job_postings as (
    select * from {{ ref("br_athena_job_postings") }}
)

select 1