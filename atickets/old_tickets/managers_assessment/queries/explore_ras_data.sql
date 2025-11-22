select * from file_manager_assessment_raw_data 
where source_file = 'Assessment_ Fotografía de Liderazgo y Flexibilidad (Responses).xlsx'
limit 10;

select * from file_manager_assessment_raw_data 
where source_file = 'Assessment_ Leadership and Flexibility (Responses).xlsx'
limit 10;


select * from file_manager_assessment_raw_data 
where source_file = 'Valoración del liderazgo de tu direct report (Responses).xlsx'
limit 10;

select * from file_manager_assessment_raw_data 
where source_file = 'Valoración del liderazgo de tu manager (Responses).xlsx'
limit 10;


select * from file_manager_assessment_raw_data 
where source_file = 'Leadership Assessment of Your Manager (Responses).xlsx'
limit 10;


select source_file, evaluation_type, count(*) from file_manager_assessment_raw_data 
group by 1,2

;


select * from file_manager_assessment_raw_data
;

CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- 2. Use CTEs to simulate two tables with names
WITH table_a(name) AS (
  VALUES ('Johnh'), ('Katherine'), ('Steve'), ('Micheal')
),
table_b(name) AS (
  VALUES ('John'), ('Johnh'), ('Catherine'), ('Steven'), ('Michael'), ('Stephanie')
)

-- 3. Fuzzy join: for each name in table_a, find the most similar in table_b
SELECT 
  a.name AS name_a, 
  b.name AS name_b, 
  similarity(a.name, b.name) AS similarity_score
FROM table_a a
JOIN LATERAL (
  SELECT 
    b.name, 
    similarity(a.name, b.name) AS similarity
  FROM table_b b
  ORDER BY similarity(a.name, b.name) DESC
  LIMIT 1
) b ON TRUE
ORDER BY similarity_score DESC;;


"provides_direction_clarity"
"builds_trust_communication"
"resolves_conflicts_fairly"
"adapts_leadership_style"
"promotes_action_progress"
"listens_other_viewpoints"
"open_minded"
"encourages_dialogue"
"stays_calm_alternatives"
"comfortable_with_change"
"promotes_learning_adaptability"
"learning_proactivity"
"focuses_on_solutions"
"shares_positive_vision"
"sees_opportunities_not_problems"
"learning_mindset_mistakes"
"motivates_actionable_focus"
"asume_own_responsability"
"clarity_and_vision"




select column_name from information_schema.columns
where table_schema = 'public'  -- change if needed
  and table_name   = 'slv_manager_assessment_results'
  and data_type = 'bigint'


;
with candidates as (
  select 1 as id, 'Jose Roberto Laban' as candidate union all
  select 2, 'Dimitri Ciavarelli' union all
  select 3, 'Carolina Medina' union all
  select 4, 'Felipe Rivera' union all
  select 5, 'Joan Carro' union all
  select 6, 'Marc Matas' union all
  select 7, 'Nora Goyanes' union all
  select 8, 'Pedro Droz' union all
  select 9, 'Andrea Barbero Gutiérrez' union all
  select 10, 'Josep Nadal' union all
  select 11, 'Mariano Aguirre Hernando' union all
  select 12, 'Guillermo Aguer' union all
  select 13, 'Dev Ikaev' union all
  select 14, 'Alejandro Pedraza' union all
  select 15, 'Aram Barkiaman' union all
  select 16, 'Gonzalo Chiesa' union all
  select 17, 'Carlos Ventos' union all
  select 18, 'Paula Mattolini' union all
  select 19, 'fghjkjhg' union all
  select 20, 'fghjjh2'
),

evaluators as (
  select 1 as id, 'Marc Castells' as evaluator union all
  select 2, 'Ana Jimenez' union all
  select 3, 'Pablo Martinez' union all
  select 4, 'Lucia Gomez' union all
  select 5, 'Sergio Lopez' union ALL
  select 6, 'Marta Sanchez' union all
  select 7, 'Javier Torres' union all
  select 8, 'Elena Ruiz' union all
  select 9, 'David Fernandez' union all
  select 10, 'Laura Moreno'
),

dinamica_1_evaluadors_1 as (SELECT
 * from evaluators where id in (1,2,3,4,5)),
dinamica_1_evaluadors_2 as (SELECT
 * from evaluators where id in (6,7,8,9,10))

  select 
      c.id as candidate_id,
      c.candidate,
      e.id as evaluator_id,
      e.evaluator
  from candidates c
  left join dinamica_1_evaluadors_1 e on 1 = 1 and e.id in (1,2,3,4,5)
  and c.id < 11
  and e.id is not null

union ALL
select 
      c.id as candidate_id,
      c.candidate,
      e.id as evaluator_id,
      e.evaluator
  from candidates c
  left join dinamica_1_evaluadors_2 e on 1 = 1 and e.id in (6,7,8,9,10)
  and c.id >= 11
  and e.id is not null
;


-- 20 candidats
-- 5 grups i cada grup de 5 te dos avaluadosrs diferents


select evaluation_type, * from slv_manager_assessment_results;


;
select * from slv_manager_assessment_results where target_email like 'marc.caste%'
