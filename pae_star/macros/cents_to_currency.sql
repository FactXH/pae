{% macro cents_to_currency(column_name) %}
    case 
        when {{ column_name }} is null then null 
        else {{ column_name }} / 100.0 
    end
{% endmacro %}
