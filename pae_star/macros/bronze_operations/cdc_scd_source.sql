{% macro cdc_scd_source(source_name, source_table, unique_fields, scd_fields, cte_name=None, company_id=1) %}
{%- set cte_name = cte_name if cte_name is not none else 'scd_' ~ source_table -%}
{%- set unique_fields_list = unique_fields if unique_fields is iterable and unique_fields is not string else [unique_fields] -%}
{%- set scd_fields_list = scd_fields if scd_fields is iterable and scd_fields is not string else [scd_fields] -%}

source_data as (
    select *,
        row_number() over (
            partition by {{ unique_fields_list | join(', ') }}
            order by _event_ts
        ) as rn
    from {{ source(source_name, source_table) }}
    {% if company_id != 'all' %}
    where company_id = {{ company_id }}
    {% endif %}
),

ranked_changes as (
    select 
        {%- for field in unique_fields_list %}
        {{ field }},
        {%- endfor %}
        {%- for field in scd_fields_list %}
        {{ field }},
        {%- endfor %}
        _event_ts,
        row_number() over (
            partition by {{ unique_fields_list | join(', ') }}, {{ scd_fields_list | join(', ') }}
            order by _event_ts
        ) as change_rn
    from source_data
),

distinct_changes as (
    select 
        {%- for field in unique_fields_list %}
        {{ field }},
        {%- endfor %}
        {%- for field in scd_fields_list %}
        {{ field }},
        {%- endfor %}
        _event_ts,
        lead(_event_ts) over (
            partition by {{ unique_fields_list | join(', ') }}
            order by _event_ts
        ) as next_event_ts
    from ranked_changes
    where change_rn = 1
),

{{ cte_name }} as (
    select 
        {%- for field in unique_fields_list %}
        {{ field }},
        {%- endfor %}
        {%- for field in scd_fields_list %}
        {{ field }},
        {%- endfor %}
        _event_ts as effective_from,
        coalesce(next_event_ts, cast('9999-12-31' as timestamp)) as effective_to,
        case 
            when next_event_ts is null then true 
            else false 
        end as is_current
    from distinct_changes
)
{% endmacro %}
