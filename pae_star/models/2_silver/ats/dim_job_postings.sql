with job_postings as (
    select * from {{ ref("base_factorial_job_postings") }}
),

job_posting_scd as (
    select * from {{ ref("base_factorial_job_posting_sdc") }}
),

job_posting_title_history as (
    select
        job_posting_id,
        array_join(array_agg(distinct job_posting_title order by job_posting_title), ' / ') as all_titles
    from job_posting_scd
    group by job_posting_id
),

hiring_managers_grouped as (
    select
        job_posting_id,
        array_join(array_agg(case when hm.hiring_role = 'owner' then emp.full_name end), ', ') as owner_emails,
        array_join(array_agg(case when hm.hiring_role = 'reviewer' then emp.full_name end), ', ') as reviewer_emails,
        array_join(array_agg(case when hm.hiring_role = 'editor' then emp.full_name end), ', ') as editor_emails,
        array_join(array_agg(case when hm.hiring_role not in ('owner', 'reviewer', 'editor') then emp.full_name end), ', ') as other_emails
    from {{ ref("base_factorial_hiring_managers") }} hm
    left join {{ ref("dim_employees") }} emp
        on hm.access_id = cast(emp.access_id as bigint)
    group by job_posting_id
),

dim_teams as (
    select * from {{ ref("dim_teams") }}
)

select
    jp.job_posting_id,
    jp.job_posting_title,
    jp.job_posting_description,
    jp.job_posting_contract_type,
    jp.job_posting_status,
    jp.job_posting_schedule_type,
    jp.location_id,
    jp.team_id,
    jp.ats_company_id,
    jp.job_posting_created_at,
    jp.job_posting_updated_at,
    jp.job_posting_salary_format,
    jp.salary_from,
    jp.salary_to,
    jp.job_posting_cv_requirement,
    jp.job_posting_cover_letter_requirement,
    jp.job_posting_phone_requirement,
    jp.job_posting_photo_requirement,
    jp.legal_entity_id,
    jp.job_posting_last_application_notified_at,
    jp.job_posting_personal_url_requirement,
    jp.job_posting_workplace_type,
    jp.job_posting_applications_count,
    jp.job_posting_active_applications_count,
    jp.company_id,
    jp.job_posting_gender_requirement,
    jp.job_posting_salary_period,
    jp.job_posting_published_at,
    jp.job_catalog_level_uuid,
    jp.job_catalog_role_uuid,
    jp.job_catalog_node_roles_uuid,
    jp.job_catalog_node_levels_uuid,
    jp.job_posting_remote,
    jp.job_posting_hide_salary,
    jp.job_posting_new_editor,
    jp.job_posting_allow_internal_apply,
    jp.job_posting_allow_referral,
    hm.owner_emails,
    hm.reviewer_emails,
    hm.editor_emails,
    hm.other_emails as other_hiring_manager_emails,
    dt.team_name,
    jph.all_titles as all_historical_titles,
    jp.last_operation
from job_postings jp
left join job_posting_title_history jph
    on jp.job_posting_id = jph.job_posting_id
left join hiring_managers_grouped hm
    on jp.job_posting_id = hm.job_posting_id
left join dim_teams dt
    on cast(jp.team_id as varchar) = cast(dt.team_id as varchar)