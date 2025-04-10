"""
Classroom and class data generation for FAMS
"""
import csv
import os
from src.utils import find_file_path
from src.models.class_model import Classroom, Class


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


def distribute_students(db, students, grade, batch_id):
    """Distribute students into classes"""
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
    
    students_sorted = sorted(students, key=get_full_name)
    chunk_size = 20  # Number of students per class
    class_index = 1
    created_classes = []
    
    # Make sure classes collection exists
    if "Class" not in db.list_collection_names():
        db.create_collection("Class")
    
    for i in range(0, len(students_sorted), chunk_size):
        chunk = students_sorted[i:i+chunk_size]
        class_name = f"{grade}A{class_index}"
        class_index += 1
        
        c_doc = {
            "className": class_name,
            "homeroomTeacherId": None,
            "batchId": batch_id  # Sử dụng batchId thay vì BatchID để thống nhất
        }
        
        r = db.Class.insert_one(c_doc)
        new_class_id = db.Class.count_documents({})
        db.Class.update_one({"_id": r.inserted_id}, {"$set": {"classId": new_class_id}})
        created_classes.append({"classId": new_class_id, "className": class_name})
        
        for st in chunk:
            db.Student.update_one({"studentId": st["studentId"]}, {"$set": {"classId": new_class_id}})
            
    return created_classes


def create_all_classes(db, students_by_grade):
    """Create classes for all grades and distribute students"""
    all_classes = []
    
    # Distribute students into classes based on grade
    grade10_classes = distribute_students(db, students_by_grade["grade10"], 10, 3)
    grade11_classes = distribute_students(db, students_by_grade["grade11"], 11, 2)
    grade12_classes = distribute_students(db, students_by_grade["grade12"], 12, 1)
    
    all_classes = grade10_classes + grade11_classes + grade12_classes
    print(f"[INIT] Created {len(all_classes)} classes and distributed students.")
    
    return all_classes 