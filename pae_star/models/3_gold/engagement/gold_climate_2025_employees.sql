-- =====================================================
-- Gold Climate 2025 Employees View
-- =====================================================
-- Combines employee data with climate survey responses
-- One row per employee (no duplicates)
-- Includes all employee attributes and climate answers for Power BI
-- =====================================================

WITH employees AS (
    SELECT * FROM {{ ref('fact_employees') }}
),

climate_answers AS (
    SELECT * FROM {{ ref('fact_climate_2025') }}
),

-- Get one climate answer per employee (in case there are duplicates, take the latest)
climate_deduped AS (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY question_respondent_access_id 
            ORDER BY question_answered_at DESC
        ) AS rn
    FROM climate_answers
),

climate_one_per_employee AS (
    SELECT 
        question_respondent_access_id,
        question_target_access_id,
        question_answered_at,
        question_group_id,
        accomplishments_recognised,
        workspace_environment,
        great_place_to_work,
        grateful_for,
        would_like_to_see_more,
        culture_and_values_practiced,
        compensation_transparency,
        policies_transparent,
        trust_leaders,
        leaders_inspire,
        social_events,
        team AS climate_team,
        tenure AS climate_tenure,
        good_decision_to_join,
        contributions_valuable,
        contribution_balance,
        meaningful_conversations,
        nps_score,
        growth_confidence,
        leaders_communication,
        envision_staying,
        proud_to_be_part,
        competitive_benefits,
        company_communications,
        additional_feedback,
        performance_evaluations_fair,
        initiative_and_goals,
        work_life_balance,
        gender AS climate_gender
    FROM climate_deduped
    WHERE rn = 1
),

-- Join employees with climate data
employees_with_climate AS (
    SELECT 
        -- Employee core information
        emp.employee_id,
        emp.xapt_id,
        emp.access_id,
        emp.email,
        emp.first_name,
        emp.last_name,
        emp.full_name,
        emp.onboarding_date,
        emp.offboarding_date,
        emp.tenure_start_date,
        emp.match_status,
        emp.is_active,
        
        -- Manager information
        emp.athena_manager_id,
        emp.athena_manager_email,
        emp.airtable_manager_email,
        emp.airtable_main_team,
        
        -- Contract information
        emp.first_effective_date,
        emp.first_role_level_name,
        emp.first_job_catalog_level_id,
        emp.last_effective_to,
        emp.last_role_level_name,
        emp.last_job_catalog_level_id,
        emp.current_salary_amount,
        emp.all_roles,
        emp.all_salaries,
        emp.nr_contracts,
        
        -- Team information
        emp.all_current_teams,
        emp.lowest_level_team_name,
        emp.lowest_level_team_level,
        emp.lowest_level_parent_team_name,
        
        -- Team information from climate 2025 survey (snapshot)
        emp.lowest_level_team_name_climate_2025,
        emp.lowest_level_team_level_climate_2025,
        emp.lowest_level_parent_team_name_climate_2025,
        
        -- Market information (if assigned)
        emp.current_market_name,
        emp.current_market_level,
        
        -- 2025 specific information
        emp.distinct_salaries_2025,
        emp.salary_increase_pct_2025,
        emp.roles_2025,
        
        -- Ranking metrics
        emp.antiquity_rank,
        emp.antiquity_rank_unique,
        emp.antiquity_rank_all_time,
        emp.antiquity_rank_all_time_unique,
        emp.salary_rank,
        emp.salary_rank_unique,
        
        -- Climate survey metadata
        climate.question_respondent_access_id,
        climate.question_target_access_id,
        climate.question_answered_at,
        climate.question_group_id,
        
        -- Climate survey responses (Likert scale questions)
        climate.accomplishments_recognised,
        climate.workspace_environment,
        climate.great_place_to_work,
        climate.culture_and_values_practiced,
        climate.compensation_transparency,
        climate.policies_transparent,
        climate.trust_leaders,
        climate.leaders_inspire,
        climate.good_decision_to_join,
        climate.contributions_valuable,
        climate.contribution_balance,
        climate.meaningful_conversations,
        climate.growth_confidence,
        climate.leaders_communication,
        climate.envision_staying,
        climate.proud_to_be_part,
        climate.competitive_benefits,
        climate.company_communications,
        climate.performance_evaluations_fair,
        climate.initiative_and_goals,
        climate.work_life_balance,
        climate.social_events,
        
        -- Climate survey metadata questions
        climate.climate_team,
        climate.climate_tenure,
        climate.climate_gender,
        climate.nps_score,
        
        -- Climate survey open text responses
        climate.grateful_for,
        climate.would_like_to_see_more,
        climate.additional_feedback,
        
        -- Derived fields for Power BI
        CASE 
            WHEN climate.question_respondent_access_id IS NOT NULL THEN TRUE 
            ELSE FALSE 
        END AS has_responded_to_climate,
        
        CASE 
            WHEN emp.offboarding_date IS NULL THEN 'Active'
            ELSE 'Inactive'
        END AS employee_status,
        
        DATE_DIFF('day', emp.onboarding_date, CURRENT_DATE) AS days_since_onboarding,
        DATE_DIFF('month', emp.onboarding_date, CURRENT_DATE) AS months_since_onboarding,
        DATE_DIFF('year', emp.onboarding_date, CURRENT_DATE) AS years_since_onboarding,
        
        -- Calculate tenure buckets
        CASE 
            WHEN DATE_DIFF('month', emp.onboarding_date, CURRENT_DATE) < 6 THEN '0-6 months'
            WHEN DATE_DIFF('month', emp.onboarding_date, CURRENT_DATE) < 12 THEN '6-12 months'
            WHEN DATE_DIFF('month', emp.onboarding_date, CURRENT_DATE) < 24 THEN '1-2 years'
            WHEN DATE_DIFF('month', emp.onboarding_date, CURRENT_DATE) < 36 THEN '2-3 years'
            ELSE '3+ years'
        END AS tenure_bucket,
        
        -- Salary buckets (if you want to anonymize in Power BI)
        CASE 
            WHEN emp.current_salary_amount < 30000 THEN '<30k'
            WHEN emp.current_salary_amount < 50000 THEN '30k-50k'
            WHEN emp.current_salary_amount < 70000 THEN '50k-70k'
            WHEN emp.current_salary_amount < 90000 THEN '70k-90k'
            ELSE '90k+'
        END AS salary_bucket
        
    FROM employees emp
    LEFT JOIN climate_one_per_employee climate
        ON emp.access_id = climate.question_respondent_access_id
)

SELECT * FROM employees_with_climate
