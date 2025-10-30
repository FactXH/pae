with source_contracts as (
    select * from {{ ref("br_athena_contracts") }}
),

contracts_with_ranks as (
    select
        *,
        row_number() over (partition by employee_id, start_date order by start_date) as contract_rank,
        dense_rank() over (partition by employee_id order by start_date) as period_number,
        lead(effective_date) over (partition by employee_id order by effective_date) as next_effective_date
    from source_contracts
)

select
    *,
            case
                when end_date is not null
                    then end_date::date
                else
                    case when next_effective_date is not null
                        then (next_effective_date::date - 1)
                    else date '2100-12-31'
                    end
            end as effective_to_date,
            case
                when period_number = max(period_number) over (partition by employee_id) then true
                else false
            end as is_last_contract
from contracts_with_ranks
-- where employee_id = '1106679'
order by employee_id, start_date, effective_date
