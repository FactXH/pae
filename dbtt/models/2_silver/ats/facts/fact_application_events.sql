with application_events as (
    select * from {{ ref("br_athena_applications_cdc") }}
),

offer_letters as (
    select * from {{ ref("br_athena_offer_letters") }}
)

select 1