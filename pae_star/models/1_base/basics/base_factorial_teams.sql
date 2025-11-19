with 
{{ dedup_not_deleted_source('athena', 'teams', include_deleted=True) }}

select
    id as team_id,
    case 
        when name = 'CX/Customer Services' then 'CX/CS'
        else name
    end as team_name,
    LENGTH(name) - LENGTH(REPLACE(name, '/', '')) AS team_level,
    case 
        when LOWER(name) LIKE '%office%' then 'Office'
        when LOWER(name) LIKE '%market/%' then 'Market'
        else 'Team' 
    end as team_type,
    case 
        when _cdc is null then null
        else _cdc.op
    end as last_operation
from dedup_teams


