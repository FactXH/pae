-- =====================================================
-- Climate Survey 2024 Memberships Dimension
-- =====================================================
-- This dimension captures team memberships at the time
-- of the Climate Survey 2024 (approximate date: September 2024)
-- TODO: Update the date to the actual survey date
-- =====================================================

SELECT *
FROM {{ ref("dim_memberships_scd") }}
WHERE 
    (DATE '2024-09-10' BETWEEN effective_from AND effective_to)
    or 
    (DATE '2024-09-10' > effective_from and effective_to is null)