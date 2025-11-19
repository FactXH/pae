with source_employees as (
    select *
    from (
        select *,
            row_number() over (partition by id order by _event_ts desc) rn
        from {{ source("athena", "employees") }}
    )
),

deduplicated_employees as (
    select *
    from source_employees
    where rn = 1
    and (_cdc is null or _cdc.op != 'D')
)

select
    id as employee_id,
    access_id,
    country,
    nationality,
    gender,
    termination_reason,
    tenure_start_date,
    terminated_on,
    termination_reason_type,
    manager_id
from deduplicated_employees