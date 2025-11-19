with 
{{ cdc_scd_source(
    source_name='athena',
    source_table='employees',
    unique_fields='id',
    scd_fields='manager_id',
    cte_name='scd_employee_managers'
) }}

select
    id as employee_id,
    manager_id,
    cast(effective_from as date) as effective_from,
    cast(effective_to as date) as effective_to,
    is_current
from scd_employee_managers
where manager_id is not null
order by employee_id, effective_from
