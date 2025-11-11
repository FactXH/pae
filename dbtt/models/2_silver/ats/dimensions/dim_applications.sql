with applications as (
    select * from {{ ref("br_athena_applications") }}
)

select 1