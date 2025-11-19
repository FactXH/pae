with 
{{ dedup_not_deleted_source('athena', 'memberships', include_deleted=True) }}

select
    id as membership_id,
    employee_id,
    team_id,
    lead as is_lead
from dedup_memberships