"""
TA Detective V2 - Advanced Talent Acquisition Investigation Tool

This module provides a funnel-based approach to investigate employee recruitment:
1. Query employees from the employee dimension
2. Match employees to hired candidates
3. Match candidates to recruitment processes
4. Generate comprehensive Excel report with multiple sheets
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any, Tuple
import pandas as pd
from datetime import datetime
import unicodedata
import re


@dataclass
class EmployeeRecord:
    """Data class for employee query results"""
    employee_id: str
    full_name: str
    email: str
    onboarding_date: Optional[datetime]
    # Add more fields as needed
    
    
@dataclass
class HiredCandidateRecord:
    """Data class for hired candidate query results"""
    candidate_id: str
    employee_id: Optional[str]
    first_name: str
    last_name: str
    email: str
    hired_date: Optional[datetime]
    application_id: Optional[str]
    application_updated_at: Optional[datetime]
    job_posting_id: Optional[str]
    job_posting_title: Optional[str]
    # Add more fields as needed


@dataclass
class RecruitmentProcessRecord:
    """Data class for recruitment process query results"""
    process_id: str
    candidate_id: str
    position_name: str
    new_hire_name: Optional[str]  # Name of person hired for this position
    hiring_manager: Optional[str]
    opened_date: Optional[datetime]
    closed_date: Optional[datetime]
    status: str
    # Add more fields as needed


@dataclass
class MatchedRecord:
    """Data class for final matched results combining all three sources"""
    # Employee data
    employee_id: Optional[str]
    employee_full_name: Optional[str]
    employee_email: Optional[str]
    employee_onboarding_date: Optional[datetime]
    
    # Candidate data
    candidate_id: Optional[str]
    candidate_first_name: Optional[str]
    candidate_last_name: Optional[str]
    candidate_email: Optional[str]
    candidate_hired_date: Optional[datetime]
    candidate_application_id: Optional[str]
    candidate_application_updated_at: Optional[datetime]
    candidate_job_posting_id: Optional[str]
    candidate_job_posting_title: Optional[str]
    
    # Recruitment process data
    process_id: Optional[str]
    position_name: Optional[str]
    new_hire_name: Optional[str]
    hiring_manager: Optional[str]
    process_opened_date: Optional[datetime]
    process_closed_date: Optional[datetime]
    process_status: Optional[str]
    
    # Matching metadata
    match_confidence: str  # 'high', 'medium', 'low'
    match_method: str  # 'employee_id', 'email', 'name+date', etc.
    hire_match_score: Optional[float]  # Employee → Candidate similarity (0.0 to 1.0)
    position_match_score: Optional[float]  # Candidate → Process similarity (0.0 to 1.0)


class TADetectiveV2:
    """
    Advanced Talent Acquisition Detective for investigating employee recruitment pipeline
    """
    
    def __init__(self, query_runner=None):
        """
        Initialize the detective with a query runner
        
        Args:
            query_runner: QueryRunner instance for database queries
        """
        self.query_runner = query_runner
        self.employees: List[EmployeeRecord] = []
        self.hired_candidates: List[HiredCandidateRecord] = []
        self.recruitment_processes: List[RecruitmentProcessRecord] = []
        self.matched_records: List[MatchedRecord] = []
    
    
    # ==================== String Matching Utilities ====================
    
    @staticmethod
    def normalize_string(text: str) -> str:
        """
        Normalize string by removing accents and converting to lowercase
        
        Args:
            text: Input string to normalize
            
        Returns:
            Normalized string
        """
        if not text:
            return ""
        
        # Remove accents
        nfd_form = unicodedata.normalize('NFD', text)
        text_without_accents = ''.join([c for c in nfd_form if unicodedata.category(c) != 'Mn'])
        
        # Convert to lowercase and strip whitespace
        return text_without_accents.lower().strip()
    
    
    @staticmethod
    def calculate_similarity(str1: str, str2: str) -> float:
        """
        Calculate similarity between two strings (0.0 to 1.0)
        Uses simple token matching approach
        
        Args:
            str1: First string
            str2: Second string
            
        Returns:
            Similarity score (0.0 = no match, 1.0 = perfect match)
        """
        if not str1 or not str2:
            return 0.0
        
        # Normalize both strings
        norm1 = TADetectiveV2.normalize_string(str1)
        norm2 = TADetectiveV2.normalize_string(str2)
        
        # Exact match after normalization
        if norm1 == norm2:
            return 1.0
        
        # Token-based matching
        tokens1 = set(re.findall(r'\w+', norm1))
        tokens2 = set(re.findall(r'\w+', norm2))
        
        if not tokens1 or not tokens2:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(tokens1.intersection(tokens2))
        union = len(tokens1.union(tokens2))
        
        return intersection / union if union > 0 else 0.0
    
    
    @staticmethod
    def match_names(first1: str, last1: str, first2: str, last2: str) -> Tuple[float, str]:
        """
        Match two name pairs and return similarity score
        
        Args:
            first1: First name from first record
            last1: Last name from first record
            first2: First name from second record
            last2: Last name from second record
            
        Returns:
            Tuple of (similarity_score, match_method)
        """
        # Normalize all names
        norm_first1 = TADetectiveV2.normalize_string(first1)
        norm_last1 = TADetectiveV2.normalize_string(last1)
        norm_first2 = TADetectiveV2.normalize_string(first2)
        norm_last2 = TADetectiveV2.normalize_string(last2)
        
        # Exact match on both names
        if norm_first1 == norm_first2 and norm_last1 == norm_last2:
            return 1.0, "exact_match"
        
        # Calculate similarity for each name
        first_similarity = TADetectiveV2.calculate_similarity(first1, first2)
        last_similarity = TADetectiveV2.calculate_similarity(last1, last2)
        
        # Average similarity
        avg_similarity = (first_similarity + last_similarity) / 2
        
        if avg_similarity >= 0.9:
            return avg_similarity, "high_confidence"
        elif avg_similarity >= 0.7:
            return avg_similarity, "medium_confidence"
        else:
            return avg_similarity, "low_confidence"
    
    
    # ==================== Query Methods ====================
    
    def query_employees(self, filters: Optional[Dict[str, Any]] = None) -> List[EmployeeRecord]:
        """
        Query employees from dim_employees
        
        Args:
            filters: Optional filters like date range, team, etc.
            
        Returns:
            List of EmployeeRecord objects
        """
        query = """
        SELECT
            first_name,
            last_name,
            full_name,
            CAST(employee_id AS BIGINT) as employee_id,
            onboarding_date,
            offboarding_date
        FROM data_lake_dev_xavi_silver.dim_employees
        WHERE 1=1
        """
        
        # Apply filters if provided
        if filters:
            if filters.get('is_active'):
                query += " AND is_active = true"
            if filters.get('onboarding_date_from'):
                query += f" AND onboarding_date >= DATE '{filters['onboarding_date_from']}'"
            if filters.get('onboarding_date_to'):
                query += f" AND onboarding_date <= DATE '{filters['onboarding_date_to']}'"
        
        # Add ordering
        query += " ORDER BY onboarding_date DESC"
        
        # Add limit
        if filters and filters.get('limit'):
            query += f" LIMIT {filters['limit']}"
        
        # Execute query - returns DataFrame
        df = self.query_runner.run_query(query, source='galaxy')
        
        # Parse results into EmployeeRecord objects
        self.employees = []
        for _, row in df.iterrows():
            self.employees.append(EmployeeRecord(
                employee_id=str(row['employee_id']),
                full_name=row['full_name'],
                email=row.get('email', ''),
                onboarding_date=row.get('onboarding_date')
            ))
        
        return self.employees
    
    
    def query_hired_candidates(self, employee_ids: Optional[List[str]] = None) -> List[HiredCandidateRecord]:
        """
        Query hired candidates from dim_hires/ats_candidates
        
        Args:
            employee_ids: Optional list of employee IDs to filter by
            
        Returns:
            List of HiredCandidateRecord objects
        """
        query = """
        SELECT
            CAST(candidate_id AS BIGINT) as candidate_id,
            candidate_first_name,
            candidate_last_name,
            candidate_email,
            candidate_all_names,
            CAST(application_id AS BIGINT) as application_id,
            hired_date as application_updated_at,
            CAST(job_posting_id AS BIGINT) as job_posting_id,
            job_posting_title,
            hired_date,
            CAST(hiring_stage_id AS BIGINT) as hiring_stage_id,
            hiring_stage_name,
            CAST(application_phase_id AS BIGINT) as application_phase_id,
            application_phase_type,
            CAST(company_id AS BIGINT) as company_id
        FROM data_lake_dev_xavi_silver.dim_hires
        WHERE 1=1
        """
        
        # Filter by employee_ids if provided
        if employee_ids and len(employee_ids) > 0:
            # Note: dim_hires might not have employee_id directly
            # This filter might need adjustment based on actual schema
            pass
        
        # Execute query - returns DataFrame
        df = self.query_runner.run_query(query, source='galaxy')
        
        # Parse results into HiredCandidateRecord objects
        self.hired_candidates = []
        for _, row in df.iterrows():
            self.hired_candidates.append(HiredCandidateRecord(
                candidate_id=str(row['candidate_id']),
                employee_id=None,  # Will be matched later
                first_name=row['candidate_first_name'],
                last_name=row['candidate_last_name'],
                email=row.get('candidate_email', ''),
                hired_date=row.get('hired_date'),
                application_id=str(row['application_id']) if row.get('application_id') else None,
                application_updated_at=row.get('application_updated_at'),
                job_posting_id=str(row['job_posting_id']) if row.get('job_posting_id') else None,
                job_posting_title=row.get('job_posting_title')
            ))
        
        return self.hired_candidates
    
    
    def query_recruitment_processes(self, candidate_ids: Optional[List[str]] = None) -> List[RecruitmentProcessRecord]:
        """
        Query recruitment processes from dim_job_positions/dim_applications
        
        Args:
            candidate_ids: Optional list of candidate IDs to filter by
            
        Returns:
            List of RecruitmentProcessRecord objects
        """
        query = """
        SELECT
            position_id,
            position_name,
            new_hire_name,
            opened_date,
            closed_date,
            team,
            specific_team,
            manager,
            seniority,
            talent_specialist
        FROM data_lake_dev_xavi_silver.dim_job_positions
        WHERE 1=1
        """
        
        # Execute query - returns DataFrame
        df = self.query_runner.run_query(query, source='galaxy')
        
        # Parse results into RecruitmentProcessRecord objects
        self.recruitment_processes = []
        for _, row in df.iterrows():
            self.recruitment_processes.append(RecruitmentProcessRecord(
                process_id=str(row['position_id']),
                candidate_id=None,  # Will be matched later
                position_name=row['position_name'],
                new_hire_name=row.get('new_hire_name'),
                hiring_manager=row.get('manager'),
                opened_date=row.get('opened_date'),
                closed_date=row.get('closed_date'),
                status='closed' if row.get('closed_date') else 'open'
            ))
        
        return self.recruitment_processes
    
    
    # ==================== Matching Methods ====================
    
    def match_employee_to_candidates(self, employee: EmployeeRecord) -> List[Tuple[HiredCandidateRecord, float, str]]:
        """
        Match an employee to hired candidate records (can have multiple matches)
        
        Args:
            employee: EmployeeRecord to match
            
        Returns:
            List of tuples: (HiredCandidateRecord, similarity_score, match_method)
        """
        matches = []
        
        # Handle None or empty full_name
        if not employee.full_name:
            return matches
        
        # Extract first and last name from employee full_name
        name_parts = employee.full_name.split()
        if len(name_parts) < 2:
            return matches
        
        emp_first_name = name_parts[0]
        emp_last_name = ' '.join(name_parts[1:])  # Handle multi-part last names
        
        # Try to match with each candidate
        for candidate in self.hired_candidates:
            # Skip candidates with missing names
            if not candidate.first_name or not candidate.last_name:
                continue
                
            similarity, method = self.match_names(
                emp_first_name, emp_last_name,
                candidate.first_name, candidate.last_name
            )
            
            # Only include matches above a threshold
            if similarity >= 0.6:
                matches.append((candidate, similarity, method))
        
        # Sort by similarity (highest first)
        matches.sort(key=lambda x: x[1], reverse=True)
        
        return matches
    
    
    def match_candidate_to_process(self, candidate: HiredCandidateRecord) -> Optional[Tuple[RecruitmentProcessRecord, float, str]]:
        """
        Match a hired candidate to their recruitment process
        
        Args:
            candidate: HiredCandidateRecord to match
            
        Returns:
            Tuple of (RecruitmentProcessRecord, similarity_score, match_method) or None
        """
        best_match = None
        best_similarity = 0.0
        best_method = ""
        
        # Candidate full name for matching
        candidate_full_name = f"{candidate.first_name} {candidate.last_name}"
        
        # Try to match with each recruitment process using new_hire_name
        for process in self.recruitment_processes:
            if not process.new_hire_name:
                continue
            
            # Match candidate name to new_hire_name from dim_job_positions
            similarity = self.calculate_similarity(candidate_full_name, process.new_hire_name)
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = process
                if similarity >= 0.9:
                    best_method = "high_confidence_hire_name"
                elif similarity >= 0.7:
                    best_method = "medium_confidence_hire_name"
                else:
                    best_method = "low_confidence_hire_name"
        
        # Return best match if above threshold
        if best_match and best_similarity >= 0.6:
            return (best_match, best_similarity, best_method)
        
        return None
    
    
    def build_matched_records(self) -> List[MatchedRecord]:
        """
        Build complete matched records by combining all three data sources
        
        Returns:
            List of MatchedRecord objects with all available data
        """
        self.matched_records = []
        
        print(f"   Matching {len(self.employees)} employees to candidates...")
        
        # Iterate through employees
        for employee in self.employees:
            # Find matching candidates (can be multiple)
            candidate_matches = self.match_employee_to_candidates(employee)
            
            if not candidate_matches:
                # Employee with no matching candidate
                self.matched_records.append(MatchedRecord(
                    employee_id=employee.employee_id,
                    employee_full_name=employee.full_name,
                    employee_email=employee.email,
                    employee_onboarding_date=employee.onboarding_date,
                    candidate_id=None,
                    candidate_first_name=None,
                    candidate_last_name=None,
                    candidate_email=None,
                    candidate_hired_date=None,
                    candidate_application_id=None,
                    candidate_application_updated_at=None,
                    candidate_job_posting_id=None,
                    candidate_job_posting_title=None,
                    process_id=None,
                    position_name=None,
                    new_hire_name=None,
                    hiring_manager=None,
                    process_opened_date=None,
                    process_closed_date=None,
                    process_status=None,
                    match_confidence='no_match',
                    match_method='no_candidate_found',
                    hire_match_score=None,
                    position_match_score=None
                ))
            else:
                # For each matched candidate
                for candidate, similarity, method in candidate_matches:
                    # Try to find matching recruitment process
                    process_match = self.match_candidate_to_process(candidate)
                    
                    if process_match:
                        process, proc_similarity, proc_method = process_match
                        
                        # Calculate overall confidence
                        avg_similarity = (similarity + proc_similarity) / 2
                        if avg_similarity >= 0.9:
                            confidence = 'high'
                        elif avg_similarity >= 0.7:
                            confidence = 'medium'
                        else:
                            confidence = 'low'
                        
                        self.matched_records.append(MatchedRecord(
                            employee_id=employee.employee_id,
                            employee_full_name=employee.full_name,
                            employee_email=employee.email,
                            employee_onboarding_date=employee.onboarding_date,
                            candidate_id=candidate.candidate_id,
                            candidate_first_name=candidate.first_name,
                            candidate_last_name=candidate.last_name,
                            candidate_email=candidate.email,
                            candidate_hired_date=candidate.hired_date,
                            candidate_application_id=candidate.application_id,
                            candidate_application_updated_at=candidate.application_updated_at,
                            candidate_job_posting_id=candidate.job_posting_id,
                            candidate_job_posting_title=candidate.job_posting_title,
                            process_id=process.process_id,
                            position_name=process.position_name,
                            new_hire_name=process.new_hire_name,
                            hiring_manager=process.hiring_manager,
                            process_opened_date=process.opened_date,
                            process_closed_date=process.closed_date,
                            process_status=process.status,
                            match_confidence=confidence,
                            match_method=f"{method}+{proc_method}",
                            hire_match_score=similarity,
                            position_match_score=proc_similarity
                        ))
                    else:
                        # Candidate matched but no process found
                        if similarity >= 0.9:
                            confidence = 'high'
                        elif similarity >= 0.7:
                            confidence = 'medium'
                        else:
                            confidence = 'low'
                        
                        self.matched_records.append(MatchedRecord(
                            employee_id=employee.employee_id,
                            employee_full_name=employee.full_name,
                            employee_email=employee.email,
                            employee_onboarding_date=employee.onboarding_date,
                            candidate_id=candidate.candidate_id,
                            candidate_first_name=candidate.first_name,
                            candidate_last_name=candidate.last_name,
                            candidate_email=candidate.email,
                            candidate_hired_date=candidate.hired_date,
                            candidate_application_id=candidate.application_id,
                            candidate_application_updated_at=candidate.application_updated_at,
                            candidate_job_posting_id=candidate.job_posting_id,
                            candidate_job_posting_title=candidate.job_posting_title,
                            process_id=None,
                            position_name=None,
                            new_hire_name=None,
                            hiring_manager=None,
                            process_opened_date=None,
                            process_closed_date=None,
                            process_status=None,
                            match_confidence=confidence,
                            match_method=f"{method}+no_process",
                            hire_match_score=similarity,
                            position_match_score=None
                        ))
        
        return self.matched_records
    
    
    # ==================== Investigation Workflow ====================
    
    def investigate(self, employee_filters: Optional[Dict[str, Any]] = None) -> Dict[str, pd.DataFrame]:
        """
        Run complete investigation workflow:
        1. Query employees
        2. Query hired candidates
        3. Query recruitment processes
        4. Match records across all sources
        
        Args:
            employee_filters: Filters for initial employee query
            
        Returns:
            Dictionary with DataFrames for each stage:
            - 'employees': Raw employee data
            - 'candidates': Raw hired candidate data
            - 'processes': Raw recruitment process data
            - 'matched': Final matched records
        """
        print("🔍 Starting TA Detective V2 Investigation...")
        
        # Step 1: Query employees
        print("\n📊 Step 1: Querying employees...")
        self.query_employees(filters=employee_filters)
        print(f"   Found {len(self.employees)} employees")
        
        # Step 2: Query hired candidates
        print("\n📊 Step 2: Querying hired candidates...")
        employee_ids = [emp.employee_id for emp in self.employees]
        self.query_hired_candidates(employee_ids=employee_ids)
        print(f"   Found {len(self.hired_candidates)} hired candidates")
        
        # Step 3: Query recruitment processes
        print("\n📊 Step 3: Querying recruitment processes...")
        candidate_ids = [cand.candidate_id for cand in self.hired_candidates]
        self.query_recruitment_processes(candidate_ids=candidate_ids)
        print(f"   Found {len(self.recruitment_processes)} recruitment processes")
        
        # Step 4: Build matched records
        print("\n🔗 Step 4: Matching records...")
        self.build_matched_records()
        print(f"   Created {len(self.matched_records)} matched records")
        
        # Convert to DataFrames
        results = {
            'employees': self._employees_to_df(),
            'candidates': self._candidates_to_df(),
            'processes': self._processes_to_df(),
            'matched': self._matched_to_df()
        }
        
        print("\n✅ Investigation complete!")
        return results
    
    
    # ==================== Export Methods ====================
    
    def export_to_excel(self, filepath: str, results: Optional[Dict[str, pd.DataFrame]] = None):
        """
        Export investigation results to Excel with multiple sheets
        
        Args:
            filepath: Path to save Excel file
            results: Optional results dict (if None, will run investigation)
        """
        if results is None:
            results = self.investigate()
        
        print(f"\n💾 Exporting results to {filepath}...")
        
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            results['employees'].to_excel(writer, sheet_name='Employees', index=False)
            results['candidates'].to_excel(writer, sheet_name='Hired Candidates', index=False)
            results['processes'].to_excel(writer, sheet_name='Recruitment Processes', index=False)
            results['matched'].to_excel(writer, sheet_name='Matched Results', index=False)
        
        print(f"✅ Excel file saved: {filepath}")
    
    
    def create_matching_table_in_trino(
        self,
        schema: str = 'data_lake_dev_xavi_silver',
        table_name: str = 'aux_job_position_matching',
        if_exists: str = 'replace'
    ):
        """
        Create a table in Trino with the matching results
        
        Args:
            schema: Target schema in Trino
            table_name: Target table name
            if_exists: What to do if table exists: 'fail', 'replace', 'append'
        """
        from utils.trino.trino_loader import TrinoLoader
        
        if not self.matched_records:
            print("⚠️ No matched records to export. Run investigate() first.")
            return
        
        print(f"\n🚀 Creating matching table in Trino: {schema}.{table_name}")
        
        # Prepare data for the matching table
        matching_data = []
        for match in self.matched_records:
            # Include ALL records - even partial matches!
            # Save if we have at least application and employee (position is optional)
            if match.candidate_application_id and match.employee_id:
                matching_data.append({
                    'position_id': match.process_id,  # Can be NULL for partial matches
                    'application_id': match.candidate_application_id,
                    'application_updated_at': match.candidate_application_updated_at,
                    'employee_id': match.employee_id,
                    'hire_match_score': match.hire_match_score,
                    'position_match_score': match.position_match_score
                })
        
        if not matching_data:
            print("⚠️ No matching records to export (need at least application_id and employee_id)")
            return
        
        # Create DataFrame
        df = pd.DataFrame(matching_data)
        
        # Handle NaN values - replace with None for proper NULL handling in SQL
        df = df.where(pd.notna(df), None)
        
        # Ensure proper data types
        df['application_updated_at'] = pd.to_datetime(df['application_updated_at'])
        
        # Convert scores to float, handling None values
        df['hire_match_score'] = df['hire_match_score'].apply(lambda x: float(x) if x is not None else None)
        df['position_match_score'] = df['position_match_score'].apply(lambda x: float(x) if x is not None else None)
        
        print(f"📊 Prepared {len(df)} matching records for export")
        
        # Load to Trino
        loader = TrinoLoader(schema=schema)
        loader.create_table_from_dataframe(
            df=df,
            table_name=table_name,
            schema=schema,
            if_exists=if_exists,
            column_types={
                'position_id': 'VARCHAR',
                'application_id': 'VARCHAR',
                'application_updated_at': 'TIMESTAMP',
                'employee_id': 'VARCHAR',
                'hire_match_score': 'DOUBLE',
                'position_match_score': 'DOUBLE'
            }
        )
        
        print(f"✅ Matching table created successfully: {schema}.{table_name}")
    
    
    # ==================== Helper Methods ====================
    
    def _employees_to_df(self) -> pd.DataFrame:
        """Convert employee records to DataFrame"""
        if not self.employees:
            return pd.DataFrame()
        
        data = []
        for emp in self.employees:
            data.append({
                'employee_id': emp.employee_id,
                'full_name': emp.full_name,
                'email': emp.email,
                'onboarding_date': emp.onboarding_date
            })
        
        return pd.DataFrame(data)
    
    
    def _candidates_to_df(self) -> pd.DataFrame:
        """Convert hired candidate records to DataFrame"""
        if not self.hired_candidates:
            return pd.DataFrame()
        
        data = []
        for cand in self.hired_candidates:
            data.append({
                'candidate_id': cand.candidate_id,
                'employee_id': cand.employee_id,
                'first_name': cand.first_name,
                'last_name': cand.last_name,
                'email': cand.email,
                'hired_date': cand.hired_date,
                'application_id': cand.application_id,
                'application_updated_at': cand.application_updated_at,
                'job_posting_id': cand.job_posting_id,
                'job_posting_title': cand.job_posting_title
            })
        
        return pd.DataFrame(data)
    
    
    def _processes_to_df(self) -> pd.DataFrame:
        """Convert recruitment process records to DataFrame"""
        if not self.recruitment_processes:
            return pd.DataFrame()
        
        data = []
        for proc in self.recruitment_processes:
            data.append({
                'process_id': proc.process_id,
                'candidate_id': proc.candidate_id,
                'position_name': proc.position_name,
                'new_hire_name': proc.new_hire_name,
                'hiring_manager': proc.hiring_manager,
                'opened_date': proc.opened_date,
                'closed_date': proc.closed_date,
                'status': proc.status
            })
        
        return pd.DataFrame(data)
    
    
    def _matched_to_df(self) -> pd.DataFrame:
        """Convert matched records to DataFrame"""
        if not self.matched_records:
            return pd.DataFrame()
        
        data = []
        for match in self.matched_records:
            data.append({
                'employee_id': match.employee_id,
                'employee_full_name': match.employee_full_name,
                'employee_email': match.employee_email,
                'employee_onboarding_date': match.employee_onboarding_date,
                'candidate_id': match.candidate_id,
                'candidate_first_name': match.candidate_first_name,
                'candidate_last_name': match.candidate_last_name,
                'candidate_email': match.candidate_email,
                'candidate_hired_date': match.candidate_hired_date,
                'candidate_application_id': match.candidate_application_id,
                'candidate_application_updated_at': match.candidate_application_updated_at,
                'candidate_job_posting_id': match.candidate_job_posting_id,
                'candidate_job_posting_title': match.candidate_job_posting_title,
                'process_id': match.process_id,
                'position_name': match.position_name,
                'new_hire_name': match.new_hire_name,
                'hiring_manager': match.hiring_manager,
                'process_opened_date': match.process_opened_date,
                'process_closed_date': match.process_closed_date,
                'process_status': match.process_status,
                'match_confidence': match.match_confidence,
                'match_method': match.match_method,
                'hire_match_score': match.hire_match_score,
                'position_match_score': match.position_match_score
            })
        
        return pd.DataFrame(data)
    
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """
        Get summary statistics about the investigation
        
        Returns:
            Dictionary with counts, match rates, etc.
        """
        high_conf = len([m for m in self.matched_records if m.match_confidence == 'high'])
        medium_conf = len([m for m in self.matched_records if m.match_confidence == 'medium'])
        low_conf = len([m for m in self.matched_records if m.match_confidence == 'low'])
        no_match = len([m for m in self.matched_records if m.match_confidence == 'no_match'])
        
        matched = len([m for m in self.matched_records if m.candidate_id is not None])
        
        return {
            'total_employees': len(self.employees),
            'total_candidates': len(self.hired_candidates),
            'total_processes': len(self.recruitment_processes),
            'total_matched_records': len(self.matched_records),
            'employees_with_candidate_match': matched,
            'match_rate': round(matched / len(self.employees) * 100, 2) if self.employees else 0.0,
            'high_confidence_matches': high_conf,
            'medium_confidence_matches': medium_conf,
            'low_confidence_matches': low_conf,
            'unmatched_employees': no_match
        }


# ==================== Usage Example ====================

def main():
    """
    Example usage of TADetectiveV2
    """
    from utils.query_runner.query_runner import QueryRunner
    
    # Initialize
    query_runner = QueryRunner()
    detective = TADetectiveV2(query_runner=query_runner)
    
    # Run investigation with optional filters
    filters = {
        'onboarding_date_from': '2024-01-01',
        'onboarding_date_to': '2024-12-31',
        'is_active': True
    }
    
    # Run full investigation
    results = detective.investigate(employee_filters=filters)
    
    # Export to Excel
    detective.export_to_excel('ta_investigation_results.xlsx', results=results)
    
    # Print summary
    summary = detective.get_summary_stats()
    print("\n📈 Summary Statistics:")
    for key, value in summary.items():
        print(f"   {key}: {value}")


if __name__ == "__main__":
    main()
