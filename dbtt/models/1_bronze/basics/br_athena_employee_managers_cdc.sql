-- TODO: CHANGE TO SILVER LAYER

with source_employees as (
    select 
        id as employee_id,
        manager_id,
        to_date(
            replace((regexp_match(_cdc, 'ts=([^,}]+)'))[1], ' UTC', ''),
            'YYYY-MM-DD'
        ) as cdc_date
    from {{ source("athena", "athena_employees") }}
    where manager_id is not null
),

-- Get the first date for each employee-manager combination
manager_relationships as (
    select
        employee_id,
        manager_id,
        min(cdc_date) as effective_from
    from source_employees
    group by employee_id, manager_id
),

-- Calculate effective_to as the day before the next manager starts
manager_periods as (
    select
        employee_id,
        manager_id,
        effective_from,
        lead(effective_from) over (
            partition by employee_id 
            order by effective_from
        ) - interval '1 day' as effective_to
    from manager_relationships
)

select
    employee_id,
    manager_id,
    effective_from,
    effective_to::date as effective_to,
    case 
        when effective_to is null then true 
        else false 
    end as is_current
from manager_periods
where manager_id is not null
order by employee_id, effective_from
