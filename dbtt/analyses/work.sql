select * from {{ source("athena", "athena_memberships") }};
;

select column_name, data_type
from information_schema.columns
where table_name = 'athena_employees';

-- country,
-- nationality,
-- gender,
-- termination_reason,
-- terminated_on,
-- termination_reasson_type,
-- manager_id,
-- tenure_start_date,
;

;
select column_name, data_type
from information_schema.columns
where table_name = 'athena_contracts_contract_versions';





select * from athena_contracts_contract_versions limit 10;


select * from athena_job_catalog_levels limit 10;



select * from file_hiring_process_2025;


select column_name
from information_schema.columns
where table_name = 'file_offer_letters';



name
opened_on
closed_on
new_hire_name
source
closed
candidate_personal_email
priority
ta_candidate
onboarding_date
team
specific_team
seniority
market
position_type
manager


column_name
sla
ideal_start_date
time_to_fill_
opened_days
fulfilled_sla
closed_week
ats_open
table_7
table_7_(2)

open_month
closed_month

ta_reponsible
quarter
to_close
;
select 
    name AS hiring_process_role,
    seniority,
    opened_on,
    closed_on,
    new_hire_name,
    source,
    closed,
    candidate_personal_email,
    priority,
    talent_specialist AS ta_candidate,
    null as onboarding_date,
    team,
    specific_team,
    market,
    position_type,
    manager,
    salary_range,
    relocation_pack

from file_hiring_process_2024
;




select * from file_offer_letters

;

select column_name
from information_schema.columns
where table_name = 'athena_employees_performance_scores';




select distinct name from athena_employees_performance_scores limit 10;

;

select * from athena_climate_answers_v3 limit 10;

select * from 
;

select * from promotions;


select * from headcount_variation_turnover;



select distinct talent_specialist;



select employee_id from slv_employees where email = 'xavier.hita@factorial.co';

select * from athena_employees limit 10;
select * from athena_airtable_people_todo limit 10;
select * from athena_teams limit 10;

select 
    mem.team_id, 
    te.name as team_name,
    mem.employee_id,
    (regexp_match(_cdc, 'op=([^,}]+)'))[1] as cdc_operation,
    to_timestamp(
        replace((regexp_match(_cdc, 'ts=([^,}]+)'))[1], ' UTC', ''),
        'YYYY-MM-DD HH24:MI:SS.US'
    ) as cdc_timestamp,
    _cdc
from athena_memberships mem 
left join br_athena_teams te
    on mem.team_id = te.team_id

where employee_id = '2306420'
order by cdc_timestamp;
;

select 
* 
from br_athena_memberships_cdc
left join
where employee_id = '2306420' 
order by cdc_timestamp;

select
    emp.email as employee_email,
    manager.email as manager_email,
    man.effective_from,
    man.effective_to,
    man.is_current
from br_athena_employee_managers_cdc man
left join slv_employees emp on emp.employee_id = man.employee_id
left join slv_employees manager on manager.employee_id = man.manager_id
where man.employee_id = '2539855' order by man.effective_from;


select * from slv_employees where email
like 'tania.gon%';




SELECT
    team_id as factorial_id,
    team_name,
    team_level as level,
    team_type as nature
from slv_teams
    where team_name like 'CX%'
;


select
        team_id as factorial_id,
        parent_team_id as factorial_parent_team_id
    from slv_teams
    where parent_team_id is not null;


select
    employee_id as employee_factorial_id,
    team_id as team_factorial_id,
    is_lead as is_lead,
    effective_from as effective_from,
    effective_to as effective_to
from slv_memberships_cdc
;