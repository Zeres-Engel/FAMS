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
    """Create necessary indexes for performance based on SQL schema"""
    # Create indexes for all collections based on SQL schema primary and foreign keys
    
    # User-related collections
    db[COLLECTIONS['USER_ACCOUNT']].create_index("UserID", unique=True, partialFilterExpression={"UserID": {"$type": "string"}})
    db[COLLECTIONS['USER_ACCOUNT']].create_index("Email", unique=True, partialFilterExpression={"Email": {"$type": "string"}})
    
    # Student indexes
    db[COLLECTIONS['STUDENT']].create_index("StudentID", unique=True, partialFilterExpression={"StudentID": {"$exists": True}})
    db[COLLECTIONS['STUDENT']].create_index("UserID", unique=True, partialFilterExpression={"UserID": {"$type": "string"}})
    db[COLLECTIONS['STUDENT']].create_index("ClassID")
    db[COLLECTIONS['STUDENT']].create_index("BatchID")
    
    # Teacher indexes
    db[COLLECTIONS['TEACHER']].create_index("TeacherID", unique=True, partialFilterExpression={"TeacherID": {"$exists": True}})
    db[COLLECTIONS['TEACHER']].create_index("UserID", unique=True, partialFilterExpression={"UserID": {"$type": "string"}})
    
    # Parent indexes
    db[COLLECTIONS['PARENT']].create_index("ParentID", unique=True, partialFilterExpression={"ParentID": {"$exists": True}})
    db[COLLECTIONS['PARENT']].create_index("UserID", unique=True, partialFilterExpression={"UserID": {"$type": "string"}})
    
    # ParentStudent indexes
    db[COLLECTIONS['PARENT_STUDENT']].create_index("ParentStudentID", unique=True, partialFilterExpression={"ParentStudentID": {"$exists": True}})
    db[COLLECTIONS['PARENT_STUDENT']].create_index("ParentID", unique=True, partialFilterExpression={"ParentID": {"$exists": True}})
    db[COLLECTIONS['PARENT_STUDENT']].create_index("StudentID", unique=True, partialFilterExpression={"StudentID": {"$exists": True}})
    
    # Class indexes
    db[COLLECTIONS['CLASS']].create_index("ClassID", unique=True, partialFilterExpression={"ClassID": {"$exists": True}})
    db[COLLECTIONS['CLASS']].create_index("HomeroomTeacherID")
    
    # Batch indexes
    db[COLLECTIONS['BATCH']].create_index("BatchID", unique=True, partialFilterExpression={"BatchID": {"$exists": True}})
    
    # Classroom indexes - using partial index to handle null values
    db[COLLECTIONS['CLASSROOM']].create_index("ClassroomID", unique=True, partialFilterExpression={"ClassroomID": {"$exists": True}})
    
    # Subject indexes
    db[COLLECTIONS['SUBJECT']].create_index("SubjectID", unique=True, partialFilterExpression={"SubjectID": {"$exists": True}})
    
    # Curriculum indexes
    db[COLLECTIONS['CURRICULUM']].create_index("CurriculumID", unique=True, partialFilterExpression={"CurriculumID": {"$exists": True}})
    
    # CurriculumSubject indexes (composite key)
    db[COLLECTIONS['CURRICULUM_SUBJECT']].create_index([
        ("CurriculumID", 1),
        ("SubjectID", 1)
    ], unique=True, partialFilterExpression={
        "CurriculumID": {"$exists": True},
        "SubjectID": {"$exists": True}
    })
    
    # Semester indexes
    db[COLLECTIONS['SEMESTER']].create_index("SemesterID", unique=True, partialFilterExpression={"SemesterID": {"$exists": True}})
    db[COLLECTIONS['SEMESTER']].create_index("CurriculumID")
    
    # ClassSchedule indexes
    db[COLLECTIONS['CLASS_SCHEDULE']].create_index("ScheduleID", unique=True, partialFilterExpression={"ScheduleID": {"$exists": True}})
    db[COLLECTIONS['CLASS_SCHEDULE']].create_index("SemesterID")
    db[COLLECTIONS['CLASS_SCHEDULE']].create_index("ClassID")
    db[COLLECTIONS['CLASS_SCHEDULE']].create_index("SubjectID")
    db[COLLECTIONS['CLASS_SCHEDULE']].create_index("TeacherID")
    db[COLLECTIONS['CLASS_SCHEDULE']].create_index("ClassroomID")
    db[COLLECTIONS['CLASS_SCHEDULE']].create_index("SlotID")
    
    # ScheduleFormat indexes
    db[COLLECTIONS['SCHEDULE_FORMAT']].create_index("SlotID", unique=True, partialFilterExpression={"SlotID": {"$exists": True}})
    db[COLLECTIONS['SCHEDULE_FORMAT']].create_index([
        ("SlotNumber", 1),
        ("DayOfWeek", 1)
    ], unique=True, partialFilterExpression={
        "SlotNumber": {"$exists": True},
        "DayOfWeek": {"$exists": True}
    })
    
    # AttendanceLog indexes
    db[COLLECTIONS['ATTENDANCE_LOG']].create_index("AttendanceID", unique=True, partialFilterExpression={"AttendanceID": {"$exists": True}})
    db[COLLECTIONS['ATTENDANCE_LOG']].create_index("ScheduleID")
    db[COLLECTIONS['ATTENDANCE_LOG']].create_index("UserID")
    
    # RFID indexes
    db[COLLECTIONS['RFID']].create_index("RFID_ID", unique=True, partialFilterExpression={"RFID_ID": {"$type": "string"}})
    db[COLLECTIONS['RFID']].create_index("UserID")
    
    # Face recognition collections
    db[COLLECTIONS['FACE_VECTOR']].create_index("FaceVectorID", unique=True, partialFilterExpression={"FaceVectorID": {"$exists": True}})
    db[COLLECTIONS['FACE_VECTOR']].create_index("UserID")
    db[COLLECTIONS['FACE_VECTOR']].create_index("ModelID")
    
    # Device and model indexes
    db[COLLECTIONS['DEVICE']].create_index("DeviceID", unique=True, partialFilterExpression={"DeviceID": {"$exists": True}})
    db[COLLECTIONS['MODEL_VERSION']].create_index("ModelID", unique=True, partialFilterExpression={"ModelID": {"$exists": True}})
    db[COLLECTIONS['MODEL_VERSION']].create_index("DeviceID")
    
    # Communication collections
    db[COLLECTIONS['ANNOUNCEMENT']].create_index("AnnouncementID", unique=True, partialFilterExpression={"AnnouncementID": {"$exists": True}})
    db[COLLECTIONS['ANNOUNCEMENT']].create_index("UserID")
    
    db[COLLECTIONS['NOTIFICATION']].create_index("NotificationID", unique=True, partialFilterExpression={"NotificationID": {"$exists": True}})
    db[COLLECTIONS['NOTIFICATION']].create_index("SenderID")
    db[COLLECTIONS['NOTIFICATION']].create_index("ReceiverID")


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