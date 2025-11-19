{% macro cast_to_float(expression) %}
    case
        when try_cast(trim(cast({{ expression }} as varchar)) as double) is not null 
        then try_cast(trim(cast({{ expression }} as varchar)) as double)
        else null
    end
{% endmacro %}
