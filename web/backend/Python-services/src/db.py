"""
Database connection and basic operations for FAMS
"""
import os
from pymongo import MongoClient
from .constants import COLLECTIONS


def connect_to_mongodb():
    """Connect to MongoDB using connection string from environment variables"""
    mongo_uri = os.getenv('MONGO_URI')
    client = MongoClient(mongo_uri, tlsAllowInvalidCertificates=True)
    client.admin.command('ping')  # Verify connection
    return client


def get_database(client=None):
    """Get the FAMS database"""
    if client is None:
        client = connect_to_mongodb()
    return client["fams"]


def drop_all_collections(db):
    """Drop all collections in the database"""
    for col_name in db.list_collection_names():
        db[col_name].drop()


def create_indexes(db):
    """Create necessary indexes for performance"""
    # Example indexes - add more as needed
    db[COLLECTIONS['USER_ACCOUNT']].create_index("UserID", unique=True)
    db[COLLECTIONS['TEACHER']].create_index("TeacherID", unique=True)
    db[COLLECTIONS['STUDENT']].create_index("StudentID", unique=True)
    db[COLLECTIONS['CLASS']].create_index("ClassID", unique=True)


def normalize_keys(document):
    """Normalize keys in document to ensure consistent naming"""
    key_map = {
        'BatchID': 'batchId',
        'ClassID': 'classId',
    }
    
    if not isinstance(document, dict):
        return document
        
    result = {}
    for key, value in document.items():
        new_key = key_map.get(key, key)
        result[new_key] = value
        
    return result 