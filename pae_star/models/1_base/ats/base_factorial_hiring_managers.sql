with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_hiring_managers', include_deleted=True) }}

select
    id,
    access_id,
    ats_job_posting_id as job_posting_id,
    hiring_role,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_ats_hiring_managers