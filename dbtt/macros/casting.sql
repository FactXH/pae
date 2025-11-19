{% macro cast_to_float(expression) %}
    CASE
        WHEN trim(({{ expression }})) ~ '^[-+]?(\d+(\.\d*)?|\.\d+)$' THEN trim(({{ expression }}))::double precision
        ELSE NULL
    END
{% endmacro %}

{% macro cast_to_date(expression) %}
    CASE
        WHEN trim(({{ expression }})) ~ '^\d{4}-\d{2}-\d{2}' THEN trim(({{ expression }}))::date
        ELSE NULL
    END
{% endmacro %}

{% macro cents_to_currency(expression) %}
    CASE
        WHEN {{ expression }} IS NOT NULL 
             AND {{ expression }}::text ~ '^[-+]?\d+$' 
        THEN ({{ expression }}::integer::float / 100.0)
        ELSE NULL
    END
{% endmacro %}
