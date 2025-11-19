with 
{{ dedup_not_deleted_source('performance', 'performance_review_processes', include_deleted=True) }}

select
    id as performance_review_process_id,
    name as performance_review_name,
    description,
    created_at,
    starts_at,
    case 
        when starts_at is not null then date_parse(starts_at, '%Y-%m-%d')
        when created_at is not null then date_parse(created_at, '%Y-%m-%d')
        else null
    end as performance_review_start_date,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_performance_review_processes
