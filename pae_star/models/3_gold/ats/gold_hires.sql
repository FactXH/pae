-- =====================================================
-- GOLD: gold_hires
-- =====================================================
-- ALL employees from fact_employees with their hiring information
-- Uses TWO independent aux tables:
--   - aux_employee_hires: employee → application matches
--   - aux_employee_positions: employee → position matches
-- Shows matching status for both independently
-- =====================================================

WITH aux_hires AS (
    SELECT * FROM {{ source('aux_tables', 'aux_employee_hires') }}
),

aux_positions AS (
    SELECT * FROM {{ source('aux_tables', 'aux_employee_positions') }}
),

fact_employees AS (
    SELECT * FROM {{ ref('fact_employees') }}
),

dim_applications AS (
    SELECT * FROM {{ ref('dim_applications') }}
),

dim_job_postings AS (
    SELECT * FROM {{ ref('dim_job_postings') }}
),

dim_job_positions AS (
    SELECT * FROM {{ ref('dim_job_positions') }}
),

dim_job_catalog AS (
    SELECT * FROM {{ ref('dim_job_catalog') }}
),

-- Statistics about matched employees
matched_hires_stats AS (
    SELECT 
        COUNT(DISTINCT employee_id) AS total_matched_hires,
        COUNT(DISTINCT application_id) AS total_matched_applications,
        MIN(application_updated_at) AS earliest_hire_match_date,
        MAX(application_updated_at) AS latest_hire_match_date
    FROM aux_hires
),

matched_positions_stats AS (
    SELECT 
        COUNT(DISTINCT employee_id) AS total_matched_positions,
        COUNT(DISTINCT position_id) AS total_matched_position_ids,
        MIN(opened_date) AS earliest_position_match_date,
        MAX(closed_date) AS latest_position_match_date
    FROM aux_positions
),

-- Statistics about all employees
all_employees_stats AS (
    SELECT 
        COUNT(DISTINCT employee_id) AS total_all_employees,
        COUNT(DISTINCT CASE WHEN is_active = TRUE THEN employee_id END) AS total_active_employees,
        COUNT(DISTINCT CASE WHEN is_active = FALSE THEN employee_id END) AS total_inactive_employees,
        MIN(onboarding_date) AS earliest_onboarding_date,
        MAX(onboarding_date) AS latest_onboarding_date
    FROM fact_employees
)

SELECT
    -- Employee information from fact_employees (PRIMARY)
    emp.employee_id,
    emp.full_name,
    emp.first_name,
    emp.last_name,
    emp.email,
    emp.access_id,
    emp.onboarding_date,
    emp.offboarding_date,
    emp.is_active,
    emp.tenure_start_date,
    emp.airtable_manager_email,
    
    -- Employee contract information
    emp.first_salary_amount,
    emp.current_salary_amount,
    emp.first_role_level_name,
    emp.last_role_level_name,
    emp.all_roles,
    emp.all_salaries,
    emp.nr_contracts,
    
    -- Employee team information
    emp.all_current_teams,
    emp.lowest_level_team_name,
    emp.lowest_level_parent_team_name,
    emp.first_lowest_level_team_name,
    emp.first_lowest_level_parent_team_name,
    
    -- Employee ranking metrics
    emp.antiquity_rank,
    emp.salary_rank,
    
    -- Matching status flags
    CASE 
        WHEN aux_h.employee_id IS NOT NULL THEN 'MATCHED'
        ELSE 'ORPHAN'
    END AS hire_matching_status,
    
    CASE 
        WHEN aux_p.employee_id IS NOT NULL THEN 'MATCHED'
        ELSE 'ORPHAN'
    END AS position_matching_status,
    
    CASE
        WHEN aux_h.employee_id IS NOT NULL AND aux_p.employee_id IS NOT NULL THEN '1_BOTH'
        WHEN aux_h.employee_id IS NOT NULL AND aux_p.employee_id IS NULL THEN '2_ONLY_APPLICATION'
        WHEN aux_h.employee_id IS NULL AND aux_p.employee_id IS NOT NULL THEN '3_ONLY_POSITION'
        ELSE '4_BAD'
    END AS hiring_status,
    
    CASE WHEN aux_h.employee_id IS NOT NULL THEN 1 ELSE 0 END AS has_hire_match,
    CASE WHEN aux_p.employee_id IS NOT NULL THEN 1 ELSE 0 END AS has_position_match,
    
    -- Matching Quality Flags (for debugging matched records)
    CASE WHEN app.application_id IS NOT NULL THEN 1 ELSE 0 END AS has_application,
    CASE WHEN pos.position_id IS NOT NULL THEN 1 ELSE 0 END AS has_position,
    CASE WHEN jp.job_posting_id IS NOT NULL THEN 1 ELSE 0 END AS has_job_posting,
    
    -- Aux hire matching information
    aux_h.application_id AS matched_application_id,
    aux_h.candidate_id AS matched_candidate_id,
    aux_h.hired_date AS matched_hired_date,
    aux_h.application_updated_at AS hire_match_updated_at,
    aux_h.hire_match_score,
    aux_h.hire_match_method,
    
    -- Aux position matching information
    aux_p.position_id AS matched_position_id,
    aux_p.position_name AS matched_position_name,
    aux_p.new_hire_name AS matched_new_hire_name,
    aux_p.opened_date AS matched_position_opened_date,
    aux_p.closed_date AS matched_position_closed_date,
    aux_p.position_match_score,
    aux_p.position_match_method,
    
    -- Application information from dim_applications
    app.application_id,
    app.ats_candidate_id,
    app.ats_job_posting_id,
    app.application_created_at,
    app.application_source,
    app.application_medium,
    app.application_rating_average,
    app.application_embedding_score,
    app.application_qualified,
    app.current_phase_type,
    app.current_hiring_stage_name,
    app.current_hiring_stage_position,
    app.all_phases,
    app.all_hiring_stages,
    app.rejection_reason,
    app.rejection_decision_maker,
    app.rejection_reason_code,
    
    -- Job posting information from dim_job_postings
    jp.job_posting_id,
    jp.job_posting_title,
    jp.job_posting_description,
    jp.job_posting_status,
    jp.job_posting_contract_type,
    jp.job_posting_schedule_type,
    jp.job_posting_created_at,
    jp.job_posting_updated_at,
    jp.salary_from,
    jp.salary_to,
    
    -- Position information from dim_job_positions (Airtable)
    pos.position_id,
    pos.xapt_position_id,
    pos.position_name,
    pos.hiring_process_role,
    pos.market,
    pos.seniority,
    pos.team AS position_team,
    pos.specific_team AS position_specific_team,
    pos.talent_specialist,
    pos.manager AS position_manager,
    pos.opened_date AS position_opened_date,
    pos.closed_date AS position_closed_date,
    pos.new_hire_name,
    pos.file_hiring_year,
    
    -- Debug statistics: Hire matches
    mhs.total_matched_hires,
    mhs.total_matched_applications,
    mhs.earliest_hire_match_date,
    mhs.latest_hire_match_date,
    
    -- Debug statistics: Position matches
    mps.total_matched_positions,
    mps.total_matched_position_ids,
    mps.earliest_position_match_date,
    mps.latest_position_match_date,
    
    -- Debug statistics: All employees counts
    aes.total_all_employees,
    aes.total_active_employees,
    aes.total_inactive_employees,
    aes.earliest_onboarding_date,
    aes.latest_onboarding_date,
    
    -- Debug metrics: Match rates
    ROUND(CAST(mhs.total_matched_hires AS DOUBLE) / 
          NULLIF(CAST(aes.total_all_employees AS DOUBLE), 0) * 100, 2) AS hire_match_rate_pct,
    ROUND(CAST(mps.total_matched_positions AS DOUBLE) / 
          NULLIF(CAST(aes.total_all_employees AS DOUBLE), 0) * 100, 2) AS position_match_rate_pct

FROM fact_employees emp
CROSS JOIN matched_hires_stats mhs
CROSS JOIN matched_positions_stats mps
CROSS JOIN all_employees_stats aes
LEFT JOIN aux_hires aux_h
    ON CAST(emp.employee_id AS VARCHAR) = aux_h.employee_id
LEFT JOIN aux_positions aux_p
    ON CAST(emp.employee_id AS VARCHAR) = aux_p.employee_id
LEFT JOIN dim_applications app
    ON CAST(aux_h.application_id AS BIGINT) = app.application_id
LEFT JOIN dim_job_postings jp
    ON app.ats_job_posting_id = jp.job_posting_id
LEFT JOIN dim_job_positions pos
    ON aux_p.position_id = pos.position_id
