
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

"""
Simple matching script - V2
Just fetch data, match, and save to Excel
"""
import os
import sys
import pandas as pd

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from query_runner.query_runner import QueryRunner
from data_matcher.matcher_v2 import SimpleMatcher


def main():
    """Match hiring positions to job postings - simple version"""
    
    print("=" * 60)
    print("🎯 SIMPLE JOB POSITION MATCHER V2")
    print("=" * 60)
    
    # Initialize query runner
    qr = QueryRunner()
    
    # Fetch job postings
    print("\n📊 Fetching job postings...")
    postings_query = """
        SELECT 
            job_posting_id,
            title,
            team_name,
            status
        FROM dim_job_posting
        WHERE status IS NOT NULL
    """
    postings_df = qr.run_query(postings_query, source='postgres', dataframe=True)
    print(f"✅ Loaded {len(postings_df)} job postings")
    
    # Fetch hiring positions
    print("\n📊 Fetching hiring positions...")
    positions_query = """
        SELECT 
            hiring_process_role,
            seniority,
            team,
            specific_team,
            market,
            talend_specialist,
            opened_date
        FROM br_file_hiring_processes
    """
    positions_df = qr.run_query(positions_query, source='postgres', dataframe=True)
    print(f"✅ Loaded {len(positions_df)} positions")
    
    # Match
    print("\n🔍 Matching positions to postings...")
    matcher = SimpleMatcher(min_score=50)
    matches_df = matcher.match(positions_df, postings_df, top_n=3)
    
    print(f"✅ Found {len(matches_df)} matches")
    
    # Show confidence distribution
    print("\n📊 Confidence Distribution:")
    print(matches_df['confidence'].value_counts().sort_index())
    
    # Save to Excel
    output_path = '/home/xavier/Documents/pae/_adata/talent/ta/matched_positions_postings_v2.xlsx'
    print(f"\n💾 Saving results to: {output_path}")
    
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
        postings_df[['job_posting_id', 'title', 'team_name', 'status']].to_excel(
            writer, sheet_name='All Job Postings', index=False
        )
    
    print("✅ Done!")
    
    # Show sample results
    print("\n📋 Sample Matches:")
    print(matches_df[['hiring_process_role', 'market', 'seniority', 'title', 'final_score', 'confidence']].head(10))


if __name__ == '__main__':
    main()
