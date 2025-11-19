with job_postings as (
    select * from {{ ref("br_athena_job_postings") }}
),
hiring_managers_grouped as (
    select
        job_posting_id,
        string_agg(case when hm.hiring_role = 'owner' then emp.email end, ',') as owner_emails,
        string_agg(case when hm.hiring_role = 'reviewer' then emp.email end, ',') as reviewer_emails,
        string_agg(case when hm.hiring_role = 'editor' then emp.email end, ',') as editor_emails,
        string_agg(case when hm.hiring_role not in ('owner', 'reviewer', 'editor') then emp.email end, ',') as other_emails
    from {{ ref("br_athena_hiring_managers") }} hm
    left join {{ ref("dim_employees") }} emp
        on hm.access_id = emp.access_id
    group by job_posting_id
),

dim_teams as (
    select * from {{ ref("dim_teams") }}
)

select
    jp.job_posting_id,
    jp.title,
    jp.description,
    jp.team_id,
    jp.status,
    jp.location_id,
    jp.salary_format,
    jp.salary_from,
    jp.salary_to,
    hm.owner_emails as owner_emails,
    hm.reviewer_emails as reviewer_emails,
    hm.editor_emails as editor_emails,
    hm.other_emails as other_hiring_manager_emails,
    dt.team_name as team_name
from job_postings as jp
left join hiring_managers_grouped as hm
    on jp.job_posting_id = hm.job_posting_id
left join dim_teams as dt
    on jp.team_id = dt.team_id