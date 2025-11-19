with raw_airtable_todos as (
    select * from {{ source("athena", "airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7") }}
)

select distinct
    main_team,
    team as airtable_team,
    market as airtable_market,
    teams
from raw_airtable_todos