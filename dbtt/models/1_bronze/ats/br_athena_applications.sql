with applications as (
    select * from {{ source("athena_ats", "athena_ats_applications") }}
)

select 1