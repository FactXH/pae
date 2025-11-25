with memberships as (
    select * from {{ ref("base_factorial_memberships") }}
),

markets as (
    select * from {{ ref("dim_markets") }}
),

market_memberships as (
    select 
        mem.employee_id,
        mem.team_id as market_id,
        markets.market_name,
        markets.market_level
    from memberships mem
    inner join markets
        on mem.team_id = markets.market_id
)

select * from market_memberships
order by employee_id