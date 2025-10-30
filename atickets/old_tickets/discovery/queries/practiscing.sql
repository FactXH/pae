select email,
    birthday as birth_year,
    EXTRACT(YEAR FROM TO_DATE(birthday, 'YYYY-MM-DD')) AS year,
    CURRENT_DATE - TO_DATE(birthday, 'YYYY-MM-DD') AS age_in_days,
    ROUND((CURRENT_DATE - TO_DATE(birthday, 'YYYY-MM-DD')) / 365.0, 2) AS age_in_years
from athena_airtable_people_todo
where email like 'xavier%';