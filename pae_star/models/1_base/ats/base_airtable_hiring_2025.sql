with hp_2025 as (
    select *
    from {{ source('factorial_ats', "airbyte_airtable_recruitment_2025_tblprsagyxeegmnpl") }}
),

deduped as (
    select *,
        row_number() over (partition by id order by _airbyte_generation_id desc) as rn
    from hp_2025
)

select
    id,
    name as hiring_process_role,
    seniority,
    opened_on as text_opened_on,
    closed_on as text_closed_on,
    opened_on as opened_date,
    closed_on as closed_date,
    new_hire_name,
    source as hiring_source,
    closed as is_closed,
    candidate_personal_email,
    priority,
    array_join(ta_reponsible, ', ') as talent_specialist,
    onboarding_date,
    team,
    specific_team,
    market,
    position_type,
    manager,
    salary_range,
    relocation_pack,
    '2025' as file_hiring_year
from deduped
where rn = 1
