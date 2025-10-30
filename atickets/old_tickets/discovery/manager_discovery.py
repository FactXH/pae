import os
import sys

sys.path.append("/home/xavier/Documents/PAE/Projectes/pae")


from utils.query_runner.query_runner import QueryRunner
from utils.data_loader.loader import Loader

class Manager:
    def direct_reports(self, all_managers):
        return [m for m in all_managers if m.manager_email == self.email]
    
    def __init__(self, employee_id, email, manager_email):
        self.employee_id = employee_id
        self.email = email
        self.manager_email = manager_email
        self.reports = []  # List of (Manager, level)

    def __str__(self):
        return self.email

    def fill_reports(self, all_managers, max_levels=40):
        """
        Fills self.reports with dicts: {manager: Manager object, level: N}, for all reports up to max_levels deep.
        """
        self.reports = []
        current_level = [self]
        for level in range(1, max_levels+1):
            next_level = []
            for manager in current_level:
                direct = manager.direct_reports(all_managers)
                for report in direct:
                    # Avoid duplicates
                    if not any(r['manager'] == report for r in self.reports):
                        self.reports.append({'manager': report, 'level': level})
                        next_level.append(report)
            current_level = next_level
            if not current_level:
                break

def load_data():
    # tables = ['data_lake_gold.employees']
    loader = Loader()

    # loader.load_from_athena(tables[0])

    query = """
        With 
        raw_deduped_surveys_forms as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM data_lake_bronze.surveys_forms
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        surveys as (
        Select sf.*
        From raw_deduped_surveys_forms  sf
        Where id = 233598
        ),

        raw_deduped_surveys_question_group_configs as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM data_lake_bronze.surveys_question_group_configs
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        raw_deduped_surveys_groups as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM data_lake_bronze.surveys_groups
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        raw_deduped_surveys_question_groups as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM data_lake_bronze.surveys_question_groups
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        raw_deduped_surveys_question_configs as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM data_lake_bronze.surveys_question_configs 
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        /*raw_deduped_custom_fields_resource_fields as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by updated_at DESC) rn
            From raw_custom_fields_resource_fields 
        )
        Where rn = 1
        ),*/


        raw_deduped_custom_fields_fields as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM data_lake_bronze.custom_fields_fields 
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        raw_deduped_custom_fields_values as (
        Select *
        From (
            Select *,
                row_number() Over(partition by id order by _event_ts DESC) rn
            FROM data_lake_bronze.custom_fields_values 
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        b1 as (
        Select
            sf.id review_id, 
            sf.company_id company_id,
            sf.created_at review_created_at,
            sf.updated_at review_updated_at,
            sf.name review_name,
            sf.schedule review_schedule,
            sf.anonymous review_anonymous,
            sf.multi_response review_multi_response,
            sf.access_id review_creator_access_id,
            sf.start_on review_start_on,
            sf.end_on review_end_on,
            sf.hide_answers_for_target review_hide_answers_for_target,
            sf.show_reviews_to_managers review_show_reviews_to_managers,
            sf.visible_to_managers review_visible_to_managers,
            sf.frequency review_frequency,
            sf.scheduled_time review_scheduled_time,
            sf.status review_status,
            sf.scheduled_week_number review_scheduled_week_number,
            sf.duration_in_days review_duration_in_days,
            sf.notify_respondents review_notify_respondents,
            sf.question_groups_count review_total_questions,
            sf.answered_question_groups_count review_total_answers,
            sf.source review_source,
            sg.name review_realtion,
            sqg.id question_group_id,
            sqg.created_at question_created_at,
            sqg.end_on question_end_on,
            sqg.updated_at question_updated_at,
            sqg.answered_at question_answered_at,
            sqg.respondent_id question_respondent_access_id,
            sqg.target_id question_target_access_id,
            sqg.drafted_at question_drafted_at,
            sqg.cycle_id,
            sqgc.id question_group_configs_id
        FROM surveys sf
        Left join raw_deduped_surveys_question_group_configs sqgc ON sqgc.surveys_form_id = sf.id
        Left join raw_deduped_surveys_groups sg ON sg.id = sqgc.respondent_id
        Left JOIN raw_deduped_surveys_question_groups sqg ON sqgc.id = sqg.surveys_question_group_config_id
        Order by company_id, review_id, sqg.respondent_id
        ),

        b2 as (
        Select 
            b1.review_id,
            b1.company_id as company_id_,
            b1.question_respondent_access_id,
            b1.question_target_access_id,
            b1.question_answered_at,
            b1.question_group_id,
            b1.question_group_configs_id,
            qc.id question_configs_id,
            frf.custom_fields_fields_id,
            cff.label_text,
            cff.field_type,
            cff.min_value, 
            cff.max_value, 
            cfv.*
        From b1
        Left Join raw_deduped_surveys_question_configs qc On qc.surveys_question_group_config_id = b1.question_group_configs_id
        Left Join data_lake_bronze.custom_fields_resource_fields frf ON frf.fieldable_id = qc.id and frf.fieldable_type like 'Surveys::QuestionConfig'
        Left Join raw_deduped_custom_fields_fields cff ON cff.id = frf.custom_fields_fields_id
        Left Join raw_deduped_custom_fields_values cfv ON cfv.custom_fields_fields_id = cff.id and  cfv.custom_field_valuable_id = b1.question_group_id
        Where b1.company_id = 1
        Order by 1,3,4,5,6,7
        ),

        memberships_ as (
        Select *
        FROM (
            Select *,
                row_number() Over(Partition by id Order by _event_ts DESC) rn
            FROM data_lake_bronze.memberships
        )
        Where rn = 1 and _cdc.op not like 'D'
        ),

        teams_ as (
        Select *
        FROM (
            Select *,
                row_number() Over(Partition by id Order by _event_ts DESC) rn
            FROM data_lake_bronze.teams
        )
        Where rn = 1 and _cdc.op not like 'D'
        )

        Select 
            b2.company_id_ as company_id,
            b2.question_respondent_access_id respondent_access_id,
            b2.question_answered_at,
            b2.label_text question,
            b2.field_type question_type,
            b2.min_value rating_min_value,
            b2.max_value rating_max_value,
            b2.long_text_value answer_long_text_value,
            b2.date_value answer_date_value,
            b2.number_value answer_number_value,
            b2.option_value answer_option_value,
            b2.cents_value answer_cents_value,
            b2.boolean_value answer_boolean_value,
            b2.single_choice_value answer_single_choice_value,
            b2.multiple_choice_value answer_multiple_choice_value
        from b2
        Order by label_text, question_respondent_access_id
    """

    loader.load_from_athena_custom_query(query, 'climate_answers_v2')

def load_job_offers_csv():
    loader = Loader()
    loader.load_file_to_database("/home/xavier/Documents/PAE/Projectes/pae/atickets/discovery/data/airtable_TA_2024.csv")
    loader.load_file_to_database("/home/xavier/Documents/PAE/Projectes/pae/atickets/discovery/data/airtable_TA_2025.csv")

def build_manager_table():
    query = "select email, manager_email, id_empleado from athena_airtable_people_todo where fecha_offboarding = ''"
    query_runner = QueryRunner()
    df = query_runner.run_query(query, source='postgres', dataframe=True)
    managers = []
    for _, row in df.iterrows():
        manager = Manager(
            employee_id=row['id_empleado'],
            email=row['email'],
            manager_email=row['manager_email'] if 'manager_email' in row and row['manager_email'] else None
        )
        managers.append(manager)


    # Fill reports for all managers
    for manager in managers:
        manager.fill_reports(managers)

    # Build a DataFrame for all relations: manager, report, level
    import pandas as pd
    from utils.data_loader.loader import Loader
    relations = []
    for manager in managers:
        for r in manager.reports:
            relations.append({
                'manager_id': manager.employee_id,
                'manager_email': manager.email,
                'report_id': r['manager'].employee_id,
                'report_email': r['manager'].email,
                'level': r['level']
            })
    df_rel = pd.DataFrame(relations)
    # Load to Postgres
    loader = Loader()
    df_rel.to_sql('manager_reports', loader.get_sqlalchemy_engine(), if_exists='replace', index=False)
    print('Loaded manager_reports table to Postgres.')
    breakpoint()

def load_ats_factorial_tables():
    loader = Loader()
    # tables = ['ats_job_postings', 'ats_candidates', 'ats_hiring_phases', 'ats_application_phases']
    # tables = ['ats_applications']
    tables = ['ats_hiring_phases', 'ats_application_phases']
    loader = Loader()
    for table in tables:
        loader.load_from_athena(table)



def main():
    load_data()
    # load_job_offers_csv()  
    # load_ats_factorial_tables()
    # build_manager_table()

if __name__ == "__main__":
    main()