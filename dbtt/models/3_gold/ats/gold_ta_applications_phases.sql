with dim_applications as (
    select * from {{ ref("dim_applications") }}
),

fact_application_events as (
    select * from {{ ref("fact_application_events") }}
),

dim_candidates as (
    select * from {{ ref("dim_candidates") }}
),

dim_job_posting_scd as (
    select * from {{ ref("dim_job_posting_scd") }}
),

dim_teams as (
    select * from {{ ref("dim_teams") }}
)

select 1