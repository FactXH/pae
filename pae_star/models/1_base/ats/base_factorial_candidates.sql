with 
{{ dedup_not_deleted_source('factorial_ats', 'ats_candidates', include_deleted=True) }}
,

all_names as (
    select 
        id,
        array_join(array_agg(distinct concat(first_name, ' ', last_name)), ', ') as all_names
    from {{source('factorial_ats', 'ats_candidates')}}
    where company_id = 1
    group by id
)

select
    dedup.id as candidate_id,
    dedup.first_name,
    dedup.last_name,
    dedup.email,
    dedup.gender as candidate_gender,
    dedup.rating_average as candidate_rating_average,
    dedup.inactive_since as candidate_inactive_since,
    dedup.company_id,
    dedup.searchable as candidate_searchable,
    dedup.talent_pool as candidate_talent_pool,
    dedup.consent_to_talent_pool as candidate_consent_to_talent_pool,
    names.all_names,
    case 
        when dedup._cdc is null then null
        else dedup._cdc.op
    end as last_operation
from dedup_ats_candidates dedup
left join all_names names
    on dedup.id = names.id