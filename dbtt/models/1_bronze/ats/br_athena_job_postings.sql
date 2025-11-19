with athena_job_postings as (
    select * from {{ source("athena_ats", "athena_ats_job_postings_dedup") }}
)

select
    jp.id as job_posting_id,
    jp.title as title,
    jp.description as description,
    jp.team_id as team_id,
    jp.status as status,
    jp.location_id as location_id,
    jp.salary_format as salary_format,
    {{ cents_to_currency('jp.salary_from_amount_in_cents') }} as salary_from,
    {{ cents_to_currency('jp.salary_to_amount_in_cents') }} as salary_to

from athena_job_postings as jp
