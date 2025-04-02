import os
import csv
import pymongo
from pymongo import MongoClient
from dotenv import load_dotenv
import datetime
import bcrypt
import json
import random

# Load environment variables
load_dotenv()

# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client['fams']

def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def generate_username(full_name, id_number):
    """Generate username from full name"""
    name_parts = full_name.split()
    if len(name_parts) > 1:
        # Get the last name and first characters of previous names
        last_name = name_parts[-1].lower()
        initials = ''.join([name[0].lower() for name in name_parts[:-1]])
        return f"{last_name}{initials}{id_number}"
    else:
        return f"{full_name.lower()}{id_number}"

def parse_date(date_str):
    """Parse date from string to datetime object"""
    try:
        # Handle different date formats
        if '/' in date_str:
            day, month, year = map(int, date_str.split('/'))
            return datetime.datetime(year, month, day)
        elif '-' in date_str:
            year, month, day = map(int, date_str.split('-'))
            return datetime.datetime(year, month, day)
    except:
        return None
    return None

def init_database():
    print("Initializing database...")
    
    # Clear existing collections
    db.users.drop()
    db.teachers.drop()
    db.students.drop()
    db.parents.drop()
    db.subjects.drop()
    db.classes.drop()
    
    # Create admin account
    admin_user = {
        "userId": "admin",
        "name": "Administrator",
        "email": "admin@fams.edu",
        "password": hash_password("1234"),
        "role": "Admin"
    }
    db.users.insert_one(admin_user)
    print("Admin account created")
    
    # Init classes
    classes = [
        {"classId": 1, "className": "10A1", "homeroomTeacherId": None},
        {"classId": 2, "className": "10A2", "homeroomTeacherId": None},
        {"classId": 3, "className": "10A3", "homeroomTeacherId": None},
        {"classId": 4, "className": "11A1", "homeroomTeacherId": None},
        {"classId": 5, "className": "11A2", "homeroomTeacherId": None},
        {"classId": 6, "className": "12A1", "homeroomTeacherId": None},
        {"classId": 7, "className": "12A2", "homeroomTeacherId": None},
        {"classId": 8, "className": "12A3", "homeroomTeacherId": None},
        {"classId": 9, "className": "12D1", "homeroomTeacherId": None}
    ]
    db.classes.insert_many(classes)
    print("Classes created")
    
    # Import teachers
    teachers = []
    teacher_users = []
    
    with open('database/teacher.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for i, row in enumerate(reader, 1):
            teacher_id = i
            full_name = row['FullName']
            username = generate_username(full_name, teacher_id)
            
            # Create user account
            teacher_user = {
                "userId": username,
                "name": full_name,
                "email": f"{username}@fams.edu",
                "password": hash_password("123456"),
                "role": "Teacher"
            }
            teacher_users.append(teacher_user)
            
            # Create teacher profile
            teacher = {
                "teacherId": teacher_id,
                "userId": username,
                "fullName": full_name,
                "email": f"{username}@fams.edu",
                "dateOfBirth": parse_date(row.get('DateOfBirth', '')),
                "phone": row.get('Phone', ''),
                "gender": row.get('Gender', '') == 'True'
            }
            teachers.append(teacher)
            
            # Assign homeroom teachers
            if i <= len(classes):
                classes[i-1]["homeroomTeacherId"] = teacher_id
    
    # Update classes with homeroom teachers
    for class_doc in classes:
        db.classes.update_one(
            {"classId": class_doc["classId"]},
            {"$set": {"homeroomTeacherId": class_doc["homeroomTeacherId"]}}
        )
    
    db.users.insert_many(teacher_users)
    db.teachers.insert_many(teachers)
    print(f"{len(teachers)} teachers imported")
    
    # Import students
    students = []
    student_users = []
    
    with open('database/student.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for i, row in enumerate(reader, 1):
            student_id = i
            full_name = row['Full Name']
            username = generate_username(full_name, student_id)
            
            # Find class ID
            class_name = row.get('Class', '')
            class_doc = db.classes.find_one({"className": class_name})
            class_id = class_doc["classId"] if class_doc else None
            
            # Create user account
            student_user = {
                "userId": username,
                "name": full_name,
                "email": f"{username}@fams.edu",
                "password": hash_password("123456"),
                "role": "Student"
            }
            student_users.append(student_user)
            
            # Create student profile
            student = {
                "studentId": student_id,
                "userId": username,
                "fullName": full_name,
                "dateOfBirth": parse_date(row.get('Date of Birth', '')),
                "classId": class_id,
                "gender": row.get('Gender', '') == 'True',
                "address": row.get('Address', ''),
                "phone": row.get('Phone', ''),
                "parentIds": []
            }
            students.append(student)
    
    db.users.insert_many(student_users)
    db.students.insert_many(students)
    print(f"{len(students)} students imported")
    
    # Import parents
    parents = []
    parent_users = []
    
    with open('database/parent.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for i, row in enumerate(reader, 1):
            parent_id = i
            full_name = row['FullName']
            username = generate_username(full_name, parent_id)
            
            # Create user account
            parent_user = {
                "userId": username,
                "name": full_name,
                "email": f"{username}@fams.edu",
                "password": hash_password("123456"),
                "role": "Parent"
            }
            parent_users.append(parent_user)
            
            # Create parent profile
            parent = {
                "parentId": parent_id,
                "userId": username,
                "fullName": full_name,
                "career": row.get('Career', ''),
                "phone": row.get('Phone', ''),
                "gender": row.get('Gender', '') == 'True',
                "studentIds": []
            }
            parents.append(parent)
    
    db.users.insert_many(parent_users)
    db.parents.insert_many(parents)
    print(f"{len(parents)} parents imported")
    
    # Assign students to parents
    all_students = list(db.students.find())
    all_parents = list(db.parents.find())
    
    # Each student gets 1-2 parents
    for student in all_students:
        num_parents = random.randint(1, min(2, len(all_parents)))
        selected_parents = random.sample(all_parents, num_parents)
        
        student_id = student["studentId"]
        
        for parent in selected_parents:
            parent_id = parent["parentId"]
            
            # Add parent to student
            db.students.update_one(
                {"studentId": student_id}, 
                {"$push": {"parentIds": parent_id}}
            )
            
            # Add student to parent
            db.parents.update_one(
                {"parentId": parent_id}, 
                {"$push": {"studentIds": student_id}}
            )
    
    print("Parent-student relationships created")
    
    # Import subjects
    subjects = []
    
    with open('database/subject.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for i, row in enumerate(reader, 1):
            subject = {
                "subjectId": i,
                "name": row['Name'],
                "type": row['Type'],
                "description": row.get('Description', '')
            }
            subjects.append(subject)
    
    db.subjects.insert_many(subjects)
    print(f"{len(subjects)} subjects imported")
    
    # Generate schedule
    generate_schedule()
    
    print("Database initialization complete!")

def generate_schedule():
    """Generate a sample schedule for classes"""
    # Create a semester
    semester = {
        "semesterId": 1,
        "name": "Học kỳ 1 2023-2024",
        "startDate": datetime.datetime(2023, 9, 1),
        "endDate": datetime.datetime(2024, 1, 15)
    }
    db.semesters.insert_one(semester)
    
    # Generate schedules
    schedules = []
    
    # Get all classes, subjects, and teachers
    classes = list(db.classes.find())
    subjects = list(db.subjects.find())
    teachers = list(db.teachers.find())
    
    time_slots = [
        {"start": "07:30", "end": "08:15"},
        {"start": "08:25", "end": "09:10"},
        {"start": "09:30", "end": "10:15"},
        {"start": "10:25", "end": "11:10"},
        {"start": "13:30", "end": "14:15"},
        {"start": "14:25", "end": "15:10"},
        {"start": "15:30", "end": "16:15"}
    ]
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    schedule_id = 1
    
    # For each class
    for class_doc in classes:
        # Assign 5-7 subjects to this class
        class_subjects = random.sample(subjects, min(len(subjects), random.randint(5, 7)))
        
        # For each subject, assign a teacher and schedule
        for subject in class_subjects:
            # Assign a teacher randomly
            teacher = random.choice(teachers)
            
            # Schedule 2-3 sessions per week
            sessions_per_week = random.randint(2, 3)
            assigned_slots = []
            
            for _ in range(sessions_per_week):
                # Try to find a free slot
                attempts = 0
                while attempts < 20:  # Limit attempts to avoid infinite loop
                    day = random.choice(days)
                    time_slot = random.choice(time_slots)
                    
                    slot_key = f"{day}-{time_slot['start']}"
                    if slot_key not in assigned_slots:
                        assigned_slots.append(slot_key)
                        
                        schedule = {
                            "scheduleId": schedule_id,
                            "semesterId": 1,
                            "classId": class_doc["classId"],
                            "subjectId": subject["subjectId"],
                            "teacherId": teacher["teacherId"],
                            "dayOfWeek": day,
                            "startTime": time_slot["start"],
                            "endTime": time_slot["end"]
                        }
                        
                        schedules.append(schedule)
                        schedule_id += 1
                        break
                    
                    attempts += 1
    
    if schedules:
        db.schedules.insert_many(schedules)
        print(f"{len(schedules)} schedule entries created")

if __name__ == "__main__":
    init_database() 