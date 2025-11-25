with source as (
    select * from {{ ref("base_factorial_teams") }}
),

offices as (
    select 
        team_id as office_id,
        team_name as office_name,
        team_level as office_level
    from source
    where team_type = 'Office'
)

select * from offices
order by office_name
