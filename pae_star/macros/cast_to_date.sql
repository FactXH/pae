{% macro cast_to_date(expression) %}
    case
        when try_cast({{ expression }} as date) is not null 
        then try_cast({{ expression }} as date)
        else null
    end
{% endmacro %}
