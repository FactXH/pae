with hiring_managers as (
    select * from {{ ref("br_athena_hiring_managers") }}
)

select 
    *
from hiring_managers