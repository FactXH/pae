#!/usr/bin/env python3
"""
001 - Airtable Client Test (No Django)

Simple test of the AirtableClient utility without Django dependencies.
This tests:
- Import functionality
- Environment variable loading from .env
- Token reading and validation
- Basic client functionality

Prerequisites:
1. Create a .env file in the PAE project root with: tair_ak=your_airtable_token
2. Install python-dotenv: pip install python-dotenv

This example runs independently of Django and focuses purely on the utils functionality.
"""

import os
import sys

# Set up path to include PAE root for utils import
current_dir = os.path.dirname(os.path.abspath(__file__))
pae_root_dir = os.path.dirname(current_dir)  # Go up one level to PAE root

if pae_root_dir not in sys.path:
    sys.path.insert(0, pae_root_dir)

print(f"🔧 PAE Root Directory: {pae_root_dir}")
print(f"🔧 Current Directory: {current_dir}")

def test_airtable_client_import():
    """Test importing the AirtableClient"""
    
    print("\n📦 Testing AirtableClient Import")
    print("=" * 40)
    
    try:
        from utils.airtable.airtable_client import AirtableClient
        print("✅ Successfully imported AirtableClient")
        return AirtableClient, True
    except ImportError as e:
        print(f"❌ Failed to import AirtableClient: {e}")
        return None, False
    except Exception as e:
        print(f"❌ Unexpected error importing AirtableClient: {e}")
        return None, False

def test_client_instantiation(AirtableClient):
    """Test creating an AirtableClient instance"""
    
    print("\n🔧 Testing Client Instantiation")
    print("=" * 40)
    
    try:
        print("📝 Creating AirtableClient instance...")
        client = AirtableClient()
        
        print(f"✅ Client created successfully")
        print(f"   Client representation: {client}")
        print(f"   Is configured: {client.is_configured}")
        
        return client, True
        
    except Exception as e:
        print(f"❌ Failed to create client: {e}")
        import traceback
        traceback.print_exc()
        return None, False

def test_client_functionality(client):
    """Test basic client functionality"""
    
    print("\n⚙️ Testing Client Functionality")
    print("=" * 40)
    
    if not client:
        print("❌ No client to test")
        return False
    
    # Test configuration status
    print(f"📊 Configuration Status:")
    print(f"   Is configured: {client.is_configured}")
    
    if client.is_configured:
        print(f"   ✅ Client has valid token")
        
        # Test headers generation
        try:
            headers = client.get_headers()
            print(f"   🔑 Headers generated successfully")
            print(f"       Content-Type: {headers.get('Content-Type')}")
            print(f"       Authorization: Bearer ***[MASKED]***")
            return True
            
        except Exception as e:
            print(f"   ❌ Error generating headers: {e}")
            return False
    else:
        print(f"   ⚠️  Client not configured (no valid token)")
        print(f"   💡 Make sure you have a .env file with: tair_ak=your_token")
        return False

def test_url_parsing(client):
    """Test URL parsing functionality"""
    
    print("\n🔗 Testing URL Parsing")
    print("=" * 30)
    
    test_url = "https://airtable.com/app82aWzFKUVNZa3m/tbl8oOJfPgxSFmwq7/viwTZa7kZyDbkYXH5?blocks=hide"
    
    try:
        parsed = client.parse_airtable_url(test_url)
        print(f"📋 Input URL: {test_url}")
        print(f"✅ Parsed successfully:")
        print(f"   Base ID: {parsed['base_id']}")
        print(f"   Table ID: {parsed['table_id']}")
        print(f"   View ID: {parsed['view_id']}")
        
        if parsed['view_id']:
            print(f"   🎯 Specific view will be filtered in API calls")
        else:
            print(f"   📋 All records from table will be retrieved")
            
        return parsed
        
    except Exception as e:
        print(f"❌ URL parsing failed: {e}")
        return None

def test_table_dataframe_retrieval(client):
    """Test retrieving data from Airtable table as pandas DataFrame"""
    
    print("\n📊 Testing Table DataFrame Retrieval")
    print("=" * 45)
    
    # The URL from your example with specific view
    airtable_url = "https://airtable.com/app82aWzFKUVNZa3m/tbl8oOJfPgxSFmwq7/viwTZa7kZyDbkYXH5?blocks=hide"
    airtable_url = "https://airtable.com/app82aWzFKUVNZa3m/tbl8oOJfPgxSFmwq7/viwTZa7kZyDbkYXH5?blocks=hide"

    if not client.is_configured:
        print("⚠️  Client not configured - skipping actual API call")
        print("   Set up .env file with tair_ak=your_token to test API calls")
        return None
    
    try:
        print(f"🔧 Attempting to fetch data as DataFrame from:")
        print(f"   {airtable_url}")
        
        # Check if URL contains view ID
        parsed_url = client.parse_airtable_url(airtable_url)
        if parsed_url.get('view_id'):
            print(f"   🎯 Filtering to specific view: {parsed_url['view_id']}")
        else:
            print(f"   📋 Retrieving all records from table")
        
        # Test with maxRecords to get all records (remove limit for full data)
        df = client.get_table_dataframe_from_url(airtable_url)
        
        print(f"✅ DataFrame created successfully!")
        print(f"📈 Records found: {len(df)}")
        print(f"📝 Columns found: {len(df.columns)}")
        
        if not df.empty:
            print(f"\n📋 DataFrame Info:")
            print(f"   Shape: {df.shape} (rows × columns)")
            print(f"   Columns: {list(df.columns)}")
            
            # Show DataFrame details
            print(f"\n📊 DataFrame Preview:")
            print("=" * 60)
            
            # Display the full DataFrame with better formatting
            try:
                import pandas as pd
                
                # Set pandas display options for better output
                pd.set_option('display.max_columns', None)
                pd.set_option('display.width', None)
                pd.set_option('display.max_colwidth', 50)
                
                # Show all records
                print(df.to_string(index=True))
                
                # Show data types
                print(f"\n📝 Column Data Types:")
                print("=" * 30)
                for col in df.columns:
                    dtype = df[col].dtype
                    non_null_count = df[col].notna().sum()
                    print(f"   {col}: {dtype} ({non_null_count}/{len(df)} non-null)")
                
            except ImportError:
                print("   (pandas not available for detailed formatting)")
                print(df)
                
        else:
            print("   📭 No records found in table")
            
        return df
        
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return None
    except Exception as e:
        print(f"❌ API request failed: {e}")
        print("   This might be due to:")
        print("   - Invalid token")
        print("   - Network connectivity issues")  
        print("   - Airtable API rate limits")
        print("   - Base/table permissions")
        print("   - pandas library not available")
        return None

def analyze_dataframe(df):
    """Analyze the structure of retrieved Airtable DataFrame"""
    
    print("\n📋 DataFrame Analysis")
    print("=" * 30)
    
    if df is None or df.empty:
        print("⚠️  No DataFrame data available for analysis")
        return
    
    print(f"📊 Analysis Results:")
    print(f"   Total records: {len(df)}")
    print(f"   Total columns: {len(df.columns)}")
    
    # Show basic statistics
    print(f"\n📈 Data Summary:")
    try:
        # Memory usage
        memory_usage = df.memory_usage(deep=True).sum()
        print(f"   Memory usage: {memory_usage / 1024:.1f} KB")
        
        # Column info
        print(f"\n📝 Column Details:")
        for col in df.columns:
            dtype = df[col].dtype
            non_null = df[col].notna().sum()
            null_count = df[col].isna().sum()
            unique_count = df[col].nunique()
            
            print(f"   {col}:")
            print(f"     Type: {dtype}")
            print(f"     Non-null: {non_null}/{len(df)} ({non_null/len(df)*100:.1f}%)")
            if null_count > 0:
                print(f"     Null: {null_count}")
            print(f"     Unique values: {unique_count}")
            
            # Show sample values for non-ID columns (handle complex data types)
            if col not in ['airtable_id', 'created_time']:
                try:
                    # Handle list/array columns differently
                    non_null_series = df[col].dropna()
                    if len(non_null_series) > 0:
                        # Check if column contains lists/complex objects
                        first_val = non_null_series.iloc[0]
                        if isinstance(first_val, (list, dict)):
                            # For complex types, show types and counts
                            list_count = non_null_series.apply(lambda x: isinstance(x, list)).sum()
                            dict_count = non_null_series.apply(lambda x: isinstance(x, dict)).sum()
                            if list_count > 0:
                                print(f"     Contains lists: {list_count} records")
                                # Show first list as example
                                first_list = non_null_series[non_null_series.apply(lambda x: isinstance(x, list))].iloc[0]
                                if len(first_list) > 0:
                                    print(f"     Example list: {str(first_list[:2])}{'...' if len(first_list) > 2 else ''}")
                            if dict_count > 0:
                                print(f"     Contains objects: {dict_count} records")
                        else:
                            # For simple types, show unique values
                            unique_values = non_null_series.unique()[:3]
                            sample_str = ', '.join([str(v)[:30] + ('...' if len(str(v)) > 30 else '') for v in unique_values])
                            print(f"     Sample values: {sample_str}")
                except Exception as e:
                    print(f"     ⚠️  Error analyzing samples: {str(e)[:50]}")
            print()
            
    except Exception as e:
        print(f"   ⚠️  Error during analysis: {e}")
        
    # Show data quality insights
    print(f"🔍 Data Quality Insights:")
    try:
        # Check for completely empty columns
        empty_cols = [col for col in df.columns if df[col].isna().all()]
        if empty_cols:
            print(f"   ⚠️  Completely empty columns: {', '.join(empty_cols)}")
        
        # Check for duplicate records (based on simple non-metadata columns only)
        data_cols = []
        for col in df.columns:
            if col not in ['airtable_id', 'created_time']:
                # Only include columns with simple data types for duplicate checking
                try:
                    # Test if column can be used for duplicate checking
                    if len(df[col].dropna()) > 0:
                        first_val = df[col].dropna().iloc[0]
                        if not isinstance(first_val, (list, dict)):
                            data_cols.append(col)
                except:
                    pass  # Skip problematic columns
        
        if data_cols:
            try:
                duplicates = df.duplicated(subset=data_cols).sum()
                if duplicates > 0:
                    print(f"   ⚠️  Duplicate records found: {duplicates} (based on simple fields)")
                else:
                    print(f"   ✅ No duplicate records (based on simple fields)")
                print(f"   📝 Checked {len(data_cols)} columns for duplicates")
            except Exception as e:
                print(f"   ⚠️  Could not check duplicates: {str(e)[:50]}")
        else:
            print(f"   ⚠️  No simple columns available for duplicate checking")
        
        print(f"   ✅ DataFrame ready for analysis!")
        
    except Exception as e:
        print(f"   ⚠️  Error checking data quality: {e}")

def show_environment_info():
    """Show information about the environment setup"""
    
    print("\n🌍 Environment Information")
    print("=" * 40)
    
    # Check for .env file
    env_file_path = os.path.join(pae_root_dir, '.env')
    env_exists = os.path.exists(env_file_path)
    
    print(f"📁 Environment File Status:")
    print(f"   Expected location: {env_file_path}")
    print(f"   File exists: {'✅ Yes' if env_exists else '❌ No'}")
    
    # Check for tair_ak environment variable
    tair_ak = os.getenv('tair_ak')
    print(f"\n🔑 Token Status:")
    if tair_ak:
        masked_token = tair_ak[:8] + '*' * (len(tair_ak) - 12) + tair_ak[-4:] if len(tair_ak) > 12 else '*' * len(tair_ak)
        print(f"   tair_ak: {masked_token}")
        print(f"   Status: ✅ Found")
    else:
        print(f"   tair_ak: ❌ Not found")
        print(f"   Status: ❌ Missing")
    
    # Check for python-dotenv
    try:
        import dotenv
        print(f"\n📦 Dependencies:")
        print(f"   python-dotenv: ✅ Available")
    except ImportError:
        print(f"\n📦 Dependencies:")
        print(f"   python-dotenv: ❌ Missing")
        print(f"   Install with: pip install python-dotenv")

def main():
    """Main test execution"""
    
    print("🚀 PAE Utils - Airtable Client Test")
    print("=" * 60)
    print("Testing AirtableClient utility without Django dependencies.\n")
    
    # Show environment info first
    show_environment_info()
    
    # Test import
    AirtableClient, import_success = test_airtable_client_import()
    
    if not import_success:
        print("\n❌ Cannot proceed without successful import")
        return
    
    # Test instantiation
    client, instantiation_success = test_client_instantiation(AirtableClient)
    
    if not instantiation_success:
        print("\n❌ Cannot proceed without successful instantiation")
        return
    
    # Test basic functionality
    functionality_success = test_client_functionality(client)
    
    # Test URL parsing (works regardless of token)
    parsed_url = test_url_parsing(client)
    url_parsing_success = parsed_url is not None
    
    # Test API calls (only if configured)
    api_success = False
    dataframe = None
    if client.is_configured:
        dataframe = test_table_dataframe_retrieval(client)
        api_success = dataframe is not None and not dataframe.empty
        
        # Analyze data if we got it
        if dataframe is not None:
            analyze_dataframe(dataframe)
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 Test Summary:")
    print(f"   Import: {'✅ Pass' if import_success else '❌ Fail'}")
    print(f"   Instantiation: {'✅ Pass' if instantiation_success else '❌ Fail'}")
    print(f"   Basic functionality: {'✅ Pass' if functionality_success else '❌ Partial'}")
    print(f"   URL parsing: {'✅ Pass' if url_parsing_success else '❌ Fail'}")
    
    if client and client.is_configured:
        print(f"   DataFrame retrieval: {'✅ Pass' if api_success else '❌ Fail'}")
        print(f"   DataFrame analysis: {'✅ Pass' if dataframe is not None and not dataframe.empty else '❌ Skip'}")
    else:
        print(f"   DataFrame retrieval: ⚪ Skipped (no token)")
        print(f"   DataFrame analysis: ⚪ Skipped (no data)")
    
    if import_success and instantiation_success:
        print("\n🎉 AirtableClient test completed!")
        
        if functionality_success and url_parsing_success:
            if client.is_configured and api_success:
                print("   ✅ All functionality tested successfully")
                print("   🚀 Client is ready for DataFrame-based data analysis")
                print("   📊 Airtable data successfully converted to pandas DataFrame")
            elif client.is_configured:
                print("   ⚠️  Client configured but DataFrame retrieval failed")
                print("   💡 Check token permissions and network connectivity")
            else:
                print("   ⚠️  Client working but needs configuration")
                print("   📝 Next steps:")
                print("     1. Create .env file in PAE root")
                print("     2. Add: tair_ak=your_airtable_api_token")
                print("     3. Install pandas: pip install pandas")
                print("     4. Run this test again for full DataFrame testing")
        else:
            print("   ⚠️  Some basic functionality failed")
    else:
        print("\n❌ Test failed - check error messages above")

if __name__ == '__main__':
    main()
