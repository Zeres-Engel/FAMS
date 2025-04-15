"""
Database management router for FAMS API
Handles database initialization and other database operations
"""
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, Query
from typing import List, Optional, Dict
import os
import shutil
import datetime
from bson.objectid import ObjectId
from .init_db_excel import init_database_from_excel, init_fams, init_users_only_from_excel
from .models import ResponseModel, ErrorResponseModel
import pandas as pd

router = APIRouter()

@router.post("/init")
async def initialize_database_excel(background_tasks: BackgroundTasks):
    """Initialize database with data from Excel files"""
    # Try to use all available Excel files
    excel_files = [
        f"src/data/xlsx/sample/FAMS_{grade}.xlsx" 
        for grade in ["10", "11", "12"]
        if os.path.exists(f"src/data/xlsx/sample/FAMS_{grade}.xlsx")
    ]
    
    if not excel_files:
        return ErrorResponseModel(
            "Missing Excel files",
            400,
            "No Excel files found. Please upload files first using /api/db/upload/excel"
        )
    
    background_tasks.add_task(init_database_from_excel, excel_files)
    return ResponseModel(
        "Database initialization started in background",
        "Database initialization process has been queued. Check logs for progress."
    )

@router.post("/initFAMS")
async def initialize_fams(background_tasks: BackgroundTasks):
    """Initialize FAMS with basic data only (no students, teachers, or schedules)"""
    background_tasks.add_task(init_fams)
    return ResponseModel(
        "FAMS initialization started in background",
        "FAMS initialization process (without students and teachers) has been queued. Check logs for progress."
    )

@router.post("/upload/fams")
async def upload_fams_excel(file: UploadFile = File(...)):
    """Upload Excel file and save as FAMS.xlsx, then return basic user information from the file"""
    if not file.filename.endswith('.xlsx'):
        return ErrorResponseModel(
            "Invalid file format",
            400,
            "Only Excel (.xlsx) files are accepted"
        )
    
    try:
        # Create directories if they don't exist
        os.makedirs("src/data/xlsx/upload", exist_ok=True)
        
        # Try to save directly to the target path
        file_path = "src/data/xlsx/upload/FAMS.xlsx"
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except PermissionError:
            # If permission denied, try saving to /tmp first
            print(f"Permission denied for {file_path}, trying alternative path")
            temp_file = "/tmp/FAMS.xlsx"
            with open(temp_file, "wb") as buffer:
                # Reset the file position to the beginning
                await file.seek(0)
                shutil.copyfileobj(file.file, buffer)
            
            # Try to copy from /tmp to destination
            try:
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                shutil.copy2(temp_file, file_path)
                os.remove(temp_file)
            except Exception as e:
                # If still can't copy, just use the temp file and return its path
                print(f"Could not copy to {file_path}: {str(e)}")
                file_path = temp_file
        
        # Parse the Excel file to extract basic user information
        # Read the Excel file
        df = pd.read_excel(file_path)
        
        # Extract the required columns (adjust based on actual Excel structure)
        # Assuming columns: Name, DOB, Gender, Address, Phone, Role (or similar)
        user_data = []
        
        # Check if the Role column exists to determine if students or teachers
        if 'Role' in df.columns:
            # If roles are explicitly defined in the file
            for _, row in df.iterrows():
                user_info = {
                    "name": row.get('Họ và Tên', ''),
                    "dob": row.get('Ngày sinh', ''),
                    "gender": row.get('Giới tính', ''),
                    "address": row.get('Địa chỉ', ''),
                    "phone": str(row.get('Số điện thoại', '')),
                    "role": row.get('Role', '')
                }
                user_data.append(user_info)
        else:
            # If roles are not explicitly defined, determine based on the sheet/tab name
            # Assuming first sheet is for Teachers and others for Students
            sheets = pd.ExcelFile(file_path).sheet_names
            
            for sheet in sheets:
                df = pd.read_excel(file_path, sheet_name=sheet)
                role = "Teacher" if sheet.lower() == "teachers" else "Student"
                
                for _, row in df.iterrows():
                    # Try various possible column names
                    name = row.get('Họ và Tên', row.get('Name', row.get('Họ Tên', '')))
                    dob = row.get('Ngày sinh', row.get('DOB', row.get('Birthday', '')))
                    gender = row.get('Giới tính', row.get('Gender', ''))
                    address = row.get('Địa chỉ', row.get('Address', ''))
                    phone = str(row.get('Số điện thoại', row.get('Phone', row.get('Điện thoại', ''))))
                    
                    user_info = {
                        "name": name,
                        "dob": dob,
                        "gender": gender,
                        "address": address,
                        "phone": phone,
                        "role": role
                    }
                    user_data.append(user_info)
        
        return ResponseModel(
            {
                "uploaded_file": file_path,
                "user_data": user_data
            },
            "File uploaded successfully as FAMS.xlsx and user data extracted"
        )
    except Exception as e:
        return ErrorResponseModel(
            "Upload failed",
            500,
            f"Failed to upload file or extract data: {str(e)}"
        )

@router.post("/import/users")
async def import_users(
    background_tasks: BackgroundTasks,
    batchYear: int = Query(..., description="Starting year of the batch (e.g., 2024 for 2024-2027)")
):
    """
    Import users (students and teachers) with specified batch year
    
    This will:
    1. Create Batch record if it doesn't exist
    2. Create two Semesters (Học kỳ 1 & 2) for the batch
    3. Create Class records (max 20 students per class)
    4. Import students and teachers from Excel
    """
    # Calculate current grade based on batch year and current date
    current_date = datetime.datetime.now()
    current_year = current_date.year
    current_month = current_date.month
    
    # Adjust academic year if we're after September (new academic year)
    academic_year = current_year if current_month >= 9 else current_year - 1
    
    # Calculate years since batch started
    years_since_start = academic_year - batchYear
    
    # Determine grade (10, 11, or 12)
    if years_since_start < 0:
        return ErrorResponseModel(
            "Invalid batch year",
            400,
            f"Batch year {batchYear} is in the future. Current academic year is {academic_year}."
        )
    
    grade = min(10 + years_since_start, 12)  # Cap at grade 12
    
    # Check if the file exists in the Docker-compatible path
    file_path = f"/app/data/xlsx/sample/FAMS_{grade}.xlsx"
    
    if not os.path.exists(file_path):
        # Also check the src path as fallback
        alt_path = f"src/data/xlsx/sample/FAMS_{grade}.xlsx"
        if os.path.exists(alt_path):
            file_path = alt_path
        else:
            # Check for uploaded FAMS.xlsx
            uploaded_path = "src/data/xlsx/upload/FAMS.xlsx"
            if os.path.exists(uploaded_path):
                file_path = uploaded_path
            else:
                return ErrorResponseModel(
                    "File not found",
                    404,
                    f"No Excel file found. Please upload a file using /api/db/upload/fams first."
                )
    
    try:
        # Connect to MongoDB to check for existing batch
        from ..db import connect_to_mongodb
        from ..constants import COLLECTIONS
        
        client = connect_to_mongodb()
        db = client["fams"]
        
        # Determine batch year range
        end_year = batchYear + 3
        batch_name = f"Khóa {batchYear}-{end_year} (Lớp {grade})"
        
        # Check if batch exists by date range
        start_date = datetime.datetime(batchYear, 9, 1)
        end_date = datetime.datetime(end_year, 6, 30)
        
        existing_batch = db[COLLECTIONS.get('BATCH', 'batches')].find_one({
            "startDate": {"$lte": start_date},
            "endDate": {"$gte": end_date}
        })
        
        # Create batch if it doesn't exist
        if not existing_batch:
            # Use numeric batch_id
            batch_count = len(list(db[COLLECTIONS.get('BATCH', 'batches')].find()))
            batch_id = batch_count + 1  # Store as integer
            
            new_batch = {
                "batchId": batch_id,
                "batchName": batch_name,
                "startDate": start_date,
                "endDate": end_date,
                "createdAt": datetime.datetime.now(),
                "updatedAt": datetime.datetime.now(),
                "isActive": True
            }
            db[COLLECTIONS.get('BATCH', 'batches')].insert_one(new_batch)
            batch_id_obj = new_batch["_id"]
            print(f"Created new batch: {batch_name}")
        else:
            # Convert existing batch_id to integer if it's a string
            batch_id = existing_batch["batchId"]
            if isinstance(batch_id, str):
                try:
                    batch_id = int(batch_id)
                    print(f"Converted batch_id from string to integer: {batch_id}")
                except ValueError:
                    print(f"Warning: Could not convert batch_id '{batch_id}' to integer")
            
            batch_id_obj = existing_batch["_id"]
            print(f"Using existing batch: {existing_batch['batchName']}")
        
        # Check if semesters exist for this batch, create if not
        semester_collection = COLLECTIONS.get('SEMESTER', 'semesters')
        existing_semesters = list(db[semester_collection].find({"BatchID": batch_id}))
        
        if len(existing_semesters) < 2:
            # Create semesters if they don't exist
            if not any(s["SemesterName"] == "Học kỳ 1" for s in existing_semesters):
                # Convert batch_id to integer if it's a string
                batch_id_int = batch_id
                if isinstance(batch_id, str):
                    try:
                        batch_id_int = int(batch_id)
                    except ValueError:
                        print(f"Warning: Could not convert batch_id '{batch_id}' to integer")
                
                semester1 = {
                    "SemesterName": "Học kỳ 1",
                    "StartDate": datetime.datetime(academic_year, 9, 1),
                    "EndDate": datetime.datetime(academic_year + 1, 1, 15),
                    "CurriculumID": grade,  # Use grade as curriculum ID
                    "BatchID": batch_id_int  # Store as integer
                }
                db[semester_collection].insert_one(semester1)
                print(f"Created Semester 1 for batch {batch_name}")
            
            if not any(s["SemesterName"] == "Học kỳ 2" for s in existing_semesters):
                # Convert batch_id to integer if it's a string
                batch_id_int = batch_id
                if isinstance(batch_id, str):
                    try:
                        batch_id_int = int(batch_id)
                    except ValueError:
                        print(f"Warning: Could not convert batch_id '{batch_id}' to integer")
                
                semester2 = {
                    "SemesterName": "Học kỳ 2",
                    "StartDate": datetime.datetime(academic_year + 1, 1, 16),
                    "EndDate": datetime.datetime(academic_year + 1, 6, 30),
                    "CurriculumID": grade,  # Use grade as curriculum ID
                    "BatchID": batch_id_int  # Store as integer
                }
                db[semester_collection].insert_one(semester2)
                print(f"Created Semester 2 for batch {batch_name}")
        
        # Now process the file using our modified function that handles class creation
        async def import_with_class_creation(file_path, batch_id, grade):
            from ..excel_data_loader import extract_students_from_excel
            from ..generators.classes import create_class_if_needed
            
            # Connect again to ensure we have a fresh connection
            client = connect_to_mongodb()
            db = client["fams"]
            
            # Extract students from Excel
            students = extract_students_from_excel(file_path, grade)
            
            # Maximum students per class
            max_per_class = 20
            
            # Group students by grade
            students_by_grade = {}
            for student in students:
                grade_key = student.get("grade", grade)
                if grade_key not in students_by_grade:
                    students_by_grade[grade_key] = []
                students_by_grade[grade_key].append(student)
            
            # Create classes as needed
            classes_created = []
            for grade_key, grade_students in students_by_grade.items():
                # Calculate how many classes we need
                num_classes = (len(grade_students) + max_per_class - 1) // max_per_class
                
                # Create academic year string 
                current_year = datetime.datetime.now().year
                academic_year = f"{current_year}-{current_year+1}"
                
                # Create new classes if needed
                for i in range(num_classes):
                    # Use correct class naming format: 10A1, 10A2, etc. instead of 10A, 10B
                    class_name = f"{grade_key}A{i+1}"  # 10A1, 10A2, etc.
                    
                    # Create class using our helper function
                    class_info = create_class_if_needed(db, class_name, grade_key, batch_id, academic_year)
                    classes_created.append(class_name)
            
            # Now that classes exist, process student and teacher import
            from ..excel_data_loader import import_all_teachers_from_excel, generate_all_students_from_excel, generate_missing_parents
            teachers = import_all_teachers_from_excel(db, [file_path])
            students_by_grade = generate_all_students_from_excel(db, [file_path])
            
            # Generate parent records and relationships for all students
            all_students = []
            for grade_students in students_by_grade.values():
                all_students.extend(grade_students)
            parents_created = generate_missing_parents(db, all_students)
            
            # Assign students to classes
            print(f"Assigning {sum(len(s) for s in students_by_grade.values())} students to classes...")
            class_collection = COLLECTIONS.get('CLASS', 'classes')
            student_collection = COLLECTIONS.get('STUDENT', 'Student')
            
            # For each grade
            for grade_key, grade_students in students_by_grade.items():
                # Skip if no students
                if not grade_students:
                    continue
                    
                # Get numeric grade value
                grade_num = 10
                if grade_key == "grade11":
                    grade_num = 11
                elif grade_key == "grade12":
                    grade_num = 12
                    
                # Find all classes for this grade
                classes = list(db[class_collection].find({"grade": grade_num}))
                if not classes:
                    print(f"Warning: No classes found for grade {grade_num}")
                    continue
                    
                # Calculate max students per class
                max_per_class = len(grade_students) // len(classes)
                if len(grade_students) % len(classes) > 0:
                    max_per_class += 1
                    
                # Distribute students
                students_distributed = 0
                for i, class_info in enumerate(classes):
                    class_id = class_info.get("classId")
                    if not class_id:
                        continue
                        
                    # Get students for this class
                    start_idx = i * max_per_class
                    end_idx = min(start_idx + max_per_class, len(grade_students))
                    class_students = grade_students[start_idx:end_idx]
                    
                    # Update student records
                    for student in class_students:
                        student_id = student.get("studentId")
                        if not student_id:
                            continue
                            
                        # Update student with class ID
                        db[student_collection].update_one(
                            {"studentId": student_id},
                            {"$set": {"classId": class_id}}
                        )
                        students_distributed += 1
                        
                print(f"Assigned {students_distributed} students to {len(classes)} classes for grade {grade_num}")
            
            # Try to delete the file after processing if needed
            try:
                if os.path.exists(file_path) and "upload" in file_path:
                    os.remove(file_path)
            except Exception as e:
                print(f"Could not delete file {file_path}: {str(e)}")
            
            return {
                "teachers": len(teachers),
                "students": sum(len(s) for s in students_by_grade.values()),
                "students_assigned": sum(len(s) for s in students_by_grade.values()),
                "parents": parents_created,
                "classes_created": classes_created
            }
        
        # Run the import as a background task
        background_tasks.add_task(import_with_class_creation, file_path, batch_id, grade)
        
        return ResponseModel(
            {
                "batch_year": batchYear,
                "batch_name": batch_name,
                "grade": grade,
                "file_path": file_path
            },
            f"Users import started for batch {batchYear}-{end_year} (Grade {grade})"
        )
    except Exception as e:
        return ErrorResponseModel(
            "Import failed",
            500,
            f"Failed to import data: {str(e)}"
        )

@router.post("/promote/students")
async def promote_students(
    background_tasks: BackgroundTasks,
    retained_students: List[str] = Query(None, description="IDs of students who will not be promoted")
):
    """
    Promote students to the next grade
    
    Students in retained_students list will remain in their current grade
    """
    async def promote_students_task(retained_student_ids):
        from ..db import connect_to_mongodb
        from ..constants import COLLECTIONS
        
        # Connect to MongoDB
        client = connect_to_mongodb()
        db = client["fams"]
        
        # Convert retained_students to set for faster lookup
        retained_set = set(retained_student_ids or [])
        
        # Get all students
        students = list(db[COLLECTIONS['STUDENT']].find({"isActive": True}))
        
        promoted_count = 0
        retained_count = 0
        
        for student in students:
            student_id = student.get("studentId")
            
            # Skip students who are retained
            if student_id in retained_set:
                print(f"Student {student_id} retained in current grade")
                retained_count += 1
                continue
                
            # Get current batch
            current_batch = student.get("batchId")
            if not current_batch:
                continue
                
            try:
                # Convert to int if possible
                batch_num = int(current_batch)
                
                # Only promote if not already in highest batch (batch 1 = grade 12)
                if batch_num > 1:
                    # Update to next batch (lower number = higher grade in this system)
                    new_batch = str(batch_num - 1)
                    
                    db[COLLECTIONS['STUDENT']].update_one(
                        {"studentId": student_id},
                        {"$set": {"batchId": new_batch}}
                    )
                    
                    promoted_count += 1
                    print(f"Promoted student {student_id} from batch {current_batch} to {new_batch}")
            except (ValueError, TypeError):
                print(f"Invalid batch format for student {student_id}: {current_batch}")
        
        print(f"Promotion complete: {promoted_count} students promoted, {retained_count} students retained")
        return {"promoted": promoted_count, "retained": retained_count}
    
    # Run the task in background
    background_tasks.add_task(promote_students_task, retained_students)
    
    return ResponseModel(
        {
            "retained_students": retained_students or []
        },
        "Student promotion process started in background"
    )

@router.post("/teacher/expire-contract")
async def expire_teacher_contracts(
    background_tasks: BackgroundTasks,
    teacherIds: List[str] = Query(..., description="IDs of teachers with expired contracts")
):
    """
    Remove teachers with expired contracts and all related data
    
    This will:
    1. Delete the teacher records
    2. Delete the user accounts
    3. Remove teacher from class schedules
    """
    async def expire_contracts_task(teacher_ids):
        from ..db import connect_to_mongodb
        from ..constants import COLLECTIONS
        
        # Connect to MongoDB
        client = connect_to_mongodb()
        db = client["fams"]
        
        deleted_count = 0
        account_count = 0
        schedule_count = 0
        
        for teacher_id in teacher_ids:
            # Get teacher info first (to get userId)
            teacher = db[COLLECTIONS['TEACHER']].find_one({"teacherId": teacher_id})
            
            if not teacher:
                print(f"Teacher {teacher_id} not found")
                continue
                
            # Get userId
            user_id = teacher.get("userId")
            
            # 1. Delete teacher record
            result = db[COLLECTIONS['TEACHER']].delete_one({"teacherId": teacher_id})
            if result.deleted_count > 0:
                deleted_count += 1
                print(f"Deleted teacher {teacher_id}")
            
            # 2. Delete user account if userId exists
            if user_id:
                result = db[COLLECTIONS['USER_ACCOUNT']].delete_one({"userId": user_id})
                if result.deleted_count > 0:
                    account_count += 1
                    print(f"Deleted user account {user_id}")
            
            # 3. Update class schedules to remove this teacher
            result = db[COLLECTIONS['CLASS_SCHEDULE']].update_many(
                {"teacherId": teacher_id},
                {"$set": {"isActive": False}}  # Mark as inactive instead of deleting
            )
            
            schedule_count += result.modified_count
            print(f"Updated {result.modified_count} schedule entries for teacher {teacher_id}")
            
        print(f"Contract expiration complete: {deleted_count} teachers, {account_count} accounts, {schedule_count} schedules")
        return {"teachers": deleted_count, "accounts": account_count, "schedules": schedule_count}
    
    # Run the task in background
    background_tasks.add_task(expire_contracts_task, teacherIds)
    
    return ResponseModel(
        {"expired_teachers": teacherIds},
        "Teacher contract expiration process started in background"
    ) 