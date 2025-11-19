with all_hiring_positions as (
    select * from {{ ref('base_airtable_hiring_2023') }}
    union all
    select * from {{ ref('base_airtable_hiring_2024') }}
    union all
    select * from {{ ref('base_airtable_hiring_2025') }}
)

select
    row_number() over (order by opened_date asc, hiring_process_role asc) as xapt_position_id,
    concat(file_hiring_year, '_', cast(cast(id as bigint) as varchar)) as position_id,
    hiring_process_role as position_name,
    *
from all_hiring_positions