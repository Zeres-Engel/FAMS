"""
Database connection and utilities for MongoDB
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


def get_collection(db, collection_key):
    """
    Get a MongoDB collection using the constants defined in COLLECTIONS
    
    Args:
        db: MongoDB database instance
        collection_key: Key from COLLECTIONS dictionary (e.g., 'USER_ACCOUNT')
        
    Returns:
        MongoDB collection
    """
    collection_name = COLLECTIONS.get(collection_key)
    if not collection_name:
        raise ValueError(f"Collection key '{collection_key}' not found in COLLECTIONS")
    return db[collection_name]


def get_field_name(field_key):
    """
    Get the MongoDB field name using the constants defined in COLLECTIONS['FIELDS']
    
    Args:
        field_key: Key from COLLECTIONS['FIELDS'] dictionary (e.g., 'USER_ID')
        
    Returns:
        MongoDB field name (e.g., 'userId')
    """
    fields = COLLECTIONS.get('FIELDS', {})
    field_name = fields.get(field_key)
    if not field_name:
        raise ValueError(f"Field key '{field_key}' not found in COLLECTIONS['FIELDS']")
    return field_name 