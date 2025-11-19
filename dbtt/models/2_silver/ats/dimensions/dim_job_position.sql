with hiring_processess as (
    select * from {{ ref("br_file_hiring_processes") }}
),

job_position_postings_matching as (
    select * from {{ ref("aux_match_hiring_processes_job_postings") }}
),

job_postings as (
    select * from {{ ref("dim_job_posting") }}
)

select 
    *
from hiring_processess hp