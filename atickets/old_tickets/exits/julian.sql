


select * from raw_teams where name like 'CX%';
select * from raw_markets;

select * from raw_airtable_todos;



SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'  -- change if needed
  AND table_name   = 'raw_airtable_todos';


select distinct compensation as a from raw_airtable_todos
where fecha_offboarding != ''
;

select 
    team_name, 
    -- memb.market,
    EXTRACT(YEAR FROM CAST(fecha_offboarding as DATE)) as offboarding_year,
    count(*),
    SUM(CASE WHEN benefits != '' THEN 1 ELSE 0 END) as count_benefits,
    AVG(CASE WHEN benefits != '' THEN CAST(benefits AS FLOAT) ELSE NULL END) as average_benefits,
    VARIANCE(CASE WHEN benefits != '' THEN CAST(benefits AS FLOAT) ELSE NULL END) as variance_benefits,

    SUM(CASE WHEN come_back != '' THEN 1 else 0 END) count_come_back, 
    ROUND(
    100.0 * SUM(CASE WHEN come_back = 'Yes' THEN 1 ELSE 0 END) 
        / NULLIF(COUNT(come_back), 0),
    2
    ) AS percentage_come_back,

    STRING_AGG("a&r_comments", ' - ') as "After and Rituals",
    STRING_AGG("t&c_comments", ' - ') as "Trasnparency and communication",
    STRING_AGG("team_comments", ' - ') as "Team Comments",
    STRING_AGG("culture_comments", ' - ') as "Culture Comments",
    STRING_AGG("manager_comments", ' - '),
    STRING_AGG("product_comments", ' - '),
    STRING_AGG("benefits_comments", ' - '),
    STRING_AGG("prof._dev._comments", ' - '),
    STRING_AGG("w-l_balance_comments", ' - '),
    STRING_AGG("compensation_comments", ' - '),
    STRING_AGG("comment_reasons_for_leaving", ' - '),

    SUM(CASE WHEN compensation != '' THEN 1 ELSE 0 END) as count_compensation,
    AVG(CASE WHEN compensation != '' THEN CAST(compensation AS FLOAT) ELSE NULL END) as average_compensation,
    VARIANCE(CASE WHEN compensation != '' THEN CAST(compensation AS FLOAT) ELSE NULL END) as variance_compensation,


    SUM(CASE WHEN compensation != '' THEN 1 ELSE 0 END) as count_compensation,
    AVG(CASE WHEN compensation != '' THEN CAST(compensation AS FLOAT) ELSE NULL END) as average_compensation,
    VARIANCE(CASE WHEN compensation != '' THEN CAST(compensation AS FLOAT) ELSE NULL END) as variance_compensation,

    
    SUM(CASE WHEN factorial_product != '' THEN 1 ELSE 0 END) as count_factorial_product,
    AVG(CASE WHEN factorial_product != '' THEN CAST(factorial_product AS FLOAT) ELSE NULL END) as average_factorial_product,
    VARIANCE(CASE WHEN factorial_product != '' THEN CAST(factorial_product AS FLOAT) ELSE NULL END) as variance_factorial_product

    rate_team_members
    rate_your_manager
    work-life_balance
    "afterworks_&_rituals"
    rate_overall_culture
    professional_development



from raw_airtable_todos emp
    left join employee_memberships memb on emp.id_empleado = memb.employee_id
    where fecha_offboarding != ''
    group by 1, 2
    -- having count(*) > 3
;
select team_name, memb.market,  count(*) from raw_airtable_todos emp
left join employee_memberships memb on emp.id_empleado = memb.employee_id
group by 1, 2
having count(*) > 3
union all
select team_name, 'NO MARKET' as market, count(*) from raw_airtable_todos emp
left join employee_memberships memb on emp.id_empleado = memb.employee_id
group by 1, 2
having count(*) > 3
union all
select 'NO TEAM', memb.market as market, count(*) from raw_airtable_todos emp
left join employee_memberships memb on emp.id_empleado = memb.employee_id
group by 1, 2
having count(*) > 3




;

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
    GROUP BY team_name, offboarding_year, memb.market;


-- RESONS OF LEAVING

;

    SELECT 
        team_name, 
        memb.market,
        EXTRACT(YEAR FROM CAST(fecha_offboarding AS DATE)) AS offboarding_year,
        COUNT(*) AS total_empleados,


        SUM(CASE WHEN "transparency_&_communication" != '' THEN 1 ELSE 0 END) AS count_transparency,
        AVG(CASE WHEN "transparency_&_communication" != '' THEN CAST("transparency_&_communication" AS FLOAT) ELSE NULL END) AS average_transparency,
        VARIANCE(CASE WHEN "transparency_&_communication" != '' THEN CAST("transparency_&_communication" AS FLOAT) ELSE NULL END) AS variance_transparency,

        string_agg(emp.email, ' - ') as emails

    FROM athena_airtable_people_todo emp
    LEFT JOIN employee_memberships memb ON emp.id_empleado = memb.employee_id
    WHERE fecha_offboarding IS NOT NULL AND fecha_offboarding != ''
    and team_name like '%Entry'
    GROUP BY team_name, offboarding_year, memb.market

;



select column_name
from information_schema.columns
where table_schema = 'public'
and table_name = 'athena_airtable_people_todo';


-- MAIN QUERY JULIAN
    SELECT 
        team_name, 
        memb.market,
        EXTRACT(YEAR FROM CAST(fecha_offboarding AS DATE)) AS offboarding_year,
        COUNT(*) AS total_empleados,
        string_agg(main_reason_of_leaving, ' - ') as main_reason_of_leaving,
        string_agg(secondary_reason_of_leaving, ' - ') as secondary_reason_of_leaving

    FROM athena_airtable_people_todo emp
    LEFT JOIN employee_memberships memb ON emp.id_empleado = memb.employee_id
    WHERE fecha_offboarding IS NOT NULL AND fecha_offboarding != ''
    GROUP BY team_name, offboarding_year, memb.market;

-- REASONS
WITH base_data AS (
    SELECT 
        team_name,
        memb.market,
        EXTRACT(YEAR FROM CAST(fecha_offboarding AS DATE)) AS offboarding_year,
        emp.id_empleado,
        main_reason_of_leaving,
        secondary_reason_of_leaving
    FROM athena_airtable_people_todo emp
    LEFT JOIN employee_memberships memb ON emp.id_empleado = memb.employee_id
    WHERE fecha_offboarding IS NOT NULL AND fecha_offboarding != ''
)

SELECT
    team_name,
    market,
    offboarding_year,
    COUNT(DISTINCT id_empleado) AS total_empleados,

    -- Main reasons counts
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Leadership (M1 -M2)') AS main_leadership_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Transparency') AS main_transparency_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Recognition') AS main_recognition_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Work Climate') AS main_work_climate_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Compensation') AS main_compensation_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Goals and Performance') AS main_goals_performance_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Work-life balance') AS main_work_life_balance_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Job Interest') AS main_job_interest_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Culture') AS main_culture_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Direct Management') AS main_direct_management_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Factorial Changes') AS main_factorial_changes_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE main_reason_of_leaving = 'Personal / New Project') AS main_personal_project_count,

    -- Secondary reasons counts
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Leadership (M1 -M2)') AS secondary_leadership_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Transparency') AS secondary_transparency_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Recognition') AS secondary_recognition_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Work Climate') AS secondary_work_climate_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Compensation') AS secondary_compensation_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Goals and Performance') AS secondary_goals_performance_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Work-life balance') AS secondary_work_life_balance_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Job Interest') AS secondary_job_interest_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Culture') AS secondary_culture_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Direct Management') AS secondary_direct_management_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Factorial Changes') AS secondary_factorial_changes_count,
    COUNT(DISTINCT id_empleado) FILTER (WHERE secondary_reason_of_leaving = 'Personal / New Project') AS secondary_personal_project_count

FROM base_data
GROUP BY team_name, market, offboarding_year
ORDER BY team_name, market, offboarding_year;




select 



from athena_airtable_people_todo 
left join employee_memberships memb on athena_airtable_people_todo.id_empleado = memb.employee_id
