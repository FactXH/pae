with answers as (
    SELECT * from {{ source('files', 'file_manager_assessment_raw_data') }}
    ),

employees as (
    select
        email,
        concat(first_name, ' ', last_name) as employee_name
    from {{ ref("slv_employees") }}
),

result as (
select 
    case when evaluation_type = 'self' then answers.respondent_email else emp.employee_email end as target_email,
    answers.*
from answers
left join lateral (
    select
        emp.employee_name,
        emp.email as employee_email,
        similarity(answers.manager_name, emp.employee_name) as similarity_score
    from employees emp
    order by similarity(answers.manager_name, emp.employee_name) desc
    limit 1
) emp on true
)

select * from result
