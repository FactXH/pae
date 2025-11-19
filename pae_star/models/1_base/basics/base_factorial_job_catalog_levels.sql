with 
{{ dedup_not_deleted_source('athena', 'job_catalog_levels', include_deleted=True, company_id='all') }}

select
    id as job_catalog_level_id,
    name as level_name,
    "order" as job_catalog_level_order,
    job_catalog_roles_id as job_catalog_role_id,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_job_catalog_levels
