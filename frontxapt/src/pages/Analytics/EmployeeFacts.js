import React from 'react';
import { Typography, Grid, Box } from '@mui/material';
import ConfigurableMetricsCard from '../../components/ConfigurableMetricsCard';
import './Climate2025.css';

function EmployeeFacts() {
  return (
    <div className="analytics-subsection" style={{ padding: 0, margin: 0 }}>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 0.5, fontWeight: 600 }}>
          Employee Facts & Performance
        </Typography>

        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          Comprehensive view of employee data including manager relationships, teams, and performance reviews.
        </Typography>
      </Box>

      <Box sx={{ px: 1 }}>

      <Grid container spacing={0}>
        <Grid item xs={12}>
          <ConfigurableMetricsCard
            title="Active Employees - Facts & Performance"
            description="Employee details with direct manager, last level team, and Q3Y25 performance score. Filter and group by any dimension."
            query={`
              WITH pf_q3y25 AS (
                SELECT 
                  employee_id, 
                  MAX(final_employee_score) as score 
                FROM data_lake_dev_xavi_silver.dim_performance_reviews
                WHERE performance_review_name LIKE '%Q3Y25%'
                GROUP BY employee_id
              ),
              all_performance AS (
                SELECT 
                  employee_id,
                  COUNT(*) as performance_count,
                  AVG(final_employee_score) as avg_performance,
                  ARRAY_JOIN(ARRAY_AGG(
                    performance_review_name || ': ' || CAST(final_employee_score AS VARCHAR)
                    ORDER BY performance_review_start_date DESC
                  ), ', ') as all_performances
                FROM data_lake_dev_xavi_silver.dim_performance_reviews
                WHERE final_employee_score IS NOT NULL
                GROUP BY employee_id
              ),
              role_changes_2024 AS (
                SELECT
                  cont.employee_id,
                  COUNT(DISTINCT job_catalog.role_name) as distinct_roles_2024,
                  CASE 
                    WHEN MAX(job_catalog.job_catalog_level_order) < MIN(job_catalog.job_catalog_level_order) THEN 'Promoted'
                    WHEN MAX(job_catalog.job_catalog_level_order) > MIN(job_catalog.job_catalog_level_order) THEN 'Demoted'
                    ELSE 'Same Level'
                  END as role_change_2024
                FROM data_lake_dev_xavi_silver.dim_contracts cont
                LEFT JOIN data_lake_dev_xavi_silver.dim_job_catalog job_catalog
                  ON job_catalog.job_catalog_level_id = cont.job_catalog_level_id
                WHERE 
                  (cont.effective_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
                   OR (cont.effective_to_date >= DATE '2024-01-01' AND cont.effective_to_date <= DATE '2024-12-31')
                   OR (cont.effective_date <= DATE '2024-01-01' AND (cont.effective_to_date >= DATE '2024-12-31' OR cont.effective_to_date IS NULL)))
                  AND job_catalog.role_name IS NOT NULL
                GROUP BY cont.employee_id
              )
              SELECT 
                emp.full_name AS employee__dim,
                mgr_emp.full_name AS direct_manager__dim,
                mgr2_emp.full_name AS manager_of_manager__dim,
                mgr3_emp.full_name AS manager_of_manager_of_manager__dim,
                emp.airtable_main_team AS main_team__dim,
                emp.lowest_level_team_name AS last_level_team__dim,
                emp.lowest_level_parent_team_name AS parent_team__dim,
                emp.last_role_level_name AS role__dim,
                emp.first_role_level_name AS first_role__dim,
                emp.all_current_teams AS all_teams__dim,
                CASE WHEN emp.is_active THEN 'Yes' ELSE 'No' END AS is_active__dim,
                COALESCE(role_ch.role_change_2024, 'No Data') AS role_change_2024__dim,
                perf.all_performances AS performance_history__dim,
                
                -- Counts (summed when grouped)
                1 AS employee_count__count__sum,
                CAST(emp.nr_contracts AS BIGINT) AS contract_count__count__sum,
                CAST(emp.distinct_salaries_2025 AS BIGINT) AS salary_changes_2025__count__sum,
                CAST(COALESCE(perf.performance_count, 0) AS BIGINT) AS performance_reviews_count__count__sum,
                CAST(COALESCE(role_ch.distinct_roles_2024, 0) AS BIGINT) AS distinct_roles_2024__count__sum,
                
                -- Metrics (weighted average when grouped using PCT)
                CAST(date_diff('day', COALESCE(emp.onboarding_date, emp.tenure_start_date, emp.first_effective_date), current_date) AS BIGINT) AS tenure_days__metric__pct,
                CAST(emp.current_salary_amount AS BIGINT) AS current_salary_eur__metric__pct,
                CAST(emp.salary_increase_pct_2025 AS DOUBLE) AS salary_increase_pct_2025__metric__pct,
                CAST(p25q3.score AS DOUBLE) AS q3y25_performance__metric__avg,
                CAST(perf.avg_performance AS DOUBLE) AS avg_all_performance__metric__avg,
                CAST(emp.antiquity_rank AS BIGINT) AS antiquity_rank__count__sum,
                CAST(emp.antiquity_rank_unique AS BIGINT) AS antiquity_rank_unique__count__sum,
                CAST(emp.salary_rank AS BIGINT) AS salary_rank__metric__pct
                
              FROM data_lake_dev_xavi_silver.fact_employees emp
              LEFT JOIN data_lake_dev_xavi_silver.base_factorial_employee_managers_scd mgr
                ON emp.employee_id = CAST(mgr.employee_id AS VARCHAR) 
                AND mgr.is_current = true
              LEFT JOIN data_lake_dev_xavi_silver.dim_employees mgr_emp
                ON CAST(mgr.manager_id AS VARCHAR) = mgr_emp.employee_id
              LEFT JOIN data_lake_dev_xavi_silver.base_factorial_employee_managers_scd mgr2
                ON CAST(mgr.manager_id AS VARCHAR) = CAST(mgr2.employee_id AS VARCHAR)
                AND mgr2.is_current = true
              LEFT JOIN data_lake_dev_xavi_silver.dim_employees mgr2_emp
                ON CAST(mgr2.manager_id AS VARCHAR) = mgr2_emp.employee_id
              LEFT JOIN data_lake_dev_xavi_silver.base_factorial_employee_managers_scd mgr3
                ON CAST(mgr2.manager_id AS VARCHAR) = CAST(mgr3.employee_id AS VARCHAR)
                AND mgr3.is_current = true
              LEFT JOIN data_lake_dev_xavi_silver.dim_employees mgr3_emp
                ON CAST(mgr3.manager_id AS VARCHAR) = mgr3_emp.employee_id
              LEFT JOIN pf_q3y25 p25q3
                ON emp.employee_id = CAST(p25q3.employee_id AS VARCHAR)
              LEFT JOIN all_performance perf
                ON emp.employee_id = CAST(perf.employee_id AS VARCHAR)
              LEFT JOIN role_changes_2024 role_ch
                ON emp.employee_id = CAST(role_ch.employee_id AS VARCHAR)
              WHERE emp.is_active = true
              ORDER BY emp.full_name
              LIMIT 10000
            `}
            database="trino"
            thresholds={{
              red: 2.2,
              yellow: 4.0,
            }}
          />
        </Grid>
      </Grid>
    </Box>
    </div>
  );
}

export default EmployeeFacts;
