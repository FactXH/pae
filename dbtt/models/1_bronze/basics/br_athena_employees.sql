with source_employees as (
    select *
    from (
        select *,
            row_number() over (partition by id order by _event_ts desc) rn
        from {{ source("athena", "athena_employees") }}
    )
),

deduplicated_employees as (
    select *
    from source_employees
    where rn = 1
    and (_cdc is null or _cdc not like '%op=D%')
)

select
    id as employee_id,
    access_id,
    country,
    nationality,
    gender,
    termination_reason,
    to_date(NULLIF(tenure_start_date, ''), 'YYYY-MM-DD') as tenure_start_date,
    to_date(NULLIF(terminated_on, ''), 'YYYY-MM-DD') as terminated_on,
    termination_reason_type,
    manager_id
from deduplicated_employees