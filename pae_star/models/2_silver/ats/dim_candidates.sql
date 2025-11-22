with candidates as (
    select * from {{ ref("base_factorial_candidates") }}
)

select
    candidate_id,
    first_name as candidate_first_name,
    last_name as candidate_last_name,
    email as candidate_email,
    all_names as candidate_all_names,
    candidate_gender,
    candidate_rating_average,
    candidate_inactive_since,
    company_id,
    candidate_searchable,
    candidate_talent_pool,
    candidate_consent_to_talent_pool,
    last_operation
from candidates
