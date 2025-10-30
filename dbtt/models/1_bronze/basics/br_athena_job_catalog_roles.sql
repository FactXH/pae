with source_roles as (
    select *
    from (
        select *,
            row_number() over (partition by id order by _event_ts desc) rn
        from {{ source("athena", "athena_job_catalog_roles") }}
    )
),

deduplicated_roles as (
    select *
    from source_roles
    where rn = 1
    -- and (_cdc is null or _cdc not like '%op=D%')
)

select
    id as job_catalog_role_id,
    name as role_name,
    description as job_catalog_role_description
from deduplicated_roles