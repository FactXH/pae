-- Market and Office Distribution: Employee distribution across markets and offices
-- Geographic and organizational distribution analysis

with market_distribution as (
    select 
        mm.market_name,
        count(distinct emp.employee_id) as employee_count,
        count(distinct case when emp.offboarding_date is null then emp.employee_id end) as active_count,
        round(avg(emp.current_salary_amount), 2) as avg_salary
    from {{ ref('dim_market_memberships') }} mm
    left join {{ ref('fact_employees') }} emp
        on cast(mm.employee_id as varchar) = emp.employee_id
    where mm.is_current = true
    group by mm.market_name
),

office_distribution as (
    select 
        om.office_name,
        count(distinct emp.employee_id) as employee_count,
        count(distinct case when emp.offboarding_date is null then emp.employee_id end) as active_count,
        round(avg(emp.current_salary_amount), 2) as avg_salary
    from {{ ref('dim_office_memberships') }} om
    left join {{ ref('fact_employees') }} emp
        on cast(om.employee_id as varchar) = emp.employee_id
    where om.is_current = true
    group by om.office_name
)

select 
    'Market' as type,
    market_name as name,
    employee_count,
    active_count,
    avg_salary
from market_distribution

union all

select 
    'Office' as type,
    office_name as name,
    employee_count,
    active_count,
    avg_salary
from office_distribution

order by type, employee_count desc
