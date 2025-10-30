with raw_airtable_todos as (
    select * from {{ source("athena", "athena_airtable_people_todo") }}
)

select 
    nombre as first_name,
    apellido as last_name,
    email as email,
    id_empleado as employee_id,
    to_date(NULLIF(fecha_onboarding, ''), 'YYYY-MM-DD') as onboarding_date,
    to_date(NULLIF(fecha_offboarding, ''), 'YYYY-MM-DD') as offboarding_date,
    employee_group,
    main_team,
    team as airtable_team,
    market as airtable_market,
    level as airtable_level,
    role as airtable_role,
    squads as airtable_squads,
    género  as airtable_gender,
    manager_email as airtable_manager_email,
    to_date(NULLIF(fecha_offboarding, ''), 'YYYY-MM-DD') as birthay_date,
    job_position as airtable_job_position,
    level as airtable_job_position_level,
    terminated_reason

from raw_airtable_todos
