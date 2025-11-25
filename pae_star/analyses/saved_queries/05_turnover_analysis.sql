-- Turnover Analysis: Offboarding trends and patterns
-- Analyze which teams have highest turnover and when people leave

with turnover_by_team as (
    select 
        emp.lowest_level_team_name as team,
        count(distinct case when emp.offboarding_date is null then emp.employee_id end) as active_count,
        count(distinct case when emp.offboarding_date is not null then emp.employee_id end) as churned_count,
        count(distinct emp.employee_id) as total_count,
        round(
            count(distinct case when emp.offboarding_date is not null then emp.employee_id end) * 100.0 / 
            nullif(count(distinct emp.employee_id), 0), 
            2
        ) as churn_rate_pct,
        avg(case 
            when emp.offboarding_date is not null 
            then date_diff('day', emp.onboarding_date, emp.offboarding_date)
        end) as avg_tenure_before_exit_days
    from {{ ref('fact_employees') }} emp
    where emp.lowest_level_team_name is not null
    group by emp.lowest_level_team_name
)

select 
    team,
    active_count,
    churned_count,
    total_count,
    churn_rate_pct,
    round(avg_tenure_before_exit_days / 365.25, 1) as avg_tenure_before_exit_years
from turnover_by_team
where total_count >= 3  -- Filter small teams for statistical relevance
order by churn_rate_pct desc
