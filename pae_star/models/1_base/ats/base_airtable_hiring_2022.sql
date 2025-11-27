with hp_2022 as (
    select *
    from {{ source('factorial_ats', "airbyte_airtable_recruitment_2022_tbl0mlnobj9gg8c0v") }}
),

deduped as (
    select *,
        row_number() over (partition by id order by _airbyte_generation_id desc) as rn
    from hp_2022
)

select 
    'yeye' as id,
    name as hiring_process_role,
    seniority,
    opened_on as text_opened_on,
    closed_on as text_closed_on,
    opened_on as opened_date,
    closed_on as closed_date,
    new_hire_name,
    source as hiring_source,
    closed as is_closed,
    cast(null as varchar) as candidate_personal_email,
    priority,
    talent_specialist,
    cast(null as date) as onboarding_date,
    team,
    specific_team,
    market,
    cast(null as varchar) as position_type,
    manager,
    salary as salary_range,
    cast(null as varchar) as relocation_pack,
    '2022' as file_hiring_year
from deduped
where rn = 1