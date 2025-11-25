-- =====================================================
-- Climate Survey 2025 Gold Aggregated by Team
-- =====================================================
-- This model aggregates survey responses by team
-- Numeric questions: AVG, COUNT, VARIANCE
-- Text questions: STRING_AGG
-- Single choice questions: STRING_AGG
-- =====================================================

WITH fact_responses AS (
    SELECT * FROM {{ ref('fact_climate_2025') }}
),

teams AS (
    SELECT * FROM {{ ref('dim_teams_climate_2025') }}
),

memberships AS (
    SELECT * FROM {{ ref('dim_memberships_climate_2025') }}
),

employees AS (
    SELECT * FROM {{ ref('dim_employees') }}
),

responses_with_teams AS (
    SELECT 
        f.*,
        m.team_id,
        t.team_name,
        t.employee_count,
        e.full_name
    FROM fact_responses f
    INNER JOIN employees e ON f.question_respondent_access_id = e.access_id
    INNER JOIN memberships m ON CAST(e.employee_id AS BIGINT) = m.employee_id
    INNER JOIN teams t ON m.team_id = t.team_id
)

SELECT
    team_id,
    team_name,

    employee_count as team_employee_count,

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
    END) AS team_respondent_count,
    
    

    -- Numeric questions: AVG, COUNT, VARIANCE
    ROUND(AVG(CAST(accomplishments_recognised AS DOUBLE)), 2) AS avg_accomplishments_recognised,
    COUNT(accomplishments_recognised) AS count_accomplishments_recognised,
    VAR_SAMP(CAST(accomplishments_recognised AS DOUBLE)) AS var_accomplishments_recognised,
    
    ROUND(AVG(CAST(workspace_environment AS DOUBLE)), 2) AS avg_workspace_environment,
    COUNT(workspace_environment) AS count_workspace_environment,
    VAR_SAMP(CAST(workspace_environment AS DOUBLE)) AS var_workspace_environment,
    
    ROUND(AVG(CAST(great_place_to_work AS DOUBLE)), 2) AS avg_great_place_to_work,
    COUNT(great_place_to_work) AS count_great_place_to_work,
    VAR_SAMP(CAST(great_place_to_work AS DOUBLE)) AS var_great_place_to_work,
    
    ROUND(AVG(CAST(culture_and_values_practiced AS DOUBLE)), 2) AS avg_culture_and_values_practiced,
    COUNT(culture_and_values_practiced) AS count_culture_and_values_practiced,
    VAR_SAMP(CAST(culture_and_values_practiced AS DOUBLE)) AS var_culture_and_values_practiced,
    
    ROUND(AVG(CAST(compensation_transparency AS DOUBLE)), 2) AS avg_compensation_transparency,
    COUNT(compensation_transparency) AS count_compensation_transparency,
    VAR_SAMP(CAST(compensation_transparency AS DOUBLE)) AS var_compensation_transparency,
    
    ROUND(AVG(CAST(policies_transparent AS DOUBLE)), 2) AS avg_policies_transparent,
    COUNT(policies_transparent) AS count_policies_transparent,
    VAR_SAMP(CAST(policies_transparent AS DOUBLE)) AS var_policies_transparent,
    
    ROUND(AVG(CAST(trust_leaders AS DOUBLE)), 2) AS avg_trust_leaders,
    COUNT(trust_leaders) AS count_trust_leaders,
    VAR_SAMP(CAST(trust_leaders AS DOUBLE)) AS var_trust_leaders,
    
    ROUND(AVG(CAST(leaders_inspire AS DOUBLE)), 2) AS avg_leaders_inspire,
    COUNT(leaders_inspire) AS count_leaders_inspire,
    VAR_SAMP(CAST(leaders_inspire AS DOUBLE)) AS var_leaders_inspire,
    
    ROUND(AVG(CAST(social_events AS DOUBLE)), 2) AS avg_social_events,
    COUNT(social_events) AS count_social_events,
    VAR_SAMP(CAST(social_events AS DOUBLE)) AS var_social_events,
    
    ROUND(AVG(CAST(good_decision_to_join AS DOUBLE)), 2) AS avg_good_decision_to_join,
    COUNT(good_decision_to_join) AS count_good_decision_to_join,
    VAR_SAMP(CAST(good_decision_to_join AS DOUBLE)) AS var_good_decision_to_join,
    
    ROUND(AVG(CAST(contributions_valuable AS DOUBLE)), 2) AS avg_contributions_valuable,
    COUNT(contributions_valuable) AS count_contributions_valuable,
    VAR_SAMP(CAST(contributions_valuable AS DOUBLE)) AS var_contributions_valuable,
    
    ROUND(AVG(CAST(contribution_balance AS DOUBLE)), 2) AS avg_contribution_balance,
    COUNT(contribution_balance) AS count_contribution_balance,
    VAR_SAMP(CAST(contribution_balance AS DOUBLE)) AS var_contribution_balance,
    
    ROUND(AVG(CAST(meaningful_conversations AS DOUBLE)), 2) AS avg_meaningful_conversations,
    COUNT(meaningful_conversations) AS count_meaningful_conversations,
    VAR_SAMP(CAST(meaningful_conversations AS DOUBLE)) AS var_meaningful_conversations,
    
    ROUND(AVG(CAST(nps_score AS DOUBLE)), 2) AS avg_nps_score,
    COUNT(nps_score) AS count_nps_score,
    VAR_SAMP(CAST(nps_score AS DOUBLE)) AS var_nps_score,
    
    ROUND(AVG(CAST(growth_confidence AS DOUBLE)), 2) AS avg_growth_confidence,
    COUNT(growth_confidence) AS count_growth_confidence,
    VAR_SAMP(CAST(growth_confidence AS DOUBLE)) AS var_growth_confidence,
    
    ROUND(AVG(CAST(leaders_communication AS DOUBLE)), 2) AS avg_leaders_communication,
    COUNT(leaders_communication) AS count_leaders_communication,
    VAR_SAMP(CAST(leaders_communication AS DOUBLE)) AS var_leaders_communication,
    
    ROUND(AVG(CAST(envision_staying AS DOUBLE)), 2) AS avg_envision_staying,
    COUNT(envision_staying) AS count_envision_staying,
    VAR_SAMP(CAST(envision_staying AS DOUBLE)) AS var_envision_staying,
    
    ROUND(AVG(CAST(proud_to_be_part AS DOUBLE)), 2) AS avg_proud_to_be_part,
    COUNT(proud_to_be_part) AS count_proud_to_be_part,
    VAR_SAMP(CAST(proud_to_be_part AS DOUBLE)) AS var_proud_to_be_part,
    
    ROUND(AVG(CAST(competitive_benefits AS DOUBLE)), 2) AS avg_competitive_benefits,
    COUNT(competitive_benefits) AS count_competitive_benefits,
    VAR_SAMP(CAST(competitive_benefits AS DOUBLE)) AS var_competitive_benefits,
    
    ROUND(AVG(CAST(company_communications AS DOUBLE)), 2) AS avg_company_communications,
    COUNT(company_communications) AS count_company_communications,
    VAR_SAMP(CAST(company_communications AS DOUBLE)) AS var_company_communications,
    
    ROUND(AVG(CAST(performance_evaluations_fair AS DOUBLE)), 2) AS avg_performance_evaluations_fair,
    COUNT(performance_evaluations_fair) AS count_performance_evaluations_fair,
    VAR_SAMP(CAST(performance_evaluations_fair AS DOUBLE)) AS var_performance_evaluations_fair,
    
    ROUND(AVG(CAST(initiative_and_goals AS DOUBLE)), 2) AS avg_initiative_and_goals,
    COUNT(initiative_and_goals) AS count_initiative_and_goals,
    VAR_SAMP(CAST(initiative_and_goals AS DOUBLE)) AS var_initiative_and_goals,
    
    ROUND(AVG(CAST(work_life_balance AS DOUBLE)), 2) AS avg_work_life_balance,
    COUNT(work_life_balance) AS count_work_life_balance,
    VAR_SAMP(CAST(work_life_balance AS DOUBLE)) AS var_work_life_balance,
    
    -- Text questions: ARRAY_AGG
    ARRAY_JOIN(ARRAY_AGG(grateful_for), ' | ') AS all_grateful_for,
    ARRAY_JOIN(ARRAY_AGG(would_like_to_see_more), ' | ') AS all_would_like_to_see_more,
    ARRAY_JOIN(ARRAY_AGG(additional_feedback), ' | ') AS all_additional_feedback,
    
    -- Single choice questions: ARRAY_AGG
    ARRAY_JOIN(ARRAY_AGG(tenure), ' | ') AS all_tenure,
    ARRAY_JOIN(ARRAY_AGG(gender), ' | ') AS all_gender,
    
    -- Employee names: ARRAY_AGG
    ARRAY_AGG(full_name) AS employee_names

FROM responses_with_teams
GROUP BY team_id, team_name, employee_count
ORDER BY team_name
