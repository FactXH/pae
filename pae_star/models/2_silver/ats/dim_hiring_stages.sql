with hiring_stages as (
    select * from {{ ref("base_factorial_hiring_stages") }}
)

select
    hiring_stage_id,
    hiring_stage_name,
    hiring_stage_position,
    company_id,
    hiring_stage_created_at,
    hiring_stage_updated_at,
    last_operation
from hiring_stages
