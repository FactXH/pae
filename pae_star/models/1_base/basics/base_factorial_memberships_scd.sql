with source_memberships as (
    select 
        id,
        employee_id,
        team_id,
        lead,
        company_id,
        case when _cdc is null then null else _cdc.op end as cdc_operation,
        _event_ts
    from {{ source("athena", "memberships") }}
    where company_id = 1
),

ranked_memberships as (
    select *,
        row_number() over (
            partition by id, employee_id, team_id, cdc_operation 
            order by _event_ts asc
        ) as rn
    from source_memberships
),

deduplicated_memberships as (
    select *
    from ranked_memberships
    where rn = 1
)

select
    id as membership_id,
    employee_id,
    team_id,
    cdc_operation,
    cast(_event_ts as date) as cdc_date
from deduplicated_memberships
order by id, _event_ts