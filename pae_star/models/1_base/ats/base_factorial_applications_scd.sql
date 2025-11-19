with 
{{ cdc_scd_source(
    source_name='factorial_ats',
    source_table='ats_applications',
    unique_fields='id',
    scd_fields=['ats_candidate_id', 'ats_job_posting_id', 'ats_application_phase_id'],
    cte_name='scd_applications'
) }}

select
    id as application_id,
    ats_candidate_id,
    ats_job_posting_id,
    ats_application_phase_id,
    cast(effective_from as date) as effective_from,
    cast(effective_to as date) as effective_to,
    is_current
from scd_applications
order by id, effective_from