

SELECT 
    -- ==================== DIMENSIONS ====================
    -- Employee information
    emp.full_name AS employee_name__dim,
    emp.email AS employee_email__dim,
    emp.employee_id AS employee_id__dim,

    emp.salary_bucket as salary_bucket__dim,
    
    -- Status and dates
    emp.employee_status AS status__dim,
    emp.is_active AS is_active__dim,
    CAST(emp.onboarding_date AS VARCHAR) AS onboarding_date__dim,
    CAST(emp.offboarding_date AS VARCHAR) AS offboarding_date__dim,
    emp.tenure_bucket AS tenure_bucket__dim,
    
    -- Role and team information
    emp.last_role_level_name AS current_role__dim,
    emp.first_role_level_name AS first_role__dim,
    emp.lowest_level_team_name AS team__dim,
    emp.lowest_level_parent_team_name AS parent_team__dim,
    emp.lowest_level_team_name_climate_2025 AS team_climate_2025__dim,
    emp.lowest_level_parent_team_name_climate_2025 AS parent_team_climate_2025__dim,
    emp.all_current_teams AS all_teams__dim,
    emp.roles_2025 AS roles_2025__dim,
    
    -- Market information (if assigned to a market)
    emp.current_market_name AS market__dim,
    emp.current_market_level AS market_level__dim,
    
    -- Manager hierarchy (using emails)
    emp.athena_manager_email AS manager_email__dim,
    mgr1.full_name AS manager_name__dim,
    mgr2.email AS manager_of_manager_email__dim,
    mgr2.full_name AS manager_of_manager_name__dim,
    mgr3.email AS manager_of_manager_of_manager_email__dim,
    mgr3.full_name AS manager_of_manager_of_manager_name__dim,
    
    emp.airtable_main_team AS main_team__dim,
    
    -- Climate survey metadata
    CAST(emp.has_responded_to_climate AS VARCHAR) AS responded_to_survey__dim,
    emp.climate_team AS survey_team__dim,
    emp.climate_tenure AS survey_tenure__dim,
    emp.climate_gender AS gender__dim,
    
    -- ==================== COUNT METRICS ====================
    -- For proper weighted averages in ConfigurableMetricsCard
    1 AS employee_count__count__sum,
    
    -- Climate response indicator (1 if responded, 0 if not)
    CASE WHEN emp.has_responded_to_climate = TRUE THEN 1 ELSE 0 END AS has_climate_response__count__sum,
    
    -- Contract metrics (counts)
    emp.nr_contracts AS nr_contracts__count__sum,
    emp.distinct_salaries_2025 AS salary_changes_2025__count__sum,
    
    -- Tenure metrics (numeric but treated as count)
    emp.days_since_onboarding AS days_tenure__count__sum,
    emp.months_since_onboarding AS months_tenure__count__sum,
    emp.years_since_onboarding AS years_tenure__count__sum,
    
    -- ==================== FINANCIAL METRICS ====================
    -- Salary metrics (use avg for proper aggregation)
    emp.current_salary_amount AS current_salary__metric__avg,
    emp.salary_increase_pct_2025 AS salary_increase_pct__metric__avg,
    
    -- ==================== RANKING METRICS ====================
    -- Rankings (use avg for aggregation)
    emp.antiquity_rank AS antiquity_rank__metric__avg,
    emp.antiquity_rank_unique AS antiquity_rank_unique__metric__avg,
    emp.salary_rank AS salary_rank__metric__avg,
    emp.salary_rank_unique AS salary_rank_unique__metric__avg,
    
    -- ==================== CLIMATE SURVEY RESPONSES (LIKERT SCALE) ====================
    -- All climate responses use __metric__avg for simple average aggregation
    -- Individual scores are hidden (not shown as separate count metrics)
    
    -- Engagement & Recognition
    CAST(emp.accomplishments_recognised AS DOUBLE) AS accomplishments_recognised__metric__avg,
    CAST(emp.contributions_valuable AS DOUBLE) AS contributions_valuable__metric__avg,
    CAST(emp.contribution_balance AS DOUBLE) AS contribution_balance__metric__avg,
    CAST(emp.good_decision_to_join AS DOUBLE) AS good_decision_to_join__metric__avg,
    CAST(emp.proud_to_be_part AS DOUBLE) AS proud_to_be_part__metric__avg,
    
    -- Leadership & Management
    CAST(emp.trust_leaders AS DOUBLE) AS trust_leaders__metric__avg,
    CAST(emp.leaders_inspire AS DOUBLE) AS leaders_inspire__metric__avg,
    CAST(emp.leaders_communication AS DOUBLE) AS leaders_communication__metric__avg,
    CAST(emp.meaningful_conversations AS DOUBLE) AS meaningful_conversations__metric__avg,
    
    -- Growth & Development
    CAST(emp.growth_confidence AS DOUBLE) AS growth_confidence__metric__avg,
    CAST(emp.envision_staying AS DOUBLE) AS envision_staying__metric__avg,
    CAST(emp.performance_evaluations_fair AS DOUBLE) AS performance_evaluations_fair__metric__avg,
    CAST(emp.initiative_and_goals AS DOUBLE) AS initiative_and_goals__metric__avg,
    
    -- Culture & Environment
    CAST(emp.great_place_to_work AS DOUBLE) AS great_place_to_work__metric__avg,
    CAST(emp.culture_and_values_practiced AS DOUBLE) AS culture_and_values_practiced__metric__avg,
    CAST(emp.workspace_environment AS DOUBLE) AS workspace_environment__metric__avg,
    CAST(emp.work_life_balance AS DOUBLE) AS work_life_balance__metric__avg,
    
    -- Transparency & Communication
    CAST(emp.compensation_transparency AS DOUBLE) AS compensation_transparency__metric__avg,
    CAST(emp.policies_transparent AS DOUBLE) AS policies_transparent__metric__avg,
    CAST(emp.company_communications AS DOUBLE) AS company_communications__metric__avg,
    
    -- Benefits & Perks
    CAST(emp.competitive_benefits AS DOUBLE) AS competitive_benefits__metric__avg,
    CAST(emp.social_events AS DOUBLE) AS social_events__metric__avg,
    
    -- NPS Score
    CAST(emp.nps_score AS DOUBLE) AS nps_score__metric__avg,
    
    -- ==================== CALCULATED COMPOSITE METRICS ====================
    -- Calculate average of all engagement metrics
    (
        COALESCE(CAST(emp.accomplishments_recognised AS DOUBLE), 0) +
        COALESCE(CAST(emp.contributions_valuable AS DOUBLE), 0) +
        COALESCE(CAST(emp.contribution_balance AS DOUBLE), 0) +
        COALESCE(CAST(emp.good_decision_to_join AS DOUBLE), 0) +
        COALESCE(CAST(emp.proud_to_be_part AS DOUBLE), 0)
    ) / NULLIF(
        (CASE WHEN emp.accomplishments_recognised IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.contributions_valuable IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.contribution_balance IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.good_decision_to_join IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.proud_to_be_part IS NOT NULL THEN 1 ELSE 0 END), 0
    ) AS avg_engagement_score__metric__avg,
    
    -- Calculate average of all leadership metrics
    (
        COALESCE(CAST(emp.trust_leaders AS DOUBLE), 0) +
        COALESCE(CAST(emp.leaders_inspire AS DOUBLE), 0) +
        COALESCE(CAST(emp.leaders_communication AS DOUBLE), 0) +
        COALESCE(CAST(emp.meaningful_conversations AS DOUBLE), 0)
    ) / NULLIF(
        (CASE WHEN emp.trust_leaders IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.leaders_inspire IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.leaders_communication IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.meaningful_conversations IS NOT NULL THEN 1 ELSE 0 END), 0
    ) AS avg_leadership_score__metric__avg,
    
    -- Calculate average of all culture metrics
    (
        COALESCE(CAST(emp.great_place_to_work AS DOUBLE), 0) +
        COALESCE(CAST(emp.culture_and_values_practiced AS DOUBLE), 0) +
        COALESCE(CAST(emp.workspace_environment AS DOUBLE), 0) +
        COALESCE(CAST(emp.work_life_balance AS DOUBLE), 0)
    ) / NULLIF(
        (CASE WHEN emp.great_place_to_work IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.culture_and_values_practiced IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.workspace_environment IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN emp.work_life_balance IS NOT NULL THEN 1 ELSE 0 END), 0
    ) AS avg_culture_score__metric__avg,
    
    -- ==================== TEXT FIELDS (DIMENSIONS) ====================
    -- Open text responses
    emp.grateful_for AS grateful_for__dim,
    emp.would_like_to_see_more AS would_like_to_see_more__dim,
    emp.additional_feedback AS feedback__dim

FROM data_lake_dev_xavi_gold.gold_climate_2025_employees emp
-- Join to get manager (level 1)
LEFT JOIN data_lake_dev_xavi_gold.gold_climate_2025_employees mgr1
    ON emp.athena_manager_email = mgr1.email
-- Join to get manager of manager (level 2)
LEFT JOIN data_lake_dev_xavi_gold.gold_climate_2025_employees mgr2
    ON mgr1.athena_manager_email = mgr2.email
-- Join to get manager of manager of manager (level 3)
LEFT JOIN data_lake_dev_xavi_gold.gold_climate_2025_employees mgr3
    ON mgr2.athena_manager_email = mgr3.email

-- WHERE emp.has_responded_to_climate = TRUE

-- Order by employee name for consistent sorting
ORDER BY emp.full_name











