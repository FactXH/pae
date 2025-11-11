with application_phases as (
    select * from {{ source("athena_ats", "athena_ats_application_phases") }}
)

select 1