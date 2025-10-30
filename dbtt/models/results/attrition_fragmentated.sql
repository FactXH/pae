with attrition as (
    select
        case 
            when emp.main_team = '[Customer Experience]' then '[CX]' 
            else emp.main_team 
        end as team,
        to_char(emp.onboarding_date, 'YYYY-MM') as onboarding_year_and_yearmonth,
        emp.offboarding_date - emp.onboarding_date as days_in_company,
        emp.offboarding_date,
        memb.termination_reason_type
    from {{ ref("br_airtable_employees") }} emp 
    left join {{ ref("br_athena_employees") }} memb
        on emp.employee_id = memb.employee_id
    where 
        emp.onboarding_date > '2022-01-01'
)

select
    team,
    onboarding_year_and_yearmonth,

    count(*) as total_onboarded,

    count(*) filter (where offboarding_date is null) as still_in_company,

    count(*) filter (where offboarding_date is not null and termination_reason_type = 'company') as fired,

    round(((COUNT(*) FILTER (WHERE offboarding_date IS NOT NULL AND days_in_company <= 120 AND termination_reason_type = 'employee'))::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2) AS attrition_in_0_120_days_pct,
    round(((COUNT(*) FILTER (WHERE offboarding_date IS NOT NULL AND days_in_company > 120 AND days_in_company <= 240 AND termination_reason_type = 'employee'))::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2) AS attrition_in_121_240_days_pct,
    round(((COUNT(*) FILTER (WHERE offboarding_date IS NOT NULL AND days_in_company > 240 AND days_in_company <= 360 AND termination_reason_type = 'employee'))::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2) AS attrition_in_241_360_days_pct,
    round(((COUNT(*) FILTER (WHERE offboarding_date IS NOT NULL AND days_in_company > 360 AND days_in_company <= 480 AND termination_reason_type = 'employee'))::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2) AS attrition_in_361_480_days_pct,
    round(((COUNT(*) FILTER (WHERE offboarding_date IS NOT NULL AND days_in_company > 480 AND days_in_company <= 600 AND termination_reason_type = 'employee'))::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2) AS attrition_in_481_600_days_pct,
    round(((COUNT(*) FILTER (WHERE offboarding_date IS NOT NULL AND days_in_company > 600 AND termination_reason_type = 'employee'))::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2) AS attrition_in_601_plus_days_pct

from attrition
group by team, onboarding_year_and_yearmonth
order by team, onboarding_year_and_yearmonth
