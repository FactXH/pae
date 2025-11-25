with memberships as (
    select * from {{ ref("base_factorial_memberships") }}
),

offices as (
    select * from {{ ref("dim_offices") }}
),

office_memberships as (
    select 
        mem.employee_id,
        mem.team_id as office_id,
        offices.office_name,
        offices.office_level,
        mem.start_date,
        mem.end_date,
        case 
            when mem.end_date is null then true 
            else false 
        end as is_current
    from memberships mem
    inner join offices
        on mem.team_id = offices.office_id
)

select * from office_memberships
order by employee_id, start_date
