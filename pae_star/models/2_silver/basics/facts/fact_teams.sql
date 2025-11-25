with teams as (
    select * from {{ ref("dim_teams") }}
),

employees as (
    select * from {{ ref("fact_employees") }}
),

memberships as (
    select * from {{ ref("dim_memberships_scd") }}
    where is_current = true
),

-- Aggregate employee metrics per team
team_metrics as (
    select 
        mem.team_id,
        
        -- Current active employees
        count(distinct case 
            when emp.offboarding_date is null then emp.employee_id 
        end) as active_employees,
        
        -- Current inactive employees (offboarded but still in membership)
        count(distinct case 
            when emp.offboarding_date is not null then emp.employee_id 
        end) as inactive_employees,
        
        -- Total current headcount
        count(distinct emp.employee_id) as total_current_headcount,
        
        -- Average tenure for active employees (in days)
        avg(case 
            when emp.offboarding_date is null 
            then date_diff('day', coalesce(emp.onboarding_date, emp.tenure_start_date), current_date)
        end) as avg_tenure_days_active,
        
        -- Average salary for active employees
        avg(case 
            when emp.offboarding_date is null then emp.current_salary_amount 
        end) as avg_salary_active,
        
        -- Min and max salary for active employees
        min(case 
            when emp.offboarding_date is null then emp.current_salary_amount 
        end) as min_salary_active,
        
        max(case 
            when emp.offboarding_date is null then emp.current_salary_amount 
        end) as max_salary_active,
        
        -- Count by role (top 3 most common roles for active employees)
        array_join(
            array_agg(distinct emp.last_role_level_name order by emp.last_role_level_name) 
            filter (where emp.offboarding_date is null),
            ', '
        ) as active_roles,
        
        -- Salary increase percentage in 2025 (average for team)
        avg(case 
            when emp.offboarding_date is null then emp.salary_increase_pct_2025 
        end) as avg_salary_increase_pct_2025
        
    from memberships mem
    left join employees emp
        on cast(mem.employee_id as varchar) = emp.employee_id
    group by mem.team_id
)

select 
    teams.team_id,
    teams.team_name,
    teams.team_level,
    teams.team_type,
    teams.parent_team_id,
    teams.parent_team_name,
    teams.is_last_team,
    
    -- Employee metrics
    coalesce(metrics.active_employees, 0) as active_employees,
    coalesce(metrics.inactive_employees, 0) as inactive_employees,
    coalesce(metrics.total_current_headcount, 0) as total_current_headcount,
    
    -- Tenure metrics
    metrics.avg_tenure_days_active,
    round(metrics.avg_tenure_days_active / 365.25, 2) as avg_tenure_years_active,
    
    -- Salary metrics
    metrics.avg_salary_active,
    metrics.min_salary_active,
    metrics.max_salary_active,
    
    -- Role information
    metrics.active_roles,
    
    -- 2025 metrics
    metrics.avg_salary_increase_pct_2025,
    
    -- Calculated flags
    case 
        when metrics.active_employees = 0 then true 
        else false 
    end as is_empty_team,
    
    case 
        when metrics.active_employees > 0 and metrics.active_employees < 3 then true 
        else false 
    end as is_small_team,
    
    case 
        when metrics.active_employees >= 10 then true 
        else false 
    end as is_large_team

from teams
left join team_metrics metrics
    on teams.team_id = metrics.team_id
order by teams.team_level, teams.team_name
