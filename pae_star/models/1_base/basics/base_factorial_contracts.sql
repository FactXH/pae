with 
{{ dedup_not_deleted_source('athena', 'contracts_contract_versions') }}

select 
    id as contract_id,
    id as contract_version_id,
    contracts_contract_id as not_defined_contract_id,
    employee_id,
    job_title,
    starts_on as start_date,
    effective_on as effective_date,
    ends_on as end_date,
    {{ cents_to_currency('salary_amount') }} as salary_amount,
    salary_frequency,
    job_catalog_level_id
from dedup_contracts_contract_versions
