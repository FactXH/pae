with hiring_processess as (
    select * from {{ ref("br_file_hiring_process") }}
)

select 1