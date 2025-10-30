
with 


select main_team, 
    CASE WHEN terminated_reason like '%empresa%' THEN 'company' 
         WHEN terminated_reason like '%trabajador%' THEN 'employee'
         ELSE 'altres' END as reason_type,
    count(*)
from athena_airtable_people_todo
where EXTRACT(
        year
        from TO_DATE(fecha_onboarding, 'YYYY-MM-DD')
    ) = 2025
    and fecha_offboarding != ''
    and terminated_reason like 'No superación del periodo de %'
group by 1, 2;