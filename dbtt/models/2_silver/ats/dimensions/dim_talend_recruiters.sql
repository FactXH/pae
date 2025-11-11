with br_file_hiring_process as (
    select * from {{ ref("br_file_hiring_process") }}
),

distinct_talend_specialist as (
select distinct
    trim(unnested_talend_specialist) as talend_specialist
    
from br_file_hiring_process,
     lateral unnest(string_to_array(talend_specialist, ',')) as unnested_talend_specialist
where talend_specialist is not null and trim(unnested_talend_specialist) != ''
)

select
    row_number() over (order by talend_specialist) as talend_specialist_id,
    talend_specialist,
    upper(talend_specialist) as talend_specialist_upper,
    null as onboarding_date,
    null as offboarding_date
from distinct_talend_specialist
