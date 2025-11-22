"""
Simple fuzzy matcher - V2
No configs, just straightforward matching with market and level awareness
"""
import pandas as pd
from rapidfuzz import fuzz


class SimpleMatcher:
    """Dead simple fuzzy matcher with market/level awareness"""
    
    def __init__(self, min_score=50):
        self.min_score = min_score
    
    def match(self, positions_df, postings_df, top_n=3):
        """
        Match positions to postings based on:
        - searchable_text (role + market + seniority)
        - market penalty if mismatched
        
        Args:
            positions_df: DataFrame with columns [hiring_process_role, market, seniority]
            postings_df: DataFrame with columns [job_posting_id, title, team_name]
            top_n: Number of top matches to return per position
            
        Returns:
            DataFrame with matched results
        """
        results = []
        
        # Prepare postings searchable text
        postings_df = postings_df.copy()
        postings_df['searchable'] = (
            postings_df['title'].fillna('').str.lower() + ' ' + 
            postings_df['team_name'].fillna('').str.lower()
        )
        
        # Process each position
        for idx, pos in positions_df.iterrows():
            pos_market = str(pos.get('market', '')).lower().strip()
            
            # Create position searchable text
            # Exclude market if it's "general" since it never appears in job posting titles
            market_text = '' if pos_market == 'general' else pos_market
            
            pos_text = (
                str(pos.get('hiring_process_role', '')).lower() + ' ' +
                market_text + ' ' +
                str(pos.get('seniority', '')).lower()
            ).strip()
            
            position_matches = []
            
            # Score each posting
            for _, posting in postings_df.iterrows():
                posting_text = posting['searchable']
                
                # Basic text similarity
                text_score = fuzz.token_sort_ratio(pos_text, posting_text)
                
                # Market check (skip if market is "general")
                market_score = 0
                if pos_market and pos_market != 'general':
                    market_score = fuzz.partial_ratio(pos_market, posting_text)
                
                # Apply market penalty if market doesn't match well
                # But skip penalty logic if market is "general"
                if pos_market and pos_market != 'general' and market_score < 30:
                    # Heavy penalty for market mismatch
                    final_score = text_score * 0.3
                else:
                    # Boost score if market matches (or if market is general)
                    if pos_market == 'general':
                        final_score = text_score  # Just use text score for general market
                    else:
                        final_score = text_score * 0.6 + market_score * 0.4
                
                # Team similarity boost
                team_similarity = 0
                if pos.get('specific_team') and posting.get('team_name'):
                    team_similarity = fuzz.token_set_ratio(str(pos.get('specific_team')).lower(), str(posting.get('team_name')).lower())
                    # If teams match well, boost the score
                    if team_similarity >= 70:
                        final_score += 10  # Add a bonus for strong team match

                if final_score >= self.min_score:
                    position_matches.append({
                        # Position fields
                        'hiring_process_role': pos.get('hiring_process_role'),
                        'market': pos.get('market'),
                        'seniority': pos.get('seniority'),
                        'team': pos.get('team'),
                        'specific_team': pos.get('specific_team'),
                        'talent_specialist': pos.get('talent_specialist') or pos.get('hiring_process_talent_specialist'),
                        'opened_date': pos.get('opened_date'),
                        'position_id': pos.get('position_id'),
                        # Posting fields
                        'job_posting_id': posting['job_posting_id'],
                        'title': posting['title'],
                        'team_name': posting['team_name'],
                        # Scores
                        'text_score': round(text_score, 2),
                        'market_score': round(market_score, 2),
                        'team_similarity': round(team_similarity, 2),
                        'final_score': round(final_score, 2),
                    })
            # If no matches found for this position, add it with empty match fields
            if not position_matches:
                results.append({
                    # Position fields
                    'hiring_process_role': pos.get('hiring_process_role'),
                    'market': pos.get('market'),
                    'seniority': pos.get('seniority'),
                    'team': pos.get('team'),
                    'specific_team': pos.get('specific_team'),
                    'talent_specialist': pos.get('talent_specialist') or pos.get('hiring_process_talent_specialist'),
                    'opened_date': pos.get('opened_date'),
                    'position_id': pos.get('position_id'),
                    # Empty posting fields
                    'job_posting_id': None,
                    'title': None,
                    'team_name': None,
                    # Empty scores
                    'text_score': None,
                    'market_score': None,
                    'final_score': None,
                })
            else:
                # Add top N matches for this position
                position_matches.sort(key=lambda x: x['final_score'], reverse=True)
                results.extend(position_matches[:top_n])
        
        # Convert to DataFrame
        if not results:
            return pd.DataFrame()
        
        results_df = pd.DataFrame(results)
        
        # Add confidence level (only for rows with matches)
        results_df['confidence'] = results_df['final_score'].apply(
            lambda x: self._get_confidence(x) if pd.notna(x) else 'No Match'
        )
        
        return results_df.reset_index(drop=True)
    
    def _get_confidence(self, score):
        """Convert score to confidence level"""
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
