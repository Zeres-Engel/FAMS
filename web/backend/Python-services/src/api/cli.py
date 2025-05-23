"""
Command-line interface functions for FAMS
"""
from .init_db import init_database

def init_db_command():
    """Initialize database with sample data"""
    print("Initializing database...")
    init_database()
    print("Database initialization completed!") 