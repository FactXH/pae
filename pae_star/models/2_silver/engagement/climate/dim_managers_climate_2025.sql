-- =====================================================
-- Climate Survey 2025 Manager-Level Dimension
-- =====================================================
-- This dimension shows manager-level combinations with more than 4 people
-- filtered to employees who were active at the time of the survey
-- =====================================================

WITH manager_reports_scd AS (
    -- Get manager-report relationships that were valid at survey time (2025-09-10)
    SELECT 
        manager_employee_id,
        manager_full_name,
        manager_email,
        report_employee_id,
        reporting_level,
        is_direct_report
    FROM {{ ref('dim_manager_reports_scd') }}
    WHERE effective_from <= DATE '2025-09-10'
        AND (effective_to IS NULL OR effective_to > DATE '2025-09-10')
),

employees_active_at_survey AS (
    -- Get employees who were active at survey time (2025-09-10)
    SELECT 
        employee_id,
        full_name,
        email,
        access_id,
        lowest_level_team_name_climate_2025 as team_name
    FROM {{ ref('fact_employees') }}
    WHERE onboarding_date <= DATE '2025-09-10'
        AND (offboarding_date IS NULL OR offboarding_date > DATE '2025-09-10')
),

active_manager_reports AS (
    -- Filter to only include active employees at survey time
    SELECT 
        mr.manager_employee_id,
        mr.manager_full_name,
        mr.manager_email,
        mr.report_employee_id,
        mr.reporting_level,
        mr.is_direct_report,
        emp_mgr.team_name AS team_name
    FROM manager_reports_scd mr
    INNER JOIN employees_active_at_survey emp_mgr 
        ON mr.manager_employee_id = emp_mgr.employee_id
    INNER JOIN employees_active_at_survey emp_rep 
        ON mr.report_employee_id = emp_rep.employee_id
),

manager_level_counts AS (
    -- Count people per manager-level combination
    SELECT 
        manager_employee_id,
        manager_full_name,
        manager_email,
        reporting_level,
        team_name,
        COUNT(DISTINCT report_employee_id) AS level_employee_count,
        ARRAY_AGG(DISTINCT report_employee_id) AS level_employee_ids
    FROM active_manager_reports
    GROUP BY 
        manager_employee_id,
        manager_full_name,
        manager_email,
        reporting_level,
        team_name
),

valid_manager_levels AS (
    -- Filter to only manager-level combinations with > 4 people
    SELECT 
        manager_employee_id,
        manager_full_name,
        manager_email,
        reporting_level,
        team_name,
        level_employee_count,
        level_employee_ids
    FROM manager_level_counts
    WHERE level_employee_count > 4
),

-- Also get "all_levels" aggregation per manager
manager_all_levels AS (
    SELECT 
        manager_employee_id,
        manager_full_name,
        manager_email,
        'all_levels' AS reporting_level,
        team_name,
        COUNT(DISTINCT report_employee_id) AS level_employee_count,
        ARRAY_AGG(DISTINCT report_employee_id) AS level_employee_ids
    FROM active_manager_reports
    GROUP BY 
        manager_employee_id,
        manager_full_name,
        manager_email,
        team_name
    HAVING COUNT(DISTINCT report_employee_id) > 4
)

-- Union individual levels with all_levels
SELECT 
    manager_employee_id,
    manager_full_name,
    manager_email,
    team_name,
    CAST(reporting_level AS VARCHAR) AS reporting_level,
    level_employee_count,
    level_employee_ids
FROM valid_manager_levels

UNION ALL

SELECT 
    manager_employee_id,
    manager_full_name,
    manager_email,
    team_name,
    reporting_level,
    level_employee_count,
    level_employee_ids
FROM manager_all_levels

ORDER BY manager_employee_id, reporting_level
