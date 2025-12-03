"""
TA Detective V3 - Independent Matching Strategy

This module provides INDEPENDENT matching for employees:
1. Match employees → hires (via dim_hires) → applications
2. Match employees → positions (via dim_job_positions) independently
3. Combine results where employee can have:
   - Hire match only (application_id, no position_id)
   - Position match only (position_id, no application_id)
   - Both matches (application_id AND position_id)
   - No matches at all

Key difference from V2: We don't require hire match to search for position match.
Each employee is matched independently to both sources.
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
    

@dataclass
class EmployeeHireMatch:
    """Match result: Employee → Hire → Application"""
    employee_id: str
    application_id: Optional[str]
    application_updated_at: Optional[datetime]
    candidate_id: Optional[str]
    hired_date: Optional[datetime]
    hire_match_score: Optional[float]
    hire_match_method: Optional[str]


@dataclass
class EmployeePositionMatch:
    """Match result: Employee → Position"""
    employee_id: str
    position_id: Optional[str]
    position_name: Optional[str]
    new_hire_name: Optional[str]
    opened_date: Optional[datetime]
    closed_date: Optional[datetime]
    position_match_score: Optional[float]
    position_match_method: Optional[str]


@dataclass
class CombinedMatch:
    """Final combined result with both hire and position matches"""
    employee_id: str
    employee_full_name: str
    employee_email: str
    employee_onboarding_date: Optional[datetime]
    
    # Hire/Application match (can be None)
    application_id: Optional[str]
    application_updated_at: Optional[datetime]
    candidate_id: Optional[str]
    hired_date: Optional[datetime]
    hire_match_score: Optional[float]
    hire_match_method: Optional[str]
    
    # Position match (can be None, independent from hire match)
    position_id: Optional[str]
    position_name: Optional[str]
    new_hire_name: Optional[str]
    position_opened_date: Optional[datetime]
    position_closed_date: Optional[datetime]
    position_match_score: Optional[float]
    position_match_method: Optional[str]
    
    # Status flags
    has_hire_match: bool
    has_position_match: bool
    match_status: str  # 'BOTH', 'HIRE_ONLY', 'POSITION_ONLY', 'NONE'


class TADetectiveV3:
    """
    Advanced TA Detective with Independent Matching Strategy
    """
    
    def __init__(self, query_runner=None):
        """
        Initialize the detective with a query runner
        
        Args:
            query_runner: QueryRunner instance for database queries
        """
        self.query_runner = query_runner
        self.employees: List[EmployeeRecord] = []
        self.hire_matches: List[EmployeeHireMatch] = []
        self.position_matches: List[EmployeePositionMatch] = []
        self.combined_matches: List[CombinedMatch] = []
    
    
    # ==================== String Matching Utilities ====================
    
    @staticmethod
    def normalize_string(text: str) -> str:
        """Normalize string by removing accents and converting to lowercase"""
        if not text:
            return ""
        
        nfd_form = unicodedata.normalize('NFD', text)
        text_without_accents = ''.join([c for c in nfd_form if unicodedata.category(c) != 'Mn'])
        return text_without_accents.lower().strip()
    
    
    @staticmethod
    def calculate_similarity(str1: str, str2: str) -> float:
        """Calculate similarity between two strings (0.0 to 1.0)"""
        if not str1 or not str2:
            return 0.0
        
        # Normalize both strings
        norm1 = TADetectiveV3.normalize_string(str1)
        norm2 = TADetectiveV3.normalize_string(str2)
        
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
        Match two name pairs and return similarity score (same as V2)
        
        Args:
            first1: First name from first record
            last1: Last name from first record
            first2: First name from second record
            last2: Last name from second record
            
        Returns:
            Tuple of (similarity_score, match_method)
        """
        # Normalize all names
        norm_first1 = TADetectiveV3.normalize_string(first1)
        norm_last1 = TADetectiveV3.normalize_string(last1)
        norm_first2 = TADetectiveV3.normalize_string(first2)
        norm_last2 = TADetectiveV3.normalize_string(last2)
        
        # Exact match on both names
        if norm_first1 == norm_first2 and norm_last1 == norm_last2:
            return 1.0, "exact_match"
        
        # Calculate similarity for each name
        first_similarity = TADetectiveV3.calculate_similarity(first1, first2)
        last_similarity = TADetectiveV3.calculate_similarity(last1, last2)
        
        # Average similarity
        avg_similarity = (first_similarity + last_similarity) / 2
        
        if avg_similarity >= 0.9:
            return avg_similarity, "high_confidence"
        elif avg_similarity >= 0.7:
            return avg_similarity, "medium_confidence"
        else:
            return avg_similarity, "low_confidence"
    
    
    @staticmethod
    def extract_email_username(email: str) -> str:
        """Extract username part from email (before @)"""
        if not email or '@' not in email:
            return ""
        return email.split('@')[0].lower().strip()
    
    
    # ==================== Data Fetching ====================
    
    def fetch_employees(self, filters: Optional[Dict[str, Any]] = None) -> List[EmployeeRecord]:
        """
        Fetch employees from fact_employees
        
        Args:
            filters: Optional filters (limit, onboarding_date_from, onboarding_date_to, etc.)
        
        Returns:
            List of EmployeeRecord objects
        """
        print("\n🔍 Fetching employees from dim_employees...")
        
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
        
        df = self.query_runner.run_query(query, source='galaxy')
        
        self.employees = [
            EmployeeRecord(
                employee_id=str(row['employee_id']),
                full_name=row['full_name'],
                email='',  # dim_employees doesn't have email
                onboarding_date=row['onboarding_date']
            )
            for _, row in df.iterrows()
        ]
        
        print(f"✅ Found {len(self.employees)} employees")
        return self.employees
    
    
    def fetch_hires(self) -> pd.DataFrame:
        """Fetch all hired candidates from dim_hires"""
        print("\n🔍 Fetching hires from dim_hires...")
        
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
        
        df = self.query_runner.run_query(query, source='galaxy')
        print(f"✅ Found {len(df)} hires")
        return df
    
    
    def fetch_positions(self) -> pd.DataFrame:
        """Fetch all job positions from dim_job_positions"""
        print("\n🔍 Fetching positions from dim_job_positions...")
        
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
        
        df = self.query_runner.run_query(query, source='galaxy')
        print(f"✅ Found {len(df)} positions")
        return df
    
    
    # ==================== Matching Logic ====================
    
    def match_employee_to_hires(
        self, 
        employee: EmployeeRecord, 
        hires_df: pd.DataFrame
    ) -> Optional[EmployeeHireMatch]:
        """
        Match a single employee to hired candidates (using V2's improved matching)
        
        Returns:
            EmployeeHireMatch or None if no match found
        """
        best_match = None
        best_score = 0.0
        best_method = None
        
        # Handle None or empty full_name
        if not employee.full_name:
            return None
        
        # Extract first and last name from employee full_name
        name_parts = employee.full_name.split()
        if len(name_parts) < 2:
            return None
        
        emp_first_name = name_parts[0]
        emp_last_name = ' '.join(name_parts[1:])  # Handle multi-part last names
        
        for _, hire in hires_df.iterrows():
            # Skip candidates with missing names
            hire_first = hire.get('candidate_first_name', '')
            hire_last = hire.get('candidate_last_name', '')
            if not hire_first or not hire_last:
                continue
            
            # Use V2's match_names function for better matching
            similarity, method = self.match_names(
                emp_first_name, emp_last_name,
                hire_first, hire_last
            )
            
            # Lower threshold like V2 (0.6 instead of 0.7)
            if similarity > best_score and similarity >= 0.6:
                best_match = hire
                best_score = similarity
                best_method = method
        
        if best_match is not None:
            return EmployeeHireMatch(
                employee_id=employee.employee_id,
                application_id=str(best_match['application_id']) if pd.notna(best_match['application_id']) else None,
                application_updated_at=best_match.get('application_updated_at'),
                candidate_id=str(best_match['candidate_id']) if pd.notna(best_match['candidate_id']) else None,
                hired_date=best_match.get('hired_date'),
                hire_match_score=best_score,
                hire_match_method=best_method
            )
        
        return None
    
    
    def match_employee_to_positions(
        self, 
        employee: EmployeeRecord, 
        positions_df: pd.DataFrame
    ) -> Optional[EmployeePositionMatch]:
        """
        Match a single employee to job positions (using improved V2 matching)
        
        Returns:
            EmployeePositionMatch or None if no match found
        """
        best_match = None
        best_score = 0.0
        best_method = None
        
        # Handle None or empty full_name
        if not employee.full_name:
            return None
        
        # Extract first and last name from employee full_name
        name_parts = employee.full_name.split()
        if len(name_parts) < 2:
            return None
        
        emp_first_name = name_parts[0]
        emp_last_name = ' '.join(name_parts[1:])  # Handle multi-part last names
        
        for _, position in positions_df.iterrows():
            new_hire_name = position.get('new_hire_name', '')
            if not new_hire_name:
                continue
            
            # Parse new_hire_name into first and last
            hire_name_parts = new_hire_name.split()
            if len(hire_name_parts) < 2:
                continue
            
            hire_first = hire_name_parts[0]
            hire_last = ' '.join(hire_name_parts[1:])
            
            # Use V2's match_names function for better matching
            similarity, method = self.match_names(
                emp_first_name, emp_last_name,
                hire_first, hire_last
            )
            
            # Lower threshold like V2 (0.6 instead of 0.7)
            if similarity > best_score and similarity >= 0.6:
                best_match = position
                best_score = similarity
                best_method = method
        
        if best_match is not None:
            return EmployeePositionMatch(
                employee_id=employee.employee_id,
                position_id=str(best_match['position_id']) if pd.notna(best_match['position_id']) else None,
                position_name=best_match.get('position_name'),
                new_hire_name=best_match.get('new_hire_name'),
                opened_date=best_match.get('opened_date'),
                closed_date=best_match.get('closed_date'),
                position_match_score=best_score,
                position_match_method=best_method
            )
        
        return None
    
    
    # ==================== Investigation Workflow ====================
    
    def investigate(self, employee_filters: Optional[Dict[str, Any]] = None) -> Dict[str, pd.DataFrame]:
        """
        Run complete investigation with independent matching
        
        Args:
            employee_filters: Filters for employee query
        
        Returns:
            Dictionary with DataFrames for export
        """
        # Step 1: Fetch all data
        self.fetch_employees(filters=employee_filters)
        hires_df = self.fetch_hires()
        positions_df = self.fetch_positions()
        
        # Step 2: Match employees to hires (independently)
        print("\n🔗 Matching employees to hires...")
        self.hire_matches = []
        for emp in self.employees:
            hire_match = self.match_employee_to_hires(emp, hires_df)
            if hire_match:
                self.hire_matches.append(hire_match)
        print(f"✅ Found {len(self.hire_matches)} hire matches")
        
        # Step 3: Match employees to positions (independently)
        print("\n🔗 Matching employees to positions...")
        self.position_matches = []
        for emp in self.employees:
            position_match = self.match_employee_to_positions(emp, positions_df)
            if position_match:
                self.position_matches.append(position_match)
        print(f"✅ Found {len(self.position_matches)} position matches")
        
        # Step 4: Combine results
        print("\n🔗 Combining matches...")
        self.combined_matches = []
        
        # Create lookup dicts
        hire_lookup = {hm.employee_id: hm for hm in self.hire_matches}
        position_lookup = {pm.employee_id: pm for pm in self.position_matches}
        
        for emp in self.employees:
            hire_match = hire_lookup.get(emp.employee_id)
            position_match = position_lookup.get(emp.employee_id)
            
            has_hire = hire_match is not None
            has_position = position_match is not None
            
            if has_hire and has_position:
                match_status = 'BOTH'
            elif has_hire:
                match_status = 'HIRE_ONLY'
            elif has_position:
                match_status = 'POSITION_ONLY'
            else:
                match_status = 'NONE'
            
            combined = CombinedMatch(
                employee_id=emp.employee_id,
                employee_full_name=emp.full_name,
                employee_email=emp.email,
                employee_onboarding_date=emp.onboarding_date,
                
                # Hire data
                application_id=hire_match.application_id if hire_match else None,
                application_updated_at=hire_match.application_updated_at if hire_match else None,
                candidate_id=hire_match.candidate_id if hire_match else None,
                hired_date=hire_match.hired_date if hire_match else None,
                hire_match_score=hire_match.hire_match_score if hire_match else None,
                hire_match_method=hire_match.hire_match_method if hire_match else None,
                
                # Position data
                position_id=position_match.position_id if position_match else None,
                position_name=position_match.position_name if position_match else None,
                new_hire_name=position_match.new_hire_name if position_match else None,
                position_opened_date=position_match.opened_date if position_match else None,
                position_closed_date=position_match.closed_date if position_match else None,
                position_match_score=position_match.position_match_score if position_match else None,
                position_match_method=position_match.position_match_method if position_match else None,
                
                has_hire_match=has_hire,
                has_position_match=has_position,
                match_status=match_status
            )
            
            self.combined_matches.append(combined)
        
        print(f"✅ Combined {len(self.combined_matches)} total employee records")
        
        # Step 5: Prepare export DataFrames
        results = {
            'combined_matches': self._combined_matches_to_df(),
            'hire_matches_only': self._hire_matches_to_df(),
            'position_matches_only': self._position_matches_to_df(),
            'employees': self._employees_to_df()
        }
        
        return results
    
    
    def create_matching_tables_in_trino(
        self,
        schema: str = 'data_lake_dev_xavi_silver',
        hire_table_name: str = 'aux_employee_hires',
        position_table_name: str = 'aux_employee_positions',
        if_exists: str = 'replace'
    ):
        """
        Create TWO separate aux tables with independent matching results:
        1. aux_employee_hires: employee_id → application_id matches
        2. aux_employee_positions: employee_id → position_id matches
        
        Args:
            schema: Target schema
            hire_table_name: Table name for hire matches
            position_table_name: Table name for position matches
            if_exists: 'replace', 'append', or 'fail'
        """
        from utils.trino.trino_loader import TrinoLoader
        
        if not self.hire_matches and not self.position_matches:
            print("⚠️ No matches to export. Run investigate() first.")
            return
        
        loader = TrinoLoader(schema=schema)
        
        # ========== TABLE 1: aux_employee_hires ==========
        if self.hire_matches:
            print(f"\n🚀 Creating hire matching table: {schema}.{hire_table_name}")
            
            hire_data = []
            for match in self.hire_matches:
                if match.employee_id and match.application_id:
                    hire_data.append({
                        'employee_id': match.employee_id,
                        'application_id': match.application_id,
                        'application_updated_at': match.application_updated_at,
                        'candidate_id': match.candidate_id,
                        'hired_date': match.hired_date,
                        'hire_match_score': match.hire_match_score,
                        'hire_match_method': match.hire_match_method
                    })
            
            if hire_data:
                df_hires = pd.DataFrame(hire_data)
                df_hires = df_hires.where(pd.notna(df_hires), None)
                
                # Ensure proper data types
                df_hires['application_updated_at'] = pd.to_datetime(df_hires['application_updated_at'])
                df_hires['hired_date'] = pd.to_datetime(df_hires['hired_date'])
                df_hires['hire_match_score'] = df_hires['hire_match_score'].apply(lambda x: float(x) if x is not None else None)
                
                print(f"📊 Prepared {len(df_hires)} hire matches")
                
                loader.create_table_from_dataframe(
                    df=df_hires,
                    table_name=hire_table_name,
                    schema=schema,
                    if_exists=if_exists,
                    column_types={
                        'employee_id': 'VARCHAR',
                        'application_id': 'VARCHAR',
                        'application_updated_at': 'TIMESTAMP',
                        'candidate_id': 'VARCHAR',
                        'hired_date': 'TIMESTAMP',
                        'hire_match_score': 'DOUBLE',
                        'hire_match_method': 'VARCHAR'
                    }
                )
                print(f"✅ Hire matching table created: {schema}.{hire_table_name}")
            else:
                print("⚠️ No hire matches with both employee_id and application_id")
        
        # ========== TABLE 2: aux_employee_positions ==========
        if self.position_matches:
            print(f"\n🚀 Creating position matching table: {schema}.{position_table_name}")
            
            position_data = []
            for match in self.position_matches:
                if match.employee_id and match.position_id:
                    position_data.append({
                        'employee_id': match.employee_id,
                        'position_id': match.position_id,
                        'position_name': match.position_name,
                        'new_hire_name': match.new_hire_name,
                        'opened_date': match.opened_date,
                        'closed_date': match.closed_date,
                        'position_match_score': match.position_match_score,
                        'position_match_method': match.position_match_method
                    })
            
            if position_data:
                df_positions = pd.DataFrame(position_data)
                df_positions = df_positions.where(pd.notna(df_positions), None)
                
                # Ensure proper data types
                df_positions['opened_date'] = pd.to_datetime(df_positions['opened_date'])
                df_positions['closed_date'] = pd.to_datetime(df_positions['closed_date'])
                df_positions['position_match_score'] = df_positions['position_match_score'].apply(lambda x: float(x) if x is not None else None)
                
                print(f"📊 Prepared {len(df_positions)} position matches")
                
                loader.create_table_from_dataframe(
                    df=df_positions,
                    table_name=position_table_name,
                    schema=schema,
                    if_exists=if_exists,
                    column_types={
                        'employee_id': 'VARCHAR',
                        'position_id': 'VARCHAR',
                        'position_name': 'VARCHAR',
                        'new_hire_name': 'VARCHAR',
                        'opened_date': 'TIMESTAMP',
                        'closed_date': 'TIMESTAMP',
                        'position_match_score': 'DOUBLE',
                        'position_match_method': 'VARCHAR'
                    }
                )
                print(f"✅ Position matching table created: {schema}.{position_table_name}")
            else:
                print("⚠️ No position matches with both employee_id and position_id")
    
    
    def export_to_excel(self, output_path: str, results: Optional[Dict[str, pd.DataFrame]] = None):
        """Export results to Excel with multiple sheets"""
        if results is None:
            results = {
                'combined_matches': self._combined_matches_to_df(),
                'hire_matches_only': self._hire_matches_to_df(),
                'position_matches_only': self._position_matches_to_df(),
                'employees': self._employees_to_df()
            }
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            for sheet_name, df in results.items():
                if not df.empty:
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        print(f"✅ Excel exported to: {output_path}")
    
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """Get summary statistics"""
        if not self.combined_matches:
            return {}
        
        total = len(self.combined_matches)
        both = sum(1 for m in self.combined_matches if m.match_status == 'BOTH')
        hire_only = sum(1 for m in self.combined_matches if m.match_status == 'HIRE_ONLY')
        position_only = sum(1 for m in self.combined_matches if m.match_status == 'POSITION_ONLY')
        none_match = sum(1 for m in self.combined_matches if m.match_status == 'NONE')
        
        return {
            'total_employees': total,
            'matched_both': both,
            'matched_hire_only': hire_only,
            'matched_position_only': position_only,
            'no_matches': none_match,
            'match_rate_any': f"{((both + hire_only + position_only) / total * 100):.1f}%",
            'match_rate_both': f"{(both / total * 100):.1f}%"
        }
    
    
    # ==================== Helper Methods ====================
    
    def _employees_to_df(self) -> pd.DataFrame:
        """Convert employees to DataFrame"""
        if not self.employees:
            return pd.DataFrame()
        
        return pd.DataFrame([
            {
                'employee_id': e.employee_id,
                'full_name': e.full_name,
                'email': e.email,
                'onboarding_date': e.onboarding_date
            }
            for e in self.employees
        ])
    
    
    def _hire_matches_to_df(self) -> pd.DataFrame:
        """Convert hire matches to DataFrame"""
        if not self.hire_matches:
            return pd.DataFrame()
        
        return pd.DataFrame([
            {
                'employee_id': hm.employee_id,
                'application_id': hm.application_id,
                'application_updated_at': hm.application_updated_at,
                'candidate_id': hm.candidate_id,
                'hired_date': hm.hired_date,
                'hire_match_score': hm.hire_match_score,
                'hire_match_method': hm.hire_match_method
            }
            for hm in self.hire_matches
        ])
    
    
    def _position_matches_to_df(self) -> pd.DataFrame:
        """Convert position matches to DataFrame"""
        if not self.position_matches:
            return pd.DataFrame()
        
        return pd.DataFrame([
            {
                'employee_id': pm.employee_id,
                'position_id': pm.position_id,
                'position_name': pm.position_name,
                'new_hire_name': pm.new_hire_name,
                'opened_date': pm.opened_date,
                'closed_date': pm.closed_date,
                'position_match_score': pm.position_match_score,
                'position_match_method': pm.position_match_method
            }
            for pm in self.position_matches
        ])
    
    
    def _combined_matches_to_df(self) -> pd.DataFrame:
        """Convert combined matches to DataFrame"""
        if not self.combined_matches:
            return pd.DataFrame()
        
        return pd.DataFrame([
            {
                'employee_id': cm.employee_id,
                'employee_full_name': cm.employee_full_name,
                'employee_email': cm.employee_email,
                'employee_onboarding_date': cm.employee_onboarding_date,
                'application_id': cm.application_id,
                'application_updated_at': cm.application_updated_at,
                'candidate_id': cm.candidate_id,
                'hired_date': cm.hired_date,
                'hire_match_score': cm.hire_match_score,
                'hire_match_method': cm.hire_match_method,
                'position_id': cm.position_id,
                'position_name': cm.position_name,
                'new_hire_name': cm.new_hire_name,
                'position_opened_date': cm.position_opened_date,
                'position_closed_date': cm.position_closed_date,
                'position_match_score': cm.position_match_score,
                'position_match_method': cm.position_match_method,
                'has_hire_match': cm.has_hire_match,
                'has_position_match': cm.has_position_match,
                'match_status': cm.match_status
            }
            for cm in self.combined_matches
        ])
