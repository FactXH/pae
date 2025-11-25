-- =====================================================
-- Manager Hierarchy Dimension
-- =====================================================
-- This model creates a flattened view of manager-report relationships
-- showing each manager with all their direct and indirect reports
-- up to 10 levels deep
-- =====================================================

WITH current_manager_relationships AS (
    -- Get current manager relationships from the SCD table
    SELECT 
        employee_id,
        manager_id
    FROM {{ ref('base_factorial_employee_managers_scd') }}
    WHERE is_current = true
),

employees AS (
    -- Get employee details including active status
    SELECT 
        employee_id,
        access_id,
        full_name,
        email,
        is_active
    FROM {{ ref('dim_employees') }}
),

-- Find ALL managers (anyone who has at least one direct report)
all_managers AS (
    SELECT DISTINCT
        e.employee_id,
        e.full_name,
        e.email,
        e.access_id,
        e.is_active
    FROM employees e
    INNER JOIN current_manager_relationships cmr 
        ON CAST(e.employee_id AS BIGINT) = cmr.manager_id
),

-- Level 1: Direct reports (for ALL managers, not just top-level)
level_1 AS (
    SELECT 
        mgr.employee_id AS manager_employee_id,
        mgr.full_name AS manager_full_name,
        mgr.email AS manager_email,
        mgr.is_active AS manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        1 AS reporting_level
    FROM all_managers mgr
    INNER JOIN current_manager_relationships cmr ON CAST(mgr.employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 2: Reports of reports
level_2 AS (
    SELECT 
        l1.manager_employee_id,
        l1.manager_full_name,
        l1.manager_email,
        l1.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        2 AS reporting_level
    FROM level_1 l1
    INNER JOIN current_manager_relationships cmr ON CAST(l1.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 3
level_3 AS (
    SELECT 
        l2.manager_employee_id,
        l2.manager_full_name,
        l2.manager_email,
        l2.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        3 AS reporting_level
    FROM level_2 l2
    INNER JOIN current_manager_relationships cmr ON CAST(l2.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 4
level_4 AS (
    SELECT 
        l3.manager_employee_id,
        l3.manager_full_name,
        l3.manager_email,
        l3.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        4 AS reporting_level
    FROM level_3 l3
    INNER JOIN current_manager_relationships cmr ON CAST(l3.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 5
level_5 AS (
    SELECT 
        l4.manager_employee_id,
        l4.manager_full_name,
        l4.manager_email,
        l4.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        5 AS reporting_level
    FROM level_4 l4
    INNER JOIN current_manager_relationships cmr ON CAST(l4.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 6
level_6 AS (
    SELECT 
        l5.manager_employee_id,
        l5.manager_full_name,
        l5.manager_email,
        l5.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        6 AS reporting_level
    FROM level_5 l5
    INNER JOIN current_manager_relationships cmr ON CAST(l5.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 7
level_7 AS (
    SELECT 
        l6.manager_employee_id,
        l6.manager_full_name,
        l6.manager_email,
        l6.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        7 AS reporting_level
    FROM level_6 l6
    INNER JOIN current_manager_relationships cmr ON CAST(l6.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 8
level_8 AS (
    SELECT 
        l7.manager_employee_id,
        l7.manager_full_name,
        l7.manager_email,
        l7.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        8 AS reporting_level
    FROM level_7 l7
    INNER JOIN current_manager_relationships cmr ON CAST(l7.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 9
level_9 AS (
    SELECT 
        l8.manager_employee_id,
        l8.manager_full_name,
        l8.manager_email,
        l8.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        9 AS reporting_level
    FROM level_8 l8
    INNER JOIN current_manager_relationships cmr ON CAST(l8.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Level 10
level_10 AS (
    SELECT 
        l9.manager_employee_id,
        l9.manager_full_name,
        l9.manager_email,
        l9.manager_is_active,
        emp.employee_id AS report_employee_id,
        emp.full_name AS report_full_name,
        emp.email AS report_email,
        emp.is_active AS report_is_active,
        10 AS reporting_level
    FROM level_9 l9
    INNER JOIN current_manager_relationships cmr ON CAST(l9.report_employee_id AS BIGINT) = cmr.manager_id
    INNER JOIN employees emp ON cmr.employee_id = CAST(emp.employee_id AS BIGINT)
),

-- Union all levels
all_reporting_relationships AS (
    SELECT * FROM level_1
    UNION ALL
    SELECT * FROM level_2
    UNION ALL
    SELECT * FROM level_3
    UNION ALL
    SELECT * FROM level_4
    UNION ALL
    SELECT * FROM level_5
    UNION ALL
    SELECT * FROM level_6
    UNION ALL
    SELECT * FROM level_7
    UNION ALL
    SELECT * FROM level_8
    UNION ALL
    SELECT * FROM level_9
    UNION ALL
    SELECT * FROM level_10
)

-- Final output with all manager-report relationships
SELECT 
    manager_employee_id,
    manager_full_name,
    manager_email,
    manager_is_active,
    report_employee_id,
    report_full_name,
    report_email,
    report_is_active,
    reporting_level,
    CASE 
        WHEN reporting_level = 1 THEN true 
        ELSE false 
    END AS is_direct_report
FROM all_reporting_relationships
ORDER BY manager_employee_id, reporting_level, report_employee_id
