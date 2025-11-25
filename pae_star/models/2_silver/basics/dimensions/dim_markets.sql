with source as (
    select * from {{ ref("base_factorial_teams") }}
),

markets as (
    select 
        team_id as market_id,
        team_name as market_name,
        team_level as market_level
    from source
    where team_type = 'Market'
)

select * from markets
order by market_name
