{% macro dedup_not_deleted_source(source_name, source_table, cte_name=None) %}
{%- set cte_name = cte_name if cte_name is not none else 'dedup_' ~ source_table -%}
source_data as (
	select *
	from (
		select *,
			row_number() over (partition by id order by _event_ts desc) rn
		from {{ source(source_name, source_table) }}
	)
),

{{ cte_name }} as (
	select *
	from source_data
	where rn = 1
	  and (_cdc is null or _cdc not like '%op=D%')
)
{% endmacro %}
