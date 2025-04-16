"""
Database initialization module
Contains functions to initialize database with sample data
"""
import os
from dotenv import load_dotenv

from ..db import connect_to_mongodb, drop_all_collections
from ..data_loader import DataLoader
from ..generators.users import (
    create_admin_user, import_teachers, generate_all_students,
    import_parents, link_parents_to_students
)
from ..generators.classes import create_all_classes
from ..schedule.generator import generate_all_schedules
from ..generators.curriculum import generate_semesters


def init_database():
    """
    Initialize database with all necessary data
    Flow:
    1. Load data from CSV files
    2. Generate user data
    3. Generate classes and distribute students
    4. Generate schedules
    """
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = connect_to_mongodb()
    db = client["fams"]
    
    # Drop all existing collections
    drop_all_collections(db)
    print("[INFO] Dropped all collections")
    
    # Step 1: Load data from CSV files
    print("\n[1] Loading data from CSV files...")
    
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
    
    # Step 2: Generate user data
    print("\n[2] Generating user data...")
    
    # Create admin user
    create_admin_user(db)
    print(f"  - Created admin user")
    
    # Import teachers
    teachers, _ = import_teachers(db)
    print(f"  - Imported {len(teachers)} teachers")
    
    # Import students
    students_by_grade = generate_all_students(db)
    total_students = sum(len(students) for students in students_by_grade.values())
    print(f"  - Generated {total_students} students")
    
    # Import parents and link to students
    parents = import_parents(db)
    print(f"  - Imported {len(parents)} parents")
    
    # Link parents to students (ensure proper relationships are created)
    link_count = link_parents_to_students(db)
    print(f"  - Created {link_count} parent-student relationships")
    
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
    
    print(f"\n[INIT] Completed database initialization!")
    
    return {
        "teachers": len(teachers),
        "classrooms": len(classrooms),
        "classes": len(classes),
        "students": total_students,
        "parents": len(parents),
        "schedules": total_schedules
    } 