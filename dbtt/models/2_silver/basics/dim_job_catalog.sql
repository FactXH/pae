with levels as (
    select * from {{ ref("br_athena_job_catalog_levels") }}
),

roles as (
    select * from {{ ref("br_athena_job_catalog_roles") }}
)

select
    jr.job_catalog_role_id,
    CONCAT(
        COALESCE(jr.role_name, ''),
        CASE
            WHEN lower(COALESCE(jl.level_name, '')) LIKE '%default%' THEN ''
            ELSE CONCAT(' - ', COALESCE(jl.level_name, ''))
        END
    ) AS role_level_name,
    jr.role_name,
    jr.job_catalog_role_description,
    jl.job_catalog_level_id,
    jl.level_name,
    jl.job_catalog_level_order
from roles jr
left join levels jl
    on jr.job_catalog_role_id = jl.job_catalog_role_id
