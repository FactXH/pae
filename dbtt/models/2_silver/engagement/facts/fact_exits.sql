
-- MAIN QUERY JULIAN
    SELECT 
        team_name, 
        memb.market,
        EXTRACT(YEAR FROM CAST(fecha_offboarding AS DATE)) AS offboarding_year,
        COUNT(*) AS total_empleados,

        -- Benefits
        SUM(CASE WHEN benefits != '' THEN 1 ELSE 0 END) AS count_benefits,
        AVG(CASE WHEN benefits != '' THEN CAST(benefits AS FLOAT) ELSE NULL END) AS average_benefits,
        VARIANCE(CASE WHEN benefits != '' THEN CAST(benefits AS FLOAT) ELSE NULL END) AS variance_benefits,

        -- Come back
        SUM(CASE WHEN come_back != '' THEN 1 ELSE 0 END) AS count_come_back, 
        ROUND(
            100.0 * SUM(CASE WHEN come_back = 'Yes' THEN 1 ELSE 0 END) 
            / NULLIF(COUNT(come_back), 0),
        2) AS percentage_come_back,

        -- Comments concatenation
        STRING_AGG("a&r_comments", ' - ') AS "After and Rituals",
        STRING_AGG("t&c_comments", ' - ') AS "Transparency and Communication",
        STRING_AGG("team_comments", ' - ') AS "Team Comments",
        STRING_AGG("culture_comments", ' - ') AS "Culture Comments",
        STRING_AGG("manager_comments", ' - ') AS "Manager Comments",
        STRING_AGG("product_comments", ' - ') AS "Product Comments",
        STRING_AGG("benefits_comments", ' - ') AS "Benefits Comments",
        STRING_AGG("prof._dev._comments", ' - ') AS "Professional Development Comments",
        STRING_AGG("w-l_balance_comments", ' - ') AS "Work-Life Balance Comments",
        STRING_AGG("compensation_comments", ' - ') AS "Compensation Comments",
        STRING_AGG("comment_reasons_for_leaving", ' - ') AS "Reasons for Leaving Comments",

        -- Compensation
        SUM(CASE WHEN compensation != '' THEN 1 ELSE 0 END) AS count_compensation,
        AVG(CASE WHEN compensation != '' THEN CAST(compensation AS FLOAT) ELSE NULL END) AS average_compensation,
        VARIANCE(CASE WHEN compensation != '' THEN CAST(compensation AS FLOAT) ELSE NULL END) AS variance_compensation,

        -- Factorial Product
        SUM(CASE WHEN factorial_product != '' THEN 1 ELSE 0 END) AS count_factorial_product,
        AVG(CASE WHEN factorial_product != '' THEN CAST(factorial_product AS FLOAT) ELSE NULL END) AS average_factorial_product,
        VARIANCE(CASE WHEN factorial_product != '' THEN CAST(factorial_product AS FLOAT) ELSE NULL END) AS variance_factorial_product,

        -- Nuevos campos numéricos (asumiendo que son texto y los casteamos)
        SUM(CASE WHEN rate_team_members != '' THEN 1 ELSE 0 END) AS count_rate_team_members,
        AVG(CASE WHEN rate_team_members != '' THEN CAST(rate_team_members AS FLOAT) ELSE NULL END) AS average_rate_team_members,
        VARIANCE(CASE WHEN rate_team_members != '' THEN CAST(rate_team_members AS FLOAT) ELSE NULL END) AS variance_rate_team_members,

        SUM(CASE WHEN rate_your_manager != '' THEN 1 ELSE 0 END) AS count_rate_your_manager,
        AVG(CASE WHEN rate_your_manager != '' THEN CAST(rate_your_manager AS FLOAT) ELSE NULL END) AS average_rate_your_manager,
        VARIANCE(CASE WHEN rate_your_manager != '' THEN CAST(rate_your_manager AS FLOAT) ELSE NULL END) AS variance_rate_your_manager,

        SUM(CASE WHEN "work-life_balance" != '' THEN 1 ELSE 0 END) AS count_work_life_balance,
        AVG(CASE WHEN "work-life_balance" != '' THEN CAST("work-life_balance" AS FLOAT) ELSE NULL END) AS average_work_life_balance,
        VARIANCE(CASE WHEN "work-life_balance" != '' THEN CAST("work-life_balance" AS FLOAT) ELSE NULL END) AS variance_work_life_balance,

        SUM(CASE WHEN "afterworks_&_rituals" != '' THEN 1 ELSE 0 END) AS count_afterworks_and_rituals,
        AVG(CASE WHEN "afterworks_&_rituals" != '' THEN CAST("afterworks_&_rituals" AS FLOAT) ELSE NULL END) AS average_afterworks_and_rituals,
        VARIANCE(CASE WHEN "afterworks_&_rituals" != '' THEN CAST("afterworks_&_rituals" AS FLOAT) ELSE NULL END) AS variance_afterworks_and_rituals,

        SUM(CASE WHEN rate_overall_culture != '' THEN 1 ELSE 0 END) AS count_rate_overall_culture,
        AVG(CASE WHEN rate_overall_culture != '' THEN CAST(rate_overall_culture AS FLOAT) ELSE NULL END) AS average_rate_overall_culture,
        VARIANCE(CASE WHEN rate_overall_culture != '' THEN CAST(rate_overall_culture AS FLOAT) ELSE NULL END) AS variance_rate_overall_culture,

        SUM(CASE WHEN professional_development != '' THEN 1 ELSE 0 END) AS count_professional_development,
        AVG(CASE WHEN professional_development != '' THEN CAST(professional_development AS FLOAT) ELSE NULL END) AS average_professional_development,
        VARIANCE(CASE WHEN professional_development != '' THEN CAST(professional_development AS FLOAT) ELSE NULL END) AS variance_professional_development,

        SUM(CASE WHEN "transparency_&_communication" != '' THEN 1 ELSE 0 END) AS count_transparency,
        AVG(CASE WHEN "transparency_&_communication" != '' THEN CAST("transparency_&_communication" AS FLOAT) ELSE NULL END) AS average_transparency,
        VARIANCE(CASE WHEN "transparency_&_communication" != '' THEN CAST("transparency_&_communication" AS FLOAT) ELSE NULL END) AS variance_transparency


    FROM athena_airtable_people_todo emp
    LEFT JOIN employee_memberships memb ON emp.id_empleado = memb.employee_id
    WHERE fecha_offboarding IS NOT NULL AND fecha_offboarding != ''
    GROUP BY team_name, offboarding_year, memb.market
