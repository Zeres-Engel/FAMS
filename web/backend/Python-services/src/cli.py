"""
FAMS CLI - Command Line Interface for data generation and management
"""
import click
from .db import connect_to_mongodb, drop_all_collections
from src.data_loader import DataLoader
from src.generators.users import (
    create_admin_user, import_teachers, generate_all_students,
    import_parents, link_parents_to_students
)
from src.generators.classes import create_all_classes
from src.schedule.generator import generate_all_schedules
from src.generators.curriculum import generate_semesters


@click.group()
def cli():
    """FAMS CLI - Faculty Administration Management System"""
    pass


@cli.command()
@click.option('--drop', is_flag=True, help='Drop all collections before initialization')
def init(drop):
    """Initialize database with all necessary data"""
    # Connect to MongoDB
    client = connect_to_mongodb()
    db = client["fams"]
    
    if drop:
        drop_all_collections(db)
        print("[INFO] Dropped all collections")
    
    # Create data loader
    data_loader = DataLoader(db)
    
    # Load base data from CSV files
    print("\n[1] Loading data from CSV files...")
    
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
    
    print("\n[INIT] Database initialization completed!")


@cli.command()
def generate_users():
    """Generate all user data (admin, teachers, students, parents)"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    print("\n[1] Generating user data...")
    
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
    link_parents_to_students(db)
    print(f"  - Imported {len(parents)} parents and linked to students")
    
    print("\n[INIT] User generation completed!")


@cli.command()
def generate_classes():
    """Generate classes and distribute students"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    print("\n[1] Generating classes...")
    
    # Get all students by grade
    students_by_grade = {
        "grade10": list(db.students.find({"batchId": 3})),
        "grade11": list(db.students.find({"batchId": 2})),
        "grade12": list(db.students.find({"batchId": 1}))
    }
    
    # Create classes and distribute students
    classes = create_all_classes(db, students_by_grade)
    print(f"  - Created {len(classes)} classes")
    
    print("\n[INIT] Class generation completed!")


@cli.command()
def generate_schedules():
    """Generate schedules for all semesters"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    print("\n[1] Generating schedules...")
    
    # Generate semesters
    semesters = generate_semesters(db)
    print(f"  - Created {len(semesters)} semesters")
    
    # Generate schedules for all semesters
    total_schedules = generate_all_schedules(db, semesters)
    print(f"  - Generated {total_schedules} schedule entries")
    
    print("\n[INIT] Schedule generation completed!")


@cli.command()
def generate_all():
    """Generate all data (users, classes, schedules)"""
    # Initialize database first
    ctx = click.get_current_context()
    ctx.invoke(init, drop=True)
    
    # Generate users
    ctx.invoke(generate_users)
    
    # Generate classes
    ctx.invoke(generate_classes)
    
    # Generate schedules
    ctx.invoke(generate_schedules)
    
    print("\n[INIT] All data generation completed!")


if __name__ == '__main__':
    cli() 