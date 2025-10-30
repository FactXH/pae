with team_memberships as (
    select * from {{ ref("raw_memberships") }}
    where team_id in (select distinct id from {{ref("raw_teams")}})
),

market_memberships as (
    select * from {{ ref("raw_memberships") }}
    where team_id in (select distinct id from {{ref("raw_markets")}})
)

select 
    emp.id_empleado as employee_id,
    emp.nombre,
    emp.apellido,
    team.name as team_name,
    CASE WHEN markt.name IS NULL THEN 'NO MARKET' ELSE markt.name END as market 
from {{ source("athena", "athena_airtable_people_todo") }} emp
    left join team_memberships mem
        on emp.id_empleado = mem.employee_id
    left join {{ ref("raw_teams")}} team
        on mem.team_id = team.id
    left join market_memberships market
        on emp.id_empleado = market.employee_id
    left join {{ ref("raw_markets") }} markt 
        on market.team_id = markt.id