with source_teams as (
    select *
    from (
        select *,
            row_number() over (partition by id order by _event_ts desc) rn
        from {{ source("athena", "athena_teams") }}
    )
),

deduplicated_teams as (
    select *
    from source_teams
    where rn = 1
    and (_cdc is null or _cdc not like '%op=D%')
)

select
    id as team_id,
    name as team_name,
    LENGTH(name) - LENGTH(REPLACE(name, '/', '')) AS team_level,
    case 
        when name ILIKE '%office%' then 'Office'
        when name ILIKE '%market/%' then 'Market'
        else 'Team' 
    end as team_type
from deduplicated_teams

-- TODO:
-- REPLACE NAMES Customer Support for CS :)
