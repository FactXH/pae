with 
{{ cdc_scd_source(
    source_name='factorial_ats',
    source_table='ats_job_postings',
    unique_fields='id',
    scd_fields=['title', 'status'],
    cte_name='scd_job_postings'
) }}

select
    id as job_posting_id,
    title as job_posting_title,
    status as job_posting_status,
    cast(effective_from as date) as effective_from,
    cast(effective_to as date) as effective_to,
    is_current
from scd_job_postings
order by id, effective_from