
-- xavier 
-- employee_id 2306420
-- access_id 2337028

-- regina
-- employee_id 1953129
-- access_id  1953129

-- nerea 
-- employee_id = 1434263
-- access_id = 1440242

-- johson
-- employee_id = 449104
-- access_id = 454219



performance_review_processes
performance_review_process_targets
performance_review_final_employee_scores
performance_review_employee_scores
performance_review_evaluations

;
select distinct id, name from data_lake_bronze.performance_review_processes where id in (
    select distinct performance_review_process_id from data_lake_bronze.performance_review_process_targets
    where access_id = 454219
);


select * from data_lake_bronze.performance_review_process_targets
where access_id = 454219;

select * from data_lake_bronze.performance_review_final_employee_scores
where performance_review_process_target_id in (
    select id from data_lake_bronze.performance_review_process_targets
    where access_id = 454219
)
;

select * from data_lake_bronze.performance_review_employee_scores
where review_process_id in (52013) and target_access_id = 2337028
;

;

select * from data_lake_bronze.performance_review_processes where id = 146875;
;

{
    "questionnaires":
    {"self":
     {"content":
     [{"type":"question","uuid":"4ecadb07-9e8f-4608-aa97-4c3a867b6f4b",
     "title":"What were your main goals during this review period, and how did they align with your role and team/company objectives?","metadata":{},"mandatory":true,"answer_type":"text","description":null},
     {"type":"question","uuid":"cfd482e2-2c88-4f84-a501-be15f70bf89d","title":"What accomplishments are you most proud of during this period, and what impact did they have on your team or the company?","metadata":{},"mandatory":true,"answer_type":"text","description":null},
     {"type":"question","uuid":"5c2d0552-f427-4d0f-8142-8d9d491361f2","title":"Looking back, what could you have approached differently, and what concrete steps will you take to grow and improve in your role?","metadata":{},"mandatory":true,"answer_type":"text","description":null},
     {"type":"question","uuid":"a9295363-ec28-4ab7-bc00-d62637b5b791","title":"How has your manager supported (or limited) your development and performance during this period? Please provide examples of both strengths and areas for improvement.","metadata":{},"mandatory":true,"answer_type":"text","description":null}]},
     
     "manager":{"content":[
        {"type":"question","uuid":"35fcc8a6-1f56-49a6-b033-e446f2e54cc0","title":"What were the main goals of your team member during this review period, and how did they align with their role and the team/company objectives?","metadata":{},"mandatory":true,"answer_type":"text","description":null},
        {"type":"question","uuid":"c5f81d86-c3f4-4661-af61-74c2749c1e80","title":"What accomplishments from your team member are you most proud of during this period, and what impact did they have on your team or the company?","metadata":{},"mandatory":true,"answer_type":"text","description":null},
        {"type":"question","uuid":"96842383-a375-4600-85d6-5a276d9734fd","title":"Looking back, what could your team member have done differently, and what concrete steps could they take to grow and improve in their role?","metadata":{},"mandatory":true,"answer_type":"text","description":null}]}},
        "default_rating_scale":{"1":"Escaso","2":"Inconsistente","3":"Cumple las expectativas","4":"Supera las expectativas","5":"Excepcional"}}


select * from 


select * from 







performance_review_final_employee_scores
15:50
Evaluation score -> performance_review_employee_scores
15:50
Employee final score -> performance_review_final_employee_scores
15:53
Employee en el contexto de una performance review
performance_review_process_targets



15:54
Cada evaluation hecha sobre un employee
performance_review_evaluations



select * from performance_reviews_process