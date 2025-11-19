"""
FuzzyMatcher - A utility class for fuzzy string matching between datasets
Uses rapidfuzz library for efficient fuzzy matching with various algorithms
"""

from typing import List, Dict, Optional, Tuple, Callable
import pandas as pd
from rapidfuzz import fuzz, process
from dataclasses import dataclass


@dataclass
class MatchConfig:
    """Configuration for a single field match"""
    source_field: str
    target_field: str
    weight: float = 1.0
    scorer: Callable = fuzz.token_sort_ratio  # Default scoring algorithm
    threshold: float = 0.0  # Minimum score to consider


class FuzzyMatcher:
    """
    A flexible fuzzy matching utility that can match records between two datasets
    based on configurable field mappings and scoring weights.
    
    Example:
        matcher = FuzzyMatcher(
            match_configs=[
                MatchConfig('job_title', 'title', weight=0.5, scorer=fuzz.token_sort_ratio),
                MatchConfig('team_name', 'team', weight=0.3)
            ],
            score_threshold=70.0
        )
        
        results = matcher.match(source_df, target_df, return_top_n=1)
    """
    
    def __init__(
        self,
        match_configs: List[MatchConfig],
        score_threshold: float = 60.0,
        combine_method: str = 'weighted',  # 'weighted', 'average', 'max', 'min'
    ):
        """
        Initialize the FuzzyMatcher
        
        Args:
            match_configs: List of MatchConfig objects defining how to match fields
            score_threshold: Minimum combined score (0-100) to consider a match
            combine_method: How to combine individual field scores
        """
        self.match_configs = match_configs
        self.score_threshold = score_threshold
        self.combine_method = combine_method
        
        # Validate weights sum to 1.0 if using weighted method
        if combine_method == 'weighted':
            total_weight = sum(config.weight for config in match_configs)
            if abs(total_weight - 1.0) > 0.01:
                print(f"⚠️ Warning: Weights sum to {total_weight}, normalizing to 1.0")
                for config in match_configs:
                    config.weight = config.weight / total_weight
    
    def _calculate_field_score(
        self, 
        source_val: str, 
        target_val: str, 
        config: MatchConfig
    ) -> float:
        """Calculate similarity score for a single field pair"""
        if pd.isna(source_val) or pd.isna(target_val):
            return 0.0
        
        source_str = str(source_val).lower().strip()
        target_str = str(target_val).lower().strip()
        
        if not source_str or not target_str:
            return 0.0
        
        score = config.scorer(source_str, target_str)
        return score if score >= config.threshold else 0.0
    
    def _combine_scores(self, field_scores: Dict[str, float]) -> float:
        """Combine multiple field scores into a single match score"""
        if not field_scores:
            return 0.0
        
        if self.combine_method == 'weighted':
            combined = sum(
                field_scores.get(config.source_field, 0.0) * config.weight 
                for config in self.match_configs
            )
        elif self.combine_method == 'average':
            combined = sum(field_scores.values()) / len(field_scores)
        elif self.combine_method == 'max':
            combined = max(field_scores.values())
        elif self.combine_method == 'min':
            combined = min(field_scores.values())
        else:
            raise ValueError(f"Unknown combine_method: {self.combine_method}")
        
        return combined
    
    def match_single(
        self, 
        source_record: Dict, 
        target_df: pd.DataFrame,
        return_top_n: int = 1
    ) -> List[Dict]:
        """
        Match a single source record against all target records
        
        Args:
            source_record: Dictionary with source record data
            target_df: DataFrame with target records
            return_top_n: Number of top matches to return
            
        Returns:
            List of match dictionaries with scores and matched data
        """
        matches = []
        
        for idx, target_row in target_df.iterrows():
            field_scores = {}
            
            # Calculate score for each configured field
            for config in self.match_configs:
                source_val = source_record.get(config.source_field)
                target_val = target_row.get(config.target_field)
                
                field_scores[config.source_field] = self._calculate_field_score(
                    source_val, target_val, config
                )
            
            # Combine individual field scores
            combined_score = self._combine_scores(field_scores)
            
            if combined_score >= self.score_threshold:
                match = {
                    'target_index': idx,
                    'match_score': round(combined_score, 2),
                    'field_scores': {k: round(v, 2) for k, v in field_scores.items()},
                    'confidence': self._get_confidence_level(combined_score),
                    'target_data': target_row.to_dict()
                }
                matches.append(match)
        
        # Sort by score and return top N
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:return_top_n]
    
    def match(
        self, 
        source_df: pd.DataFrame, 
        target_df: pd.DataFrame,
        return_top_n: int = 1,
        source_id_field: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Match all records from source to target DataFrame
        
        Args:
            source_df: DataFrame with source records
            target_df: DataFrame with target records
            return_top_n: Number of top matches to return per source record
            source_id_field: Optional field name to use as identifier in results
            
        Returns:
            DataFrame with match results
        """
        results = []
        
        for idx, source_row in source_df.iterrows():
            source_record = source_row.to_dict()
            matches = self.match_single(source_record, target_df, return_top_n)
            
            for rank, match in enumerate(matches, 1):
                result = {
                    'source_index': idx,
                    'match_rank': rank,
                    'match_score': match['match_score'],
                    'confidence': match['confidence'],
                }
                
                # Add source ID if provided
                if source_id_field and source_id_field in source_record:
                    result['source_id'] = source_record[source_id_field]
                
                # Add all source fields with 'source_' prefix
                for key, val in source_record.items():
                    result[f'source_{key}'] = val
                
                # Add field scores
                for field, score in match['field_scores'].items():
                    result[f'{field}_score'] = score
                
                # Add matched target fields with 'matched_' prefix
                for key, val in match['target_data'].items():
                    result[f'matched_{key}'] = val
                
                results.append(result)
        
        return pd.DataFrame(results)
    
    def _get_confidence_level(self, score: float) -> str:
        """Convert numeric score to confidence level"""
        if score >= 90:
            return 'Very High'
        elif score >= 80:
            return 'High'
        elif score >= 70:
            return 'Medium'
        elif score >= 60:
            return 'Low'
        else:
            return 'Very Low'
    
    def quick_match(
        self,
        source_values: List[str],
        target_values: List[str],
        limit: int = 5,
        scorer: Callable = fuzz.token_sort_ratio
    ) -> Dict[str, List[Tuple[str, float]]]:
        """
        Quick fuzzy match for simple string lists (no DataFrames needed)
        
        Args:
            source_values: List of strings to match
            target_values: List of strings to match against
            limit: Max number of matches per source value
            scorer: Scoring function to use
            
        Returns:
            Dictionary mapping each source value to list of (match, score) tuples
        """
        results = {}
        
        for source_val in source_values:
            matches = process.extract(
                source_val, 
                target_values, 
                scorer=scorer, 
                limit=limit
            )
            results[source_val] = [(match[0], round(match[1], 2)) for match in matches]
        
        return results
