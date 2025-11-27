-- =====================================================
-- Climate Survey 2025 Gold Aggregated by Manager-Level
-- =====================================================
-- This model aggregates survey responses by manager and reporting level
-- showing averages, counts, and variances for each manager-level combination
-- =====================================================

WITH fact_responses AS (
    SELECT * FROM {{ ref('fact_climate_2025') }}
),

dim_managers AS (
    SELECT * FROM {{ ref('dim_managers_climate_2025') }}
),

employees AS (
    SELECT * FROM {{ ref('dim_employees') }}
),

-- Explode the employee_ids array to get one row per manager-level-employee
manager_level_employees AS (
    SELECT 
        dm.manager_employee_id,
        dm.manager_full_name,
        dm.manager_email,
        dm.reporting_level,
        dm.level_employee_count,
        employee_id_bigint
    FROM dim_managers dm
    CROSS JOIN UNNEST(dm.level_employee_ids) AS t(employee_id_bigint)
),

responses_with_manager_level AS (
    SELECT 
        f.*,
        mle.manager_employee_id,
        mle.manager_full_name,
        mle.manager_email,
        mle.reporting_level,
        mle.level_employee_count
    FROM fact_responses f
    INNER JOIN employees e ON f.question_respondent_access_id = e.access_id
    INNER JOIN manager_level_employees mle ON mle.employee_id_bigint = e.employee_id
)

SELECT
    manager_employee_id,
    manager_full_name,
    manager_email,
    reporting_level,
    level_employee_count,

    COUNT(DISTINCT CASE 
        WHEN accomplishments_recognised IS NOT NULL 
            OR workspace_environment IS NOT NULL 
            OR great_place_to_work IS NOT NULL 
            OR grateful_for IS NOT NULL 
            OR would_like_to_see_more IS NOT NULL 
            OR culture_and_values_practiced IS NOT NULL 
            OR compensation_transparency IS NOT NULL 
            OR policies_transparent IS NOT NULL 
            OR trust_leaders IS NOT NULL 
            OR leaders_inspire IS NOT NULL 
            OR social_events IS NOT NULL 
            OR team IS NOT NULL 
            OR tenure IS NOT NULL 
            OR good_decision_to_join IS NOT NULL 
            OR contributions_valuable IS NOT NULL 
            OR contribution_balance IS NOT NULL 
            OR meaningful_conversations IS NOT NULL 
            OR nps_score IS NOT NULL 
            OR growth_confidence IS NOT NULL 
            OR leaders_communication IS NOT NULL 
            OR envision_staying IS NOT NULL 
            OR proud_to_be_part IS NOT NULL 
            OR competitive_benefits IS NOT NULL 
            OR company_communications IS NOT NULL 
            OR additional_feedback IS NOT NULL 
            OR performance_evaluations_fair IS NOT NULL 
            OR initiative_and_goals IS NOT NULL 
            OR work_life_balance IS NOT NULL 
            OR gender IS NOT NULL
        THEN question_respondent_access_id 
    END) AS respondent_count,

    -- Numeric questions: AVG, COUNT, VARIANCE
    ROUND(AVG(CAST(accomplishments_recognised AS DOUBLE)), 2) AS avg_accomplishments_recognised,
    COUNT(accomplishments_recognised) AS count_accomplishments_recognised,
    ROUND(VAR_SAMP(CAST(accomplishments_recognised AS DOUBLE)), 2) AS var_accomplishments_recognised,
    
    ROUND(AVG(CAST(workspace_environment AS DOUBLE)), 2) AS avg_workspace_environment,
    COUNT(workspace_environment) AS count_workspace_environment,
    ROUND(VAR_SAMP(CAST(workspace_environment AS DOUBLE)), 2) AS var_workspace_environment,
    
    ROUND(AVG(CAST(great_place_to_work AS DOUBLE)), 2) AS avg_great_place_to_work,
    COUNT(great_place_to_work) AS count_great_place_to_work,
    ROUND(VAR_SAMP(CAST(great_place_to_work AS DOUBLE)), 2) AS var_great_place_to_work,
    
    ROUND(AVG(CAST(culture_and_values_practiced AS DOUBLE)), 2) AS avg_culture_and_values_practiced,
    COUNT(culture_and_values_practiced) AS count_culture_and_values_practiced,
    ROUND(VAR_SAMP(CAST(culture_and_values_practiced AS DOUBLE)), 2) AS var_culture_and_values_practiced,
    
    ROUND(AVG(CAST(compensation_transparency AS DOUBLE)), 2) AS avg_compensation_transparency,
    COUNT(compensation_transparency) AS count_compensation_transparency,
    ROUND(VAR_SAMP(CAST(compensation_transparency AS DOUBLE)), 2) AS var_compensation_transparency,
    
    ROUND(AVG(CAST(policies_transparent AS DOUBLE)), 2) AS avg_policies_transparent,
    COUNT(policies_transparent) AS count_policies_transparent,
    ROUND(VAR_SAMP(CAST(policies_transparent AS DOUBLE)), 2) AS var_policies_transparent,
    
    ROUND(AVG(CAST(trust_leaders AS DOUBLE)), 2) AS avg_trust_leaders,
    COUNT(trust_leaders) AS count_trust_leaders,
    ROUND(VAR_SAMP(CAST(trust_leaders AS DOUBLE)), 2) AS var_trust_leaders,
    
    ROUND(AVG(CAST(leaders_inspire AS DOUBLE)), 2) AS avg_leaders_inspire,
    COUNT(leaders_inspire) AS count_leaders_inspire,
    ROUND(VAR_SAMP(CAST(leaders_inspire AS DOUBLE)), 2) AS var_leaders_inspire,
    
    ROUND(AVG(CAST(social_events AS DOUBLE)), 2) AS avg_social_events,
    COUNT(social_events) AS count_social_events,
    ROUND(VAR_SAMP(CAST(social_events AS DOUBLE)), 2) AS var_social_events,
    
    ROUND(AVG(CAST(good_decision_to_join AS DOUBLE)), 2) AS avg_good_decision_to_join,
    COUNT(good_decision_to_join) AS count_good_decision_to_join,
    ROUND(VAR_SAMP(CAST(good_decision_to_join AS DOUBLE)), 2) AS var_good_decision_to_join,
    
    ROUND(AVG(CAST(contributions_valuable AS DOUBLE)), 2) AS avg_contributions_valuable,
    COUNT(contributions_valuable) AS count_contributions_valuable,
    ROUND(VAR_SAMP(CAST(contributions_valuable AS DOUBLE)), 2) AS var_contributions_valuable,
    
    ROUND(AVG(CAST(contribution_balance AS DOUBLE)), 2) AS avg_contribution_balance,
    COUNT(contribution_balance) AS count_contribution_balance,
    ROUND(VAR_SAMP(CAST(contribution_balance AS DOUBLE)), 2) AS var_contribution_balance,
    
    ROUND(AVG(CAST(meaningful_conversations AS DOUBLE)), 2) AS avg_meaningful_conversations,
    COUNT(meaningful_conversations) AS count_meaningful_conversations,
    ROUND(VAR_SAMP(CAST(meaningful_conversations AS DOUBLE)), 2) AS var_meaningful_conversations,
    
    ROUND(AVG(CAST(nps_score AS DOUBLE)), 2) AS avg_nps_score,
    COUNT(nps_score) AS count_nps_score,
    ROUND(VAR_SAMP(CAST(nps_score AS DOUBLE)), 2) AS var_nps_score,
    
    ROUND(AVG(CAST(growth_confidence AS DOUBLE)), 2) AS avg_growth_confidence,
    COUNT(growth_confidence) AS count_growth_confidence,
    ROUND(VAR_SAMP(CAST(growth_confidence AS DOUBLE)), 2) AS var_growth_confidence,
    
    ROUND(AVG(CAST(leaders_communication AS DOUBLE)), 2) AS avg_leaders_communication,
    COUNT(leaders_communication) AS count_leaders_communication,
    ROUND(VAR_SAMP(CAST(leaders_communication AS DOUBLE)), 2) AS var_leaders_communication,
    
    ROUND(AVG(CAST(envision_staying AS DOUBLE)), 2) AS avg_envision_staying,
    COUNT(envision_staying) AS count_envision_staying,
    ROUND(VAR_SAMP(CAST(envision_staying AS DOUBLE)), 2) AS var_envision_staying,
    
    ROUND(AVG(CAST(proud_to_be_part AS DOUBLE)), 2) AS avg_proud_to_be_part,
    COUNT(proud_to_be_part) AS count_proud_to_be_part,
    ROUND(VAR_SAMP(CAST(proud_to_be_part AS DOUBLE)), 2) AS var_proud_to_be_part,
    
    ROUND(AVG(CAST(competitive_benefits AS DOUBLE)), 2) AS avg_competitive_benefits,
    COUNT(competitive_benefits) AS count_competitive_benefits,
    ROUND(VAR_SAMP(CAST(competitive_benefits AS DOUBLE)), 2) AS var_competitive_benefits,
    
    ROUND(AVG(CAST(company_communications AS DOUBLE)), 2) AS avg_company_communications,
    COUNT(company_communications) AS count_company_communications,
    ROUND(VAR_SAMP(CAST(company_communications AS DOUBLE)), 2) AS var_company_communications,
    
    ROUND(AVG(CAST(performance_evaluations_fair AS DOUBLE)), 2) AS avg_performance_evaluations_fair,
    COUNT(performance_evaluations_fair) AS count_performance_evaluations_fair,
    ROUND(VAR_SAMP(CAST(performance_evaluations_fair AS DOUBLE)), 2) AS var_performance_evaluations_fair,
    
    ROUND(AVG(CAST(initiative_and_goals AS DOUBLE)), 2) AS avg_initiative_and_goals,
    COUNT(initiative_and_goals) AS count_initiative_and_goals,
    ROUND(VAR_SAMP(CAST(initiative_and_goals AS DOUBLE)), 2) AS var_initiative_and_goals,
    
    ROUND(AVG(CAST(work_life_balance AS DOUBLE)), 2) AS avg_work_life_balance,
    COUNT(work_life_balance) AS count_work_life_balance,
    ROUND(VAR_SAMP(CAST(work_life_balance AS DOUBLE)), 2) AS var_work_life_balance

FROM responses_with_manager_level
GROUP BY 
    manager_employee_id,
    manager_full_name,
    manager_email,
    reporting_level,
    level_employee_count
ORDER BY manager_full_name, reporting_level
