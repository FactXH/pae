with source_teams as (Select
    *
  FROM
    (
      Select
        *,
        row_number() Over(
          Partition by id
          Order by
            _event_ts DESC
        ) rn
      FROM
        athena_memberships
    ))

select * from source_teams where rn = 1
and _cdc not like '%op=D%'
