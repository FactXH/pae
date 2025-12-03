-- =====================================================
-- GOLD: gold_orphan_positions
-- =====================================================
-- ALL positions from dim_job_positions with matching status
-- Uses aux_employee_positions to show which positions are matched vs orphans
-- Includes employee information when available
-- =====================================================

WITH aux_positions AS (
    SELECT * FROM {{ source('aux_tables', 'aux_employee_positions') }}
),

dim_job_positions AS (
    SELECT * FROM {{ ref('dim_job_positions') }}
),

dim_applications AS (
    SELECT * FROM {{ ref('dim_applications') }}
),

fact_employees AS (
    SELECT * FROM {{ ref('fact_employees') }}
),

-- Statistics about matched positions
matched_positions_stats AS (
    SELECT 
        COUNT(DISTINCT position_id) AS total_matched_positions,
        COUNT(DISTINCT employee_id) AS total_matched_employees,
        MIN(opened_date) AS earliest_match_date,
        MAX(closed_date) AS latest_match_date
    FROM aux_positions
),

-- Statistics about all positions
all_positions_stats AS (
    SELECT 
        COUNT(DISTINCT position_id) AS total_all_positions,
        COUNT(DISTINCT CASE WHEN closed_date IS NOT NULL THEN position_id END) AS total_all_closed,
        COUNT(DISTINCT CASE WHEN closed_date IS NULL THEN position_id END) AS total_all_open,
        MIN(opened_date) AS earliest_open_date,
        MAX(opened_date) AS latest_open_date
    FROM dim_job_positions
)

SELECT
    -- Position information from dim_job_positions (Airtable)
    p.xapt_position_id,
    p.position_id,
    p.position_name,
    p.hiring_process_role,
    p.market,
    p.seniority,
    p.team AS position_team,
    p.specific_team AS position_specific_team,
    p.talent_specialist,
    p.manager AS position_manager,
    p.opened_date AS position_opened_date,
    p.closed_date AS position_closed_date,
    p.new_hire_name,
    p.file_hiring_year,
    p.is_closed,
    p.hiring_source,
    
    -- Position status flags
    CASE 
        WHEN p.closed_date IS NOT NULL THEN 'CLOSED'
        ELSE 'OPEN'
    END AS position_status,
    
    CASE
        WHEN p.closed_date IS NOT NULL AND p.new_hire_name IS NOT NULL THEN 'CLOSED_WITH_HIRE'
        WHEN p.closed_date IS NOT NULL AND p.new_hire_name IS NULL THEN 'CLOSED_NO_HIRE'
        WHEN p.closed_date IS NULL THEN 'STILL_OPEN'
    END AS position_hiring_status,
    
    -- Days metrics
    CASE
        WHEN p.closed_date IS NOT NULL AND p.opened_date IS NOT NULL 
        THEN DATE_DIFF('day', p.opened_date, p.closed_date)
    END AS days_to_close,
    
    CASE
        WHEN p.closed_date IS NULL AND p.opened_date IS NOT NULL 
        THEN DATE_DIFF('day', p.opened_date, CURRENT_DATE)
    END AS days_open,
    
    -- Matching status flags
    CASE
        WHEN aux_p.position_id IS NOT NULL THEN 'MATCHED'
        ELSE 'ORPHAN'
    END AS position_matching_status,
    
    CASE WHEN aux_p.position_id IS NOT NULL THEN 1 ELSE 0 END AS is_matched,
    CASE WHEN aux_p.position_id IS NULL THEN 1 ELSE 0 END AS is_orphan,
    
    -- Aux position matching information (if matched)
    aux_p.employee_id AS matched_employee_id,
    aux_p.new_hire_name AS matched_new_hire_name,
    aux_p.opened_date AS matched_opened_date,
    aux_p.closed_date AS matched_closed_date,
    aux_p.position_match_score,
    aux_p.position_match_method,
    
    -- Employee information (via aux match)
    emp.full_name AS employee_full_name,
    emp.email AS employee_email,
    emp.onboarding_date AS employee_onboarding_date,
    emp.first_salary_amount AS employee_first_salary,
    emp.current_salary_amount AS employee_current_salary,
    emp.first_role_level_name AS employee_first_role,
    emp.last_role_level_name AS employee_current_role,
    
    -- Debug statistics: Matched counts
    mps.total_matched_positions,
    mps.total_matched_employees,
    mps.earliest_match_date,
    mps.latest_match_date,
    
    -- Debug statistics: All positions counts
    aps.total_all_positions,
    aps.total_all_closed,
    aps.total_all_open,
    aps.earliest_open_date,
    aps.latest_open_date,
    
    -- Debug metrics: Match rate
    ROUND(CAST(mps.total_matched_positions AS DOUBLE) / 
          NULLIF(CAST(aps.total_all_positions AS DOUBLE), 0) * 100, 2) AS match_rate_pct

FROM dim_job_positions p
CROSS JOIN matched_positions_stats mps
CROSS JOIN all_positions_stats aps
LEFT JOIN aux_positions aux_p
    ON p.position_id = aux_p.position_id
LEFT JOIN fact_employees emp
    ON CAST(aux_p.employee_id AS VARCHAR) = emp.employee_id
