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
    where emp.offboarding_date > '2025-01-01' or emp.offboarding_date is null
),

initial_employees as (
    select
        team, team_level, team_type, count(*) as initial_employees
    from 
       employee_teams
    where 
        onboarding_date <= '2025-01-01' 
        and (offboarding_date >'2025-01-01' or offboarding_date is null)
    group by
        team, team_level, team_type
),

final_employees as (
    select
        team, team_level, team_type, count(*) as final_employees
    from 
        employee_teams
    where 
        onboarding_date <= '2025-10-15' 
        and (offboarding_date >'2025-10-15' or offboarding_date is null)
    group by
        team, team_level, team_type
),

onboardings as (
    select
        team, team_level, team_type, count(*) as onboardings
    from 
        employee_teams
    where 
        onboarding_date > '2025-01-01' 
        and onboarding_date <= '2025-10-15'
    group by
        team, team_level, team_type
),

ofboardings as (
    select
        team, team_level, team_type, count(*) as offboardings
    from 
        employee_teams
    where 
        offboarding_date > '2025-01-01' 
        and offboarding_date <= '2025-10-15'
    group by
        team, team_level, team_type
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
        group by
            team, team_level, team_type
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
        and (offboarding_date - onboarding_date) <= 90
        group by
            team, team_level, team_type
),

periodo_prueba as (
    select
            team, team_level, team_type, count(*) as periodo_prueba
        from 
            employee_teams
        where 
            offboarding_date > '2025-01-01' 
        and terminated_reason like 'No superación del periodo de prueba (instancia empresa%'
        group by
            team, team_level, team_type
)

select
    ie.team,
    ie.team_level,
    ie.team_type,
    ie.initial_employees,
    fe.final_employees,
    ob.onboardings,
    ofb.offboardings,
    coalesce(fe.final_employees,0) - coalesce(ie.initial_employees,0) as net_change,
    round(COALESCE(offboardings,0) / NULLIF((COALESCE(initial_employees,0) + COALESCE(final_employees,0)) / 2.0, 0), 2) as turnover_rate
    , at.attrition
    , ea.early_attrition
    , pp.periodo_prueba
from 
    initial_employees ie
left join 
    final_employees fe
    on ie.team = fe.team
left join 
    onboardings ob
    on ie.team = ob.team
left join 
    ofboardings ofb
    on ie.team = ofb.team
left join 
    attrition at
    on ie.team = at.team
left join 
    early_attrition ea
    on ie.team = ea.team
left join 
    periodo_prueba pp
    on ie.team = pp.team

where ie.team is not null