import os
import sys
from datetime import datetime

# Set up path to include PAE root for utils import
current_dir = os.path.dirname(os.path.abspath(__file__))
pae_root_dir = os.path.dirname(current_dir)  # Go up one level to PAE root
pae_root_dir = os.path.dirname(pae_root_dir)  # Go up second level to PAE root

if pae_root_dir not in sys.path:
    sys.path.insert(0, pae_root_dir)


from utils.detective.ta_detective_v3 import TADetectiveV3
from utils.query_runner.query_runner import QueryRunner

def main():
    """
    Run TA Detective V3 investigation with INDEPENDENT matching
    - Matches employees to hires independently
    - Matches employees to positions independently
    - Combines results: employee can have hire only, position only, both, or neither
    """
    # Initialize query runner and detective
    query_runner = QueryRunner()
    detective = TADetectiveV3(query_runner=query_runner)
    
    # Define filters (optional - adjust as needed)
    filters = {
        # 'limit': 400,  # Process first 10 employees ordered by onboarding date desc
        # 'onboarding_date_from': '2024-01-01',
        # 'onboarding_date_to': '2024-12-31'
    }
    
    # Run full investigation
    print("=" * 80)
    print("TA DETECTIVE V3 - INDEPENDENT MATCHING INVESTIGATION")
    print("=" * 80)
    
    results = detective.investigate(employee_filters=filters)
    
    # Print summary statistics
    summary = detective.get_summary_stats()
    print("\n" + "=" * 80)
    print("INVESTIGATION SUMMARY")
    print("=" * 80)
    for key, value in summary.items():
        print(f"   {key.replace('_', ' ').title()}: {value}")
    
    # Export to Excel
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_path = os.path.join(current_dir, 'data', 'detective_results', f'ta_investigation_v3_{timestamp}.xlsx')
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    detective.export_to_excel(output_path, results=results)
    
    print("\n" + "=" * 80)
    print(f"✅ Investigation complete! Results saved to:")
    print(f"   {output_path}")
    print("=" * 80)
    
    # Create matching tables in Trino (TWO SEPARATE TABLES)
    print("\n" + "=" * 80)
    print("CREATING MATCHING TABLES IN TRINO (V3)")
    print("=" * 80)
    detective.create_matching_tables_in_trino(
        schema='data_lake_dev_xavi_silver',
        hire_table_name='aux_employee_hires',
        position_table_name='aux_employee_positions',
        if_exists='replace'
    )
    print("=" * 80)

if __name__ == "__main__":
    main()
