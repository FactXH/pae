"""
Main script for fuzzy matching job positions to job postings
Demonstrates usage of FuzzyMatcher with QueryRunner
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.data_matcher.matcher import FuzzyMatcher, MatchConfig
from utils.query_runner.query_runner import QueryRunner
from rapidfuzz import fuzz
import pandas as pd
import os


def match_job_positions_to_postings():
    """
    Match hiring process positions to job postings using fuzzy matching
    """
    print("🚀 Starting Job Position to Job Posting Matcher")
    print("=" * 60)
    
    # Initialize query runner
    qr = QueryRunner()
    
    # Fetch job postings
    print("\n📊 Fetching job postings from database...")
    postings_query = """
        SELECT 
            job_posting_id,
            title,
            team_name,
            status,
            description
        FROM dim_job_posting
        WHERE status IS NOT NULL
    """
    
    postings_df = qr.run_query(postings_query, source='postgres', dataframe=True)
    
    # Create enhanced searchable text combining title and team_name
    postings_df['searchable_text'] = (
        postings_df['title'].fillna('').str.lower() + ' ' + 
        postings_df['team_name'].fillna('').str.lower()
    )
    
    print(f"✅ Loaded {len(postings_df)} job postings")
    
    # Fetch job positions from hiring processes
    print("\n📊 Fetching hiring process positions...")
    positions_query = """
        SELECT 
            hiring_process_role,
            seniority,
            team,
            specific_team,
            market
        FROM br_file_hiring_processes
    """
    
    positions_df = qr.run_query(positions_query, source='postgres', dataframe=True)
    
    # Create enhanced position text combining role, market, and seniority
    positions_df['position_text'] = (
        positions_df['hiring_process_role'].fillna('').str.lower() + ' ' +
        positions_df['market'].fillna('').str.lower() + ' ' +
        positions_df['seniority'].fillna('').str.lower()
    ).str.strip()
    
    print(f"✅ Loaded {len(positions_df)} positions")
    
    # Configure fuzzy matcher
    print("\n⚙️ Configuring fuzzy matcher...")
    matcher = FuzzyMatcher(
        match_configs=[
            MatchConfig(
                source_field='position_text',
                target_field='searchable_text',
                weight=0.4,  # 40% weight - combined position string
                scorer=fuzz.token_sort_ratio,
                threshold=30.0
            ),
            MatchConfig(
                source_field='hiring_process_role',
                target_field='title',
                weight=0.3,  # 30% weight - role match
                scorer=fuzz.token_sort_ratio,
                threshold=30.0
            ),
            MatchConfig(
                source_field='market',
                target_field='searchable_text',
                weight=0.2,  # 20% weight - market match
                scorer=fuzz.partial_ratio,
                threshold=30.0
            ),
            MatchConfig(
                source_field='team',
                target_field='team_name',
                weight=0.1,  # 10% weight - team match
                scorer=fuzz.token_set_ratio,
                threshold=40.0
            ),
        ],
        score_threshold=50.0,  # Only keep matches with 50+ combined score
        combine_method='weighted'
    )
    
    # Perform matching
    print("\n🔍 Performing fuzzy matching...")
    matches_df = matcher.match(
        source_df=positions_df,
        target_df=postings_df,
        return_top_n=3,  # Return top 3 matches per position
    )
    
    print(f"✅ Generated {len(matches_df)} matches")
    
    # Display results summary
    print("\n" + "=" * 60)
    print("📈 MATCHING RESULTS SUMMARY")
    print("=" * 60)
    
    print(f"\nTotal positions: {len(positions_df)}")
    print(f"Total postings: {len(postings_df)}")
    print(f"Total matches found: {len(matches_df)}")
    
    # Confidence distribution
    print("\n📊 Confidence Distribution:")
    confidence_counts = matches_df['confidence'].value_counts()
    for confidence, count in confidence_counts.items():
        print(f"  {confidence}: {count}")
    
    # Show top 10 matches
    print("\n🏆 Top 10 Best Matches:")
    print("-" * 60)
    top_matches = matches_df.nlargest(10, 'match_score')
    
    for idx, row in top_matches.iterrows():
        print(f"\n#{idx + 1} - Score: {row['match_score']} ({row['confidence']})")
        print(f"  Position: {row['source_hiring_process_role']}")
        print(f"  Team: {row['source_team']} / {row['source_specific_team']}")
        print(f"  ↓")
        print(f"  Matched Posting: {row['matched_title']}")
        print(f"  Team: {row['matched_team_name']}")
        print(f"  ID: {row['matched_job_posting_id']}")
    
    # Save results to Excel
    output_dir = '/home/xavier/Documents/pae/_adata/talent/ta'
    output_file = f'{output_dir}/matched_positions_postings.xlsx'
    
    # Create directory if it doesn't exist
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    # Save to Excel with multiple sheets (requires openpyxl)
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Main matches sheet
        matches_df.to_excel(writer, sheet_name='All Matches', index=False)
        
        # Summary sheet
        summary_df = pd.DataFrame({
            'Metric': ['Total Positions', 'Total Postings', 'Total Matches', 'Avg Match Score'],
            'Value': [
                len(positions_df),
                len(postings_df),
                len(matches_df),
                round(matches_df['match_score'].mean(), 2)
            ]
        })
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Confidence distribution sheet
        confidence_dist = matches_df['confidence'].value_counts().reset_index()
        confidence_dist.columns = ['Confidence Level', 'Count']
        confidence_dist.to_excel(writer, sheet_name='Confidence Distribution', index=False)
    
    print(f"\n💾 Results saved to: {output_file}")
    
    return matches_df


def quick_match_example():
    """
    Simple example of quick matching without DataFrames
    """
    print("\n" + "=" * 60)
    print("🎯 Quick Match Example")
    print("=" * 60)
    
    matcher = FuzzyMatcher(
        match_configs=[],  # Not used for quick match
        score_threshold=60.0
    )
    
    job_titles_to_match = [
        "Senior Software Engineer",
        "Product Manager",
        "Data Scientist"
    ]
    
    available_postings = [
        "Sr. Software Developer",
        "Senior Product Manager - Growth",
        "Machine Learning Engineer",
        "Software Engineer",
        "Data Analyst"
    ]
    
    results = matcher.quick_match(
        source_values=job_titles_to_match,
        target_values=available_postings,
        limit=3,
        scorer=fuzz.token_sort_ratio
    )
    
    print("\nQuick Match Results:")
    for source, matches in results.items():
        print(f"\n'{source}' matches:")
        for match, score in matches:
            print(f"  → '{match}' (score: {score})")


if __name__ == "__main__":
    try:
        # Run main matching
        matches_df = match_job_positions_to_postings()
        
        # Run quick match example
        quick_match_example()
        
        print("\n✅ All matching complete!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
