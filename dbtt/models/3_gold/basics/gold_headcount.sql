with dim_employees as (
    select * from {{ ref("dim_employees") }}
),

memberships_scd as (
    select * from {{ ref("dim_memberships_scd") }}
    limit 1
),

dim_teams as (
    select * from {{ ref("dim_teams") }}
)

select 1