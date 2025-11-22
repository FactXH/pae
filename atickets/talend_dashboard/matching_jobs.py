import os
import sys

# Set up path to include PAE root for utils import
current_dir = os.path.dirname(os.path.abspath(__file__))
pae_root_dir = os.path.dirname(current_dir)  # Go up one level to PAE root
pae_root_dir = os.path.dirname(pae_root_dir)  # Go up second level to PAE root

if pae_root_dir not in sys.path:
    sys.path.insert(0, pae_root_dir)

from utils.query_runner.query_runner import QueryRunner
from utils.data_matcher.matcher_v2 import SimpleMatcher
import pandas as pd

# Set up QueryRunner
qr = QueryRunner()

# Query job positions (source)
positions_query = '''
    SELECT 
        xapt_position_id,
        position_id,
        hiring_process_role,
        market,
        seniority,
        team,
        specific_team,
        talent_specialist,
        opened_date,
        manager
    FROM data_lake_dev_xavi_silver.dim_job_positions
    WHERE hiring_process_role IS NOT NULL
'''
positions_df = qr.run_query(
    positions_query,
    source='galaxy'
)

# Query job postings (target)
postings_query = '''
    SELECT 
        job_posting_id,
        job_posting_title,
        job_posting_created_at,
        team_name,
        all_historical_titles,
        owner_emails,
        reviewer_emails,
        editor_emails,
        other_hiring_manager_emails
    FROM data_lake_dev_xavi_silver.dim_job_postings_2
    WHERE job_posting_id IS NOT NULL
'''
postings_df = qr.run_query(
    postings_query,
    source='galaxy',
    schema='ats'
)
# Rename for matcher compatibility
if 'job_posting_title' in postings_df.columns:
    postings_df = postings_df.rename(columns={'job_posting_title': 'title'})

# Run matcher
matcher = SimpleMatcher(min_score=50)
matches_df = matcher.match(positions_df, postings_df, top_n=3)

# Reorder columns for Excel output
main_cols = [
    'talent_specialist',
    'position_id',
    'job_posting_id',
    'hiring_process_role',
    'market',
    'seniority',
    'specific_team',
    'title',
    'team_name',
    'final_score',
    'manager_score',
    'text_score',
    'market_score',
    'team_similarity',
    'manager_match_flag',
    'manager',
    'manager_concat',
]
# Add any remaining columns at the end
other_cols = [c for c in matches_df.columns if c not in main_cols]
matches_df = matches_df[main_cols + other_cols]

# Remove timezone info from all datetime columns before writing to Excel
def remove_timezone(df):
    for col in df.select_dtypes(include=['datetimetz']).columns:
        df[col] = df[col].dt.tz_localize(None)
    return df

matches_df = matches_df.sort_values(['talent_specialist', 'position_id'], ascending=[True, True])
matches_df = remove_timezone(matches_df)

# Save to Excel
output_path = '/home/xavier/Documents/pae/atickets/talend_dashboard/data/matching_jobs/matched_positions_postings_v3.xlsx'
print(f"\n💾 Saving results to: {output_path}")
# breakpoint()
# Remove timezone info from postings_df before writing to Excel
postings_df = remove_timezone(postings_df)
with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
    matches_df.to_excel(writer, sheet_name='Matches', index=False)
    
    # Summary sheet
    summary = pd.DataFrame({
        'Total Positions': [len(positions_df)],
        'Total Postings': [len(postings_df)],
        'Total Matches': [len(matches_df)],
        'Positions with Matches': [len(matches_df[matches_df['job_posting_id'].notna()])],
        'Positions without Matches': [len(matches_df[matches_df['job_posting_id'].isna()])],
        'Avg Score': [matches_df['final_score'].mean()],
    })
    summary.to_excel(writer, sheet_name='Summary', index=False)
    
    # All available job postings
    postings_cols = ['job_posting_id', 'title', 'job_posting_created_at'] + [c for c in postings_df.columns if c not in ['job_posting_id', 'title', 'job_posting_created_at']]
    postings_out = postings_df[postings_cols].copy()
    # Insert job_posting_link and empty column after 'title'
    insert_idx = postings_out.columns.get_loc('title') + 1
    postings_out.insert(insert_idx, 'job_posting_link', postings_out['job_posting_id'].apply(lambda x: f'https://app.factorialhr.com/recruitment/jobs/{x}/applications' if pd.notnull(x) else ''))
    postings_out.insert(insert_idx + 1, 'is_good_match', '')
    postings_out.to_excel(writer, sheet_name='All Job Postings', index=False)

print("✅ Done!")

# Show sample results
print("\n📋 Sample Matches:")
print(matches_df.head(10))
