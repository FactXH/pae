



select * from athena_ats_candidates where company_id = '1' limit 1;
select * from athena_ats_applications where company_id = '1' limit 1;
select * from athena_as



;
select * from file_airtable_ta_2025 limit 1;


SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'  -- change if needed
  AND table_name   = 'raw_airtable_todos';

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'  -- change if needed
  AND table_name   = 'file_airtable_ta_2025';


select 
    team,
    -- specific_team,
    market,
    count(*)

from file_airtable_ta_2025
where source not in ('Vacancy canceled')  -- job openings que s'han cancelat.
and closed_on is not null
group by 1,
    2
    -- 3
    ;


select count(*)
from file_airtable_ta_2025
where source not in ('Vacancy canceled')  -- job openings que s'han cancelat.
and closed_on is not null
;

select source, count(*)
from file_airtable_ta_2025
where source not in ('Vacancy canceled')  -- job openings que s'han cancelat.
and closed_on is not null
-- and name like '%ngineer%'
group by 1
;


select * from athena_ats_job_postings limit 10;


select * from athena_ats_applications limit 10;


select source, count(*) from file_airtable_ta_2025 group by 1
;

select fecha_onboarding from raw_airtable_todos;
;

-- with 

;
select main_team, 
    CASE WHEN terminated_reason like '%empresa%' THEN 'company' 
         WHEN terminated_reason like '%trabajador%' THEN 'employee'
         ELSE 'altres' END as reason_type,
    count(*)
from athena_airtable_people_todo
where EXTRACT(
        year
        from TO_DATE(fecha_offboarding, 'YYYY-MM-DD')
    ) = 2025
    and fecha_offboarding != ''
    and terminated_reason like 'No superación del periodo de %'
group by 1, 2;



select main_team, nombre, apellido, terminated_reason from athena_airtable_people_todo
where apellido like '%azquez%'


;
select main_team, terminated_reason,
    count(*)
from athena_airtable_people_todo
where EXTRACT(
        year
        from TO_DATE(fecha_onboarding, 'YYYY-MM-DD')
    ) = 2025
    and fecha_offboarding != ''
    and terminated_reason like 'No superación del periodo de prueba (instancia empresa)'
group by 1, 2;

select main_team,
    count(*)
from raw_airtable_todos
where EXTRACT(
        year
        from TO_DATE(fecha_offboarding, 'YYYY-MM-DD')
    ) = 2025
    -- and fecha_offboarding != ''
    -- and terminated_reason like 'No superación del periodo de %'
group by 1;





select terminated_reason, count(*) from raw_airtable_todos group by 1
;


SELECT TO_DATE(opened_on, 'DD/MM/YYYY') as opened_on,
TO_DATE(closed_on, 'MM/DD/YYYY') as closed_on
from file_airtable_ta_2025
where closed_on is null




-- FOTOS
    -- HIRING

    -- HIRES PER TEAM / MARKET  IN AIRTABLE (average time - to - fill)
    -- HIRES PER SOURCE IN AIRTABLE (average time - to - fill)
    -- APPLICANTS PER JOB POSTING (2024 / 2025)
    -- APPLICANTS PER TEAM
    -- APPLICANTS (TOTAL) (distinct persones)
    -- APPLICATIONS PER PERSONS

    -- REJECTION RATES (Offers no acceptades)
    -- REJECTS AFTER ACCEPT (Offers acceptades pero es fan enrere)

    -- PERIODOS DE PRUEBA BY MAIN TEAM


-- DASHBOARD
    -- FUNNEL (POER STAGES (EXERCICI DE GENERALITZAR STAGES))
    -- Hiring QUALITY






;

select distinct termination_reason, termination_reason_type from raw_employees;





SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'  -- change if needed
  AND table_name   = 'raw_airtable_todos';

;

select access_id, id from raw_employees;



select
    answers.*,
    people_todo.manager_email,
    memb.team_name,
    memb.market
from athena_climate_answers_v2 answers
left join raw_employees emp
    on answers.respondent_access_id = emp.access_id
left join raw_airtable_todos people_todo
    on emp.id = people_todo.id_empleado
left join
    employee_memberships memb on memb.employee_id = emp.id;


;
select * from 
br_file_hiring_process



;
select 
    team, 
    market, 
    source, 
    file_hiring_year,
    string_agg(distinct hiring_process_role, ', ') as hiring_process_roles,
    count(*),
    sum(case when closed_on is not null then 1 else 0 end) as total_hires,
    round(AVG(CASE WHEN closed_on IS NOT NULL THEN closed_on - opened_on ELSE NULL END), 2) as avg_time_to_fill
from br_file_hiring_process
where source != 'Vacancy canceled'
group by 1, 2, 3, 4
;
select * from headcount_variation_turnover_extended;




select talend_specialist, 
date_part('year', closed_on) as hiring_year,
date_part('month', closed_on) as hiring_month,
string_agg(distinct hiring_process_role, ', ') as hiring_process_roles,
count(*) from br_file_hiring_process where talend_specialist like 'Ra%' or talend_specialist like 'Carlo%'
group by 1, 2, 3
order by 2 asc, 3 asc;




-- sabado
select talend_specialist, 
count(*)
from br_file_hiring_process 
where opened_on is not null and closed_on is null
and opened_on > '2025-01-01'
group by 1;

;
select ta_reponsible,
count(*)
from
file_hiring_process_2025
where closed_on is null
group BY 1

union all

select 'total' as ta_reponsible,
count(*)
from
file_hiring_process_2025
where closed_on is null
group BY 1

;
select * from file_hiring_process_2025;