-- select count(DISTINCT email) from athena_airtable_people_todo

select count(*) from athena_airtable_people_todo
;
-- select count(*) from athena_memberships
;

select 
    'airtable' as source,
    count(*) as total_employees, 
    sum(case when fecha_offboarding = '' then 1 else 0 end) as active_employees
from athena_airtable_people_todo
union all
select
'factorial' as source,
count(*) as total_employees, 
sum(case when terminated_on != '' then 0 else 1 END)
as active_employees
from raw_employees
;

select email, manager_email, id_empleado from athena_airtable_people_todo
;

select email, manager_email, id_empleado from athena_airtable_people_todo
where manager_email = '';
;

select * from manager_reports where report_email like 'florencia.cuello@factorial.co';

;
select access_id, id from athena_employees
;

select * from 



;
select * from athena_employees limit 1
;

with employees_ as 
(
    select *
    from (
        select *,
            row_number() over (partition by id order by _event_ts desc) rn
        from athena_employees
    ) sub
    where rn = 1 and (sub._cdc.op is null or sub._cdc.op =! 'D')
)
;

select respondent_access_id from athena_climate_answers;
;

select 
    man.manager_email, 
    question, 
    answer_cents_value, 
    answer_boolean_value, 
    answer_long_text_value, 
    answer_single_choice_value
from athena_climate_answers ans
left join raw_employees emp 
    on ans.respondent_access_id = emp.access_id
left join manager_reports man 
    on emp.id = man.report_id
where manager_email is not NULL
    and emp.access_id = '1827667'
;


select teams, count(*) from athena_airtable_people_todo 
where fecha_offboarding = '' group by 1

;
select * from raw_teams


;
select nombre, apellido from athena_airtable_people_todo  todo
left join raw_







where fecha_offboarding = '' group by 1;



;
select * from employee_memberships where team_name is not null and market is not null




;


select * from file_airtable_ta_2024 limit 10;
select * from file_airtable_ta_2025 limit 10;