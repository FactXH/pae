with offer_letters as (
    select * from {{ source("athena_ats", "athena_ats_offer_letters") }}
)

select 1