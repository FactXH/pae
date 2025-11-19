with hiring_managers as (
    select * from {{ source("athena_ats", "athena_ats_hiring_managers_dedup") }}
)

select
    id,
    access_id,
    ats_job_posting_id as job_posting_id,
    hiring_role
from hiring_managers