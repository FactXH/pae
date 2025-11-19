with offer_letters as (
    select * from {{ source("factorial_ats", "ats_offer_letters") }}
)

select 1