"""
Database initialization from Excel files for FAMS
Contains functions to initialize database from Excel files
"""
import os
from dotenv import load_dotenv

from ..db import connect_to_mongodb, drop_all_collections, create_indexes
from ..data_loader import DataLoader
from ..excel_data_loader import (
    import_all_teachers_from_excel, 
    generate_all_students_from_excel,
    generate_missing_parents
)
from ..generators.users import (
    create_admin_user,
    link_parents_to_students
)
from ..generators.classes import create_all_classes, assign_homeroom_teachers
from ..schedule.generator import generate_all_schedules
from ..generators.curriculum import generate_semesters


def init_database_from_excel(excel_files=None):
    """
    Initialize database with data from Excel files
    Flow:
    1. Load data from Excel files
    2. Generate user data (students, teachers)
    3. Generate classes and distribute students
    4. Generate schedules
    
    Args:
        excel_files: List of Excel file paths to use
    """
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = connect_to_mongodb()
    db = client["fams"]
    
    # Drop all existing collections
    drop_all_collections(db)
    print("[INFO] Dropped all collections")
    
    # Step 1: Load data from files
    print("\n[1] Loading data from files...")
    
    # Create data loader
    data_loader = DataLoader(db)
    
    # Import subjects from CSV first - they are needed for curriculum
    subjects = data_loader.load_subjects()
    print(f"  - Imported {len(subjects)} subjects")
    
    # Import classrooms
    classrooms = data_loader.load_classrooms()
    print(f"  - Imported {len(classrooms)} classrooms")
    
    # Import time slots 
    slots = data_loader.load_slots()
    print(f"  - Imported {len(slots)} time slots")
    
    # Setup curricula for all grades
    curriculums = data_loader.load_all_curricula()
    print(f"  - Created {len(curriculums)} curriculums")
    
    # Step 2: Generate user data from Excel
    print("\n[2] Generating user data from Excel...")
    
    # Create admin user
    create_admin_user(db)
    print(f"  - Created admin user")
    
    # Import teachers from Excel
    teachers, _ = import_all_teachers_from_excel(db, excel_files)
    print(f"  - Imported {len(teachers)} teachers from Excel")
    
    # Import students from Excel
    students_by_grade = generate_all_students_from_excel(db, excel_files)
    total_students = sum(len(students) for students in students_by_grade.values())
    print(f"  - Generated {total_students} students from Excel")
    
    # Link parents to students
    link_parents_to_students(db)
    print(f"  - Linked parents to students")
    
    # Step 3: Generate classes and distribute students
    print("\n[3] Generating classes...")
    
    # Create classes and distribute students
    classes = create_all_classes(db, students_by_grade)
    print(f"  - Created {len(classes)} classes")
    
    # Assign homeroom teachers for all classes
    for academic_year in ["2022-2023", "2023-2024", "2024-2025"]:
        assignment_result = assign_homeroom_teachers(db, academic_year)
        print(f"  - Assigned {assignment_result['assigned_count']} homeroom teachers for {academic_year}")
    
    # Step 4: Generate schedules
    print("\n[4] Generating schedules...")
    
    # Generate semesters
    semesters = generate_semesters(db)
    print(f"  - Created {len(semesters)} semesters")
    
    # Generate schedules for all semesters
    total_schedules = generate_all_schedules(db, semesters)
    print(f"  - Generated {total_schedules} schedule entries")
    
    print(f"\n[INIT] Completed database initialization from Excel!")
    
    return {
        "teachers": len(teachers),
        "classrooms": len(classrooms),
        "classes": len(classes),
        "students": total_students,
        "schedules": total_schedules
    }


def init_fams(excel_files=None):
    """
    Initialize FAMS with basic data only (no students, teachers, or schedules)
    - Updated to match SQL database structure from FAMS.sql
    
    Flow:
    1. Load data from files
    2. Create admin user only
    3. Generate semesters
    4. Setup proper database structure based on SQL schema
    
    Args:
        excel_files: Not used, added for compatibility
    """
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = connect_to_mongodb()
    db = client["fams"]
    
    # Drop all existing collections
    drop_all_collections(db)
    print("[INFO] Dropped all collections")
    
    # Step 1: Setup collections to match SQL schema structure
    print("\n[1] Setting up database collections according to SQL schema...")
    
    # Ensure all collections from the SQL schema exist
    # These match the tables defined in FAMS.sql
    required_collections = [
        'UserAccount', 'AttendanceLog', 'Batch', 'Class', 'Classroom',
        'ClassSchedule', 'Curriculum', 'CurriculumSubject', 'Device',
        'FaceVector', 'ModelVersion', 'Notification', 'Parent',
        'ParentStudent', 'RFID', 'ScheduleFormat', 'Semester',
        'Student', 'Subject', 'Teacher', 'Announcement'
    ]
    
    for collection in required_collections:
        if collection not in db.list_collection_names():
            db.create_collection(collection)
            print(f"  - Created collection: {collection}")
    
    # Create data loader
    data_loader = DataLoader(db)
    
    # Step 2: Load basic data
    print("\n[2] Loading basic data...")
    
    # Import subjects from CSV
    subjects = data_loader.load_subjects()
    print(f"  - Imported {len(subjects)} subjects")
    
    # Import classrooms
    classrooms = data_loader.load_classrooms()
    print(f"  - Imported {len(classrooms)} classrooms")
    
    # Import time slots 
    slots = data_loader.load_slots()
    print(f"  - Imported {len(slots)} time slots")
    
    # Setup curricula for all grades
    curriculums = data_loader.load_all_curricula()
    print(f"  - Created {len(curriculums)} curriculums")
    
    # Step 3: Create admin only
    print("\n[3] Creating admin user...")
    
    # Create admin user
    create_admin_user(db)
    print(f"  - Created admin user")
    
    # Step 4: Generate semesters 
    print("\n[4] Generating semesters...")
    
    # Generate semesters
    semesters = generate_semesters(db)
    print(f"  - Created {len(semesters)} semesters")
    
    # Step 5: Create indexes for better performance
    print("\n[5] Creating database indexes...")
    create_indexes(db)
    print(f"  - Created indexes for database collections")
    
    print(f"\n[INIT] Completed FAMS initialization!")
    
    return {
        "collections": len(required_collections),
        "teachers": 0,
        "classrooms": len(classrooms),
        "classes": 0,
        "students": 0,
        "schedules": 0
    }


def init_users_only_from_excel(excel_files=None):
    """
    Initialize only users (students and teachers) from Excel files without scheduling
    Flow:
    1. Load data from Excel files
    2. Generate user data (students, teachers) only
    
    Args:
        excel_files: List of Excel file paths to use
    """
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = connect_to_mongodb()
    db = client["fams"]
    
    # Step 1: Load data from files
    print("\n[1] Loading data from files...")
    
    # Create data loader
    data_loader = DataLoader(db)
    
    # Import subjects from CSV first - they are needed for curriculum
    subjects = data_loader.load_subjects()
    print(f"  - Imported {len(subjects)} subjects")
    
    # Import classrooms
    classrooms = data_loader.load_classrooms()
    print(f"  - Imported {len(classrooms)} classrooms")
    
    # Import time slots 
    slots = data_loader.load_slots()
    print(f"  - Imported {len(slots)} time slots")
    
    # Setup curricula for all grades
    curriculums = data_loader.load_all_curricula()
    print(f"  - Created {len(curriculums)} curriculums")
    
    # Step 2: Generate user data from Excel
    print("\n[2] Generating user data from Excel...")
    
    # Create admin user
    create_admin_user(db)
    print(f"  - Created admin user")
    
    # Import teachers from Excel
    teachers, _ = import_all_teachers_from_excel(db, excel_files)
    print(f"  - Imported {len(teachers)} teachers from Excel")
    
    # Import students from Excel
    students_by_grade = generate_all_students_from_excel(db, excel_files)
    total_students = sum(len(students) for students in students_by_grade.values())
    print(f"  - Generated {total_students} students from Excel")
    
    # Link parents to students
    link_parents_to_students(db)
    print(f"  - Linked parents to students")
    
    print(f"\n[INIT] Completed user initialization from Excel without scheduling!")
    
    return {
        "teachers": len(teachers),
        "classrooms": len(classrooms),
        "students": total_students,
    }


def link_parents_to_students(db):
    """Link parents to students using the generate_missing_parents function"""
    # Get all students
    students = list(db.Student.find({"isActive": True}))
    
    if not students:
        print("No students found to link parents")
        return 0
    
    # Generate parent records and relationships
    parents_created = generate_missing_parents(db, students)
    
    return parents_created 