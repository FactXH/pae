with memberships_ordered as (
    select
        employee_id,
        team_id,
        is_lead,
        cdc_operation,
        cdc_timestamp,
        row_number() over (
            partition by employee_id, team_id, cdc_operation
            order by cdc_timestamp
        ) as operation_rn
    from {{ ref('br_athena_memberships_cdc') }}
),

-- Pair inserts with deletes to create effective periods
membership_periods as (
    select
        i.employee_id,
        i.team_id,
        i.is_lead,
        i.cdc_timestamp as effective_from,
        d.cdc_timestamp as effective_to,
        i.operation_rn as period_number
    from memberships_ordered i
    left join memberships_ordered d
        on i.employee_id = d.employee_id
        and i.team_id = d.team_id
        and d.cdc_operation = 'D'
        and d.operation_rn = i.operation_rn  -- Match nth insert with nth delete
    where i.cdc_operation = 'I'
)

select
    employee_id,
    team_id,
    is_lead,
    effective_from,
    effective_to,
    case 
        when effective_to is null then true 
        else false 
    end as is_current,
    period_number
from membership_periods
order by employee_id, team_id, effective_from