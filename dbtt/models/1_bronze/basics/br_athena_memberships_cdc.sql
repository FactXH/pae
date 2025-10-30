with source_memberships as (
    select *,
        (regexp_match(_cdc, 'op=([^,}]+)'))[1] as cdc_operation,
        to_date(
            replace((regexp_match(_cdc, 'ts=([^,}]+)'))[1], ' UTC', ''),
            'YYYY-MM-DD'
        ) as cdc_timestamp
    from {{ source("athena", "athena_memberships") }}
),

ranked_memberships as (
    select *,
        row_number() over (
            partition by id, cdc_operation 
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
    employee_id,
    team_id,
    lead as is_lead,
    cdc_operation,
    cdc_timestamp

from deduplicated_memberships