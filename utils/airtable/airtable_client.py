"""
Simple Airtable Client

A basic client for interacting with Airtable API.
Reads authentication token from environment variables.
"""

import os
import re
from typing import Optional, Dict, Any, Union

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False
    print("Warning: python-dotenv not available. Install with: pip install python-dotenv")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("Warning: requests library not available. Install with: pip install requests")

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas library not available. Install with: pip install pandas")


class AirtableClient:
    """
    Simple Airtable API client
    
    Reads the Airtable API token from environment variables.
    The token should be stored under the key 'tair_ak' in your .env file.
    
    Usage:
        client = AirtableClient()
        print(f"Token loaded: {client.token is not None}")
    """
    
    def __init__(self, env_file_path: Optional[str] = None):
        """
        Initialize the Airtable client
        
        Args:
            env_file_path: Optional path to .env file. If not provided, 
                          will look for .env in current directory and parent directories
        """
        self.token: Optional[str] = None
        self._load_environment(env_file_path)
        self._load_token()
    
    def _load_environment(self, env_file_path: Optional[str] = None):
        """Load environment variables from .env file"""
        
        if not DOTENV_AVAILABLE:
            print("⚠️  python-dotenv not available - reading from system environment only")
            return
        
        try:
            if env_file_path:
                # Load from specific path
                if os.path.exists(env_file_path):
                    load_dotenv(env_file_path)
                    print(f"✅ Loaded environment from: {env_file_path}")
                else:
                    print(f"⚠️  Environment file not found: {env_file_path}")
            else:
                # Load from default locations (.env in current dir or parent dirs)
                load_dotenv()
                
                # Try to find .env file for reporting
                current_dir = os.getcwd()
                env_file = os.path.join(current_dir, '.env')
                if os.path.exists(env_file):
                    print(f"✅ Loaded environment from: {env_file}")
                else:
                    # Check parent directory
                    parent_dir = os.path.dirname(current_dir)
                    parent_env_file = os.path.join(parent_dir, '.env')
                    if os.path.exists(parent_env_file):
                        print(f"✅ Loaded environment from: {parent_env_file}")
                    else:
                        print("📝 No .env file found in current or parent directory")
                        
        except Exception as e:
            print(f"❌ Error loading environment file: {e}")
    
    def _load_token(self):
        """Load the Airtable API token from environment variables"""
        
        self.token = os.getenv('tair_ak')
        
        if self.token:
            # Mask the token for security when displaying
            masked_token = self.token[:8] + '*' * (len(self.token) - 12) + self.token[-4:] if len(self.token) > 12 else '*' * len(self.token)
            print(f"✅ Airtable token loaded: {masked_token}")
        else:
            print("⚠️  Airtable token not found in environment variables")
            print("   Make sure 'tair_ak' is set in your .env file or environment")
    
    @property
    def is_configured(self) -> bool:
        """Check if the client is properly configured with a token"""
        return self.token is not None and len(self.token.strip()) > 0
    
    def get_headers(self) -> dict:
        """
        Get headers for Airtable API requests
        
        Returns:
            dict: Headers including Authorization with Bearer token
            
        Raises:
            ValueError: If token is not configured
        """
        if not self.is_configured:
            raise ValueError("Airtable token not configured. Check your .env file or environment variables.")
        
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def __str__(self) -> str:
        """String representation of the client"""
        status = "✅ Configured" if self.is_configured else "❌ Not configured"
        return f"AirtableClient({status})"
    
    def __repr__(self) -> str:
        """Detailed representation of the client"""
        return f"AirtableClient(token={'✅ Set' if self.is_configured else '❌ Missing'})"
    
    def parse_airtable_url(self, url: str) -> Dict[str, Optional[str]]:
        """
        Parse an Airtable URL to extract base_id, table_id, and view_id
        
        Args:
            url: Airtable URL (e.g., https://airtable.com/app12345/tbl67890/viw...)
            
        Returns:
            dict: Dictionary with 'base_id', 'table_id', and 'view_id' keys
            
        Example:
            url = "https://airtable.com/app82aWzFKUVNZa3m/tbl8oOJfPgxSFmwq7/viwTZa7kZyDbkYXH5"
            result = client.parse_airtable_url(url)
            # {'base_id': 'app82aWzFKUVNZa3m', 'table_id': 'tbl8oOJfPgxSFmwq7', 'view_id': 'viwTZa7kZyDbkYXH5'}
        """
        
        # Pattern to match Airtable URLs with optional view
        # https://airtable.com/{base_id}/{table_id}/{view_id}?...
        pattern = r'airtable\.com/([a-zA-Z0-9]+)/([a-zA-Z0-9]+)(?:/([a-zA-Z0-9]+))?'
        
        match = re.search(pattern, url)
        
        if match:
            base_id, table_id, view_id = match.groups()
            return {
                'base_id': base_id,
                'table_id': table_id,
                'view_id': view_id  # Will be None if not present in URL
            }
        else:
            return {
                'base_id': None,
                'table_id': None,
                'view_id': None
            }
    
    def get_table_data(self, base_id: str, table_id: str, **kwargs) -> Dict[str, Any]:
        """
        Get data from an Airtable table
        
        Args:
            base_id: Airtable base ID (e.g., 'app82aWzFKUVNZa3m')
            table_id: Airtable table ID (e.g., 'tbl8oOJfPgxSFmwq7')
            **kwargs: Additional query parameters (maxRecords, pageSize, etc.)
            
        Returns:
            dict: API response containing records and metadata
            
        Raises:
            ValueError: If client is not configured
            RuntimeError: If requests library is not available
            Exception: For API errors
        """
        
        if not self.is_configured:
            raise ValueError("Airtable client not configured. Check your .env file or environment variables.")
        
        if not REQUESTS_AVAILABLE:
            raise RuntimeError("requests library not available. Install with: pip install requests")
        
        # Build API URL
        api_url = f"https://api.airtable.com/v0/{base_id}/{table_id}"
        
        # Get headers
        headers = self.get_headers()
        
        # Make request
        try:
            response = requests.get(api_url, headers=headers, params=kwargs)
            response.raise_for_status()  # Raise exception for bad status codes
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Airtable API request failed: {str(e)}")
    
    def get_table_data_from_url(self, url: str, **kwargs) -> Dict[str, Any]:
        """
        Get data from an Airtable table using a full Airtable URL
        
        Args:
            url: Full Airtable URL (e.g., https://airtable.com/app.../tbl.../viw...)
            **kwargs: Additional query parameters (maxRecords, pageSize, etc.)
            
        Returns:
            dict: API response containing records and metadata
            
        Raises:
            ValueError: If URL cannot be parsed or client is not configured
            
        Note:
            If the URL contains a view ID, it will automatically be added to the API request
            to filter records to only that view.
        """
        
        # Parse the URL
        parsed = self.parse_airtable_url(url)
        
        if not parsed['base_id'] or not parsed['table_id']:
            raise ValueError(f"Could not parse Airtable URL: {url}")
        
        # Add view parameter if view_id is present in URL
        if parsed['view_id']:
            kwargs['view'] = parsed['view_id']
        
        return self.get_table_data(parsed['base_id'], parsed['table_id'], **kwargs)
    
    def _records_to_dataframe(self, records: list) -> 'pd.DataFrame':
        """
        Convert Airtable records to pandas DataFrame
        
        Args:
            records: List of Airtable record dictionaries
            
        Returns:
            pandas.DataFrame: Flattened DataFrame with record data
            
        Raises:
            RuntimeError: If pandas is not available
        """
        
        if not PANDAS_AVAILABLE:
            raise RuntimeError("pandas library not available. Install with: pip install pandas")
        
        if not records:
            return pd.DataFrame()
        
        # Flatten each record
        flattened_records = []
        for record in records:
            # Start with record metadata
            flat_record = {
                'airtable_id': record.get('id'),
                'created_time': record.get('createdTime')
            }
            
            # Add all fields from the 'fields' object
            fields = record.get('fields', {})
            flat_record.update(fields)
            
            flattened_records.append(flat_record)
        
        return pd.DataFrame(flattened_records)
    
    def get_table_dataframe(self, base_id: str, table_id: str, **kwargs) -> 'pd.DataFrame':
        """
        Get data from an Airtable table as a pandas DataFrame
        
        Args:
            base_id: Airtable base ID (e.g., 'app82aWzFKUVNZa3m')
            table_id: Airtable table ID (e.g., 'tbl8oOJfPgxSFmwq7')
            **kwargs: Additional query parameters (maxRecords, pageSize, etc.)
            
        Returns:
            pandas.DataFrame: Table data as DataFrame
            
        Raises:
            ValueError: If client is not configured
            RuntimeError: If pandas or requests library is not available
            Exception: For API errors
        """
        
        # Get raw data first
        data = self.get_table_data(base_id, table_id, **kwargs)
        
        # Convert to DataFrame
        records = data.get('records', [])
        return self._records_to_dataframe(records)
    
    def get_table_dataframe_from_url(self, url: str, **kwargs) -> 'pd.DataFrame':
        """
        Get data from an Airtable table as a pandas DataFrame using a full Airtable URL
        
        Args:
            url: Full Airtable URL (e.g., https://airtable.com/app.../tbl.../viw...)
            **kwargs: Additional query parameters (maxRecords, pageSize, etc.)
            
        Returns:
            pandas.DataFrame: Table data as DataFrame
            
        Raises:
            ValueError: If URL cannot be parsed or client is not configured
            RuntimeError: If pandas or requests library is not available
            
        Note:
            If the URL contains a view ID, it will automatically be added to the API request
            to filter records to only that view.
        """
        
        # Parse the URL
        parsed = self.parse_airtable_url(url)
        
        if not parsed['base_id'] or not parsed['table_id']:
            raise ValueError(f"Could not parse Airtable URL: {url}")
        
        # Add view parameter if view_id is present in URL
        if parsed['view_id']:
            kwargs['view'] = parsed['view_id']
        
        return self.get_table_dataframe(parsed['base_id'], parsed['table_id'], **kwargs)


# Example usage and testing
if __name__ == '__main__':
    print("🔧 Testing Airtable Client")
    print("=" * 40)
    
    # Test client initialization
    client = AirtableClient()
    print(f"\nClient status: {client}")
    print(f"Is configured: {client.is_configured}")
    
    if client.is_configured:
        try:
            headers = client.get_headers()
            print(f"✅ Headers generated successfully")
            print(f"   Authorization header present: {'Authorization' in headers}")
            
            # Test URL parsing
            test_url = "https://airtable.com/app82aWzFKUVNZa3m/tbl8oOJfPgxSFmwq7/viwTZa7kZyDbkYXH5"
            parsed = client.parse_airtable_url(test_url)
            print(f"\n🔗 URL parsing test:")
            print(f"   Base ID: {parsed['base_id']}")
            print(f"   Table ID: {parsed['table_id']}")
            print(f"   View ID: {parsed['view_id']}")
            
        except Exception as e:
            print(f"❌ Error testing client: {e}")
    else:
        print("❌ Client not configured - cannot generate headers")
        print("\nTo configure:")
        print("1. Create a .env file in your project root")
        print("2. Add: tair_ak=your_airtable_api_token")
        print("3. Make sure python-dotenv and requests are installed:")
        print("   pip install python-dotenv requests")
