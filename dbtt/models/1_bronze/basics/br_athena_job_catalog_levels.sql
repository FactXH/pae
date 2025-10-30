with source_levels as (
    select *
    from (
        select *,
            row_number() over (partition by id order by _event_ts desc) rn
        from {{ source("athena", "athena_job_catalog_levels") }}
    )
),

deduplicated_levels as (
    select *
    from source_levels
    where rn = 1
    and (_cdc is null or _cdc not like '%op=D%')
)

select
    id as job_catalog_level_id,
    name as level_name,
    "order" as job_catalog_level_order,
    job_catalog_roles_id as job_catalog_role_id
from deduplicated_levels
