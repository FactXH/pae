-- This model uses PostgreSQL's pg_trgm extension for fuzzy string matching
-- to match job positions with job postings based on similarity scores

{{ config(
    pre_hook="CREATE EXTENSION IF NOT EXISTS pg_trgm;"
) }}

with dim_job_posting as (
    select 
        job_posting_id,
        team_name,
        title,
        -- Create a searchable text that includes title + common market keywords from title
        lower(title || ' ' || coalesce(team_name, '')) as searchable_text
    from {{ ref("dim_job_posting") }}
),

job_positions as (
    select 
        hiring_process_role,
        seniority,
        team,
        specific_team,
        market,
        row_number() over () as position_row_id  -- unique identifier for each position
    from {{ ref("br_file_hiring_processes") }}
),

-- Cross join to compare each position with each job posting
position_posting_candidates as (
    select
        jp.position_row_id,
        jp.hiring_process_role,
        jp.seniority,
        jp.team,
        jp.specific_team,
        jp.market,
        djp.job_posting_id,
        djp.team_name,
        djp.title,
        
        -- Calculate similarity scores for different fields
        -- similarity() returns a value between 0 and 1 (0 = no match, 1 = perfect match)
        coalesce(similarity(lower(jp.hiring_process_role), lower(djp.title)), 0) as role_title_similarity,
        coalesce(similarity(lower(jp.team), lower(djp.team_name)), 0) as team_similarity,
        coalesce(similarity(lower(jp.specific_team), lower(djp.team_name)), 0) as specific_team_similarity,
        -- Market matching - CRITICAL to avoid mismatches like Spanish vs LATAM or French vs Italian
        -- Match market against the full searchable text (title + team)
        coalesce(similarity(lower(jp.market), djp.searchable_text), 0) as market_similarity,
        
        -- Create concatenated strings for overall matching (including market)
        lower(coalesce(jp.hiring_process_role, '') || ' ' || coalesce(jp.seniority, '') || ' ' || coalesce(jp.team, '') || ' ' || coalesce(jp.market, '')) as position_combined,
        lower(coalesce(djp.title, '') || ' ' || coalesce(djp.team_name, '')) as posting_combined
        
    from job_positions jp
    cross join dim_job_posting djp
),

-- Calculate combined similarity first
combined_similarity_calc as (
    select
        *,
        similarity(position_combined, posting_combined) as combined_similarity
    from position_posting_candidates
),

-- Calculate weighted similarity score with market penalty
scored_matches as (
    select
        *,
        -- Base weighted score
        (role_title_similarity * 0.3 +  -- 30% weight on role/title match
         greatest(team_similarity, specific_team_similarity) * 0.2 +  -- 20% weight on team match
         combined_similarity * 0.1  -- 10% weight on combined string match
        ) as base_score,
        
        -- Market score with strong penalty if market doesn't match
        -- If market_similarity < 0.3, apply heavy penalty (multiply base score by 0.3)
        -- If market_similarity >= 0.3, add it with 40% weight
        case 
            when market_similarity < 0.3 then 
                -- Heavy penalty for market mismatch
                (role_title_similarity * 0.3 + 
                 greatest(team_similarity, specific_team_similarity) * 0.2 + 
                 combined_similarity * 0.1) * 0.3
            else
                -- Normal weighted score with market bonus
                (role_title_similarity * 0.3 + 
                 market_similarity * 0.4 +  -- 40% weight on market when it matches!
                 greatest(team_similarity, specific_team_similarity) * 0.2 + 
                 combined_similarity * 0.1)
        end as weighted_score
        
    from combined_similarity_calc
),

-- Rank matches for each position
ranked_matches as (
    select
        *,
        row_number() over (
            partition by position_row_id 
            order by weighted_score desc, market_similarity desc, role_title_similarity desc
        ) as match_rank
    from scored_matches
)

-- Return best match for each position
select
    position_row_id,
    hiring_process_role,
    seniority,
    team,
    specific_team,
    market,
    job_posting_id as matched_job_posting_id,
    title as matched_job_title,
    team_name as matched_team_name,
    weighted_score as match_score,
    base_score,
    role_title_similarity,
    team_similarity,
    specific_team_similarity,
    market_similarity,
    combined_similarity,
    case 
        when weighted_score >= 0.7 then 'High Confidence'
        when weighted_score >= 0.4 then 'Medium Confidence'
        when weighted_score >= 0.2 then 'Low Confidence'
        else 'Very Low Confidence'
    end as match_confidence
from ranked_matches
where match_rank = 1  -- Only keep the best match for each position
order by weighted_score desc

