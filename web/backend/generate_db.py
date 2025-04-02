import os
import csv
import pymongo
import unicodedata
import re
from pymongo import MongoClient
from dotenv import load_dotenv
import datetime
import bcrypt
import json
import random
import ssl

# Load environment variables
load_dotenv()

def remove_accents(input_str):
    """Remove Vietnamese accents from a string"""
    s = unicodedata.normalize('NFD', input_str)
    s = s.encode('ascii', 'ignore').decode('utf-8')
    return s

def generate_username(full_name, batch_id=None, id_number=None):
    """Generate username from full name without accents
    
    Format: lastname + initials + batch + id
    Example: Nguyễn Phước Thành, batch 1, id 12 -> thanhnp112
    """
    # Remove accents
    normalized_name = remove_accents(full_name)
    
    # Split name parts
    name_parts = normalized_name.split()
    if len(name_parts) < 2:
        base_username = normalized_name.lower()
    else:
        # Last name and initials of other parts
        last_name = name_parts[-1].lower()
        initials = ''.join([name[0].lower() for name in name_parts[:-1]])
        base_username = f"{last_name}{initials}"
    
    # Add batch and ID if provided
    if batch_id is not None and id_number is not None:
        return f"{base_username}{batch_id}{id_number}"
    elif id_number is not None:
        return f"{base_username}{id_number}"
    else:
        return base_username

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

def connect_to_mongodb():
    """Connect to MongoDB with proper settings for Atlas"""
    mongo_uri = os.getenv('MONGO_URI')
    
    # Configure proper TLS settings for MongoDB Atlas
    client = MongoClient(
        mongo_uri,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=5000  # 5 seconds timeout
    )
    
    try:
        # Test connection
        client.admin.command('ping')
        print("Connected to MongoDB successfully!")
        return client
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        print(f"Connection string: {mongo_uri}")
        
        # Fallback: Try to connect locally if Atlas fails
        try:
            print("Trying to connect to local MongoDB...")
            local_client = MongoClient('mongodb://localhost:27017/')
            local_client.admin.command('ping')
            print("Connected to local MongoDB!")
            return local_client
        except Exception as local_err:
            print(f"Local MongoDB connection also failed: {local_err}")
            raise

def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def drop_all_collections(db):
    """Drop all collections in the database"""
    collections = db.list_collection_names()
    for collection in collections:
        try:
            db[collection].drop()
            print(f"Dropped collection: {collection}")
        except Exception as e:
            print(f"Failed to drop {collection}: {e}")

def find_file_path(relative_paths):
    """Try multiple possible file paths and return the first one that exists"""
    for path in relative_paths:
        if os.path.exists(path):
            return path
    return None

def get_curriculum_data(grade):
    """Load curriculum data for a specific grade level"""
    paths = [
        f'backend/database/curriculum_{grade}.csv',
        f'database/curriculum_{grade}.csv'
    ]
    
    file_path = find_file_path(paths)
    if not file_path:
        print(f"Warning: Curriculum file for grade {grade} not found")
        return {}
    
    curriculum_data = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                subject_name = row['SubjectName']
                sessions = int(row.get('Sessions', 2))  # Default to 2 if not provided
                curriculum_data[subject_name] = sessions
    except Exception as e:
        print(f"Error reading curriculum file for grade {grade}: {e}")
    
    return curriculum_data

def init_database():
    print("Initializing database...")
    
    # Connect to MongoDB
    client = connect_to_mongodb()
    db = client['fams']
    
    # Clear existing collections
    print("Cleaning up database...")
    drop_all_collections(db)
    
    # Create admin account
    admin_user = {
        "userId": "admin",
        "name": "Administrator",
        "email": "admin@fams.edu.vn",
        "password": hash_password("1234"),
        "role": "Admin"
    }
    db.users.insert_one(admin_user)
    print("Admin account created")
    
    # Create batches
    batches = [
        {"batchId": 1, "batchName": "Khóa 2021-2024", "startYear": 2021, "endYear": 2024, "grade": 12},
        {"batchId": 2, "batchName": "Khóa 2022-2025", "startYear": 2022, "endYear": 2025, "grade": 11},
        {"batchId": 3, "batchName": "Khóa 2023-2026", "startYear": 2023, "endYear": 2026, "grade": 10}
    ]
    db.batches.insert_many(batches)
    print("Batches created")
    
    # Init classes with batch info
    classes = [
        {"classId": 1, "className": "10A1", "homeroomTeacherId": None, "batchId": 3},
        {"classId": 2, "className": "10A2", "homeroomTeacherId": None, "batchId": 3},
        {"classId": 3, "className": "10A3", "homeroomTeacherId": None, "batchId": 3},
        {"classId": 4, "className": "11A1", "homeroomTeacherId": None, "batchId": 2},
        {"classId": 5, "className": "11A2", "homeroomTeacherId": None, "batchId": 2},
        {"classId": 6, "className": "12A1", "homeroomTeacherId": None, "batchId": 1},
        {"classId": 7, "className": "12A2", "homeroomTeacherId": None, "batchId": 1},
        {"classId": 8, "className": "12A3", "homeroomTeacherId": None, "batchId": 1},
        {"classId": 9, "className": "12D1", "homeroomTeacherId": None, "batchId": 1}
    ]
    db.classes.insert_many(classes)
    print("Classes created")
    
    # Create classrooms
    classrooms = [
        {"classroomId": 1, "roomNumber": "A101", "building": "A", "capacity": 40},
        {"classroomId": 2, "roomNumber": "A102", "building": "A", "capacity": 40},
        {"classroomId": 3, "roomNumber": "A103", "building": "A", "capacity": 40},
        {"classroomId": 4, "roomNumber": "A201", "building": "A", "capacity": 40},
        {"classroomId": 5, "roomNumber": "A202", "building": "A", "capacity": 40},
        {"classroomId": 6, "roomNumber": "B101", "building": "B", "capacity": 40},
        {"classroomId": 7, "roomNumber": "B102", "building": "B", "capacity": 40},
        {"classroomId": 8, "roomNumber": "B201", "building": "B", "capacity": 40},
        {"classroomId": 9, "roomNumber": "B202", "building": "B", "capacity": 40}
    ]
    db.classrooms.insert_many(classrooms)
    print("Classrooms created")
    
    # Import teachers
    teachers = []
    teacher_users = []
    
    try:
        file_path = find_file_path(['backend/database/teacher.csv', 'database/teacher.csv'])
        if file_path:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader, 1):
                    teacher_id = i
                    full_name = row['FullName']
                    username = generate_username(full_name, None, teacher_id)
                    
                    # Create user account
                    teacher_user = {
                        "userId": username,
                        "name": full_name,
                        "email": f"{username}@fams.edu.vn",
                        "password": hash_password("123456"),
                        "role": "Teacher"
                    }
                    teacher_users.append(teacher_user)
                    
                    # Create teacher profile
                    teacher = {
                        "teacherId": teacher_id,
                        "userId": username,
                        "fullName": full_name,
                        "email": f"{username}@fams.edu.vn",
                        "dateOfBirth": parse_date(row.get('DateOfBirth', '')),
                        "phone": row.get('Phone', ''),
                        "gender": row.get('Gender', '') == 'True'
                    }
                    teachers.append(teacher)
                    
                    # Assign homeroom teachers
                    if i <= len(classes):
                        classes[i-1]["homeroomTeacherId"] = teacher_id
    except Exception as e:
        print(f"Error importing teachers: {e}")
    
    # Update classes with homeroom teachers
    for class_doc in classes:
        db.classes.update_one(
            {"classId": class_doc["classId"]},
            {"$set": {"homeroomTeacherId": class_doc["homeroomTeacherId"]}}
        )
    
    if teacher_users:
        db.users.insert_many(teacher_users)
    if teachers:
        db.teachers.insert_many(teachers)
    print(f"{len(teachers)} teachers imported")
    
    # Import students
    students = []
    student_users = []
    
    try:
        file_path = find_file_path(['backend/database/student.csv', 'database/student.csv'])
        if file_path:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader, 1):
                    student_id = i
                    full_name = row['Full Name']
                    
                    # Find class ID and batch info
                    class_name = row.get('Class', '')
                    class_doc = db.classes.find_one({"className": class_name})
                    
                    if class_doc:
                        class_id = class_doc["classId"]
                        batch_id = class_doc["batchId"]
                        
                        # Generate username with batch info
                        username = generate_username(full_name, batch_id, student_id)
                        
                        # Create user account
                        student_user = {
                            "userId": username,
                            "name": full_name,
                            "email": f"{username}@fams.edu.vn",
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
                            "batchId": batch_id,
                            "gender": row.get('Gender', '') == 'True',
                            "address": row.get('Address', ''),
                            "phone": row.get('Phone', ''),
                            "parentIds": []
                        }
                        students.append(student)
    except Exception as e:
        print(f"Error importing students: {e}")
    
    if student_users:
        db.users.insert_many(student_users)
    if students:
        db.students.insert_many(students)
    print(f"{len(students)} students imported")
    
    # Import parents
    parents = []
    parent_users = []
    
    try:
        file_path = find_file_path(['backend/database/parent.csv', 'database/parent.csv'])
        if file_path:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader, 1):
                    parent_id = i
                    full_name = row['FullName']
                    username = generate_username(full_name, None, parent_id)
                    
                    # Create user account
                    parent_user = {
                        "userId": username,
                        "name": full_name,
                        "email": f"{username}@fams.edu.vn",
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
    except Exception as e:
        print(f"Error importing parents: {e}")
    
    if parent_users:
        db.users.insert_many(parent_users)
    if parents:
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
    
    try:
        file_path = find_file_path(['backend/database/subject.csv', 'database/subject.csv'])
        if file_path:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader, 1):
                    subject = {
                        "subjectId": i,
                        "name": row['Name'],
                        "type": row['Type'],
                        "description": row.get('Description', '')
                    }
                    subjects.append(subject)
    except Exception as e:
        print(f"Error importing subjects: {e}")
    
    if subjects:
        db.subjects.insert_many(subjects)
        print(f"{len(subjects)} subjects imported")
    
    # Generate schedule
    generate_schedule(db)
    
    print("Database initialization complete!")

def generate_schedule(db):
    """Generate a sample schedule for classes using curriculum data"""
    # Create a semester
    semester = {
        "semesterId": 1,
        "name": "Học kỳ 1 2023-2024",
        "startDate": datetime.datetime(2023, 9, 1),
        "endDate": datetime.datetime(2024, 1, 15)
    }
    db.semesters.insert_one(semester)
    
    # Define periods according to requested timetable
    periods = {
        # Morning periods
        1: {"start": "07:00", "end": "07:45"},
        2: {"start": "07:50", "end": "08:35"},
        3: {"start": "08:50", "end": "09:35"},
        4: {"start": "09:40", "end": "10:25"},
        5: {"start": "10:30", "end": "11:15"},
        # Afternoon periods
        6: {"start": "12:30", "end": "13:15"},
        7: {"start": "13:20", "end": "14:05"},
        8: {"start": "14:10", "end": "14:55"},
        9: {"start": "15:10", "end": "15:55"},
        10: {"start": "16:00", "end": "16:45"}
    }
    
    # Days of the week (include weekends but will not schedule classes on them)
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekdays = days[:5]  # Only Monday-Friday for actual classes
    
    # Generate schedules
    schedules = []
    
    # Get all classes, subjects, teachers, and batches
    classes = list(db.classes.find())
    subjects = list(db.subjects.find())
    teachers = list(db.teachers.find())
    classrooms = list(db.classrooms.find())
    batches = list(db.batches.find())
    
    # Load curriculum data for each grade
    curriculum_data = {
        10: get_curriculum_data(10),
        11: get_curriculum_data(11),
        12: get_curriculum_data(12)
    }
    
    # Create a mapping of subject names to subject documents
    subject_name_to_doc = {subject['name']: subject for subject in subjects}
    
    # For tracking schedules
    used_slots = {}  # Track used slots: {classId: {day: [periods]}}
    teacher_schedule = {}  # Track teacher schedules: {teacherId: {day: [periods]}}
    classroom_schedule = {}  # Track classroom schedules: {classroomId: {day: [periods]}}
    schedule_id = 1
    
    # Reserve all weekend slots as "free time"
    for class_doc in classes:
        class_id = class_doc["classId"]
        if class_id not in used_slots:
            used_slots[class_id] = {}
        
        # Mark weekends as reserved (no classes)
        for day in days[5:]:  # Saturday and Sunday
            if day not in used_slots[class_id]:
                used_slots[class_id][day] = []
            
            # Mark all periods as used
            for period_num in periods:
                period = periods[period_num]
                
                schedule = {
                    "scheduleId": schedule_id,
                    "semesterId": 1,
                    "classId": class_id,
                    "subjectId": None,  # No subject (free time)
                    "teacherId": None,  # No teacher
                    "classroomId": None,  # No classroom
                    "dayOfWeek": day,
                    "period": period_num,
                    "startTime": period["start"],
                    "endTime": period["end"],
                    "isFreeTime": True
                }
                
                schedules.append(schedule)
                schedule_id += 1
                
                # Mark the slot as used
                used_slots[class_id][day].append(period_num)
    
    # Generate schedule for each class
    for class_doc in classes:
        class_id = class_doc["classId"]
        batch_id = class_doc["batchId"]
        
        # Get curriculum for this class's grade
        batch = next((b for b in batches if b["batchId"] == batch_id), None)
        grade = batch["grade"] if batch else 10
        
        class_curriculum = curriculum_data.get(grade, {})
        
        # Init tracking structures if needed
        if class_id not in used_slots:
            used_slots[class_id] = {}
        
        for day in weekdays:
            if day not in used_slots[class_id]:
                used_slots[class_id][day] = []
        
        # Schedule subjects from curriculum
        for subject_name, num_sessions in class_curriculum.items():
            # Find corresponding subject in database
            subject = subject_name_to_doc.get(subject_name)
            if not subject:
                continue
            
            # Assign a teacher
            if teachers:
                teacher = random.choice(teachers)
                teacher_id = teacher["teacherId"]
                
                # Initialize teacher schedule if needed
                if teacher_id not in teacher_schedule:
                    teacher_schedule[teacher_id] = {day: [] for day in weekdays}
                
                # Assign a classroom
                classroom = random.choice(classrooms)
                classroom_id = classroom["classroomId"]
                
                # Initialize classroom schedule if needed
                if classroom_id not in classroom_schedule:
                    classroom_schedule[classroom_id] = {day: [] for day in weekdays}
                
                # Schedule the required number of sessions
                sessions_scheduled = 0
                
                # Try to distribute sessions evenly across days
                days_copy = weekdays.copy()
                random.shuffle(days_copy)
                
                while sessions_scheduled < num_sessions and days_copy:
                    day = days_copy.pop(0)
                    
                    # Find available periods
                    available_periods = []
                    for period_num in periods:
                        # Check if period is available for class, teacher, and classroom
                        class_available = period_num not in used_slots[class_id].get(day, [])
                        teacher_available = period_num not in teacher_schedule[teacher_id].get(day, [])
                        classroom_available = period_num not in classroom_schedule[classroom_id].get(day, [])
                        
                        if class_available and teacher_available and classroom_available:
                            available_periods.append(period_num)
                    
                    # Schedule if periods are available
                    if available_periods:
                        period_num = random.choice(available_periods)
                        period = periods[period_num]
                        
                        schedule = {
                            "scheduleId": schedule_id,
                            "semesterId": 1,
                            "classId": class_id,
                            "subjectId": subject["subjectId"],
                            "teacherId": teacher_id,
                            "classroomId": classroom_id,
                            "dayOfWeek": day,
                            "period": period_num,
                            "startTime": period["start"],
                            "endTime": period["end"],
                            "isFreeTime": False
                        }
                        
                        schedules.append(schedule)
                        schedule_id += 1
                        
                        # Mark slot as used
                        if day not in used_slots[class_id]:
                            used_slots[class_id][day] = []
                        used_slots[class_id][day].append(period_num)
                        
                        # Mark teacher and classroom as busy
                        teacher_schedule[teacher_id][day].append(period_num)
                        classroom_schedule[classroom_id][day].append(period_num)
                        
                        sessions_scheduled += 1
                
                # If we couldn't schedule all sessions on different days, use the same days
                if sessions_scheduled < num_sessions:
                    days_copy = weekdays.copy()
                    
                    while sessions_scheduled < num_sessions and days_copy:
                        day = days_copy.pop(0)
                        
                        # Find available periods
                        available_periods = []
                        for period_num in periods:
                            class_available = period_num not in used_slots[class_id].get(day, [])
                            teacher_available = period_num not in teacher_schedule[teacher_id].get(day, [])
                            classroom_available = period_num not in classroom_schedule[classroom_id].get(day, [])
                            
                            if class_available and teacher_available and classroom_available:
                                available_periods.append(period_num)
                        
                        if available_periods:
                            period_num = random.choice(available_periods)
                            period = periods[period_num]
                            
                            schedule = {
                                "scheduleId": schedule_id,
                                "semesterId": 1,
                                "classId": class_id,
                                "subjectId": subject["subjectId"],
                                "teacherId": teacher_id,
                                "classroomId": classroom_id,
                                "dayOfWeek": day,
                                "period": period_num,
                                "startTime": period["start"],
                                "endTime": period["end"],
                                "isFreeTime": False
                            }
                            
                            schedules.append(schedule)
                            schedule_id += 1
                            
                            # Mark slot as used
                            if day not in used_slots[class_id]:
                                used_slots[class_id][day] = []
                            used_slots[class_id][day].append(period_num)
                            
                            # Mark teacher and classroom as busy
                            teacher_schedule[teacher_id][day].append(period_num)
                            classroom_schedule[classroom_id][day].append(period_num)
                            
                            sessions_scheduled += 1
    
    # Fill remaining slots with free periods
    for class_doc in classes:
        class_id = class_doc["classId"]
        
        for day in weekdays:
            if day not in used_slots[class_id]:
                used_slots[class_id][day] = []
            
            # Check each period
            for period_num in periods:
                if period_num not in used_slots[class_id][day]:
                    period = periods[period_num]
                    
                    # Add as free time
                    schedule = {
                        "scheduleId": schedule_id,
                        "semesterId": 1,
                        "classId": class_id,
                        "subjectId": None,
                        "teacherId": None,
                        "classroomId": None,
                        "dayOfWeek": day,
                        "period": period_num,
                        "startTime": period["start"],
                        "endTime": period["end"],
                        "isFreeTime": True
                    }
                    
                    schedules.append(schedule)
                    schedule_id += 1
                    
                    # Mark slot as used
                    used_slots[class_id][day].append(period_num)
    
    if schedules:
        db.schedules.insert_many(schedules)
        print(f"{len(schedules)} schedule entries created")
    
    # Create curriculum documents
    curriculums = []
    for grade, curriculum in curriculum_data.items():
        # Get batch for this grade
        batch = next((b for b in batches if b["grade"] == grade), None)
        if batch:
            subject_ids = []
            for subject_name in curriculum:
                subject = subject_name_to_doc.get(subject_name)
                if subject:
                    subject_ids.append(subject["subjectId"])
            
            curriculum_doc = {
                "curriculumId": grade,
                "curriculumName": f"Chương trình lớp {grade}",
                "description": f"Chương trình học dành cho học sinh lớp {grade}",
                "batchId": batch["batchId"],
                "subjectIds": subject_ids
            }
            curriculums.append(curriculum_doc)
    
    if curriculums:
        db.curriculums.insert_many(curriculums)
        print(f"{len(curriculums)} curriculum documents created")

if __name__ == "__main__":
    init_database()