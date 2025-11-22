

select * from data_lake_bronze.employees limit 1;

-- eliminar accesses ya que employee id gold ya tiene user id. Y no es neceesario pasar por ahi.
-- 


WITH
  teams_ AS (
   SELECT *
   FROM
     (
      SELECT
        *
      , row_number() OVER (PARTITION BY id ORDER BY _event_ts DESC) rn
      FROM
        "data_lake_bronze"."teams"
   ) 
   WHERE ((rn = 1) AND (NOT (_cdc.op LIKE 'D')))
) 
, employees_ AS (
   SELECT *
   FROM
     (
      SELECT
        *
      , row_number() OVER (PARTITION BY id ORDER BY _event_ts DESC) rn
      FROM
        "data_lake_bronze"."employees"
   ) 
   WHERE (rn = 1)
) 
, accesses_ AS (
   SELECT *
   FROM
     (
      SELECT
        *
      , row_number() OVER (PARTITION BY id ORDER BY _event_ts DESC) rn
      FROM
        "data_lake_bronze"."accesses"
   ) 
   WHERE (rn = 1)
) 
, users_ AS (
   SELECT *
   FROM
     (
      SELECT
        *
      , row_number() OVER (PARTITION BY id ORDER BY _event_ts DESC) rn
      FROM
        "data_lake_bronze"."users"
   ) 
   WHERE (rn = 1)
) 
, manager AS (
   SELECT *
   FROM
     (
      SELECT
        c.*
      , row_number() OVER (PARTITION BY c.employee_id ORDER BY c.month_end DESC) rn
      FROM
        ("data_lake_gold"."monthly_employees_managers_hierarchy" c
      INNER JOIN (
         SELECT DISTINCT
           employee_id
         , company_id
         FROM
           "data_lake_gold"."employees"
         WHERE (company_id = 1)
      )  a ON (a.employee_id = c.employee_id))
   ) 
   WHERE (rn = 1)
) 
, b1 AS (
   SELECT
     ARRAY_AGG(t.team_id) teams_id
   , ARRAY_AGG(t2.name) teams_name
   , em.*
   , emp.gender
   , emp.nationality
   , emp.country
   , emp.city
   , emp.birthday_on
   , date_diff('year', emp.birthday_on, now()) age
   , us.email
   FROM
     ((((((
      SELECT *
      FROM
        "data_lake_silver"."employees_contract_intervals"
      WHERE (company_id = 1)
   )  em
   LEFT JOIN (
      SELECT *
      FROM
        "data_lake_silver"."employees_team_intervals"
      WHERE (company_id = 1)
   )  t ON ((t.employee_id = em.employee_id) AND (((t.created_at >= em.starts_on) AND ((t.created_at <= em.ends_on) OR (em.ends_on IS NULL))) OR ((t.ends_at >= em.starts_on) AND ((t.ends_at <= em.ends_on) OR (em.ends_on IS NULL))))))
   LEFT JOIN teams_ t2 ON (t2.id = t.team_id))
   LEFT JOIN employees_ emp ON (emp.id = em.employee_id))
   LEFT JOIN accesses_ ac ON (ac.id = emp.access_id))
   LEFT JOIN users_ us ON (us.id = ac.user_id))
   WHERE (em.company_id = 1)
   GROUP BY 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22
   ORDER BY em.employee_id ASC, em.period ASC
) 
, b2 AS (
   SELECT
     b1.*
   , m.manager_id last_manager
   , m.managers_hierarchy last_managers_hierarchy
   , ele.legal_entity_name
   , ele.legal_entity_id
   , (CASE WHEN (((b1.ends_on IS NULL) OR (b1.ends_on > now())) AND (b1.starts_on <= now())) THEN 'current' WHEN (b1.starts_on > now()) THEN 'future' ELSE 'past' END) employee_type
   FROM
     ((b1
   LEFT JOIN "data_lake_silver"."employees_legal_entities" ele ON (ele.employee_id = b1.employee_id))
   LEFT JOIN manager m ON (b1.employee_id = m.employee_id))
   WHERE ((NOT (b1.email LIKE 'okta@factorial.co')) AND (NOT (b1.email LIKE 'workato@factorial.co')))
   ORDER BY b1.employee_id ASC, b1.period ASC
) 
SELECT
  b2.*
, CONCAT(u.first_name, ' ', u.last_name) last_manager_name
, u.email last_manager_email
, air.tipo_de_baja_simplificada
FROM
  (((b2
LEFT JOIN data_lake_gold.employees em ON (em.employee_id = b2.last_manager))
LEFT JOIN users_ u ON (u.id = em.user_id))
LEFT JOIN "data_lake_bronze"."airbyte_airtable_people_people_todos_sync_view_tblmwfnk5fykznky7" air ON (air.email = b2.email));
;



select * from data_lake_gold.employees
where COMPANY_ID = 1;