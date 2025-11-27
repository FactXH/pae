-- =====================================================
-- Employee Facts with Climate Survey 2025 Responses
-- =====================================================
-- One row per employee with their latest climate survey response
-- =====================================================

WITH employee_facts AS (
    SELECT
        employee_id,
        full_name,
        email,
        is_active,
        onboarding_date,
        airtable_main_team,
        athena_manager_full_name,
        last_role_level_name,
        current_salary_amount,
        distinct_salaries_2025
    FROM data_lake_dev_xavi_silver.fact_employees
    WHERE is_active = true
),

climate_responses AS (
    SELECT
        question_respondent_access_id,
        question_answered_at,
        
        -- Convert text answers to numeric where possible (1-5 scale)
        CAST(accomplishments_recognised AS DOUBLE) AS accomplishments_recognised,
        CAST(workspace_environment AS DOUBLE) AS workspace_environment,
        CAST(great_place_to_work AS DOUBLE) AS great_place_to_work,
        CAST(culture_and_values_practiced AS DOUBLE) AS culture_and_values_practiced,
        CAST(trust_leaders AS DOUBLE) AS trust_leaders,
        CAST(leaders_inspire AS DOUBLE) AS leaders_inspire,
        CAST(good_decision_to_join AS DOUBLE) AS good_decision_to_join,
        CAST(contributions_valuable AS DOUBLE) AS contributions_valuable,
        CAST(contribution_balance AS DOUBLE) AS contribution_balance,
        CAST(meaningful_conversations AS DOUBLE) AS meaningful_conversations,
        CAST(nps_score AS DOUBLE) AS nps_score,
        CAST(growth_confidence AS DOUBLE) AS growth_confidence,
        CAST(leaders_communication AS DOUBLE) AS leaders_communication,
        CAST(envision_staying AS DOUBLE) AS envision_staying,
        CAST(proud_to_be_part AS DOUBLE) AS proud_to_be_part,
        
        -- Text fields
        grateful_for,
        would_like_to_see_more,
        additional_feedback,
        
        -- Metadata
        ROW_NUMBER() OVER (
            PARTITION BY question_respondent_access_id 
            ORDER BY question_answered_at DESC
        ) AS rn
    FROM data_lake_dev_xavi_silver.fact_climate_2025
),

latest_climate_responses AS (
    SELECT *
    FROM climate_responses
    WHERE rn = 1
)

SELECT
    -- Employee dimensions
    emp.employee_id AS employee_id__dim,
    emp.full_name AS employee_name__dim,
    emp.airtable_main_team AS team__dim,
    emp.athena_manager_full_name AS manager__dim,
    emp.last_role_level_name AS role__dim,
    
    -- Employee facts
    1 AS employee_count__count__sum,
    emp.current_salary_amount AS salary__metricbignumber__avg,
    emp.distinct_salaries_2025 AS salary_changes__count__sum,
    
    -- Climate survey metrics (1-5 scale, use PCT aggregation for weighted average)
    climate.accomplishments_recognised AS accomplishments__metric__pct,
    climate.workspace_environment AS workspace__metric__pct,
    climate.great_place_to_work AS great_place__metric__pct,
    climate.culture_and_values_practiced AS culture_values__metric__pct,
    climate.trust_leaders AS trust_leaders__metric__pct,
    climate.leaders_inspire AS leaders_inspire__metric__pct,
    climate.good_decision_to_join AS good_decision__metric__pct,
    climate.contributions_valuable AS contributions__metric__pct,
    climate.contribution_balance AS balance__metric__pct,
    climate.meaningful_conversations AS conversations__metric__pct,
    climate.nps_score AS nps__metric__avg,
    climate.growth_confidence AS growth__metric__pct,
    climate.leaders_communication AS communication__metric__pct,
    climate.envision_staying AS envision_staying__metric__pct,
    climate.proud_to_be_part AS proud__metric__pct,
    
    -- Survey participation
    CASE WHEN climate.question_respondent_access_id IS NOT NULL THEN 1 ELSE 0 END AS has_response__count__sum,
    
    -- Text responses (for reference, not aggregated)
    climate.grateful_for,
    climate.would_like_to_see_more,
    climate.additional_feedback

FROM employee_facts emp
LEFT JOIN latest_climate_responses climate
    ON emp.employee_id = climate.question_respondent_access_id

ORDER BY emp.airtable_main_team, emp.athena_manager_full_name, emp.full_name
