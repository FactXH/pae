with 
{{ dedup_not_deleted_source('athena', 'job_catalog_roles', include_deleted=True) }}

select
    id as job_catalog_role_id,
    name as role_name,
    description as job_catalog_role_description,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_job_catalog_roles