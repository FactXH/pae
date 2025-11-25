-- =====================================================
-- Climate Survey 2024 Fact Table (Transposed)
-- =====================================================
-- This model pivots the survey responses so each respondent has one row
-- with all questions as separate columns
-- =====================================================

WITH base_answers AS (
    SELECT 
        question_respondent_access_id,
        question_target_access_id,
        question_answered_at,
        question_group_id,
        label_text,
        COALESCE(long_text_value, CAST(number_value AS VARCHAR), single_choice_value) AS answer
    FROM {{ ref('base_factorial_climate_2024_answers') }}
    WHERE label_text IS NOT NULL
)

SELECT
    question_respondent_access_id,
    question_target_access_id,
    question_answered_at,
    question_group_id,
    
    -- Pivot each question into its own column
    MAX(CASE WHEN label_text = 'I feel my accomplishments are recognised' THEN answer END) AS accomplishments_recognised,
    MAX(CASE WHEN label_text = 'My workspace and office offer an excellent environment for working and recreation' THEN answer END) AS workspace_environment,
    MAX(CASE WHEN label_text = 'I consider Factorial a great place to work' THEN answer END) AS great_place_to_work,
    MAX(CASE WHEN label_text = 'Write single words that express what you are grateful for at Factorial' THEN answer END) AS grateful_for,
    MAX(CASE WHEN label_text = 'Write single words that express what you would like to see more at Factorial' THEN answer END) AS would_like_to_see_more,
    MAX(CASE WHEN label_text = 'I consider Factorial''s culture and values are put into practice daily' THEN answer END) AS culture_and_values_practiced,
    MAX(CASE WHEN label_text = 'Factorial provides clear and transparent information about compensation and career plans' THEN answer END) AS compensation_transparency,
    MAX(CASE WHEN label_text = 'Policies and processes at Factorial are transparent and aligned with our values' THEN answer END) AS policies_transparent,
    MAX(CASE WHEN label_text = 'I feel I can trust my leaders' THEN answer END) AS trust_leaders,
    MAX(CASE WHEN label_text = 'My leaders inspire teamwork, make good decisions and effectively guide others towards common goals' THEN answer END) AS leaders_inspire,
    MAX(CASE WHEN label_text = 'Social events (Facts by Factorial, End of Year Dinner, Afterworks) provide great opportunities for bonding and sharing a fun time together' THEN answer END) AS social_events,
    MAX(CASE WHEN label_text = 'Which team are you in?' THEN answer END) AS team,
    MAX(CASE WHEN label_text = 'How long have you been working in Factorial?' THEN answer END) AS tenure,
    MAX(CASE WHEN label_text = 'I believe joining Factorial was a good decision' THEN answer END) AS good_decision_to_join,
    MAX(CASE WHEN label_text = 'I feel my contributions are valuable and make a differenceI feel my contributions are valuable and make a difference' THEN answer END) AS contributions_valuable,
    MAX(CASE WHEN label_text = 'I feel there is a reasonable balance between what I contribute to the company and what I receive in return' THEN answer END) AS contribution_balance,
    MAX(CASE WHEN label_text = 'My leads and I have meaningful conversations that help me improve my performance' THEN answer END) AS meaningful_conversations,
    MAX(CASE WHEN label_text = 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?' THEN answer END) AS nps_score,
    MAX(CASE WHEN label_text = 'I am confident that I can grow and develop myself at Factorial' THEN answer END) AS growth_confidence,
    MAX(CASE WHEN label_text = 'My leaders share information in a clear, transparent and consistent way' THEN answer END) AS leaders_communication,
    MAX(CASE WHEN label_text = 'As far as I can see, I envision myself growing and staying at Factorial' THEN answer END) AS envision_staying,
    MAX(CASE WHEN label_text = 'I am proud to be part of Factorial' THEN answer END) AS proud_to_be_part,
    MAX(CASE WHEN label_text = 'I believe Factorial offers competitive benefits (e.g., Alan, Wellhub, )' THEN answer END) AS competitive_benefits,
    MAX(CASE WHEN label_text = 'The communications I receive from Factorial (via Slack, Factorial platform, All Hands), help me understand more about the company''s culture, its context, and business vision' THEN answer END) AS company_communications,
    MAX(CASE WHEN label_text = 'Feel free to share any feedback here!' THEN answer END) AS additional_feedback,
    MAX(CASE WHEN label_text = 'I believe that performance evaluations are fair, consistent, and reflect my contributions and achievements' THEN answer END) AS performance_evaluations_fair,
    MAX(CASE WHEN label_text = 'I strive to achieve goals and take initiative even when faced with challenges' THEN answer END) AS initiative_and_goals,
    MAX(CASE WHEN label_text = 'The flexibility Factorial provides enables me to maintain a positive work/life balance' THEN answer END) AS work_life_balance,
    MAX(CASE WHEN label_text = 'What is your gender?' THEN answer END) AS gender

FROM base_answers
GROUP BY 
    question_respondent_access_id,
    question_target_access_id,
    question_answered_at,
    question_group_id
