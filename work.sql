select * from {{ source("athena", "athena_memberships")  }}
;

select * from headcount_variation_turnover_extended
where team_level = 0
;


select * from attrition_fragmentated;


select distinct termination_reason_type from br_athena_employees;

;
select employee_id, count(DISTINCT start_date) from br_athena_contracts
group by employee_id
having count(distinct start_date) > 1
order by 2 desc



;

select effective_date, count(*) from dim_contracts
group by effective_date



;


with average_performance as (
    select 
        employee_id,
        avg(
            case 
                when score ~ '^\d+$' then cast(score as integer)
                else null
            end
        ) as avg_score
    from athena_employees_performance_scores
    where evaluation_type = 'manager'
    group by employee_id
)

select main_team, count(*) total_attrition, count(*) filter (where avg_perf.avg_score > 3) as attrition_high_performers,
    round(100.0 * count(*) filter (where avg_perf.avg_score > 3) / NULLIF(count(*), 0), 2) as pct_attrition_high_performers
from br_airtable_employees emp
left join br_athena_employees ath
    on emp.employee_id = ath.employee_id
left join average_performance avg_perf
    on emp.employee_id = avg_perf.employee_id
    where extract('year' from offboarding_date) = 2025
    and ATH.termination_reason_type = 'employee'

group by main_team
;



select
  case 
    when score ~ '^\d+$' then cast(score as integer)
    else null
  end as score_int
from athena_employees_performance_scores
;



select * from headcount_variation_turnover_extended
;

select count(distinct respondent_access_id) from athena_climate_answers_v2
-- 1247
;

select * from athena_climate_answers_v2
where respondent_access_id = '1'
;



select 
    team.name as team_name,
    count(distinct respondent_access_id) filter (where answer_number_value != '') as nr_participants,
    count(distinct respondent_access_id) as nr_participants_requested,
    count(*), filter (where int(answer_number_value) >=  9) as promoters,
    count(*), filter (where int(answer_number_value) <=  6) as detractors
    -- count(distinct respondent_access_id) filter (where answer_number_value != '') / NULLIF(count(distinct respondent_access_id), 0) as pct_participation
from athena_climate_answers_v2
left join br_athena_employees emp
    on athena_climate_answers_v2.respondent_access_id = emp.access_id
left join br_athena_memberships mem
    on emp.employee_id = mem.employee_id
left join br_athena_teams team
    on mem.team_id = team.team_id
where team_level = 0
and question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?'
group by 1
-- where question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?'
;


SELECT 
    team.name AS team_name,
    COUNT(DISTINCT respondent_access_id) AS nr_participants,
    COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) >= 9) AS promoters,
    COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) <= 6) AS detractors,
    ROUND(
      100.0 * (
        COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) >= 9) - 
        COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) <= 6)
      ) / NULLIF(COUNT(*), 0), 
      2
    ) AS nps_percentage
FROM athena_climate_answers_v2
LEFT JOIN br_athena_employees emp
    ON athena_climate_answers_v2.respondent_access_id = emp.access_id
LEFT JOIN br_athena_memberships mem
    ON emp.employee_id = mem.employee_id
LEFT JOIN br_athena_teams team
    ON mem.team_id = team.team_id
WHERE team_level = 0
  AND question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?'
  AND answer_number_value IS NOT NULL
  AND answer_number_value != ''
GROUP BY team.name;


SELECT 
    team.name AS team_name,
    COUNT(DISTINCT respondent_access_id) AS nr_participants,
    COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) >= 9) AS promoters,
    COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) <= 6) AS detractors,
    ROUND(
      100.0 * (
        COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) >= 9) - 
        COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) <= 6)
      ) / NULLIF(COUNT(*), 0), 
      2
    ) AS nps_percentage
FROM athena_climate_answers_v2
LEFT JOIN br_athena_employees emp
    ON athena_climate_answers_v2.respondent_access_id = emp.access_id
LEFT JOIN br_athena_memberships mem
    ON emp.employee_id = mem.employee_id
LEFT JOIN br_athena_teams team
    ON mem.team_id = team.team_id
WHERE team_level = 0
  AND question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?'
  AND answer_number_value IS NOT NULL
  AND answer_number_value != ''
GROUP BY team.name

UNION ALL

SELECT 
    'TOTAL' AS team_name,
    COUNT(DISTINCT respondent_access_id) AS nr_participants,
    COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) >= 9) AS promoters,
    COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) <= 6) AS detractors,
    ROUND(
      100.0 * (
        COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) >= 9) - 
        COUNT(*) FILTER (WHERE CAST(answer_number_value AS INTEGER) <= 6)
      ) / NULLIF(COUNT(*), 0), 
      2
    ) AS nps_percentage
FROM athena_climate_answers_v2
LEFT JOIN br_athena_employees emp
    ON athena_climate_answers_v2.respondent_access_id = emp.access_id
LEFT JOIN br_athena_memberships mem
    ON emp.employee_id = mem.employee_id
LEFT JOIN br_athena_teams team
    ON mem.team_id = team.team_id
WHERE team_level = 0
  AND question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?'
  AND answer_number_value IS NOT NULL
  AND answer_number_value != '';


SELECT
    team.name AS team_name,
    ROUND(AVG(CASE WHEN a.question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS avg_enps
FROM athena_climate_answers_v2 a
LEFT JOIN br_athena_employees emp ON a.respondent_access_id = emp.access_id
LEFT JOIN br_athena_memberships mem ON emp.employee_id = mem.employee_id
LEFT JOIN br_athena_teams team ON mem.team_id = team.team_id
WHERE team_level = 0
AND a.question IN ('On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?')
GROUP BY team.name;

;
select distinct question from athena_climate_answers_v2
;



SELECT
    team.name AS team_name,

    ROUND(AVG(CASE WHEN a.question = 'I consider Factorial’s culture and values are put into practice daily' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS culture_values,

    ROUND(AVG(CASE WHEN a.question = 'I am confident that I can grow and develop myself at Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS growth_confidence,

    ROUND(AVG(CASE WHEN a.question = 'I feel my accomplishments are recognised' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS recognition,

    ROUND(AVG(CASE WHEN a.question = 'As far as I can see, I envision myself growing and staying at Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS retention_intent,

    ROUND(AVG(CASE WHEN a.question = 'Factorial provides clear and transparent information about compensation and career plans' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS compensation_transparency,

    ROUND(AVG(CASE WHEN a.question = 'I believe that performance evaluations are fair, consistent, and reflect my contributions and achievements' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS performance_fairness,

    ROUND(AVG(CASE WHEN a.question = 'Policies and processes at Factorial are transparent and aligned with our values' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS policy_transparency,

    ROUND(AVG(CASE WHEN a.question = 'I feel there is a reasonable balance between what I contribute to the company and what I receive in return' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS contribution_balance,

    ROUND(AVG(CASE WHEN a.question = 'The communications I receive from Factorial (via Slack, Factorial platform, All Hands), help me understand more about the company’s culture, its context, and business vision' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS communication_clarity,

    ROUND(AVG(CASE WHEN a.question = 'I strive to achieve goals and take initiative even when faced with challenges' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS initiative,

    ROUND(AVG(CASE WHEN a.question = 'I feel I can trust my leaders' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_trust,

    ROUND(AVG(CASE WHEN a.question = 'I believe Factorial offers competitive benefits (e.g., Alan, Wellhub, )' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS benefits_competitiveness,

    ROUND(AVG(CASE WHEN a.question = 'My leaders inspire teamwork, make good decisions and effectively guide others towards common goals' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_effectiveness,

    ROUND(AVG(CASE WHEN a.question = 'I feel my contributions are valuable and make a difference' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS contribution_value,

    ROUND(AVG(CASE WHEN a.question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS enps,

    ROUND(AVG(CASE WHEN a.question = 'My leads and I have meaningful conversations that help me improve my performance' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS feedback_conversations,

    ROUND(AVG(CASE WHEN a.question = 'My workspace and office offer an excellent environment for working and recreation' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS workspace_quality,

    ROUND(AVG(CASE WHEN a.question = 'I believe joining Factorial was a good decision' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS joining_satisfaction,

    ROUND(AVG(CASE WHEN a.question = 'I am proud to be part of Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS pride,

    ROUND(AVG(CASE WHEN a.question = 'I consider Factorial a great place to work' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS great_place_to_work,

    ROUND(AVG(CASE WHEN a.question = 'The flexibility Factorial provides enables me to maintain a positive work/life balance' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS work_life_balance,

    ROUND(AVG(CASE WHEN a.question = 'Social events (Facts by Factorial, End of Year Dinner, Afterworks) provide great opportunities for bonding and sharing a fun time together' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS social_events_value,

    ROUND(AVG(CASE WHEN a.question = 'My leaders share information in a clear, transparent and consistent way' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_communication

FROM athena_climate_answers_v2 a
LEFT JOIN br_athena_employees emp ON a.respondent_access_id = emp.access_id
LEFT JOIN br_athena_memberships mem ON emp.employee_id = mem.employee_id
LEFT JOIN br_athena_teams team ON mem.team_id = team.team_id
WHERE team_level = 0
group BY team.name
union all 
    select 
'totals' as team_name,
    ROUND(AVG(CASE WHEN a.question = 'I consider Factorial’s culture and values are put into practice daily' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS culture_values,

    ROUND(AVG(CASE WHEN a.question = 'I am confident that I can grow and develop myself at Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS growth_confidence,

    ROUND(AVG(CASE WHEN a.question = 'I feel my accomplishments are recognised' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS recognition,

    ROUND(AVG(CASE WHEN a.question = 'As far as I can see, I envision myself growing and staying at Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS retention_intent,

    ROUND(AVG(CASE WHEN a.question = 'Factorial provides clear and transparent information about compensation and career plans' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS compensation_transparency,

    ROUND(AVG(CASE WHEN a.question = 'I believe that performance evaluations are fair, consistent, and reflect my contributions and achievements' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS performance_fairness,

    ROUND(AVG(CASE WHEN a.question = 'Policies and processes at Factorial are transparent and aligned with our values' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS policy_transparency,

    ROUND(AVG(CASE WHEN a.question = 'I feel there is a reasonable balance between what I contribute to the company and what I receive in return' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS contribution_balance,

    ROUND(AVG(CASE WHEN a.question = 'The communications I receive from Factorial (via Slack, Factorial platform, All Hands), help me understand more about the company’s culture, its context, and business vision' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS communication_clarity,

    ROUND(AVG(CASE WHEN a.question = 'I strive to achieve goals and take initiative even when faced with challenges' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS initiative,

    ROUND(AVG(CASE WHEN a.question = 'I feel I can trust my leaders' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_trust,

    ROUND(AVG(CASE WHEN a.question = 'I believe Factorial offers competitive benefits (e.g., Alan, Wellhub, )' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS benefits_competitiveness,

    ROUND(AVG(CASE WHEN a.question = 'My leaders inspire teamwork, make good decisions and effectively guide others towards common goals' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_effectiveness,

    ROUND(AVG(CASE WHEN a.question = 'I feel my contributions are valuable and make a difference' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS contribution_value,

    ROUND(AVG(CASE WHEN a.question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS enps,

    ROUND(AVG(CASE WHEN a.question = 'My leads and I have meaningful conversations that help me improve my performance' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS feedback_conversations,

    ROUND(AVG(CASE WHEN a.question = 'My workspace and office offer an excellent environment for working and recreation' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS workspace_quality,

    ROUND(AVG(CASE WHEN a.question = 'I believe joining Factorial was a good decision' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS joining_satisfaction,

    ROUND(AVG(CASE WHEN a.question = 'I am proud to be part of Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS pride,

    ROUND(AVG(CASE WHEN a.question = 'I consider Factorial a great place to work' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS great_place_to_work,

    ROUND(AVG(CASE WHEN a.question = 'The flexibility Factorial provides enables me to maintain a positive work/life balance' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS work_life_balance,

    ROUND(AVG(CASE WHEN a.question = 'Social events (Facts by Factorial, End of Year Dinner, Afterworks) provide great opportunities for bonding and sharing a fun time together' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS social_events_value,

    ROUND(AVG(CASE WHEN a.question = 'My leaders share information in a clear, transparent and consistent way' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_communication

FROM athena_climate_answers_v2 a
LEFT JOIN br_athena_employees emp ON a.respondent_access_id = emp.access_id
LEFT JOIN br_athena_memberships mem ON emp.employee_id = mem.employee_id
LEFT JOIN br_athena_teams team ON mem.team_id = team.team_id
WHERE team_level = 0
;

select * from slv_employee limit 1




SELECT
    team.name AS team_name,

    ROUND(AVG(CASE WHEN a.question = 'I consider Factorial’s culture and values are put into practice daily' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS culture_values,

    ROUND(AVG(CASE WHEN a.question = 'I am confident that I can grow and develop myself at Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS growth_confidence,

    ROUND(AVG(CASE WHEN a.question = 'I feel my accomplishments are recognised' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS recognition,

    ROUND(AVG(CASE WHEN a.question = 'As far as I can see, I envision myself growing and staying at Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS retention_intent,

    ROUND(AVG(CASE WHEN a.question = 'Factorial provides clear and transparent information about compensation and career plans' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS compensation_transparency,

    ROUND(AVG(CASE WHEN a.question = 'I believe that performance evaluations are fair, consistent, and reflect my contributions and achievements' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS performance_fairness,

    ROUND(AVG(CASE WHEN a.question = 'Policies and processes at Factorial are transparent and aligned with our values' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS policy_transparency,

    ROUND(AVG(CASE WHEN a.question = 'I feel there is a reasonable balance between what I contribute to the company and what I receive in return' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS contribution_balance,

    ROUND(AVG(CASE WHEN a.question = 'The communications I receive from Factorial (via Slack, Factorial platform, All Hands), help me understand more about the company’s culture, its context, and business vision' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS communication_clarity,

    ROUND(AVG(CASE WHEN a.question = 'I strive to achieve goals and take initiative even when faced with challenges' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS initiative,

    ROUND(AVG(CASE WHEN a.question = 'I feel I can trust my leaders' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_trust,

    ROUND(AVG(CASE WHEN a.question = 'I believe Factorial offers competitive benefits (e.g., Alan, Wellhub, )' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS benefits_competitiveness,

    ROUND(AVG(CASE WHEN a.question = 'My leaders inspire teamwork, make good decisions and effectively guide others towards common goals' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_effectiveness,

    ROUND(AVG(CASE WHEN a.question = 'I feel my contributions are valuable and make a difference' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS contribution_value,

    ROUND(AVG(CASE WHEN a.question = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS enps,

    ROUND(AVG(CASE WHEN a.question = 'My leads and I have meaningful conversations that help me improve my performance' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS feedback_conversations,

    ROUND(AVG(CASE WHEN a.question = 'My workspace and office offer an excellent environment for working and recreation' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS workspace_quality,

    ROUND(AVG(CASE WHEN a.question = 'I believe joining Factorial was a good decision' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS joining_satisfaction,

    ROUND(AVG(CASE WHEN a.question = 'I am proud to be part of Factorial' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS pride,

    ROUND(AVG(CASE WHEN a.question = 'I consider Factorial a great place to work' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS great_place_to_work,

    ROUND(AVG(CASE WHEN a.question = 'The flexibility Factorial provides enables me to maintain a positive work/life balance' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS work_life_balance,

    ROUND(AVG(CASE WHEN a.question = 'Social events (Facts by Factorial, End of Year Dinner, Afterworks) provide great opportunities for bonding and sharing a fun time together' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS social_events_value,

    ROUND(AVG(CASE WHEN a.question = 'My leaders share information in a clear, transparent and consistent way' 
                   THEN CAST(NULLIF(answer_number_value, '') AS FLOAT) END)::NUMERIC, 2) AS leadership_communication

FROM athena_climate_answers_v2 a
LEFT JOIN br_athena_employees emp ON a.respondent_access_id = emp.access_id
LEFT JOIN br_athena_memberships mem ON emp.employee_id = mem.employee_id
LEFT JOIN br_athena_teams team ON mem.team_id = team.team_id
WHERE team_level = 0
group BY team.name


;
    SELECT *
    from dim_job_catalog
    where job_catalog_level_id is not null
;

select * from dim_employees where first_name like 'Xavier%'

;
select * from br_athena_job_catalog_levels;



select * from athena_job_catalog_roles;
select * from athena_contracts_contract_versions;

;
select 
    employee_id as employee_factorial_id,
    manager_id as manager_factorial_id,
    effective_from,
    effective_to
from br_athena_employee_managers_cdc;



    SELECT
        job_catalog_level_id as factorial_id,
        level_name,
        role_name,
        role_level_name
    from dim_job_catalog;




;


select column_name, data_type
from information_schema.columns
where table_name = 'dim_contracts';

    select
        contract_id as contract_factorial_id,
        employee_id as employee_factorial_id,
        job_title as public_job_title,
        effective_date as effective_from,
        effective_to_date as effective_to,
        salary_amount,
        job_catalog_level_id as job_catalog_level_factorial_id

    from dim_contracts;
;

select
    employee_id as factorial_employee_id,
    manager_id as factorial_manager_id,
    effective_from,
    effective_to
from
    br_athena_employee_managers_cdc;

select * from dim_contracts where employee_id = '2343694';

select * from dim_employees where email like 'johns%';


2306420
2337028


    select
        pe.id as employee_id,
        pe.access_id as employee_access_id,
        pe.full_name as employee_full_name
    from {{ ref("dim_employees") }} pe



;
select *
from slv_performance_reviews
where employee_id = '2306420'
;


select 
    performance_review_name,
    employee_id,
    performance_review_start_date,
    manager_employee_id,
    concat(self_employee_score_questionnaire_answered, '/', self_review_questionnaire_answered) as employee_answers,
    concat(manager_employee_score_questionnaire_answered, '/', manager_review_questionnaire_answered) as manager_answers,
    self_score,
    manager_score,
    final_employee_score,
    final_score_calculated_at
from slv_performance_reviews
where lower(performance_review_name) like 'perfo%'
;


;
select performance_review_name, performance_review_start_date, count(*) from slv_performance_reviews
group by 1, 2 order by 3 desc
;

[
    {"type":"section","uuid":"addf08ec-a8ec-54e5-b353-10c5683bd1fb","title":"Overall performance","metadata":{},"questions":[{"type":"answered_question","answer":
    {"value":4,"comment":"Overall, Xavi's performance shows a mix of strong individual technical skills and areas needing development in teamwork and collaboration. He possesses significant technical capability, initiative, and resilience, demonstrated by the independent development of his data loading tool and his ability to overcome technical hurdles. This resulted in high efficiency in his individual tasks.\n\nHowever, his impact on the team was limited by a tendency towards autonomous work, challenges in collaborative integration, and communication that sometimes focused more on issues than collaborative solutions. 
    There's a need for improvement in adhering to and improving team processes collaboratively, and fostering more effective teamwork. 
    While his individual contributions are noted, growth in collaboration and process adherence is necessary to maximize his effectiveness within the team structure. 
    His performance is valuable in its technical aspects but requires development in team integration and collaborative practices.\n"},"question":{"type":"question","uuid":"1eaa83bb-3375-5839-8416-f88f5fd3e972","label":{"manager":"How would you evaluate this person's performance during this review period?"},"scale":{"1":"Needs improvement","2":"Room for growth","3":"Meets expectations","4":"Exceeds expectations","5":"Outstanding"},"metadata":{},"mandatory":true,"answer_type":"rating","description":null,"with_comment":true}}]}]/
    [{"type":"answered_question","answer":"Xavi joined with a clear set of goals outlined for his Data Engineer role, including developing and managing ETL pipelines, collaborating with analysts, integrating data sources, driving automation, overseeing migrations, and ensuring data integrity and performance. These goals are fundamental to the Data Engineer function and align directly with the company's need for efficient, reliable, and well-managed data infrastructure.
    \n\nHowever, the operational reality of the team during this period presented challenges in directly pursuing all these goals collaboratively. Day-to-day tasks often revolved around specific data entry tickets. 
    Xavi effectively adapted his focus towards executing his assigned tasks to the highest possible standard, embodying the principles of his role (efficiency, accuracy, control) within his immediate sphere of influence. ",
    "question":{"type":"question","uuid":"8f7c0d69-e6ea-4313-9eee-cc31ddfea349","label":{"manager":"What were the main goals of your team member during this review period, and how did they align with their role and the team/company objectives?"},"metadata":{},"mandatory":true,"answer_type":"text","description":null}},
    {"type":"answered_question","answer":"\t•\tDevelopment of the Data Loader/Migrator Tool: Confronted with inefficient and error-prone manual data entry processes lacking traceability and control, Xavi took significant personal initiative to design and build a comprehensive automation tool. This was done proactively and autonomously. The tool incorporates crucial elements like validation, error handling, and execution control. The direct impact is seen in Xavi's own work: his handling of data entry tickets is now significantly more efficient, controlled, faster, and demonstrably more accurate. While team adoption hasn't occurred yet, this tool represents a substantial improvement over previous methods and holds significant potential value for standardizing and improving data handling processes within the team. \t\n\t•\tExceptional Resilience and Professionalism: Xavi has demonstrated remarkable resilience and self-motivation in an environment he perceived as lacking clear direction and support. Instead of disengaging, he drew motivation from a desire to learn, improve, and contribute meaningfully to the company's long-term success. He maintained high professional standards for his own work despite observing different practices around him. This mindset is commendable and highly valuable.\nAdditionally, his willingness and ability to assist other departments (SQL, Product Support) on technical matters highlights his skills and collaborative spirit beyond the immediate team.\n","question":{"type":"question","uuid":"28789a98-3804-47b2-b0b2-0d5ddfb3eb77","label":{"manager":"What accomplishments from your team member are you most proud of during this period, and what impact did they have on your team or the company?"},"metadata":{},"mandatory":true,"answer_type":"text","description":null}},{"type":"answered_question","answer":"Looking back, navigating the initial ambiguity was challenging. Perhaps embracing full autonomy and taking ownership of his specific tasks and processes even earlier might have reduced some initial friction, although the learning curve in understanding the environment is acknowledged. Similarly, while attempts to engage with engineering support channels proved frustrating, developing alternative strategies earlier for navigating undocumented or buggy APIs (like the pattern recognition he eventually mastered) could have saved time.\nConcrete steps for continued growth include:\n\t•\tComplete and Formalize the Data Loader Tool: Finish developing the remaining modules and incorporate all planned mandatory features for robust code and ETL best practices. This solidifies a key contribution.\n \t•\tDocument and Showcase: Create clear documentation for the tool. Finding opportunities to formally showcase its capabilities and benefits (quantifying the efficiency/accuracy gains) could increase its visibility and potential for wider adoption, demonstrating leadership through innovation.\n \t•\tContinue Building Cross-Functional Relationships: Leverage the positive interactions with other departments to build a wider internal network, which can be beneficial for navigating complex issues and understanding broader company needs.\n \t•\tRefine Communication Strategies for Roadblocks: Continue developing effective ways to communicate technical challenges and dependencies, perhaps focusing on data-driven impact assessments when escalation or collaboration is required.\n \t•\tImprove Team Collaboration: While Xavi demonstrated strong individual capabilities, there were missed opportunities for deeper collaboration within the team. Building solutions autonomously, while technically impressive, meant the team couldn't provide input or benefit collectively during the development process. Moving forward, involving team members earlier, seeking collective input, and contributing to shared solutions rather than primarily individual ones would be beneficial.\n \t•\tConstructive Communication: While identifying issues is important, the way concerns are communicated matters. At times, feedback could be perceived more as complaints rather than constructive suggestions for improvement. Focusing on proposing solutions collaboratively and framing challenges in a way that encourages teamwork is a key area for development.\n \t•\tAdherence to Established Processes: While initiative is valued, it's also important to understand, utilize, and improve existing team processes before creating entirely separate ones. When processes are perceived as flawed, the ideal approach is to raise concerns constructively and work with the team to refine them, rather than bypassing them. Greater effort in understanding and respecting existing workflows, even while suggesting improvements, is needed.\n \t•\tSeek Guidance Within Team Structures: While self-sufficiency is a strength, relying more on team knowledge and established support channels, even when frustrating, is part of effective teamwork. Persisting in seeking help within the team structure and escalating appropriately through agreed channels is encouraged.\n","question":{"type":"question","uuid":"4d51e8e0-cd76-41ca-a769-505b21232cb3",
"label":{"manager":"Looking back, what could your team member have done differently, and what concrete steps could they take to grow and improve in their role?"},"metadata":{},"mandatory":true,"answer_type":"text","description":null}}]



;

SELECT 
    first_name as first_name,
    last_name as last_name,
    email as email,
    employee_id as factorial_id,
    onboarding_date,
    offboarding_date
FROM dim_employees;




;
select performance_name, count(*) from engagement_performancereview 
where self_score is not null 
group by performance_name;

;
update engagement_performancereview
set tair_id = null where 1 = 1

;



delete from engagement_performancereview where performance_name in
(select distinct performance_name from engagement_performancereview
 group by performance_name
 having count(*) < 600
);


;
select * from athena_ats_candidates_dedup where lower(last_name) = 'hita';
select * from athena_ats_candidates_dedup where lower(first_name) = 'rocio';


-- 7835555
;
select * from athena_ats_applications_dedup where ats_candidate_id = '7835555';
select * from athena_ats_rejection_reasons_dedup where id = '1511'

;
select * from file_hiring_process_2025 where new_hire_name like 'Xav%';


;

;
select * from 
athena_ats_job_postings_dedup where id in ('239848', '256440')





select * from dim_teams;;
















--------------------
--------------------------------------------------------------------------------------------------------------------------------------------
-- CREATE SOURCES
;

create table athena_ats_job_postings as 
select 1;

drop table athena_ats_offer_letters;
create  table athena_ats_offer_letters as 
select 1;

create table athena_ats_applications as
select 1;

create table athena_ats_application_phases as
select 1;

create table athena_ats_hiring_stages as
select 1;

create table athena_sources as 
select 1;

create table athena_ats_candidates as 
select 1;

create table athena_ats_candidate_sources as
select 1;