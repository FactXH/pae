with hiring_stages as (
    select * from {{ source("athena_ats", "athena_ats_hiring_stages") }}
)

select 1