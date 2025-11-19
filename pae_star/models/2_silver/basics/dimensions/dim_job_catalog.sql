with levels as (
    select * from {{ ref("base_factorial_job_catalog_levels") }}
),

roles as (
    select * from {{ ref("base_factorial_job_catalog_roles") }}
)

select
    jr.job_catalog_role_id,
    concat(
        coalesce(jr.role_name, ''),
        case
            when lower(coalesce(jl.level_name, '')) like '%default%' then ''
            else concat(' - ', coalesce(jl.level_name, ''))
        end
    ) as role_level_name,
    jr.role_name,
    jr.job_catalog_role_description,
    jr.last_operation as role_last_operation,
    jl.job_catalog_level_id,
    jl.level_name,
    jl.job_catalog_level_order,
    jl.last_operation as level_last_operation
from roles jr
left join levels jl
    on jr.job_catalog_role_id = jl.job_catalog_role_id