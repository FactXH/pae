# Fuzzy Matcher Utility

A powerful and flexible fuzzy string matching utility for matching records between datasets using configurable field mappings and scoring algorithms.

## Features

- 🎯 **Multiple scoring algorithms** from rapidfuzz (token_sort_ratio, token_set_ratio, partial_ratio, etc.)
- ⚖️ **Weighted matching** across multiple fields
- 🔧 **Configurable thresholds** per field and overall
- 📊 **Confidence levels** (Very High, High, Medium, Low, Very Low)
- 🚀 **Integration with QueryRunner** for direct SQL-to-SQL fuzzy matching
- 💨 **Quick match mode** for simple string lists

## Installation

```bash
pip install rapidfuzz
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

## Quick Start

### 1. Direct SQL Query Matching (Easiest)

```python
from utils.query_runner.query_runner import QueryRunner
from utils.data_matcher.matcher import MatchConfig
from rapidfuzz import fuzz

qr = QueryRunner()

matches = qr.run_fuzzy_match(
    source_query="SELECT name, team FROM positions",
    target_query="SELECT title, department FROM postings",
    match_configs=[
        MatchConfig('name', 'title', weight=0.7),
        MatchConfig('team', 'department', weight=0.3),
    ],
    score_threshold=60.0,
    return_top_n=3
)
```

### 2. DataFrame Matching

```python
from utils.data_matcher.matcher import FuzzyMatcher, MatchConfig
from rapidfuzz import fuzz
import pandas as pd

# Your DataFrames
source_df = pd.DataFrame([...])
target_df = pd.DataFrame([...])

# Configure matcher
matcher = FuzzyMatcher(
    match_configs=[
        MatchConfig(
            source_field='job_title',
            target_field='posting_title',
            weight=0.6,
            scorer=fuzz.token_sort_ratio,
            threshold=30.0  # Field-level minimum
        ),
        MatchConfig(
            source_field='team',
            target_field='department',
            weight=0.4,
            scorer=fuzz.token_set_ratio
        ),
    ],
    score_threshold=60.0,  # Overall minimum
    combine_method='weighted'
)

# Match
results = matcher.match(source_df, target_df, return_top_n=3)
```

### 3. Quick String Matching

```python
from utils.data_matcher.matcher import FuzzyMatcher
from rapidfuzz import fuzz

matcher = FuzzyMatcher(match_configs=[], score_threshold=60.0)

results = matcher.quick_match(
    source_values=["Software Engineer", "Product Manager"],
    target_values=["Sr. Software Developer", "Product Manager - Growth"],
    limit=3,
    scorer=fuzz.token_sort_ratio
)
```

## Configuration

### MatchConfig

```python
MatchConfig(
    source_field='field_name_in_source',    # Required
    target_field='field_name_in_target',    # Required
    weight=0.5,                              # 0.0 to 1.0, weights should sum to 1.0
    scorer=fuzz.token_sort_ratio,            # Scoring algorithm
    threshold=0.0                            # Minimum score for this field (0-100)
)
```

### Available Scorers (from rapidfuzz.fuzz)

- `fuzz.ratio` - Simple Levenshtein distance (exact matching)
- `fuzz.partial_ratio` - Best partial match
- `fuzz.token_sort_ratio` - Sorted token matching (best for reordered words)
- `fuzz.token_set_ratio` - Set-based token matching (best for different word counts)
- `fuzz.partial_token_sort_ratio` - Combination of partial and token sort
- `fuzz.partial_token_set_ratio` - Combination of partial and token set

### Combine Methods

- `'weighted'` - Weighted average of field scores (default)
- `'average'` - Simple average of all field scores
- `'max'` - Take maximum field score
- `'min'` - Take minimum field score

## Real-World Example: Job Matching

See `main.py` for complete example matching hiring positions to job postings:

```python
from utils.data_matcher.main import match_job_positions_to_postings

# Matches positions to postings from database
matches_df = match_job_positions_to_postings()

# Results include:
# - source_* fields (original position data)
# - matched_* fields (matched posting data)
# - match_score (0-100)
# - confidence (Very High/High/Medium/Low/Very Low)
# - field_scores (individual scores per field)
```

## Output Columns

The matcher returns a DataFrame with:

- `source_index` - Original source row index
- `match_rank` - Rank of this match (1 = best)
- `match_score` - Overall match score (0-100)
- `confidence` - Confidence level string
- `source_*` - All fields from source record
- `matched_*` - All fields from matched target record
- `{field}_score` - Individual score for each configured field

## Examples

Run the examples file to see all use cases:

```bash
python utils/data_matcher/example_usage.py
```

Examples include:
1. Direct QueryRunner integration
2. Manual DataFrame matching
3. Quick string matching
4. Custom scoring algorithms

## Integration with QueryRunner

The `QueryRunner` class has a built-in `run_fuzzy_match()` method:

```python
from utils.query_runner.query_runner import QueryRunner

qr = QueryRunner()

# Fuzzy match between any two SQL queries
matches = qr.run_fuzzy_match(
    source_query="SELECT * FROM table1",
    target_query="SELECT * FROM table2",
    match_configs=[...],
    source='postgres',  # or 'athena'
    score_threshold=60.0,
    return_top_n=3
)
```

## Tips for Best Results

1. **Field Weights**: Give more weight to fields that are most distinctive
   - Job titles: 50-70% weight
   - Team/Department: 20-30% weight
   - Other fields: Split remaining weight

2. **Scoring Algorithm Selection**:
   - Use `token_sort_ratio` when word order doesn't matter
   - Use `token_set_ratio` when words can be missing/added
   - Use `partial_ratio` for substring matching
   - Use `ratio` for exact matching with typos

3. **Thresholds**:
   - Overall threshold: 60-70 for good matches
   - Field thresholds: 30-40 to allow some flexibility
   - Adjust based on your data quality

4. **Performance**:
   - Fuzzy matching is O(n*m) where n=source rows, m=target rows
   - For large datasets, pre-filter with exact matches first
   - Use `return_top_n` to limit results per source record

## License

Internal use only.
