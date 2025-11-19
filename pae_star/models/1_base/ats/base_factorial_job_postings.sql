with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_job_postings', include_deleted=True) }}

select
    id as job_posting_id,
    title as job_posting_title,
    description as job_posting_description,
    contract_type as job_posting_contract_type,
    status as job_posting_status,
    schedule_type as job_posting_schedule_type,
    location_id,
    team_id,
    ats_company_id,
    created_at as job_posting_created_at,
    updated_at as job_posting_updated_at,
    salary_format as job_posting_salary_format,
    {{ cents_to_currency('salary_from_amount_in_cents') }} as salary_from,
    {{ cents_to_currency('salary_to_amount_in_cents') }} as salary_to,
    cv_requirement as job_posting_cv_requirement,
    cover_letter_requirement as job_posting_cover_letter_requirement,
    phone_requirement as job_posting_phone_requirement,
    photo_requirement as job_posting_photo_requirement,
    legal_entity_id,
    last_application_notified_at as job_posting_last_application_notified_at,
    personal_url_requirement as job_posting_personal_url_requirement,
    workplace_type as job_posting_workplace_type,
    applications_count as job_posting_applications_count,
    active_applications_count as job_posting_active_applications_count,
    company_id,
    gender_requirement as job_posting_gender_requirement,
    salary_period as job_posting_salary_period,
    published_at as job_posting_published_at,
    job_catalog_level_uuid,
    job_catalog_role_uuid,
    job_catalog_node_roles_uuid,
    job_catalog_node_levels_uuid,
    remote as job_posting_remote,
    hide_salary as job_posting_hide_salary,
    new_editor as job_posting_new_editor,
    allow_internal_apply as job_posting_allow_internal_apply,
    allow_referral as job_posting_allow_referral,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_ats_job_postings
