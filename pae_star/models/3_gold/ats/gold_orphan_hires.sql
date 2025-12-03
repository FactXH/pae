-- =====================================================
-- GOLD: gold_orphan_hires
-- =====================================================
-- ALL hires from dim_hires with matching status
-- Uses aux_employee_hires to show which hires are matched vs orphans
-- Includes employee information when available
-- =====================================================

WITH aux_hires AS (
    SELECT * FROM {{ source('aux_tables', 'aux_employee_hires') }}
),

dim_hires AS (
    SELECT * FROM {{ ref('dim_hires') }}
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


-- Statistics about matched hires
matched_hires_stats AS (
    SELECT 
        COUNT(DISTINCT application_id) AS total_matched_applications,
        COUNT(DISTINCT employee_id) AS total_matched_employees,
        MIN(application_updated_at) AS earliest_match_date,
        MAX(application_updated_at) AS latest_match_date
    FROM aux_hires
),

-- Statistics about all hires
all_hires_stats AS (
    SELECT 
        COUNT(DISTINCT application_id) AS total_all_applications,
        COUNT(DISTINCT candidate_id) AS total_all_candidates,
        MIN(hired_date) AS earliest_hire_date,
        MAX(hired_date) AS latest_hire_date
    FROM dim_hires
)

SELECT
    -- Hire information from dim_hires
    h.candidate_id,
    h.candidate_first_name,
    h.candidate_last_name,
    h.candidate_email,
    h.candidate_all_names,
    h.application_id,
    h.job_posting_id,
    h.job_posting_title AS hire_job_posting_title,
    h.hired_date,
    h.hiring_stage_id,
    h.hiring_stage_name,
    h.application_phase_id,
    h.application_phase_type,
    h.company_id,
    
    -- Matching status flags
    CASE 
        WHEN aux_h.application_id IS NOT NULL THEN 'MATCHED'
        ELSE 'ORPHAN'
    END AS hire_matching_status,
    
    CASE WHEN aux_h.application_id IS NOT NULL THEN 1 ELSE 0 END AS is_matched,
    CASE WHEN aux_h.application_id IS NULL THEN 1 ELSE 0 END AS is_orphan,
    
    -- Aux hire matching information (if matched)
    aux_h.employee_id AS matched_employee_id,
    aux_h.candidate_id AS matched_candidate_id,
    aux_h.hired_date AS matched_hired_date,
    aux_h.application_updated_at AS hire_match_updated_at,
    aux_h.hire_match_score,
    aux_h.hire_match_method,
    
    -- Employee information from fact_employees (via aux match)
    emp.full_name,
    emp.first_name,
    emp.last_name,
    emp.email,
    emp.access_id,
    emp.onboarding_date,
    emp.offboarding_date,
    emp.is_active,
    emp.first_salary_amount,
    emp.current_salary_amount,
    emp.first_role_level_name,
    emp.last_role_level_name,
    emp.all_current_teams,
    emp.lowest_level_team_name,
    
    -- Application information from dim_applications
    app.application_source,
    app.application_medium,
    app.application_created_at,
    app.current_phase_type,
    app.current_hiring_stage_name,
    app.all_phases,
    app.all_hiring_stages,
    app.rejection_reason,
    
    -- Job posting information
    jp.job_posting_title,
    jp.job_posting_description,
    jp.job_posting_status,
    jp.job_posting_contract_type,
    jp.job_posting_created_at,
    jp.salary_from,
    jp.salary_to,
    
    
    -- Debug statistics: Matched counts
    mhs.total_matched_applications,
    mhs.total_matched_employees,
    mhs.earliest_match_date,
    mhs.latest_match_date,
    
    -- Debug statistics: All hires counts
    ahs.total_all_applications,
    ahs.total_all_candidates,
    ahs.earliest_hire_date,
    ahs.latest_hire_date,
    
    -- Debug metrics: Match rate
    ROUND(CAST(mhs.total_matched_applications AS DOUBLE) / 
          NULLIF(CAST(ahs.total_all_applications AS DOUBLE), 0) * 100, 2) AS match_rate_pct

FROM dim_hires h
CROSS JOIN matched_hires_stats mhs
CROSS JOIN all_hires_stats ahs
LEFT JOIN aux_hires aux_h
    ON CAST(h.application_id AS VARCHAR) = aux_h.application_id
LEFT JOIN fact_employees emp
    ON CAST(aux_h.employee_id AS VARCHAR) = emp.employee_id
LEFT JOIN dim_applications app
    ON CAST(h.application_id AS BIGINT) = app.application_id
LEFT JOIN dim_job_postings jp
    ON h.job_posting_id = jp.job_posting_id