with offer_letters as (
    select
        file_id,
        file_name,
        employee_id,
        created_at as offer_letter_created_at
    from {{ source('files', "file_offer_letters") }}
)

select 