#!/usr/bin/env python3
"""
005 - Airtable Integration Example

This script demonstrates how to use the AirtableClient utility with Django models.
It shows how to:
- Load Airtable API token from .env file
- Initialize the AirtableClient
- Integrate with Employee model (which has tair_id field)
- Prepare for future Airtable sync operations

Prerequisites:
1. Create a .env file in the PAE project root with: tair_ak=your_airtable_token
2. Install python-dotenv: pip install python-dotenv
3. Have some Employee records with tair_id values (optional)
"""

import os
import sys
from datetime import date
import django

# Set up the path to include both xapt project and PAE root
current_dir = os.path.dirname(os.path.abspath(__file__))
xapt_project_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
pae_root_dir = os.path.abspath(os.path.join(xapt_project_dir, '..'))

# Add paths if they're not already in sys.path
for path in [xapt_project_dir, pae_root_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

print(f"🔧 XAPT Project Directory: {xapt_project_dir}")
print(f"🔧 PAE Root Directory: {pae_root_dir}")

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xapt.settings')
django.setup()

# Import models and utilities after Django setup
from engagement.models import Employee, Team, TeamMembership, PerformanceReview
from engagement.utils.tairtable_exporter import TairtableExporter

# Import Airtable client
try:
    from utils.airtable.airtable_client import AirtableClient
    AIRTABLE_AVAILABLE = True
except ImportError as e:
    print(f"❌ Could not import AirtableClient: {e}")
    AIRTABLE_AVAILABLE = False


def main():
    """Main execution function"""
    # exporter.delete_performance_reviews()

    # client = AirtableClient()
    # data = client.get_table_data_from_url(exporter.performance_review_table_url)

    # breakpoint()

    performances = PerformanceReview.objects.all()
    
    for performance in performances:
        if performance.employee.email.startswith('xavier.hita'):
            print(performance.return_self_questionarie_markdown())
            print(performance.return_manager_questionarie_markdown())


if __name__ == '__main__':
    main()
