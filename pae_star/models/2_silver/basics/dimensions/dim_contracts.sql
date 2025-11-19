with source_contracts as (
    select * from {{ ref("base_factorial_contracts") }}
),

terminated_employees as (
    select
        employee_id,
        offboarding_date as offboarding_date
    from {{ ref("dim_employees") }}
    where offboarding_date is not null
),

contracts_with_ranks as (
    select
        *,
        row_number() over (partition by employee_id, start_date order by start_date) as contract_rank,
        dense_rank() over (partition by employee_id order by start_date) as period_number,
        lead(effective_date) over (partition by employee_id order by effective_date) as next_effective_date,
        case when lead(effective_date) over (partition by employee_id order by effective_date) is null then true else false end as is_last_contract
    from source_contracts
)

select
    contracts_with_ranks.*,
            case
                when te.offboarding_date is not null
                    then te.offboarding_date
                when end_date is not null
                    then end_date
                else
                    case when next_effective_date is not null
                        then next_effective_date - interval '1' day
                    else date '2100-12-31'
                    end
            end as effective_to_date,
    contracts_with_ranks.is_last_contract as is_current_contract
from contracts_with_ranks contracts_with_ranks
left join terminated_employees te
    on cast(contracts_with_ranks.employee_id as varchar) = te.employee_id and contracts_with_ranks.is_last_contract = true
-- where employee_id = '1106679'
order by contracts_with_ranks.employee_id, contracts_with_ranks.effective_date
