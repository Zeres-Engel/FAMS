"""
Database initialization from Excel files for FAMS
Contains functions to initialize database from Excel files
"""
import os
from dotenv import load_dotenv

from ..db import connect_to_mongodb, drop_all_collections
from ..data_loader import DataLoader
from ..excel_data_loader import (
    import_all_teachers_from_excel, 
    generate_all_students_from_excel
)
from ..generators.users import (
    create_admin_user,
    link_parents_to_students
)
from ..generators.classes import create_all_classes
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
    Flow:
    1. Load data from files
    2. Create admin user only
    3. Generate semesters
    
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
    
    # Step 1: Load basic data
    print("\n[1] Loading basic data...")
    
    # Create data loader
    data_loader = DataLoader(db)
    
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
    
    # Step 2: Create admin only
    print("\n[2] Creating admin user...")
    
    # Create admin user
    create_admin_user(db)
    print(f"  - Created admin user")
    
    # Step 3: Generate semesters 
    print("\n[3] Generating semesters...")
    
    # Generate semesters
    semesters = generate_semesters(db)
    print(f"  - Created {len(semesters)} semesters")
    
    print(f"\n[INIT] Completed FAMS initialization!")
    
    return {
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