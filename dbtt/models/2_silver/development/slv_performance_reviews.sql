with performance_review_processes as (
    select * from {{ ref("br_athena_performance_review_processes") }}
),

performance_review_process_targets as (
    select * from {{ ref("br_athena_performance_review_process_targets") }}
),

performance_reviews_evaluations as (
    select * from {{ ref("br_athena_performance_reviews_evaluations") }}
),

performance_review_scores as (
    select * from {{ ref("br_athena_perfomance_scores") }}
),

final_employee_scores as (
    select * from {{ ref("br_athena_performance_review_final_employee_scores") }}
),

employees as (
    select
        employee_id,
        access_id
    from {{ ref("dim_employees") }} pe
)

select
    prp.performance_review_process_id,
    prp.performance_review_name,
    prp.performance_review_start_date,
    e.employee_id,
    manager.employee_id as manager_employee_id,
    self_pre.reviewer_access_id as self_reviewer_access_id,
    manager_pre.reviewer_access_id as manager_reviewer_access_id,
    self_pre.employee_score_questionnaire_answered as self_employee_score_questionnaire_answered,
    manager_pre.employee_score_questionnaire_answered as manager_employee_score_questionnaire_answered,

    self_pre.review_questionnaire_answered as self_review_questionnaire_answered,
    manager_pre.review_questionnaire_answered as manager_review_questionnaire_answered,

    self_score.score as self_score,
    manager_score.score as manager_score,
    fes.score as final_employee_score,
    fes.normalized_score as final_normalized_score,
    fes.calculated_at as final_score_calculated_at

from 
    performance_review_processes prp
left join performance_review_process_targets prpt
    on prp.performance_review_process_id = prpt.performance_review_process_id
left join employees e
    on prpt.target_access_id = e.access_id
left join performance_reviews_evaluations self_pre
    on prpt.target_access_id = self_pre.target_access_id and prp.performance_review_process_id = self_pre.review_process_id and self_pre.evaluation_type = 'self'
left join performance_reviews_evaluations manager_pre
    on prpt.target_access_id = manager_pre.target_access_id and prp.performance_review_process_id = manager_pre.review_process_id and manager_pre.evaluation_type = 'manager'
left join performance_review_scores self_score
    on prp.performance_review_process_id = self_score.review_process_id and prpt.target_access_id = self_score.target_access_id and self_score.reviewer_strategy = 'self'
left join performance_review_scores manager_score
    on prp.performance_review_process_id = manager_score.review_process_id and prpt.target_access_id = manager_score.target_access_id and manager_score.reviewer_strategy = 'manager'
left join final_employee_scores fes
    on prpt.performance_review_process_target_id = fes.performance_review_process_target_id
left join employees manager
    on manager.access_id = manager_pre.reviewer_access_id
