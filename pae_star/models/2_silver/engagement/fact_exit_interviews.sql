-- =====================================================
-- Fact Table: Exit Interviews (Employee Level)
-- =====================================================
-- Grain: 1 row per employee exit interview
-- Source: base_factorial_exit_interviews
-- =====================================================

with base as (
    select * from {{ ref('base_factorial_exit_interviews') }}
)

select
    employee_id,
    manager_email,
    main_team,
    job_position,
    fecha_offboarding as offboarding_date,
    terminated_reason,
    tipo_de_baja_simplificada as exit_type,
    compensation,
    benefits,
    professional_development,
    rate_team_members,
    rate_your_manager,
    rate_overall_culture,
    work_life_balance,
    days_in_company,
    permanence_months,
    recommend_to_a_friend,
    main_reason_of_leaving,
    secondary_reason_of_leaving,
    come_back,
    come_back_circumstances,
    is_salary_increasing,
    room_for_improvement,
    most_positive_aspects,
    transparency_and_communication,
    -- Comments fields
    ar_comments,
    tc_comments,
    team_comments,
    culture_comments,
    manager_comments,
    product_comments,
    benefits_comments,
    professional_development_comments,
    afterworks_and_rituals,
    work_life_balance_comments,
    where_are_you_going,
    compensation_comments,
    comment_reasons_for_leaving
from base
