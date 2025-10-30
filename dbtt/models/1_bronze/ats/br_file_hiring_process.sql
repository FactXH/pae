with hp_2025 as (
    select *
    from {{ source('files', "file_hiring_process_2025") }}
),

hp_2024 as (
    select *
    from {{ source('files', "file_hiring_process_2024") }}
)

select name AS hiring_process_role,
    seniority,
    opened_on as text_opened_on,
    closed_on as text_closed_on,
    to_date(NULLIF(opened_on, ''), 'DD/MM/YYYY') as opened_on,
    to_date(NULLIF(closed_on, ''), 'MM/DD/YYYY') as closed_on,
    new_hire_name,
    source,
    closed,
    candidate_personal_email,
    priority,
    ta_reponsible as talend_specialist,
    onboarding_date,
    team,
    specific_team,
    market,
    position_type,
    manager,
    salary_range,
    relocation_pack,
    '2025' as file_hiring_year
from hp_2025
union ALL
select name AS hiring_process_role,
    seniority,
    opened_on as text_opened_on,
    closed_on as text_closed_on,
    to_date(NULLIF(opened_on, ''), 'DD/MM/YYYY') as opened_on,
    to_date(NULLIF(closed_on, ''), 'MM/DD/YYYY') as closed_on,
    new_hire_name,
    source,
    closed,
    candidate_personal_email,
    priority,
    talent_specialist,
    null as onboarding_date,
    team,
    specific_team,
    market,
    position_type,
    manager,
    salary_range,
    relocation_pack,
    '2024' as file_hiring_year
from hp_2024