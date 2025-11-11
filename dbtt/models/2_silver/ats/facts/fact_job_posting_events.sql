with job_postings_cdc as (
    select * from {{ ref("br_athena_job_posting_cdc") }}
)

select 1
