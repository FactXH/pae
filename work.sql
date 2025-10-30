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

select effective_date, count(*) from slv_contracts
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