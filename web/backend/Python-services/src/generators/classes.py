"""
Classroom and class data generation for FAMS
"""
import csv
import os
import random
from src.utils import find_file_path
from src.models.Classroom import Classroom
from src.models.Class import Class
import datetime
from bson import ObjectId


def import_classrooms(db):
    """Import classrooms from CSV file"""
    room_csv = "src/data/room.csv"
    rooms = []
    
    if os.path.exists(room_csv):
        with open(room_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=1):
                classroom = Classroom.from_csv_row(row, i)
                rooms.append(classroom.dict(exclude={"collection"}))
                
        if rooms:
            db.classrooms.insert_many(rooms)
            print(f"[INIT] Imported {len(rooms)} rooms from room.csv.")
    else:
        # Create default classrooms if no CSV found
        default_rooms = [
            Classroom(
                classroomId=1,
                classroomName="A101",
                location="Building A",
                capacity=40
            ),
            Classroom(
                classroomId=2,
                classroomName="A102",
                location="Building A",
                capacity=40
            ),
            Classroom(
                classroomId=3,
                classroomName="B101",
                location="Building B",
                capacity=40
            ),
            Classroom(
                classroomId=4,
                classroomName="B102",
                location="Building B",
                capacity=40
            )
        ]
        
        default_room_dicts = [room.dict(exclude={"collection"}) for room in default_rooms]
        db.classrooms.insert_many(default_room_dicts)
        rooms = default_room_dicts
        print(f"[INIT] Created {len(default_room_dicts)} default classrooms.")
        
    return rooms


def distribute_students(db, students, grade, batch_id, academic_year=None):
    """Distribute students into classes
    
    Args:
        db: MongoDB database connection
        students: List of student dictionaries
        grade: Grade level (e.g. 10)
        batch_id: Used for logging purposes
        academic_year: Academic year for the classes (e.g. "2022-2023")
    
    Returns:
        List of created class dictionaries
    """
    # Lấy tên đầy đủ của học sinh
    def get_full_name(student):
        if "fullName" in student:
            return student["fullName"]
        elif "firstName" in student and "lastName" in student:
            return f"{student['firstName']} {student['lastName']}".strip()
        else:
            # Trả về studentId nếu không có tên
            return str(student.get("studentId", ""))
        
    # In ra một học sinh để debug
    if students and len(students) > 0:
        print(f"Student sample: {students[0]}")
    
    # Nếu không có academic_year, tạo dựa trên năm hiện tại
    if not academic_year:
        current_year = datetime.datetime.now().year
        academic_year = f"{current_year}-{current_year+1}"
    
    print(f"[INFO] Creating classes for academic year: {academic_year}")
    
    students_sorted = sorted(students, key=get_full_name)
    chunk_size = 20  # Number of students per class (changed from 40 to 20)
    class_index = 1
    created_classes = []
    
    # Make sure classes collection exists
    if "Class" not in db.list_collection_names():
        db.create_collection("Class")
    
    # Convert batch_id to integer if it's a string
    if isinstance(batch_id, str):
        try:
            batch_id = int(batch_id)
        except ValueError:
            print(f"Warning: Could not convert batch_id '{batch_id}' to integer")
    
    for i in range(0, len(students_sorted), chunk_size):
        chunk = students_sorted[i:i+chunk_size]
        class_name = f"{grade}A{class_index}"  # Using 10A1, 10A2 format
        class_index += 1
        
        c_doc = {
            "_id": ObjectId(),  # Pre-generate an ObjectId
            "className": class_name,
            "grade": grade,
            "homeroomTeacherId": None,
            "academicYear": academic_year,
            "createdAt": datetime.datetime.now(),
            "isActive": True
        }
        
        r = db.Class.insert_one(c_doc)
        new_class_id = db.Class.count_documents({})
        db.Class.update_one({"_id": r.inserted_id}, {"$set": {"classId": new_class_id}})
        created_classes.append({"classId": new_class_id, "className": class_name})
        
        print(f"[DEBUG] Created class {class_name} with ID {new_class_id} and academicYear {academic_year}")
        
        for st in chunk:
            student_id = st["studentId"]
            # Cập nhật để sử dụng classIds thay vì classId
            db.Student.update_one(
                {"studentId": student_id}, 
                {"$addToSet": {"classIds": new_class_id}}
            )
            print(f"[DEBUG] Assigned student ID {student_id} to class {new_class_id} ({class_name})")
            
    print(f"[INFO] Created {len(created_classes)} classes for grade {grade}")
    return created_classes


def create_class_if_needed(db, class_name, grade, batch_id, academic_year):
    """
    Check if a class with the given name exists, create if not
    
    Args:
        db: MongoDB database connection
        class_name: Name of the class (e.g. "10A1")
        grade: Grade level (e.g. 10)
        batch_id: Used for logging purposes
        academic_year: Academic year string (e.g. "2024-2025")
        
    Returns:
        Dictionary with class information
    """
    # Make sure classes collection exists
    if "classes" not in db.list_collection_names() and "Class" not in db.list_collection_names():
        db.create_collection("Class")
    
    # Determine collection name (could be "Class" or "classes")
    collection_name = "Class" if "Class" in db.list_collection_names() else "classes"
    
    # Check if class exists
    existing_class = db[collection_name].find_one({"className": class_name})
    
    if existing_class:
        return existing_class
    
    # Convert batch_id to integer if it's a string
    if isinstance(batch_id, str):
        try:
            batch_id = int(batch_id)
        except ValueError:
            print(f"Warning: Could not convert batch_id '{batch_id}' to integer")
    
    # Create new class if not exists
    new_class = {
        "_id": ObjectId(),  # Pre-generate an ObjectId
        "className": class_name,
        "grade": grade,
        "homeroomTeacherId": None,
        "academicYear": academic_year,
        "createdAt": datetime.datetime.now(),
        "isActive": True
    }
    
    result = db[collection_name].insert_one(new_class)
    
    # Check if we need to set a classId
    if "classId" not in new_class:
        new_class_id = db[collection_name].count_documents({})
        db[collection_name].update_one({"_id": result.inserted_id}, {"$set": {"classId": new_class_id}})
        new_class["classId"] = new_class_id
    
    print(f"Created new class: {class_name} (Grade {grade}, Batch {batch_id})")
    
    return new_class


def assign_homeroom_teachers(db, academic_year=None):
    """
    Assign homeroom teachers to classes randomly
    
    Args:
        db: MongoDB database connection
        academic_year: Optional academic year to filter classes
        
    Returns:
        Dict containing count of assigned classes and list of assigned teacher IDs
    """
    # Get all active teachers
    teachers = list(db.Teacher.find({"isActive": True}))
    if not teachers:
        print(f"[WARNING] No active teachers found to assign as homeroom teachers")
        return {"assigned_count": 0, "assigned_teachers": []}
    
    print(f"[INFO] Found {len(teachers)} active teachers to assign as homeroom teachers")
    
    # Get classes for the given academic year or all classes if not specified
    class_query = {"isActive": True}
    if academic_year:
        class_query["academicYear"] = academic_year
    
    classes = list(db.Class.find(class_query))
    if not classes:
        print(f"[WARNING] No active classes found for assignment")
        return {"assigned_count": 0, "assigned_teachers": []}
    
    print(f"[INFO] Found {len(classes)} active classes for homeroom teacher assignment")
    
    # Group classes by academic year
    classes_by_year = {}
    for cls in classes:
        year = cls.get("academicYear")
        if year not in classes_by_year:
            classes_by_year[year] = []
        classes_by_year[year].append(cls)
    
    # Assign teachers for each academic year
    assigned_count = 0
    assigned_teachers = []
    
    for year, year_classes in classes_by_year.items():
        print(f"[INFO] Assigning homeroom teachers for academic year {year}")
        
        # Get teachers who aren't already homeroom teachers for this year
        already_assigned = set()
        for cls in year_classes:
            if cls.get("homeroomTeacherId") is not None:
                already_assigned.add(cls.get("homeroomTeacherId"))
                
        # Find unassigned classes
        unassigned_classes = [cls for cls in year_classes if cls.get("homeroomTeacherId") is None]
        if not unassigned_classes:
            print(f"[INFO] All classes in {year} already have homeroom teachers")
            continue
            
        # Get available teachers (those not already assigned as homeroom for this year)
        available_teachers = [t for t in teachers if t.get("userId") not in already_assigned]
        
        if len(available_teachers) < len(unassigned_classes):
            print(f"[WARNING] Not enough teachers ({len(available_teachers)}) to assign to all classes ({len(unassigned_classes)}) in {year}!")
            # We'll assign as many as we can
        
        # Randomly shuffle both lists
        random.shuffle(available_teachers)
        random.shuffle(unassigned_classes)
        
        # Assign teachers to classes
        for i, cls in enumerate(unassigned_classes):
            if i >= len(available_teachers):
                print(f"[WARNING] Ran out of available teachers for {year}. {len(unassigned_classes) - i} classes left unassigned.")
                break
                
            teacher = available_teachers[i]
            teacher_id = teacher.get("teacherId")
            teacher_user_id = teacher.get("userId")  # Use userId instead of teacherId
            class_id = cls.get("classId")
            
            # Update the class with the assigned teacher's userId
            db.Class.update_one(
                {"classId": class_id},
                {"$set": {"homeroomTeacherId": teacher_user_id}}
            )
            
            print(f"[INFO] Assigned teacher {teacher.get('fullName')} (ID: {teacher_id}, UserID: {teacher_user_id}) as homeroom teacher for class {cls.get('className')} (ID: {class_id})")
            assigned_count += 1
            assigned_teachers.append(teacher_user_id)
    
    print(f"[INFO] Successfully assigned {assigned_count} homeroom teachers")
    return {"assigned_count": assigned_count, "assigned_teachers": assigned_teachers}


def create_all_classes(db, students_by_grade):
    """Create classes for all grades and distribute students"""
    all_classes = []
    
    # Get current academic year
    current_year = datetime.datetime.now().year
    next_year = current_year + 1
    academic_year = f"{current_year}-{next_year}"
    
    # Distribute students into classes based on grade
    grade10_classes = distribute_students(db, students_by_grade["grade10"], 10, 3, academic_year)
    grade11_classes = distribute_students(db, students_by_grade["grade11"], 11, 2, academic_year)
    grade12_classes = distribute_students(db, students_by_grade["grade12"], 12, 1, academic_year)
    
    all_classes = grade10_classes + grade11_classes + grade12_classes
    print(f"[INIT] Created {len(all_classes)} classes and distributed students.")
    
    # Assign homeroom teachers to the newly created classes
    assignment_result = assign_homeroom_teachers(db, academic_year)
    print(f"[INIT] Assigned {assignment_result['assigned_count']} homeroom teachers to classes.")
    
    return all_classes 