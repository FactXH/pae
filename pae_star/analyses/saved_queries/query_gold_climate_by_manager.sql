SELECT
    -- ========== DIMENSIONS ==========
    manager_employee_id AS manager_employee_id__dim,
    manager_full_name AS manager_name__dim,
    manager_email AS manager_email__dim,
    reporting_level AS reporting_level__dim,
    level_employee_count AS level_employee_count__dim,
    employee_names as all_employees__dim,

    -- ========== METRICS ==========
    respondent_count AS respondent_count__metric__sum,

    avg_accomplishments_recognised AS accomplishments_recognised__metric__avg,
    avg_workspace_environment AS workspace_environment__metric__avg,
    avg_great_place_to_work AS great_place_to_work__metric__avg,
    avg_culture_and_values_practiced AS culture_and_values_practiced__metric__avg,
    avg_compensation_transparency AS compensation_transparency__metric__avg,
    avg_policies_transparent AS policies_transparent__metric__avg,
    avg_trust_leaders AS trust_leaders__metric__avg,
    avg_leaders_inspire AS leaders_inspire__metric__avg,
    avg_social_events AS social_events__metric__avg,
    avg_good_decision_to_join AS good_decision_to_join__metric__avg,
    avg_contributions_valuable AS contributions_valuable__metric__avg,
    avg_contribution_balance AS contributions_valuable__metric___avg,
    avg_meaningful_conversations AS meaningful_conversations__metric__avg,
    avg_nps_score AS nps_score__metric__avg,
    avg_growth_confidence AS growth_confidence__metric__avg,
    avg_leaders_communication AS leaders_communication__metric__avg,
    avg_envision_staying AS envision_staying__metric__avg,
    avg_proud_to_be_part AS proud_to_be_part__metric__avg,
    avg_competitive_benefits AS competitive_benefits__metric__avg,
    avg_company_communications AS company_communications__metric__avg,
    avg_performance_evaluations_fair AS performance_evaluations_fair__metric__avg,
    avg_initiative_and_goals AS initiative_and_goals__metric__avg,
    avg_work_life_balance AS work_life_balance__metric__avg

FROM data_lake_dev_xavi_gold.gold_climate_2025_by_manager
