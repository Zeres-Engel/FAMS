"""
Database management router for FAMS API
Handles database initialization and other database operations
"""
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, Query, Body
from typing import List, Optional, Dict
import os
import shutil
import datetime
from bson.objectid import ObjectId
from .init_db_excel import init_database_from_excel, init_fams, init_users_only_from_excel
from .models import ResponseModel, ErrorResponseModel
import pandas as pd
from ..schedule.core import generate_improved_schedule
import re

router = APIRouter()

@router.post("/initFAMS")
async def initialize_fams(background_tasks: BackgroundTasks):
    """
    Initialize FAMS with basic data only (no students, teachers, or schedules)
    
    This endpoint will:
    1. Create all collections based on FAMS.sql schema
    2. Create appropriate indexes for performance
    3. Load basic data (subjects, classrooms, time slots)
    4. Create admin user
    5. Generate semester structure
    6. Import data from FAMS_12.xlsx and create grade 10 classes with academic year 2022-2023
    
    Returns a response when initialization has started.
    """
    background_tasks.add_task(init_fams_with_sample_data)
    return ResponseModel(
        "FAMS initialization started in background",
        "FAMS initialization process with database structure based on SQL schema has been queued. Check logs for progress."
    )

def promote_students_to_next_grade(db, current_academic_year, next_academic_year):
    """Promotes students to the next grade level.
    - Students in grade 10 move to grade 11
    - Students in grade 11 move to grade 12
    - Students in grade 12 graduate (not implemented)
    
    Args:
        db: MongoDB database connection
        current_academic_year: The current academic year (e.g., "2022-2023")
        next_academic_year: The next academic year (e.g., "2023-2024")
    
    Returns:
        A summary dictionary of the promotion results
    """
    print(f"[INFO] Promoting students from {current_academic_year} to {next_academic_year}")
    
    results = {
        "promoted_students": 0,
        "created_classes": [],
        "errors": []
    }
    
    # Get classes for the current academic year
    current_classes = list(db.Class.find({"academicYear": current_academic_year}))
    print(f"[DEBUG] Found {len(current_classes)} classes for academic year {current_academic_year}")
    
    if not current_classes:
        error_msg = f"No classes found for academic year {current_academic_year}"
        print(f"[ERROR] {error_msg}")
        results["errors"].append(error_msg)
        return results
    
    # Group classes by grade
    classes_by_grade = {}
    for cls in current_classes:
        grade = cls.get("grade")
        if grade:
            if grade not in classes_by_grade:
                classes_by_grade[grade] = []
            classes_by_grade[grade].append(cls)
    
    print(f"[DEBUG] Classes by grade: {', '.join([f'Grade {k}: {len(v)}' for k, v in classes_by_grade.items()])}")
    
    # Process grade 10 and 11 classes
    for current_grade in [10, 11]:
        next_grade = current_grade + 1
        current_grade_classes = classes_by_grade.get(current_grade, [])
        
        print(f"[INFO] Processing {len(current_grade_classes)} classes for grade {current_grade}")
        
        # Special case for 2023-2024 academic year: create more classes for grade 11
        extra_classes_count = 0
        if current_grade == 10 and next_academic_year == "2023-2024":
            # Count total number of students in grade 10
            total_students = 0
            for cls in current_grade_classes:
                class_id = cls.get("classId")
                if class_id:
                    student_count = db.Student.count_documents({"classId": class_id})
                    total_students += student_count
            
            # Calculate how many additional classes we need (aim for ~40 students per class)
            students_per_class = 40
            existing_classes_count = len(current_grade_classes)
            total_classes_needed = (total_students + students_per_class - 1) // students_per_class
            
            extra_classes_count = max(0, total_classes_needed - existing_classes_count)
            
            print(f"[INFO] For 2023-2024 academic year, need to create {extra_classes_count} additional classes " +
                  f"to accommodate {total_students} students from grade 10 to 11")
            
        # Create new classes for next grade with same naming pattern but incremented grade
        next_grade_classes = []
        for i, current_class in enumerate(current_grade_classes):
            current_class_name = current_class.get("className", "")
            next_class_name = current_class_name.replace(str(current_grade), str(next_grade))
            
            # Create new class for next grade
            new_class = {
                "_id": ObjectId(),
                "className": next_class_name,
                "grade": next_grade,
                "academicYear": next_academic_year,
                "homeroomTeacherId": None,
                "createdAt": datetime.datetime.now(),
                "isActive": True
            }
            
            r = db.Class.insert_one(new_class)
            new_class_id = db.Class.count_documents({})
            db.Class.update_one({"_id": r.inserted_id}, {"$set": {"classId": new_class_id}})
            
            next_grade_classes.append({
                "classId": new_class_id,
                "className": next_class_name,
                "oldClassId": current_class.get("classId")
            })
            
            print(f"[DEBUG] Created new class: {next_class_name} (ID: {new_class_id}) for academic year {next_academic_year}")
        
        # Create additional classes if needed for 2023-2024 academic year
        if extra_classes_count > 0:
            # Find the highest class number used so far
            highest_class_num = 0
            for next_class in next_grade_classes:
                class_name = next_class["className"]
                match = re.search(rf"{next_grade}A(\d+)", class_name)
                if match:
                    class_num = int(match.group(1))
                    highest_class_num = max(highest_class_num, class_num)
            
            # Create additional classes
            for i in range(extra_classes_count):
                class_num = highest_class_num + i + 1
                new_class_name = f"{next_grade}A{class_num}"
                
                new_class = {
                    "_id": ObjectId(),
                    "className": new_class_name,
                    "grade": next_grade,
                    "academicYear": next_academic_year,
                    "homeroomTeacherId": None,
                    "createdAt": datetime.datetime.now(),
                    "isActive": True
                }
                
                r = db.Class.insert_one(new_class)
                new_class_id = db.Class.count_documents({})
                db.Class.update_one({"_id": r.inserted_id}, {"$set": {"classId": new_class_id}})
                
                # These classes don't have an oldClassId since they're new
                next_grade_classes.append({
                    "classId": new_class_id,
                    "className": new_class_name,
                    "oldClassId": None  # No old class
                })
                
                print(f"[DEBUG] Created additional class: {new_class_name} (ID: {new_class_id}) for academic year {next_academic_year}")
        
        # Distribute students evenly among the new classes
        if current_grade == 10 and next_academic_year == "2023-2024" and extra_classes_count > 0:
            # Collect all students from grade 10
            all_students = []
            for cls in current_grade_classes:
                class_id = cls.get("classId")
                if class_id:
                    students = list(db.Student.find({"classId": class_id}))
                    all_students.extend(students)
            
            print(f"[INFO] Redistributing {len(all_students)} students from grade 10 across {len(next_grade_classes)} classes for grade 11")
            
            # Sort students by name for more predictable distribution
            all_students.sort(key=lambda s: s.get("fullName", ""))
            
            # Calculate students per class
            students_per_class = len(all_students) / len(next_grade_classes)
            
            # Clear the oldClassId mapping since we're redistributing
            for next_class in next_grade_classes:
                next_class["oldClassId"] = None
            
            # Distribute students evenly
            class_idx = 0
            students_assigned = 0
            for student in all_students:
                student_id = student.get("studentId")
                student_name = student.get("fullName", f"ID: {student_id}")
                
                # Move to next class if we've filled the current one
                if students_assigned >= (class_idx + 1) * students_per_class and class_idx < len(next_grade_classes) - 1:
                    class_idx += 1
                
                next_class_id = next_grade_classes[class_idx]["classId"]
                
                # Update student's classIds to include the new class
                db.Student.update_one(
                    {"studentId": student_id},
                    {"$addToSet": {"classIds": next_class_id}}  # Use $addToSet to add to array
                )
                
                print(f"[DEBUG] Assigned student {student_name} to class ID {next_class_id}")
                results["promoted_students"] += 1
                students_assigned += 1
            
        else:
            # Standard promotion - assign students to corresponding next grade classes
            for next_class in next_grade_classes:
                old_class_id = next_class["oldClassId"]
                next_class_id = next_class["classId"]
                
                # Skip if this is a new class with no old class association
                if old_class_id is None:
                    continue
                    
                # Find students in the current class - use the last item in classIds array
                students = list(db.Student.find({"classIds": {"$elemMatch": {"$eq": old_class_id}}}))
                
                print(f"[DEBUG] Found {len(students)} students in class ID {old_class_id} to promote to class ID {next_class_id}")
                
                for student in students:
                    # Update student's classIds to include the new class
                    student_id = student.get("studentId")
                    student_name = student.get("fullName", f"ID: {student_id}")
                    
                    db.Student.update_one(
                        {"studentId": student_id},
                        {"$addToSet": {"classIds": next_class_id}}  # Use $addToSet to add to array
                    )
                    
                    print(f"[DEBUG] Promoted student {student_name} from class ID {old_class_id} to class ID {next_class_id}")
                    results["promoted_students"] += 1
                
        results["created_classes"].extend(next_grade_classes)
    
    print(f"[INFO] Promotion completed: {results['promoted_students']} students promoted, {len(results['created_classes'])} classes created")
    return results

async def init_fams_with_sample_data():
    """Initialize FAMS with sample data from FAMS_12.xlsx, FAMS_11.xlsx and FAMS_10.xlsx"""
    from ..excel_data_loader import import_all_teachers_from_excel, generate_all_students_from_excel
    from ..generators.classes import create_all_classes, distribute_students, assign_homeroom_teachers
    from ..utils import hash_password, generate_username
    
    # Step 1: Initialize basic FAMS structure
    result = init_fams()
    print("[INFO] Basic FAMS structure initialized")
    
    # Connect to MongoDB
    from ..db import connect_to_mongodb
    client = connect_to_mongodb()
    db = client["fams"]
    
    # Process files in order for different academic years
    sample_files = [
        {"path": "src/data/xlsx/sample/FAMS_12.xlsx", "year": "2022-2023", "grade": 10},
        {"path": "src/data/xlsx/sample/FAMS_11.xlsx", "year": "2023-2024", "grade": 10},
        {"path": "src/data/xlsx/sample/FAMS_10.xlsx", "year": "2024-2025", "grade": 10}
    ]
    
    # Dictionary to track created teachers to avoid duplicates
    all_teachers_by_email = {}
    
    # Track created batches
    batches = {}
    
    # Lấy danh sách giáo viên đã nhập để sử dụng lại
    saved_teachers_data = []
    
    # Track academic years for each teacher to allow duplicates across different years
    teachers_by_year = {}
    
    # Process each sample file
    for file_idx, file_info in enumerate(sample_files):
        excel_path = file_info["path"]
        academic_year = file_info["year"]
        grade = file_info["grade"]
        
        if not os.path.exists(excel_path):
            print(f"[WARNING] Sample file not found: {excel_path}")
            continue
            
        print(f"[INFO] Processing file: {excel_path} for academic year {academic_year}, grade {grade}")
        
        # Nếu là năm học tiếp theo (2023-2024 hoặc 2024-2025), thực hiện lên lớp từ năm học trước
        if file_idx > 0:  # Không phải năm học đầu tiên
            previous_academic_year = sample_files[file_idx-1]["year"]
            print(f"[INFO] Promoting students from previous academic year {previous_academic_year} to {academic_year}")
            
            # Use the dedicated function for student promotion
            promotion_results = promote_students_to_next_grade(db, previous_academic_year, academic_year)
            
            print(f"[INFO] Promotion completed: {promotion_results['promoted_students']} students promoted, {len(promotion_results['created_classes'])} classes created")
            
            # Check for any errors
            if promotion_results["errors"]:
                print(f"[WARNING] Encountered {len(promotion_results['errors'])} errors during promotion:")
                for error in promotion_results["errors"]:
                    print(f"  - {error}")
        
        # Tiếp tục xử lý import học sinh từ file Excel
        # Đoạn code xử lý import bình thường
        
        # Step 3: Import teachers and students from Excel
        # First, process the Excel file ourselves to ensure we capture all details
        print(f"[INFO] Processing Excel file {excel_path} for complete data extraction")
        
        # Read the Excel file with all sheets
        excel_file = pd.ExcelFile(excel_path)
        sheets = excel_file.sheet_names
        
        # Dictionary to store extracted teachers and students
        extracted_teachers = []
        extracted_students = []
        
        for sheet in sheets:
            df = pd.read_excel(excel_path, sheet_name=sheet)
            
            # Determine role based on sheet name
            is_teacher_sheet = "giáo viên" in sheet.lower() or "teacher" in sheet.lower()
            
            for _, row in df.iterrows():
                # Skip rows without name
                name = row.get('Họ và Tên', row.get('Name', row.get('Họ Tên', '')))
                if pd.isna(name) or not name:
                    continue
                
                # Process common fields
                gender_str = str(row.get('Giới tính', row.get('Gender', '')))
                gender = gender_str.lower() in ["nam", "male", "true", "1"]
                
                address = str(row.get('Địa chỉ', row.get('Address', '')))
                phone = str(row.get('Số điện thoại', row.get('Phone', row.get('Điện thoại', ''))))
                
                # Process date of birth
                dob_str = row.get('Ngày sinh', row.get('DOB', row.get('Birthday', '')))
                dob = None
                if not pd.isna(dob_str):
                    try:
                        if isinstance(dob_str, datetime.datetime):
                            dob = dob_str
                        else:
                            # Try common formats
                            date_formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y']
                            for fmt in date_formats:
                                try:
                                    dob = datetime.datetime.strptime(str(dob_str), fmt)
                                    break
                                except ValueError:
                                    continue
                    except Exception as e:
                        print(f"[WARNING] Error parsing date {dob_str}: {str(e)}")
                
                if is_teacher_sheet:
                    # Extract teacher-specific fields
                    email = str(row.get('Email', f"{generate_username(name, len(extracted_teachers)+1, 'teacher')}@fams.edu.vn"))
                    major = str(row.get('Chuyên môn', row.get('Major', row.get('Môn giảng dạy', ''))))
                    degree = str(row.get('Bằng cấp', row.get('Degree', '')))
                    weekly_capacity = 10
                    try:
                        capacity_val = row.get('Số tiết/tuần', row.get('WeeklyCapacity', 10))
                        if not pd.isna(capacity_val):
                            weekly_capacity = int(capacity_val)
                    except (ValueError, TypeError):
                        weekly_capacity = 10
                    
                    # Skip duplicate teachers (by email)
                    if email in all_teachers_by_email:
                        continue
                    
                    teacher = {
                        "fullName": str(name),
                        "gender": gender,
                        "dateOfBirth": dob,
                        "address": address,
                        "phone": phone,
                        "email": email,
                        "major": major,
                        "degree": degree,
                        "weeklyCapacity": weekly_capacity
                    }
                    extracted_teachers.append(teacher)
                else:
                    # Extract student-specific fields
                    student = {
                        "fullName": str(name),
                        "gender": gender,
                        "dateOfBirth": dob,
                        "address": address,
                        "phone": phone,
                        "email": f"{generate_username(name, len(extracted_students)+1, 'student')}@fams.edu.vn"
                    }
                    
                    # Extract parent information
                    parents = []
                    
                    # Parent 1
                    parent1_name = row.get('Tên Phụ huynh 1', '')
                    if parent1_name and not pd.isna(parent1_name):
                        parent1_gender = str(row.get('Giới tính Phụ huynh 1', ''))
                        parent1 = {
                            "name": str(parent1_name),
                            "career": str(row.get('Nghề nghiệp Phụ huynh 1', '')),
                            "phone": str(row.get('SĐT Phụ huynh 1', '')),
                            "gender": parent1_gender.lower() in ["nam", "male", "true", "1"],
                            "email": str(row.get('Email Phụ huynh 1', '')),
                            "relationship": "Father" if 'Nam' in parent1_gender else "Mother"
                        }
                        parents.append(parent1)
                    
                    # Parent 2
                    parent2_name = row.get('Tên Phụ huynh 2', '')
                    if parent2_name and not pd.isna(parent2_name):
                        parent2_gender = str(row.get('Giới tính Phụ huynh 2', ''))
                        parent2 = {
                            "name": str(parent2_name),
                            "career": str(row.get('Nghề nghiệp Phụ huynh 2', '')),
                            "phone": str(row.get('SĐT Phụ huynh 2', '')),
                            "gender": parent2_gender.lower() in ["nam", "male", "true", "1"],
                            "email": str(row.get('Email Phụ huynh 2', '')),
                            "relationship": "Father" if 'Nam' in parent2_gender else "Mother"
                        }
                        parents.append(parent2)
                    
                    student["parents"] = parents
                    extracted_students.append(student)
        
        # Lưu danh sách giáo viên để tái sử dụng nếu cần
        if len(extracted_teachers) > 0:
            saved_teachers_data = extracted_teachers.copy()
        elif saved_teachers_data:
            # Nếu không có giáo viên trong file này, sử dụng giáo viên đã lưu
            extracted_teachers = saved_teachers_data.copy()
            print(f"[INFO] Re-using {len(extracted_teachers)} teachers from previous data since no teachers found in {excel_path}")
        
        print(f"[INFO] Extracted {len(extracted_teachers)} teachers and {len(extracted_students)} students from Excel file")
        
        # Create or get existing batch
        start_year = int(academic_year.split("-")[0])
        end_year = start_year + 3
        
        # Create a batch if it doesn't exist for this start year
        if start_year not in batches:
            # Get the latest batch ID
            last_batch = db.Batch.find_one(sort=[("batchId", -1)])
            batch_id = 1
            if last_batch and "batchId" in last_batch:
                try:
                    batch_id = int(last_batch["batchId"]) + 1
                except (ValueError, TypeError):
                    batch_id = 1
            
            batch_name = f"Khóa {start_year}-{end_year} (Lớp {grade})"
            
            # Check if batch exists
            existing_batch = db.Batch.find_one({"startYear": start_year})
            if existing_batch:
                batch_id = existing_batch["batchId"]
                batch_name = existing_batch["batchName"]
                print(f"[INFO] Using existing batch: {batch_name} with ID: {batch_id}")
            else:
                # Create the batch document
                batch_doc = {
                    "batchId": batch_id,
                    "batchName": batch_name,
                    "startYear": start_year,
                    "createdAt": datetime.datetime.now(),
                    "updatedAt": datetime.datetime.now(),
                    "isActive": True
                }
                
                # Insert the batch
                db.Batch.insert_one(batch_doc)
                print(f"[INFO] Created new batch: {batch_name} with ID: {batch_id}")
            
            batches[start_year] = batch_id
        else:
            batch_id = batches[start_year]
            print(f"[INFO] Using existing batch ID: {batch_id} for start year {start_year}")
        
        # Create teacher accounts for new teachers
        teacher_ids = []
        for idx, teacher_data in enumerate(extracted_teachers):
            email = teacher_data.get("email")
            
            # Check if teacher already exists
            existing_teacher = db.Teacher.find_one({"email": email, "academicYear": academic_year})
            if existing_teacher:
                teacher_ids.append(existing_teacher["teacherId"])
                all_teachers_by_email[email] = existing_teacher["teacherId"]
                continue
            
            # Create username for new teachers
            username = generate_username(teacher_data["fullName"], idx + 1, role="teacher")
            
            # Check if UserAccount exists
            existing_user = db.UserAccount.find_one({"email": email})
            if not existing_user:
                # Create UserAccount document
                user_account = {
                    "userId": username,
                    "email": email,
                    "password": hash_password("123456"),  # Default password
                    "role": "teacher",
                    "createdAt": datetime.datetime.now(),
                    "updatedAt": datetime.datetime.now(),
                    "isActive": True
                }
                
                # Insert UserAccount
                db.UserAccount.insert_one(user_account)
            else:
                username = existing_user["userId"]
            
            # Get next teacher ID
            last_teacher = db.Teacher.find_one(sort=[("teacherId", -1)])
            teacher_id = 1
            if last_teacher and "teacherId" in last_teacher:
                try:
                    teacher_id = int(last_teacher["teacherId"]) + 1
                except (ValueError, TypeError):
                    teacher_id = 1
            
            # Create teacher document
            teacher_doc = {
                "teacherId": teacher_id,
                "userId": username,
                "fullName": teacher_data["fullName"],
                "email": email,
                "dateOfBirth": teacher_data.get("dateOfBirth"),
                "gender": teacher_data.get("gender", False),
                "address": teacher_data.get("address", ""),
                "phone": teacher_data.get("phone", ""),
                "major": teacher_data.get("major", ""),
                "degree": teacher_data.get("degree", ""),
                "weeklyCapacity": teacher_data.get("weeklyCapacity", 10),
                "classIds": [],  # Initialize empty classIds array for tracking teaching history
                "createdAt": datetime.datetime.now(),
                "updatedAt": datetime.datetime.now(),
                "isActive": True,
                "academicYear": academic_year  # Add academic year to teacher record
            }
            
            # Insert teacher
            db.Teacher.insert_one(teacher_doc)
            teacher_ids.append(teacher_id)
            all_teachers_by_email[email] = teacher_id
        
        print(f"[INFO] Created/found {len(teacher_ids)} teacher accounts for academic year {academic_year}")
        
        # Create student and parent accounts
        student_ids = []
        parent_ids = []
        
        for idx, student_data in enumerate(extracted_students):
            username = generate_username(student_data["fullName"], idx + 1, role="student")
            email = student_data.get("email") or f"{username}@fams.edu.vn"
            
            # Create UserAccount document
            user_account = {
                "userId": username,
                "email": email,
                "password": hash_password("123456"),  # Default password
                "role": "student",
                "createdAt": datetime.datetime.now(),
                "updatedAt": datetime.datetime.now(),
                "isActive": True
            }
            
            # Insert UserAccount
            db.UserAccount.insert_one(user_account)
            
            # Get next student ID
            last_student = db.Student.find_one(sort=[("studentId", -1)])
            student_id = 1
            if last_student and "studentId" in last_student:
                try:
                    student_id = int(last_student["studentId"]) + 1
                except (ValueError, TypeError):
                    student_id = 1
            
            # Create student document
            student_doc = {
                "studentId": student_id,
                "userId": username,
                "fullName": student_data["fullName"],
                "email": email,
                "dateOfBirth": student_data.get("dateOfBirth"),
                "gender": student_data.get("gender", False),
                "address": student_data.get("address", ""),
                "phone": student_data.get("phone", ""),
                "batchId": batch_id,
                "classIds": [],  # Use classIds array instead of classId scalar
                "createdAt": datetime.datetime.now(),
                "updatedAt": datetime.datetime.now(),
                "isActive": True
            }
            
            # Insert student
            db.Student.insert_one(student_doc)
            student_ids.append(student_id)
            
            # Process parents if they exist
            student_parents = student_data.get("parents", [])
            if student_parents:
                for parent_idx, parent_data in enumerate(student_parents):
                    # Skip empty parent names
                    if not parent_data.get("name"):
                        continue
                    
                    # Process parent as in user_management.py
                    offset = 1000 if parent_idx > 0 else 0  # Add offset for second parents
                    parent_username = generate_username(parent_data["name"], idx + offset, role="parent")
                    parent_email = parent_data.get("email") or f"{parent_username}@fams.edu.vn"
                    
                    # Create parent UserAccount
                    parent_account = {
                        "userId": parent_username,
                        "email": parent_email,
                        "password": hash_password("123456"),  # Default password
                        "role": "parent",
                        "createdAt": datetime.datetime.now(),
                        "updatedAt": datetime.datetime.now(),
                        "isActive": True
                    }
                    
                    # Insert UserAccount
                    db.UserAccount.insert_one(parent_account)
                    
                    # Get next parent ID
                    last_parent = db.Parent.find_one(sort=[("parentId", -1)])
                    parent_id = 1
                    if last_parent and "parentId" in last_parent:
                        try:
                            parent_id = int(last_parent["parentId"]) + 1
                        except (ValueError, TypeError):
                            parent_id = 1
                    
                    # Create parent document
                    parent_doc = {
                        "parentId": parent_id,
                        "userId": parent_username,
                        "fullName": parent_data["name"],
                        "career": parent_data.get("career", ""),
                        "phone": parent_data.get("phone", ""),
                        "gender": parent_data.get("gender", False),
                        "createdAt": datetime.datetime.now(),
                        "updatedAt": datetime.datetime.now(),
                        "isActive": True
                    }
                    
                    # Insert parent
                    db.Parent.insert_one(parent_doc)
                    parent_ids.append(parent_id)
                    
                    # Create ParentStudent relationship
                    last_relation = db.ParentStudent.find_one(sort=[("parentStudentId", -1)])
                    relation_id = 1
                    if last_relation and "parentStudentId" in last_relation:
                        try:
                            relation_id = int(last_relation["parentStudentId"]) + 1
                        except (ValueError, TypeError):
                            relation_id = 1
                    
                    parent_student_doc = {
                        "parentStudentId": relation_id,
                        "parentId": parent_id,
                        "studentId": student_id,
                        "relationship": parent_data.get("relationship", "Other"),
                        "isEmergencyContact": parent_idx == 0,  # First parent is emergency contact
                        "createdAt": datetime.datetime.now(),
                        "updatedAt": datetime.datetime.now(),
                        "isActive": True
                    }
                    
                    db.ParentStudent.insert_one(parent_student_doc)
        
        print(f"[INFO] Created {len(student_ids)} student accounts and {len(parent_ids)} parent accounts for academic year {academic_year}")
        
        # Create classes with grade and specific academic year
        # Create a custom students_by_grade dictionary with our batch_id
        current_grade_students = []
        
        # Get all students from DB with this batch ID
        all_students = list(db.Student.find({"batchId": batch_id, "$or": [{"classIds": []}, {"classIds": {"$exists": False}}]}))
        for student in all_students:
            if "studentId" in student:
                student_dict = {
                    "studentId": student["studentId"],
                    "batchId": batch_id
                }
                current_grade_students.append(student_dict)
        
        print(f"[INFO] Preparing to create classes with {len(current_grade_students)} students for grade {grade}")
        
        # Create classes and distribute students using our dictionary
        try:
            # Tạo lớp cho từng khối riêng biệt
            grade_classes = distribute_students(db, current_grade_students, grade, batch_id, academic_year)
            print(f"[INFO] Created {len(grade_classes)} classes for grade {grade}")
            classes = grade_classes
        except Exception as e:
            print(f"[ERROR] Error creating classes: {str(e)}")
            import traceback
            print(traceback.format_exc())
            classes = []
        
        # Update academicYear for new classes
        for class_doc in db.Class.find({"grade": grade, "academicYear": None}):
            db.Class.update_one(
                {"_id": class_doc["_id"]},
                {"$set": {"academicYear": academic_year}}
            )
        print(f"[INFO] Updated classes with academic year: {academic_year}")
        
        # Generate Semester 1 and Semester 2 schedules with attendance logs
        print(f"[INFO] Starting schedule generation for both semesters in academic year {academic_year}")
        
        # First, ensure the Semester collection has entries for both semesters
        semesters = []
        for sem_num in [1, 2]:
            # Find or create semester
            semester_name = f"Học kỳ {sem_num}"
            existing_semester = db.Semester.find_one({
                "SemesterName": semester_name,
                "academicYear": academic_year,
                "grade": grade
            })
            
            # Define semester dates based on semester number
            year = int(academic_year.split("-")[0])
            if sem_num == 1:
                # First semester: Sep 1 - Dec 31
                start_date = datetime.datetime(year, 9, 1)
                end_date = datetime.datetime(year, 12, 31)
            else:
                # Second semester: Jan 1 - May 31
                start_date = datetime.datetime(year + 1, 1, 1)
                end_date = datetime.datetime(year + 1, 5, 31)
            
            if not existing_semester:
                # Create semester if not exists
                curriculum_id = 1  # Default curriculum ID
                next_id = 1
                last_semester = db.Semester.find_one(sort=[("SemesterID", -1)])
                if last_semester and "SemesterID" in last_semester:
                    next_id = int(last_semester["SemesterID"]) + 1
                
                semester_doc = {
                    "SemesterID": next_id,
                    "CurriculumID": curriculum_id,
                    "SemesterName": semester_name,
                    "StartDate": start_date,
                    "EndDate": end_date,
                    "grade": grade,  # Set grade explicitly
                    "academicYear": academic_year,
                    "createdAt": datetime.datetime.now(),
                    "updatedAt": datetime.datetime.now(),
                    "isActive": True
                }
                db.Semester.insert_one(semester_doc)
                semester_id = next_id
                print(f"[INFO] Created semester: {semester_name} with ID: {semester_id}")
            else:
                semester_id = existing_semester.get("SemesterID", 1)
                # Update the semester with the correct dates
                db.Semester.update_one(
                    {"_id": existing_semester["_id"]},
                    {"$set": {
                        "StartDate": start_date,
                        "EndDate": end_date
                    }}
                )
                print(f"[INFO] Updated existing semester: {semester_name} with academic year: {academic_year}")
            
            semesters.append({
                "id": semester_id, 
                "name": semester_name, 
                "number": sem_num,
                "startDate": start_date,
                "endDate": end_date
            })
        
        # Now generate schedules for both semesters
        schedules_count = 0
        attendance_logs_count = 0
        
        for semester in semesters:
            sem_number = semester["number"]
            sem_name = semester["name"]
            start_date = semester["startDate"]
            end_date = semester["endDate"]
            
            print(f"[INFO] Generating schedules for {sem_name} ({start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')})")
            
            # Prepare semester info for schedule generation
            semester_info = {
                "semesterNumber": sem_number,
                "semesterName": sem_name,
                "startDate": start_date,
                "endDate": end_date,
                "curriculumId": 1  # Default curriculum ID
            }
            
            # Generate schedules using improved algorithm
            try:
                schedules, warnings = generate_improved_schedule(
                    db=db,
                    semester_info=semester_info,
                    total_weeks=16,  # 16 weeks per semester
                    academic_year=academic_year  # Thêm tham số academicYear để chỉ lấy lớp của năm học này
                )
                
                if warnings:
                    print(f"[WARNING] Encountered {len(warnings)} warnings during schedule generation:")
                    for warning in warnings[:5]:  # Print only first 5 warnings
                        print(f"  - {warning}")
                    if len(warnings) > 5:
                        print(f"  - ... and {len(warnings) - 5} more")
                
                # Prepare schedules for database insertion
                cleaned_schedules = []
                for schedule in schedules:
                    clean_schedule = {
                        "scheduleId": schedule["scheduleId"],
                        "semesterId": semester["id"], 
                        "semesterNumber": sem_number,
                        "classId": schedule["classId"],
                        "subjectId": schedule["subjectId"],
                        "teacherId": schedule["teacherId"],
                        "classroomId": schedule["classroomId"],
                        "slotId": schedule["slotId"],
                        "topic": schedule.get("topic", ""),
                        "sessionDate": schedule["sessionDate"],
                        "sessionWeek": schedule.get("sessionWeek", ""),
                        "createdAt": datetime.datetime.now(),
                        "updatedAt": datetime.datetime.now(),
                        "isActive": True
                    }
                    cleaned_schedules.append(clean_schedule)
                
                # Insert schedules into database
                if cleaned_schedules:
                    db.ClassSchedule.insert_many(cleaned_schedules)
                    print(f"[INFO] Created {len(cleaned_schedules)} schedules for {sem_name}")
                    schedules_count += len(cleaned_schedules)
                else:
                    print(f"[WARNING] No schedules were generated for {sem_name}. Please check for errors.")
                
                # Generate attendance logs for each schedule
                attendance_logs = []
                next_attendance_id = 1
                
                # Get the last attendance ID if any exist
                last_attendance = db.AttendanceLog.find_one(sort=[("attendanceId", -1)])
                if last_attendance and "attendanceId" in last_attendance:
                    try:
                        next_attendance_id = int(last_attendance["attendanceId"]) + 1
                    except (ValueError, TypeError):
                        print(f"[WARNING] Could not parse attendanceId: {last_attendance.get('attendanceId')}. Starting from 1.")
                
                print(f"[INFO] Generating attendance logs with starting ID: {next_attendance_id}")
                
                # For each schedule, create attendance logs for all students in the class
                for schedule in cleaned_schedules:
                    class_id = schedule["classId"]
                    schedule_id = schedule["scheduleId"]
                    teacher_id = schedule["teacherId"]
                    
                    # Get all students in this class
                    students_in_class = list(db.Student.find({"classIds": class_id, "isActive": True}))
                    
                    if not students_in_class:
                        print(f"[WARNING] No students found for class ID: {class_id}")
                        continue
                    
                    print(f"[INFO] Creating attendance logs for class ID {class_id} with {len(students_in_class)} students")
                    
                    # Get teacher information
                    teacher = db.Teacher.find_one({"teacherId": teacher_id})
                    if teacher and "userId" in teacher:
                        # Create attendance log for teacher
                        teacher_attendance = {
                            "attendanceId": next_attendance_id,
                            "scheduleId": schedule_id,
                            "userId": teacher["userId"],
                            "checkIn": None,
                            "note": "",
                            "status": "Not Now",  # Default status
                            "semesterNumber": sem_number,
                            "createdAt": datetime.datetime.now(),
                            "updatedAt": datetime.datetime.now(),
                            "isActive": True,
                            "userRole": "teacher"  # Add role to differentiate from students
                        }
                        attendance_logs.append(teacher_attendance)
                        next_attendance_id += 1
                    
                    for student in students_in_class:
                        user_id = student.get("userId")
                        if user_id:
                            attendance_log = {
                                "attendanceId": next_attendance_id,
                                "scheduleId": schedule_id,
                                "userId": user_id,
                                "checkIn": None,
                                "note": "",
                                "status": "Not Now",  # Default status
                                "semesterNumber": sem_number,  # Add for easier filtering
                                "createdAt": datetime.datetime.now(),
                                "updatedAt": datetime.datetime.now(),
                                "isActive": True,
                                "userRole": "student"  # Add role for consistency
                            }
                            attendance_logs.append(attendance_log)
                            next_attendance_id += 1
                            
                            # Insert in batches of 1000 to avoid memory issues
                            if len(attendance_logs) >= 1000:
                                try:
                                    db.AttendanceLog.insert_many(attendance_logs)
                                    attendance_logs_count += len(attendance_logs)
                                    print(f"[INFO] Inserted batch of {len(attendance_logs)} attendance logs")
                                    attendance_logs = []
                                except Exception as e:
                                    print(f"[ERROR] Failed to insert attendance logs batch: {str(e)}")
                                    # Continue with empty batch
                                    attendance_logs = []
                
                # Insert any remaining attendance logs
                if attendance_logs:
                    try:
                        db.AttendanceLog.insert_many(attendance_logs)
                        attendance_logs_count += len(attendance_logs)
                        print(f"[INFO] Inserted final batch of {len(attendance_logs)} attendance logs for {sem_name}")
                    except Exception as e:
                        print(f"[ERROR] Failed to insert final batch of attendance logs: {str(e)}")
                
            except Exception as e:
                print(f"[ERROR] Failed to generate schedules for {sem_name}: {str(e)}")
                import traceback
                print(traceback.format_exc())
        
        print(f"[INFO] Completed data initialization for academic year {academic_year}")
        print(f"[INFO] Created/found {len(classes)} classes with {schedules_count} schedules and {attendance_logs_count} attendance logs")
        
        # After processing Excel file, assign homeroom teachers
        print(f"[INFO] Assigning homeroom teachers for academic year {academic_year}")
        assignment_result = assign_homeroom_teachers(db, academic_year)
        print(f"[INFO] Assigned {assignment_result['assigned_count']} homeroom teachers for academic year {academic_year}")
    
    # After processing all files, do final cleanup and verification
    print("[INFO] All sample files processed successfully")
    
    # Report on batches created
    batch_count = db.Batch.count_documents({})
    print(f"[INFO] Total batches in system: {batch_count}")
    for batch in db.Batch.find({}):
        print(f"[INFO] Batch: {batch['batchName']} (ID: {batch['batchId']}), Start Year: {batch['startYear']}")
    
    # Report on class counts by academic year
    for year in ["2022-2023", "2023-2024", "2024-2025"]:
        class_count = db.Class.count_documents({"academicYear": year})
        if class_count > 0:
            print(f"[INFO] Academic Year {year}: {class_count} classes")
            # Hiển thị chi tiết các lớp
            classes_by_grade = {}
            for c in db.Class.find({"academicYear": year}):
                grade = c.get("grade")
                if grade not in classes_by_grade:
                    classes_by_grade[grade] = []
                classes_by_grade[grade].append(c.get("className"))
            
            # In danh sách lớp theo khối
            for grade, class_names in classes_by_grade.items():
                print(f"  - Grade {grade}: {', '.join(class_names)}")
        else:
            print(f"[INFO] Academic Year {year}: {class_count} classes")
    
    # Report on student counts
    student_count = db.Student.count_documents({})
    print(f"[INFO] Total students in system: {student_count}")
    
    # Report on teacher counts
    teacher_count = db.Teacher.count_documents({})
    print(f"[INFO] Total teachers in system: {teacher_count}")
    
    # Report on schedules
    schedule_count = db.ClassSchedule.count_documents({})
    print(f"[INFO] Total schedules in system: {schedule_count}")
    
    # Report on attendance logs
    attendance_count = db.AttendanceLog.count_documents({})
    print(f"[INFO] Total attendance logs in system: {attendance_count}")
    
    print("[INFO] Database initialization complete!")
    
    return {
        "status": "success",
        "batches": batch_count,
        "teachers": teacher_count,
        "students": student_count,
        "classes": db.Class.count_documents({}),
        "academicYears": ["2022-2023", "2023-2024", "2024-2025"],
        "schedules": schedule_count,
        "attendanceLogs": attendance_count
    }