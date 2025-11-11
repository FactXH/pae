select 
    
    main_team,
        case
            when fecha_offboarding = '' then 'ACTIVE'
            else 'OFFBOARDED'
        end as status,
        count(*)
    from athena_airtable_people_todo
    group by 
        main_team,
        case
            when fecha_offboarding = '' then 'ACTIVE'
            else 'OFFBOARDED'
        end;


    select column_name, data_type, is_nullable
    from information_schema.columns
    where table_name = 'athena_airtable_people_todo';

        ;
        
    select 
        main_team,
        case 
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 24 then '21-23'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 27 then '24-26'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 30 then '27-29'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 33 then '30-32'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 36 then '33-35'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 39 then '36-38'
            else '39+'
        end as age_bin,
        count(*) as people_count,
        STRING_AGG(EMAIL, ', ')
    from athena_airtable_people_todo
    where fecha_offboarding = ''
    group by 
        main_team,
        case 
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 24 then '21-23'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 27 then '24-26'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 30 then '27-29'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 33 then '30-32'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 36 then '33-35'
            when DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(birthday, 'YYYY-MM-DD'))) < 39 then '36-38'
            else '39+'
        end
    union all
    select main_team, 'all_ages' as age_bin, count(*) as people_count,
    STRING_AGG(EMAIL, ', ')
    from athena_airtable_people_todo
    where fecha_offboarding = ''
    group by main_team
    order by main_team, age_bin;