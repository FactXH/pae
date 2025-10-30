with employee_teams as (
    select
        team.name as team,
        team.team_level,
        team.team_type,
        emp.employee_id,
        emp.onboarding_date,
        emp.offboarding_date,
        ath_emp.termination_reason_type,
        emp.terminated_reason
    from 
        {{ ref("br_airtable_employees") }} emp
    left join {{ ref("br_athena_memberships") }} memb
        on emp.employee_id = memb.employee_id
    left join {{ ref("br_athena_teams") }} team
        on memb.team_id = team.team_id
    left join {{ ref("br_athena_employees") }} ath_emp
        on emp.employee_id = ath_emp.employee_id
    where emp.offboarding_date > '2024-01-01' or emp.offboarding_date is null
),

-- === 2025 CTEs ===

initial_employees as (
    select
        team, team_level, team_type, count(*) as initial_employees
    from 
       employee_teams
    where 
        onboarding_date <= '2025-01-01' 
        and (offboarding_date > '2025-01-01' or offboarding_date is null)
    group by team, team_level, team_type
),

final_employees as (
    select
        team, team_level, team_type, count(*) as final_employees
    from 
        employee_teams
    where 
        onboarding_date <= '2025-10-15' 
        and (offboarding_date > '2025-10-15' or offboarding_date is null)
    group by team, team_level, team_type
),

onboardings as (
    select
        team, team_level, team_type, count(*) as onboardings
    from 
        employee_teams
    where 
        onboarding_date > '2025-01-01' 
        and onboarding_date <= '2025-10-15'
    group by team, team_level, team_type
),

ofboardings as (
    select
        team, team_level, team_type, count(*) as offboardings
    from 
        employee_teams
    where 
        offboarding_date > '2025-01-01' 
        and offboarding_date <= '2025-10-15'
    group by team, team_level, team_type
),

attrition as (
    select
        team, team_level, team_type, count(*) as attrition
    from 
        employee_teams
    where 
        offboarding_date > '2025-01-01' 
        and offboarding_date <= '2025-10-15'
        and termination_reason_type = 'employee'
    group by team, team_level, team_type
),

early_attrition as (
    select
        team, team_level, team_type, count(*) as early_attrition
    from 
        employee_teams
    where 
        offboarding_date > '2025-01-01' 
        and offboarding_date <= '2025-10-15'
        and termination_reason_type = 'employee'
        and (offboarding_date - onboarding_date) <= 120
    group by team, team_level, team_type
),

custom_early_attrition as (
    select
        team, team_level, team_type, count(*) as early_attrition
    from 
        employee_teams
    where 
        onboarding_date > '2024-09-01'
        and termination_reason_type = 'employee'
        and (offboarding_date - onboarding_date) <= 120
    group by team, team_level, team_type
),

periodo_prueba as (
    select
        team, team_level, team_type, count(*) as periodo_prueba
    from 
        employee_teams
    where 
        offboarding_date > '2025-01-01' 
        and terminated_reason like 'No superación del periodo de prueba (instancia empresa%'
    group by team, team_level, team_type
),

-- === 2024 CTEs ===

y2024_initial_employees as (
    select
        team, team_level, team_type, count(*) as initial_employees_2024
    from 
       employee_teams
    where 
        onboarding_date <= '2024-01-01' 
        and (offboarding_date > '2024-01-01' or offboarding_date is null)
    group by team, team_level, team_type
),

y2024_final_employees as (
    select
        team, team_level, team_type, count(*) as final_employees_2024
    from 
        employee_teams
    where 
        onboarding_date <= '2024-12-31' 
        and (offboarding_date > '2024-12-31' or offboarding_date is null)
    group by team, team_level, team_type
),

y2024_onboardings as (
    select
        team, team_level, team_type, count(*) as onboardings_2024
    from 
        employee_teams
    where 
        onboarding_date > '2024-01-01' 
        and onboarding_date <= '2024-12-31'
    group by team, team_level, team_type
),

y2024_offboardings as (
    select
        team, team_level, team_type, count(*) as offboardings_2024
    from 
        employee_teams
    where 
        offboarding_date > '2024-01-01' 
        and offboarding_date <= '2024-12-31'
    group by team, team_level, team_type
),

y2024_attrition as (
    select
        team, team_level, team_type, count(*) as attrition_2024
    from 
        employee_teams
    where 
        offboarding_date > '2024-01-01' 
        and offboarding_date <= '2024-12-31'
        and termination_reason_type = 'employee'
    group by team, team_level, team_type
),

y2024_early_attrition as (
    select
        team, team_level, team_type, count(*) as early_attrition_2024
    from 
        employee_teams
    where 
        offboarding_date > '2024-01-01' 
        and offboarding_date <= '2024-12-31'
        and termination_reason_type = 'employee'
        and (offboarding_date - onboarding_date) <= 120
    group by team, team_level, team_type
),

y2024_periodo_prueba as (
    select
        team, team_level, team_type, count(*) as periodo_prueba_2024
    from 
        employee_teams
    where 
        offboarding_date > '2024-01-01' 
        and terminated_reason like 'No superación del periodo de prueba (instancia empresa%'
    group by team, team_level, team_type
)

-- === Final SELECT ===

select
    -- Team identifiers
    ie.team,
    ie.team_level,
    ie.team_type,

    -- Metrics side by side for 2025 and 2024
    ie.initial_employees,
    yie.initial_employees_2024,
    fe.final_employees,
    yfe.final_employees_2024,
    ob.onboardings,
    yob.onboardings_2024,
    ofb.offboardings,
    yofb.offboardings_2024,
    at.attrition,
    yat.attrition_2024,
    ea.early_attrition,
    yea.early_attrition_2024,
    pp.periodo_prueba,
    ypp.periodo_prueba_2024,
    coalesce(fe.final_employees,0) - coalesce(ie.initial_employees,0) as net_change_2025,
    coalesce(yfe.final_employees_2024,0) - coalesce(yie.initial_employees_2024,0) as net_change_2024,
    round(1.0 * COALESCE(ea.early_attrition,0) / NULLIF(COALESCE(ob.onboardings,0), 0), 2) as early_attrition_rate_2025,
    round(1.0 * COALESCE(yea.early_attrition_2024,0) / NULLIF(COALESCE(yob.onboardings_2024,0), 0), 2) as early_attrition_rate_2024,
    round(1.0 * COALESCE(at.attrition,0) / NULLIF((COALESCE(ie.initial_employees,0) + COALESCE(fe.final_employees,0)) / 2.0, 0), 2) as attrition_rate_2025,
    round(1.0 * COALESCE(ofb.offboardings,0) / NULLIF((COALESCE(ie.initial_employees,0) + COALESCE(fe.final_employees,0)) / 2.0, 0), 2) as turnover_rate_2025,
    round(1.0 * COALESCE(yofb.offboardings_2024,0) / NULLIF((COALESCE(yie.initial_employees_2024,0) + COALESCE(yfe.final_employees_2024,0)) / 2.0, 0), 2) as turnover_rate_2024

from 
    initial_employees ie
left join final_employees fe on ie.team = fe.team and ie.team_level = fe.team_level and ie.team_type = fe.team_type
left join onboardings ob on ie.team = ob.team and ie.team_level = ob.team_level and ie.team_type = ob.team_type
left join ofboardings ofb on ie.team = ofb.team and ie.team_level = ofb.team_level and ie.team_type = ofb.team_type
left join attrition at on ie.team = at.team and ie.team_level = at.team_level and ie.team_type = at.team_type
left join early_attrition ea on ie.team = ea.team and ie.team_level = ea.team_level and ie.team_type = ea.team_type
left join periodo_prueba pp on ie.team = pp.team and ie.team_level = pp.team_level and ie.team_type = pp.team_type

-- 2024 joins
left join y2024_initial_employees yie on ie.team = yie.team and ie.team_level = yie.team_level and ie.team_type = yie.team_type
left join y2024_final_employees yfe on ie.team = yfe.team and ie.team_level = yfe.team_level and ie.team_type = yfe.team_type
left join y2024_onboardings yob on ie.team = yob.team and ie.team_level = yob.team_level and ie.team_type = yob.team_type
left join y2024_offboardings yofb on ie.team = yofb.team and ie.team_level = yofb.team_level and ie.team_type = yofb.team_type
left join y2024_attrition yat on ie.team = yat.team and ie.team_level = yat.team_level and ie.team_type = yat.team_type
left join y2024_early_attrition yea on ie.team = yea.team and ie.team_level = yea.team_level and ie.team_type = yea.team_type
left join y2024_periodo_prueba ypp on ie.team = ypp.team and ie.team_level = ypp.team_level and ie.team_type = ypp.team_type

-- early attrition custom join
left join custom_early_attrition cea on ie.team = cea.team and ie.team_level = cea.team_level and ie.team_type = cea.team_type

where ie.team is not null
