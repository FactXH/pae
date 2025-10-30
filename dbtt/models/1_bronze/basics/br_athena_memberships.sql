with source_memberships as (
    select *
    from (
        select *,
            row_number() over (partition by id order by _event_ts desc) rn
        from {{ source("athena", "athena_memberships") }}
    )
),

deduplicated_memberships as (
    select *
    from source_memberships
    where rn = 1
    and (_cdc is null or _cdc not like '%op=D%')
)

select
    employee_id,
    team_id,
    lead as is_lead
from deduplicated_memberships