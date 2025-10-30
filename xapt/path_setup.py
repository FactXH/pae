"""
Path setup utility for xapt Django project to access PAE utils modules.
This ensures that utils modules from the PAE project root are always available.
"""
import sys
import os

def setup_pae_path():
    """
    Add PAE project root to Python path if not already present.
    This allows importing utils modules from anywhere in the Django project.
    """
    # Get the PAE project root (3 levels up from xapt/)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    pae_root = os.path.abspath(os.path.join(current_dir, '..'))
    
    if pae_root not in sys.path:
        sys.path.insert(0, pae_root)
        print(f"Added PAE root to Python path: {pae_root}")
    
    return pae_root

def validate_utils_import():
    """
    Validate that utils modules can be imported successfully.
    Returns True if all key utils modules are available, False otherwise.
    """
    try:
        from utils.query_runner.query_runner import QueryRunner
        from utils.data_loader.loader import Loader
        from utils.clients.aws_client import query_athena
        print("✓ All PAE utils modules imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Failed to import PAE utils modules: {e}")
        return False

# Auto-setup when this module is imported
if __name__ == "__main__":
    pae_root = setup_pae_path()
    success = validate_utils_import()
    
    if success:
        print(f"✅ PAE utils integration ready! Root path: {pae_root}")
    else:
        print("❌ PAE utils integration failed. Check your path configuration.")
else:
    # Auto-setup when imported as a module
    setup_pae_path()
