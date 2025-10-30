with source_contracts as (
    select *
    from (
        select *,
            row_number() over (partition by id order by _event_ts desc) rn
        from {{ source("athena", "athena_contracts_contract_versions") }}
    )
),

deduplicated_contracts as (
    select *
    from source_contracts
    where rn = 1
    and (_cdc is null or _cdc not like '%op=D%')
)

select 
    id as contract_id,
    id as contract_version_id,
    contracts_contract_id as not_defined_contract_id,
    employee_id,
    job_title,
    to_date(NULLIF(starts_on, ''), 'YYYY-MM-DD') as start_date,
    to_date(NULLIF(effective_on, ''), 'YYYY-MM-DD') as effective_date,
    to_date(NULLIF(ends_on, ''), 'YYYY-MM-DD') as end_date,
    CAST(NULLIF(salary_amount, '') AS BIGINT) / 100.0 as salary_amount,
    salary_frequency,
    job_catalog_level_id
from deduplicated_contracts
