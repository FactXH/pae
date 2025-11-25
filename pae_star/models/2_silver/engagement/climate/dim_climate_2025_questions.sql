-- =====================================================
-- Climate Survey 2025 Questions Dimension
-- =====================================================
-- This dimension table maps question labels to column names
-- =====================================================

SELECT 'I feel my accomplishments are recognised' AS question_label, 'accomplishments_recognised' AS column_name
UNION ALL SELECT 'My workspace and office offer an excellent environment for working and recreation', 'workspace_environment'
UNION ALL SELECT 'I consider Factorial a great place to work', 'great_place_to_work'
UNION ALL SELECT 'Write single words that express what you are grateful for at Factorial', 'grateful_for'
UNION ALL SELECT 'Write single words that express what you would like to see more at Factorial', 'would_like_to_see_more'
UNION ALL SELECT 'I consider Factorial''s culture and values are put into practice daily', 'culture_and_values_practiced'
UNION ALL SELECT 'Factorial provides clear and transparent information about compensation and career plans', 'compensation_transparency'
UNION ALL SELECT 'Policies and processes at Factorial are transparent and aligned with our values', 'policies_transparent'
UNION ALL SELECT 'I feel I can trust my leaders', 'trust_leaders'
UNION ALL SELECT 'My leaders inspire teamwork, make good decisions and effectively guide others towards common goals', 'leaders_inspire'
UNION ALL SELECT 'Social events (Facts by Factorial, End of Year Dinner, Afterworks) provide great opportunities for bonding and sharing a fun time together', 'social_events'
UNION ALL SELECT 'Which team are you in?', 'team'
UNION ALL SELECT 'How long have you been working in Factorial?', 'tenure'
UNION ALL SELECT 'I believe joining Factorial was a good decision', 'good_decision_to_join'
UNION ALL SELECT 'I feel my contributions are valuable and make a differenceI feel my contributions are valuable and make a difference', 'contributions_valuable'
UNION ALL SELECT 'I feel there is a reasonable balance between what I contribute to the company and what I receive in return', 'contribution_balance'
UNION ALL SELECT 'My leads and I have meaningful conversations that help me improve my performance', 'meaningful_conversations'
UNION ALL SELECT 'On a scale of 1 to 10, how likely are you to recommend Factorial as a great place to work?', 'nps_score'
UNION ALL SELECT 'I am confident that I can grow and develop myself at Factorial', 'growth_confidence'
UNION ALL SELECT 'My leaders share information in a clear, transparent and consistent way', 'leaders_communication'
UNION ALL SELECT 'As far as I can see, I envision myself growing and staying at Factorial', 'envision_staying'
UNION ALL SELECT 'I am proud to be part of Factorial', 'proud_to_be_part'
UNION ALL SELECT 'I believe Factorial offers competitive benefits (e.g., Alan, Wellhub, )', 'competitive_benefits'
UNION ALL SELECT 'The communications I receive from Factorial (via Slack, Factorial platform, All Hands), help me understand more about the company''s culture, its context, and business vision', 'company_communications'
UNION ALL SELECT 'Feel free to share any feedback here!', 'additional_feedback'
UNION ALL SELECT 'I believe that performance evaluations are fair, consistent, and reflect my contributions and achievements', 'performance_evaluations_fair'
UNION ALL SELECT 'I strive to achieve goals and take initiative even when faced with challenges', 'initiative_and_goals'
UNION ALL SELECT 'The flexibility Factorial provides enables me to maintain a positive work/life balance', 'work_life_balance'
UNION ALL SELECT 'What is your gender?', 'gender'
