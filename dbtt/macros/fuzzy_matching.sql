-- Macros for fuzzy string matching using PostgreSQL pg_trgm extension

{% macro enable_pg_trgm() %}
    -- Enable pg_trgm extension if not already enabled
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
{% endmacro %}

{% macro fuzzy_match_score(field1, field2, weight=1.0) %}
    -- Calculate similarity score between two fields with optional weight
    (coalesce(similarity(lower({{ field1 }}), lower({{ field2 }})), 0) * {{ weight }})
{% endmacro %}

{% macro best_fuzzy_match(source_table, target_table, match_fields, weight_map={}) %}
    -- Generic fuzzy matching between two tables
    -- match_fields: list of tuples [(source_field, target_field, weight), ...]
    
    with cross_matched as (
        select
            s.*,
            t.*,
            {% for source_field, target_field, weight in match_fields %}
                {{ fuzzy_match_score(source_field, target_field, weight) }} as {{ source_field }}_score
                {% if not loop.last %}, {% endif %}
            {% endfor %}
        from {{ source_table }} s
        cross join {{ target_table }} t
    ),
    
    scored as (
        select
            *,
            (
                {% for source_field, target_field, weight in match_fields %}
                    {{ source_field }}_score
                    {% if not loop.last %} + {% endif %}
                {% endfor %}
            ) as total_score
        from cross_matched
    )
    
    select * from scored
{% endmacro %}
