{{
    config(
        materialized='table',
        schema='silver'
    )
}}

with employees as (
    select * from {{ ref("base_airtable_employees")}}
)

select * from employees
where first_name like 'Xavier%'