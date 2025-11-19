with memberships_ordered as (
    select
        membership_id,
        employee_id,
        team_id,
        cdc_operation,
        cdc_date,
        row_number() over (
            partition by employee_id, team_id, cdc_operation
            order by cdc_date
        ) as operation_rn
    from {{ ref('base_factorial_memberships_scd') }}
),

-- Pair inserts/creates with deletes to create effective periods
membership_periods as (
    select
        i.membership_id,
        i.employee_id,
        i.team_id,
        i.cdc_date as effective_from,
        d.cdc_date as effective_to,
        i.operation_rn as period_number
    from memberships_ordered i
    left join memberships_ordered d
        on i.employee_id = d.employee_id
        and i.team_id = d.team_id
        and d.cdc_operation = 'D'
        and d.operation_rn = i.operation_rn  -- Match nth insert with nth delete
    where i.cdc_operation in ('I', 'C')  -- Include both Insert and Create operations
)

select
    membership_id,
    employee_id,
    team_id,
    effective_from,
    effective_to,
    case 
        when effective_to is null then true 
        else false 
    end as is_current,
    period_number
from membership_periods
order by employee_id, team_id, effective_from