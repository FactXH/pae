# PAE Utils Examples

This folder contains examples and tests for PAE utilities **without Django dependencies**. These examples focus on testing individual utils components in isolation.

## Purpose

- 🧪 **Test utils functionality** independently of Django
- 📚 **Demonstrate usage** of PAE utility classes
- 🔧 **Quick validation** of environment setup
- 🚀 **Simple execution** without complex Django setup

## Structure

```
examples/
├── __init__.py                    # Package initialization
├── README.md                      # This file
├── 001_airtable_client_test.py    # AirtableClient basic functionality test
└── [future examples...]          # Additional utils tests
```

## Usage

### Running Examples

From the PAE root directory:

```bash
# Run specific example
python3 examples/001_airtable_client_test.py

# Or from examples directory
cd examples
python3 001_airtable_client_test.py
```

### Prerequisites

- Python 3.x
- Required packages: `pip install python-dotenv`
- `.env` file in PAE root with appropriate tokens

## Available Examples

### 001 - Airtable Client Test
- **File**: `001_airtable_client_test.py`
- **Purpose**: Comprehensive AirtableClient testing with pandas DataFrame support
- **Requirements**: `.env` file with `tair_ak=your_token`, `requests` library, `pandas` library
- **Features**:
  - ✅ Import testing
  - ✅ Environment variable loading
  - ✅ Token validation
  - ✅ Headers generation
  - ✅ URL parsing (extract base_id and table_id)
  - ✅ **DataFrame retrieval** - Airtable data as pandas DataFrame
  - ✅ **Full records display** - All records printed as formatted DataFrame
  - ✅ **Data analysis** - Column types, null values, data quality insights
  - ✅ **Memory usage tracking** - DataFrame size and optimization info
  - ✅ Detailed error reporting
  - ✅ Production readiness validation

## Comparison with Django Examples

| Feature | PAE Examples | Django Examples |
|---------|--------------|-----------------|
| **Location** | `pae/examples/` | `xapt/engagement/examples/` |
| **Dependencies** | Utils only | Django + Models |
| **Setup** | Minimal path setup | Full Django setup |
| **Focus** | Utils testing | Model integration |
| **Execution** | Direct Python | Django environment |

## Next Steps

Future examples might include:
- Query runner tests
- Data loader demonstrations
- DBT runner validation
- Other PAE utils testing

## Environment Setup

Create a `.env` file in the PAE root directory:

```bash
# PAE Root: /home/xavier/Documents/PAE/Projectes/pae/.env
tair_ak=your_airtable_api_token_here
```

This allows examples to test environment variable loading and token validation.
