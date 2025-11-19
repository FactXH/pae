with 
{{ dedup_not_deleted_source('athena', 'employees') }}

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
from dedup_employees
