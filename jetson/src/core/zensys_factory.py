import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# Default instances for simple import
default_zensys = None
default_attendance_service = None
default_message_manager = None

def create_zensys_instance():
    """
    Create and initialize a ZenSys instance with default configuration.
    This is the recommended way to get a ZenSys instance.
    
    Returns:
        A pre-configured ZenSys instance
    """
    try:
        # Import here to avoid circular imports
        from src.core.zensys.zensys import ZenSys
        
        # Create a new ZenSys instance
        zen_system = ZenSys()
        
        # Initialize the system
        zen_system.initialize()
        
        return zen_system
    except Exception as e:
        print(f"Error initializing ZenSys: {e}")
        raise

def get_default_instance():
    """
    Get the default ZenSys instance, creating it if needed.
    
    Returns:
        The default ZenSys instance
    """
    global default_zensys
    if default_zensys is None:
        default_zensys = create_zensys_instance()
    return default_zensys

def get_attendance_service():
    """
    Get the default AttendanceService instance, creating it if needed.
    
    Returns:
        The default AttendanceService instance
    """
    global default_attendance_service
    if default_attendance_service is None:
        from src.core.api.attendance_service import AttendanceService
        default_attendance_service = AttendanceService()
    return default_attendance_service

def get_message_manager():
    """
    Get the default MessageManager instance, creating it if needed.
    
    Returns:
        The default MessageManager instance
    """
    global default_message_manager
    if default_message_manager is None:
        from src.core.messaging.message_manager import MessageManager
        default_message_manager = MessageManager()
    return default_message_manager

# Export public API
__all__ = [
    'create_zensys_instance', 
    'get_default_instance',
    'get_attendance_service',
    'get_message_manager'
] 