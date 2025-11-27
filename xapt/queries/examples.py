"""
Example script to create sample queries and views programmatically
Run with: python manage.py shell < queries/examples.py
Or in Django shell: exec(open('queries/examples.py').read())
"""

from queries.models import Query, QueryView

# Create a sample query
query1 = Query.objects.create(
    name="Employee Facts Overview",
    description="Basic employee facts with dimensions and metrics",
    sql_query="""
SELECT 
    department AS department__dim,
    location AS location__dim,
    job_level AS level__dim,
    COUNT(*) AS employee_count__count__sum,
    AVG(tenure_years) AS avg_tenure__metric__avg,
    AVG(performance_score) AS avg_performance__metric__avg,
    AVG(satisfaction_score) AS satisfaction__metric__pct
FROM employees
GROUP BY department, location, job_level
""",
    database="sqlite"
)

print(f"✅ Created Query: {query1.name} (ID: {query1.id})")

# Create a view for this query
view1 = QueryView.objects.create(
    name="Default Employee View",
    description="Default configuration showing all dimensions",
    query=query1,
    config={
        "title": "Employee Facts",
        "thresholds": {
            "red": 2.2,
            "yellow": 4.0
        },
        "dimensionFilters": {},
        "dimensionExcludes": {},
        "enabledFilters": [],
        "metricRanges": {},
        "aggMetricRanges": {},
        "visibleColumns": [
            "avg_tenure__metric__avg",
            "avg_performance__metric__avg",
            "satisfaction__metric__pct"
        ],
        "selectedDimensions": ["department__dim"],
        "sortConfig": {
            "column": None,
            "direction": "asc"
        }
    }
)

print(f"✅ Created View: {view1.name} (ID: {view1.id})")

# Create an advanced employee analytics query showcasing multiple features
query2 = Query.objects.create(
    name="Employee Analytics Dashboard",
    description="Comprehensive employee metrics with salary rankings, team analysis, and multi-aggregation support",
    sql_query="""
-- Advanced Employee Analytics with Multiple Features
-- Showcases: Window Functions, Salary Rankings, Team Aggregations, Multi-aggregation columns
SELECT 
    -- Core Dimensions
    employee_id AS employee_id__dim,
    full_name AS employee_name__dim,
    airtable_main_team AS team__dim,
    athena_manager_email AS manager__dim,
    last_role_level_name AS role__dim,
    all_current_teams AS all_teams__dim,
    first_role_level_name AS first_role__dim,
    
    -- Salary Metrics (using metricbignumber for gradient display)
    current_salary_amount AS salary__metricbignumber__avg,
    salary_increase_pct_2025 AS salary_increase__metric__pct,
    distinct_salaries_2025 AS salary_changes_2025__count__sum,
    
    -- Ranking Metrics (using metricrank for centered bold display)
    salary_rank AS salary_rank__metricrank__min,
    salary_rank_unique AS salary_rank_unique__metricrank__min,
    antiquity_rank AS tenure_rank__metricrank__min,
    antiquity_rank_unique AS tenure_rank_unique__metricrank__min,
    antiquity_rank_all_time AS all_time_rank__metricrank__min,
    
    -- Multi-aggregation columns (sum-avg-max)
    nr_contracts AS contracts__metric__sum-avg-max,
    
    -- Standard Metrics
    CASE WHEN offboarding_date IS NULL OR offboarding_date = '' THEN 1 ELSE 0 END AS active_employee__count__sum,
    
    -- Date calculations
    CAST(date_diff('day', onboarding_date, CURRENT_DATE) / 365.25 AS DOUBLE) AS tenure_years__metric__avg,
    
    -- Additional context fields
    roles_2025 AS roles_history__dim,
    all_salaries AS salary_history__dim,
    all_roles AS all_roles__dim,
    lowest_level_team_name AS sub_team__dim,
    lowest_level_parent_team_name AS parent_team__dim,
    match_status AS data_match__dim
    
FROM data_lake_dev_xavi_silver.fact_employees
WHERE is_active = 1
ORDER BY airtable_main_team, athena_manager_email, salary_rank
""",
    database="trino"
)

print(f"✅ Created Query: {query2.name} (ID: {query2.id})")

# Create a comprehensive view with advanced configuration
view2 = QueryView.objects.create(
    name="Team Salary Analysis View",
    description="Salary and ranking analysis by team with gradient visualization",
    query=query2,
    config={
        "title": "Employee Salary & Ranking Dashboard",
        "thresholds": {
            "red": 2.0,
            "yellow": 5.0
        },
        "dimensionFilters": {},
        "dimensionExcludes": {},
        "enabledFilters": [],
        "metricRanges": {},
        "aggMetricRanges": {},
        "visibleColumns": [
            "salary__metricbignumber__avg",
            "salary_increase__metric__pct",
            "salary_rank__metricrank__min",
            "tenure_rank__metricrank__min",
            "contracts__metric__sum-avg-max",
            "tenure_years__metric__avg"
        ],
        "selectedDimensions": ["team__dim", "manager__dim"],
        "sortConfig": {
            "column": "salary_rank__metricrank__min",
            "direction": "asc"
        }
    }
)

print(f"✅ Created View: {view2.name} (ID: {view2.id})")

print("\n🎉 Sample queries and views created successfully!")
print(f"Total Queries: {Query.objects.count()}")
print(f"Total Views: {QueryView.objects.count()}")
print("\n💡 Visit http://localhost:3000/whiteboard to see them!")
