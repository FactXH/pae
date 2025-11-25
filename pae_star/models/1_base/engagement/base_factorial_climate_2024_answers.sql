-- =====================================================
-- Climate Survey 2024 Answers Base Model
-- =====================================================
-- This model extracts and joins survey form data with question groups,
-- question configurations, and custom field values for Climate Survey 2024
-- =====================================================

With 
        -- Deduplicate surveys_forms table (keeping latest record per id)
        deduped_surveys_forms as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM {{ source('engagement', 'surveys_forms') }}
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        -- Filter for Climate Survey 2024 (id = TBD - update with correct ID)
        climate_survey_2024 as (
        Select sf.*
        From deduped_surveys_forms  sf
        Where id = 233598  -- TODO: Replace with correct 2024 survey ID
        ),

        -- Deduplicate surveys_question_group_configs table
        deduped_question_group_configs as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM {{ source('engagement', 'surveys_question_group_configs') }}
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        -- Deduplicate surveys_groups table
        deduped_surveys_groups as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM {{ source('engagement', 'surveys_groups') }}
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        -- Deduplicate surveys_question_groups table
        deduped_question_groups as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM {{ source('engagement', 'surveys_question_groups') }}
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        -- Deduplicate surveys_question_configs table
        deduped_question_configs as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM {{ source('engagement', 'surveys_question_configs') }}
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        -- Deduplicate custom_fields_fields table
        deduped_custom_fields as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM {{ source('engagement', 'custom_fields_fields') }}
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        -- Deduplicate custom_fields_values table
        deduped_custom_field_values as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM {{ source('engagement', 'custom_fields_values') }}
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        -- Join survey form with question groups and configs
        survey_question_groups_joined as (
        Select
            sf.id review_id, 
            sf.company_id company_id,
            sf.created_at review_created_at,
            sf.updated_at review_updated_at,
            sf.name review_name,
            sf.schedule review_schedule,
            sf.anonymous review_anonymous,
            sf.multi_response review_multi_response,
            sf.access_id review_creator_access_id,
            sf.start_on review_start_on,
            sf.end_on review_end_on,
            sf.hide_answers_for_target review_hide_answers_for_target,
            sf.show_reviews_to_managers review_show_reviews_to_managers,
            sf.visible_to_managers review_visible_to_managers,
            sf.frequency review_frequency,
            sf.scheduled_time review_scheduled_time,
            sf.status review_status,
            sf.scheduled_week_number review_scheduled_week_number,
            sf.duration_in_days review_duration_in_days,
            sf.notify_respondents review_notify_respondents,
            sf.question_groups_count review_total_questions,
            sf.answered_question_groups_count review_total_answers,
            sf.source review_source,
            sg.name review_realtion,
            sqg.id question_group_id,
            sqg.created_at question_created_at,
            sqg.end_on question_end_on,
            sqg.updated_at question_updated_at,
            sqg.answered_at question_answered_at,
            sqg.respondent_id question_respondent_access_id,
            sqg.target_id question_target_access_id,
            sqg.drafted_at question_drafted_at,
            sqg.cycle_id,
            sqgc.id question_group_configs_id
        FROM climate_survey_2024 sf
        Left join deduped_question_group_configs sqgc ON sqgc.surveys_form_id = sf.id
        Left join deduped_surveys_groups sg ON sg.id = sqgc.respondent_id
        Left JOIN deduped_question_groups sqg ON sqgc.id = sqg.surveys_question_group_config_id
        Order by company_id, review_id, sqg.respondent_id
        ),

        -- Join with question configs and custom field values to get complete survey responses
        survey_responses_with_custom_fields as (
        Select 
            base.review_id,
            base.company_id as company_id_,
            base.question_respondent_access_id,
            base.question_target_access_id,
            base.question_answered_at,
            base.question_group_id,
            base.question_group_configs_id,
            qc.id question_configs_id,
            cff.label_text,
            cff.field_type,
            cff.min_value, 
            cff.max_value, 
            cfv.*
        From survey_question_groups_joined base
        Left Join deduped_question_configs qc On qc.surveys_question_group_config_id = base.question_group_configs_id
        Left Join {{ source('engagement', 'custom_fields_resource_fields') }} frf ON frf.fieldable_id = qc.id and frf.fieldable_type like 'Surveys::QuestionConfig'
        Left Join deduped_custom_fields cff ON cff.id = frf.custom_fields_fields_id
        Left Join deduped_custom_field_values cfv ON cfv.custom_fields_fields_id = cff.id and  cfv.custom_field_valuable_id = base.question_group_id
        Where base.company_id = 1
        Order by 1,3,4,5,6,7
        )

-- Final output: All survey responses with custom field values
select * from survey_responses_with_custom_fields
