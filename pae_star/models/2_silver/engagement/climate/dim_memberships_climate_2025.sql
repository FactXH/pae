-- =====================================================
-- Climate Survey 2025 Memberships Dimension
-- =====================================================
-- This dimension captures team memberships at the time
-- of the Climate Survey 2025 (September 10, 2025)
-- =====================================================

SELECT *
FROM {{ ref("dim_memberships_scd") }}
WHERE 
    DATE '2025-09-10' BETWEEN effective_from AND effective_to 
    or 
    DATE '2025-09-10' > effective_from and effective_to is null
