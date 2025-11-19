"""
Example usage of FuzzyMatcher and QueryRunner integration
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.query_runner.query_runner import QueryRunner
from utils.data_matcher.matcher import MatchConfig
from rapidfuzz import fuzz


def example_1_direct_query_runner():
    """
    Example 1: Using QueryRunner.run_fuzzy_match directly
    This is the simplest way to do fuzzy matching with SQL queries
    """
    print("\n" + "="*60)
    print("Example 1: Direct QueryRunner fuzzy match")
    print("="*60)
    
    qr = QueryRunner()
    
    # Simple fuzzy match between two tables
    matches = qr.run_fuzzy_match(
        source_query="""
            SELECT 
                hiring_process_role,
                team,
                specific_team
            FROM br_file_hiring_processes
            LIMIT 10
        """,
        target_query="""
            SELECT 
                job_posting_id,
                title,
                team_name
            FROM dim_job_posting
            WHERE status = 'published'
        """,
        match_configs=[
            MatchConfig(
                source_field='hiring_process_role',
                target_field='title',
                weight=0.6,
                scorer=fuzz.token_sort_ratio
            ),
            MatchConfig(
                source_field='team',
                target_field='team_name',
                weight=0.4,
                scorer=fuzz.token_set_ratio
            ),
        ],
        score_threshold=60.0,
        return_top_n=3,
        source='postgres'
    )
    
    print(f"\n✅ Found {len(matches)} matches")
    print("\nTop 5 matches:")
    print(matches.head()[['source_hiring_process_role', 'matched_title', 'match_score', 'confidence']])
    
    return matches


def example_2_manual_dataframes():
    """
    Example 2: Manual DataFrame fuzzy matching
    Use this when you have DataFrames from other sources
    """
    print("\n" + "="*60)
    print("Example 2: Manual DataFrame matching")
    print("="*60)
    
    from utils.data_matcher.matcher import FuzzyMatcher
    import pandas as pd
    
    # Create sample data
    positions_data = [
        {'role': 'Senior Software Engineer', 'team': 'Engineering', 'level': 'Senior'},
        {'role': 'Product Manager', 'team': 'Product', 'level': 'Mid'},
        {'role': 'Data Scientist', 'team': 'Analytics', 'level': 'Senior'},
    ]
    
    postings_data = [
        {'id': 'JP001', 'title': 'Sr. Software Developer', 'dept': 'Engineering'},
        {'id': 'JP002', 'title': 'Product Manager - Growth', 'dept': 'Product'},
        {'id': 'JP003', 'title': 'Machine Learning Engineer', 'dept': 'Data Science'},
        {'id': 'JP004', 'title': 'Senior Product Manager', 'dept': 'Product'},
    ]
    
    positions_df = pd.DataFrame(positions_data)
    postings_df = pd.DataFrame(postings_data)
    
    # Configure matcher
    matcher = FuzzyMatcher(
        match_configs=[
            MatchConfig('role', 'title', weight=0.7, scorer=fuzz.token_sort_ratio),
            MatchConfig('team', 'dept', weight=0.3, scorer=fuzz.partial_ratio),
        ],
        score_threshold=50.0
    )
    
    # Perform matching
    matches = matcher.match(positions_df, postings_df, return_top_n=2)
    
    print(f"\n✅ Found {len(matches)} matches")
    print("\nMatches:")
    print(matches[['source_role', 'matched_title', 'match_score', 'confidence']])
    
    return matches


def example_3_quick_string_match():
    """
    Example 3: Quick string matching without DataFrames
    Perfect for simple lookups
    """
    print("\n" + "="*60)
    print("Example 3: Quick string matching")
    print("="*60)
    
    from utils.data_matcher.matcher import FuzzyMatcher
    
    matcher = FuzzyMatcher(match_configs=[], score_threshold=60.0)
    
    # Match job titles
    roles_to_match = [
        "Backend Engineer",
        "Frontend Developer",
        "DevOps Engineer"
    ]
    
    available_positions = [
        "Senior Backend Software Engineer",
        "Full Stack Developer",
        "Frontend Engineer - React",
        "Site Reliability Engineer (SRE)",
        "Backend Developer - Python",
    ]
    
    results = matcher.quick_match(
        source_values=roles_to_match,
        target_values=available_positions,
        limit=3,
        scorer=fuzz.token_sort_ratio
    )
    
    print("\nQuick match results:")
    for role, matches in results.items():
        print(f"\n'{role}':")
        for match, score in matches:
            print(f"  → {match} (score: {score})")
    
    return results


def example_4_custom_scoring():
    """
    Example 4: Using different scoring algorithms
    """
    print("\n" + "="*60)
    print("Example 4: Custom scoring algorithms")
    print("="*60)
    
    from utils.data_matcher.matcher import FuzzyMatcher
    import pandas as pd
    
    data1 = pd.DataFrame([
        {'name': 'John Doe', 'email': 'john@example.com'},
        {'name': 'Jane Smith', 'email': 'jane.smith@company.com'},
    ])
    
    data2 = pd.DataFrame([
        {'full_name': 'Jon Doe', 'contact': 'j.doe@example.com'},
        {'full_name': 'Jane M. Smith', 'contact': 'jane@company.com'},
    ])
    
    # Different scorers for different fields
    matcher = FuzzyMatcher(
        match_configs=[
            MatchConfig('name', 'full_name', weight=0.6, scorer=fuzz.ratio),  # Exact matching
            MatchConfig('email', 'contact', weight=0.4, scorer=fuzz.partial_ratio),  # Partial matching
        ],
        score_threshold=60.0
    )
    
    matches = matcher.match(data1, data2, return_top_n=1)
    
    print(f"\n✅ Found {len(matches)} matches")
    print("\nMatches:")
    print(matches[['source_name', 'matched_full_name', 'match_score']])
    
    return matches


if __name__ == "__main__":
    print("🚀 FuzzyMatcher Examples")
    print("="*60)
    
    # Install rapidfuzz first: pip install rapidfuzz
    
    try:
        # Run examples
        example_1_direct_query_runner()
        example_2_manual_dataframes()
        example_3_quick_string_match()
        example_4_custom_scoring()
        
        print("\n" + "="*60)
        print("✅ All examples completed successfully!")
        print("="*60)
        
    except ImportError as e:
        print(f"\n❌ Missing dependency: {e}")
        print("Install with: pip install rapidfuzz")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
