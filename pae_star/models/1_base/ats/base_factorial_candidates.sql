with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_candidates', include_deleted=True) }}

select
    id as candidate_id,
    gender as candidate_gender,
    rating_average as candidate_rating_average,
    inactive_since as candidate_inactive_since,
    company_id,
    searchable as candidate_searchable,
    talent_pool as candidate_talent_pool,
    consent_to_talent_pool as candidate_consent_to_talent_pool,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_ats_candidates