"""
Student Management API Endpoints
Handles student data management, class assignments, and data import
"""
from fastapi import APIRouter, UploadFile, File, Body, Query
from typing import List, Dict, Optional
import os
import shutil
import pandas as pd
from bson.objectid import ObjectId
import datetime
import re
from pymongo import MongoClient
import traceback

from ..db import get_database, connect_to_mongodb
from ..constants import COLLECTIONS
from ..utils import hash_password, generate_username
from .models import ResponseModel, ErrorResponseModel

router = APIRouter()

@router.post("/upload/fams")
async def upload_fams_excel(file: UploadFile = File(...)):
    """
    Upload Excel file and save as FAMS.xlsx, then return basic user information with chosen=True
    """
    if not file.filename.endswith('.xlsx'):
        return ErrorResponseModel(
            "Invalid file format",
            400,
            "Only Excel (.xlsx) files are accepted"
        )
    
    try:
        # Create directories if they don't exist
        os.makedirs("src/data/xlsx/upload", exist_ok=True)
        
        # Save file
        file_path = "src/data/xlsx/upload/FAMS.xlsx"
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except PermissionError:
            # If permission denied, try saving to /tmp first
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
                file_path = temp_file
        
        # Parse the Excel file
        user_data = []
        
        # Read the Excel file with all sheets
        excel_file = pd.ExcelFile(file_path)
        sheets = excel_file.sheet_names
        
        for sheet in sheets:
            df = pd.read_excel(file_path, sheet_name=sheet)
            
            # Determine role based on sheet name
            role = "teacher" if "giáo viên" in sheet.lower() or "teacher" in sheet.lower() else "student"
            
            for _, row in df.iterrows():
                # Try various possible column names
                name = row.get('Họ và Tên', row.get('Name', row.get('Họ Tên', '')))
                if pd.isna(name) or not name:
                    continue  # Skip rows without name
                
                # Process date of birth - now looking for dayOfBirth first
                dayOfBirth = row.get('Ngày sinh', row.get('dayOfBirth', row.get('DOB', row.get('Birthday', ''))))
                if not pd.isna(dayOfBirth):
                    if isinstance(dayOfBirth, datetime.datetime):
                        dayOfBirth = dayOfBirth.strftime('%Y-%m-%d')
                    else:
                        dayOfBirth = str(dayOfBirth)
                else:
                    dayOfBirth = ""
                
                # Get other fields
                gender = row.get('Giới tính', row.get('Gender', ''))
                address = row.get('Địa chỉ', row.get('Address', ''))
                phone = str(row.get('Số điện thoại', row.get('Phone', row.get('Điện thoại', ''))))
                
                # Build user info
                user_info = {
                    "name": str(name),
                    "dayOfBirth": dayOfBirth,
                    "gender": str(gender),
                    "address": str(address),
                    "phone": str(phone),
                    "role": role,
                    "chosen": True  # Add chosen=True for all records
                }
                
                # For teachers, get email, major and degree
                if role == "teacher":
                    email = row.get('Email', '')
                    if email and not pd.isna(email):
                        user_info["email"] = str(email)
                    
                    major = row.get('Chuyên môn', row.get('Major', ''))
                    if major and not pd.isna(major):
                        user_info["major"] = str(major)
                    
                    degree = row.get('Bằng cấp', row.get('Degree', ''))
                    if degree and not pd.isna(degree):
                        user_info["degree"] = str(degree)
                
                # For students, extract parent information
                if role == "student":
                    # Parent 1 info
                    parent1_name = row.get('Tên Phụ huynh 1', '')
                    if parent1_name and not pd.isna(parent1_name):
                        parent1_info = {
                            "name": str(parent1_name),
                            "career": str(row.get('Nghề nghiệp Phụ huynh 1', '')),
                            "phone": str(row.get('SĐT Phụ huynh 1', '')),
                            "gender": str(row.get('Giới tính Phụ huynh 1', '')),
                            "email": str(row.get('Email Phụ huynh 1', '')),
                            "relationship": "Father" if 'Nam' in str(row.get('Giới tính Phụ huynh 1', '')) else "Mother"
                        }
                        user_info["parent1"] = parent1_info
                    
                    # Parent 2 info
                    parent2_name = row.get('Tên Phụ huynh 2', '')
                    if parent2_name and not pd.isna(parent2_name):
                        parent2_info = {
                            "name": str(parent2_name),
                            "career": str(row.get('Nghề nghiệp Phụ huynh 2', '')),
                            "phone": str(row.get('SĐT Phụ huynh 2', '')),
                            "gender": str(row.get('Giới tính Phụ huynh 2', '')),
                            "email": str(row.get('Email Phụ huynh 2', '')),
                            "relationship": "Father" if 'Nam' in str(row.get('Giới tính Phụ huynh 2', '')) else "Mother"
                        }
                        user_info["parent2"] = parent2_info
                
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
async def import_filtered_users(user_data: List[Dict] = Body(...)):
    """
    Import filtered users to database
    Only users with chosen=True will be imported
    Returns the userIds of imported users
    Creates UserAccount entries and links to Student/Teacher records
    Handles students with batch assignment and parent relationships
    """
    # Filter only chosen users
    chosen_users = [user for user in user_data if user.get("chosen", False)]
    
    if not chosen_users:
        return ErrorResponseModel(
            "No users selected", 
            400, 
            "No users were selected for import"
        )
    
    # Connect to database
    client = connect_to_mongodb()
    db = client["fams"]
    
    # Prepare results to store userIds
    result_ids = []
    
    try:
        current_year = datetime.datetime.now().year
        
        # Process users based on role
        for index, user in enumerate(chosen_users):
            role = user.get("role", "")
            name = user.get("name", "")
            
            # Generate username based on name and counter
            username = generate_username(name, index + 1, role=role)
            
            # Create email - for teachers, use provided email if available
            if role == "teacher" and "email" in user and user["email"]:
                email = user["email"]
            else:
                email = user.get("email", f"{username}@fams.edu.vn")
            
            # Create UserAccount document
            user_account = {
                "userId": username,
                "email": email,
                "password": hash_password("123456"),  # Default password
                "role": role,
                "createdAt": datetime.datetime.now(),
                "updatedAt": datetime.datetime.now(),
                "isActive": True
            }
            
            # Insert UserAccount
            db.UserAccount.insert_one(user_account)
            
            # Process gender field (handle Vietnamese input)
            gender_str = user.get("gender", "").lower()
            gender = True if gender_str in ["nam", "male", "true", "1"] else False
            
            # Format date of birth
            dob_str = user.get("dayOfBirth", user.get("dob", ""))  # Include fallback to dob for backward compatibility
            try:
                # Try to parse various date formats
                dob = None
                if dob_str:
                    # Try common formats
                    date_formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y']
                    for fmt in date_formats:
                        try:
                            dob = datetime.datetime.strptime(dob_str, fmt)
                            break
                        except ValueError:
                            continue
            except Exception:
                dob = None
            
            if role == "student":
                # Check and create batch if needed
                # Get the latest batch ID
                latest_batch = db.Batch.find_one(sort=[("batchId", -1)])
                
                batch_id = 1  # Default batch ID as integer
                if latest_batch:
                    try:
                        # Ensure batch_id is an integer
                        if isinstance(latest_batch["batchId"], str):
                            batch_id = int(latest_batch["batchId"]) + 1
                        else:
                            batch_id = latest_batch["batchId"] + 1
                    except (ValueError, TypeError):
                        batch_id = 1
                
                batch_name = f"Batch {batch_id}"
                
                # Create batch document
                batch_doc = {
                    "batchId": batch_id,  # Store as integer, not string
                    "batchName": batch_name,
                    "startYear": current_year,
                    "startDate": datetime.datetime.now(),
                    "endDate": datetime.datetime(current_year + 3, 5, 31),  # 3 years later
                    "createdAt": datetime.datetime.now(),
                    "updatedAt": datetime.datetime.now(),
                    "isActive": True
                }
                
                # Check if batch already exists
                existing_batch = db.Batch.find_one({"startYear": current_year})
                if not existing_batch:
                    db.Batch.insert_one(batch_doc)
                    batch_id_int = batch_id
                else:
                    # Ensure existing batch_id is an integer
                    if isinstance(existing_batch["batchId"], str):
                        batch_id_int = int(existing_batch["batchId"])
                        # Update the existing batch to use integer batchId
                        db.Batch.update_one(
                            {"_id": existing_batch["_id"]},
                            {"$set": {"batchId": batch_id_int}}
                        )
                    else:
                        batch_id_int = existing_batch["batchId"]
                
                # Get next student ID
                last_student = db.Student.find_one(sort=[("studentId", -1)])
                student_id = 1
                if last_student and "studentId" in last_student:
                    try:
                        student_id = int(last_student["studentId"]) + 1
                    except (ValueError, TypeError):
                        student_id = 1
                
                # Prepare student document
                student_doc = {
                    "studentId": student_id,
                    "userId": username,
                    "fullName": name,
                    "email": email,
                    "dateOfBirth": dob,
                    "gender": gender,
                    "address": user.get("address", ""),
                    "phone": user.get("phone", ""),
                    "batchId": batch_id_int,  # Use integer, not string
                    "classId": None,  # Will be assigned later
                    "createdAt": datetime.datetime.now(),
                    "updatedAt": datetime.datetime.now(),
                    "isActive": True
                }
                
                # Insert student
                result = db.Student.insert_one(student_doc)
                student_db_id = result.inserted_id
                
                result_ids.append({
                    "_id": str(student_db_id),
                    "userId": username,
                    "studentId": student_id,
                    "role": "student"
                })
                
                # Process parent information
                parents_info = []
                
                # Parent 1
                if "parent1" in user and user["parent1"]:
                    parent1 = user["parent1"]
                    parent1_record = process_parent(db, parent1, index)
                    if parent1_record:
                        parents_info.append({
                            "parent_id": parent1_record["parentId"],
                            "relationship": parent1.get("relationship", "Other"),
                            "isEmergencyContact": True  # First parent is emergency contact
                        })
                
                # Parent 2
                if "parent2" in user and user["parent2"]:
                    parent2 = user["parent2"]
                    parent2_record = process_parent(db, parent2, index + 1000)  # Offset to avoid username conflicts
                    if parent2_record:
                        parents_info.append({
                            "parent_id": parent2_record["parentId"],
                            "relationship": parent2.get("relationship", "Other"),
                            "isEmergencyContact": False
                        })
                
                # Create ParentStudent relationships
                for parent_info in parents_info:
                    # Get next relationship ID
                    last_relation = db.ParentStudent.find_one(sort=[("parentStudentId", -1)])
                    relation_id = 1
                    if last_relation and "parentStudentId" in last_relation:
                        try:
                            relation_id = int(last_relation["parentStudentId"]) + 1
                        except (ValueError, TypeError):
                            relation_id = 1
                    
                    # Create relationship record
                    parent_student_doc = {
                        "parentStudentId": relation_id,
                        "parentId": parent_info["parent_id"],  # Already an integer from process_parent
                        "studentId": student_id,  # Integer
                        "relationship": parent_info["relationship"],
                        "isEmergencyContact": parent_info["isEmergencyContact"],
                        "createdAt": datetime.datetime.now(),
                        "updatedAt": datetime.datetime.now(),
                        "isActive": True
                    }
                    
                    db.ParentStudent.insert_one(parent_student_doc)
                
            elif role == "teacher":
                # Get next teacher ID
                last_teacher = db.Teacher.find_one(sort=[("teacherId", -1)])
                teacher_id = 1
                if last_teacher and "teacherId" in last_teacher:
                    try:
                        teacher_id = int(last_teacher["teacherId"]) + 1
                    except (ValueError, TypeError):
                        teacher_id = 1
                
                # Prepare teacher document
                teacher_doc = {
                    "teacherId": teacher_id,
                    "userId": username,
                    "fullName": name,
                    "email": email,
                    "dateOfBirth": dob,
                    "gender": gender,
                    "address": user.get("address", ""),
                    "phone": user.get("phone", ""),
                    "major": user.get("major", ""),
                    "degree": user.get("degree", ""),  # Added degree field
                    "weeklyCapacity": 10,  # Default value
                    "createdAt": datetime.datetime.now(),
                    "updatedAt": datetime.datetime.now(),
                    "isActive": True
                }
                
                # Insert teacher
                result = db.Teacher.insert_one(teacher_doc)
                result_ids.append({
                    "_id": str(result.inserted_id),
                    "userId": username,
                    "teacherId": teacher_id,
                    "role": "teacher"
                })
        
        return ResponseModel(
            result_ids,
            f"Successfully imported {len(result_ids)} users"
        )
    
    except Exception as e:
        return ErrorResponseModel(
            "Import failed",
            500,
            f"Failed to import users: {str(e)}"
        )
    finally:
        client.close()

def process_parent(db, parent_data, index):
    """
    Process parent data and create parent records
    Returns the parent record with ID if successful
    """
    name = parent_data.get("name", "")
    if not name:
        return None
        
    # Generate username for parent
    username = generate_username(name, index, role="parent")
    
    # Create email from username or use provided email
    email = parent_data.get("email") or f"{username}@fams.edu.vn"
    
    # Create UserAccount document
    user_account = {
        "userId": username,
        "email": email,
        "password": hash_password("123456"),  # Default password
        "role": "parent",
        "createdAt": datetime.datetime.now(),
        "updatedAt": datetime.datetime.now(),
        "isActive": True
    }
    
    # Insert UserAccount
    db.UserAccount.insert_one(user_account)
    
    # Process gender
    gender_str = parent_data.get("gender", "").lower()
    gender = True if gender_str in ["nam", "male", "true", "1"] else False
    
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
        "parentId": parent_id,  # Store as integer
        "userId": username,
        "fullName": name,
        "career": parent_data.get("career", ""),
        "phone": parent_data.get("phone", ""),
        "gender": gender,
        "createdAt": datetime.datetime.now(),
        "updatedAt": datetime.datetime.now(),
        "isActive": True
    }
    
    # Insert parent
    db.Parent.insert_one(parent_doc)
    
    return parent_doc

@router.get("/unassigned-students")
async def get_unassigned_students():
    """
    Get a list of student userIds without assigned classes
    Returns the userId (not MongoDB _id) of each student
    """
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Find students with classId = None or not set
        unassigned_students = list(db.Student.find(
            {"$or": [{"classId": None}, {"classId": {"$exists": False}}]},
            {"userId": 1}
        ))
        
        # Extract userId values (not _id)
        student_ids = [student["userId"] for student in unassigned_students]
        
        return ResponseModel(
            student_ids,
            f"Found {len(student_ids)} unassigned students"
        )
    except Exception as e:
        return ErrorResponseModel(
            "Search failed",
            500,
            f"Failed to find unassigned students: {str(e)}"
        )
    finally:
        client.close()

@router.post("/assign-temp-class")
async def assign_temp_class(user_ids: List[str] = Body(...), grade: int = Body(...)):
    """
    Assign students to a temporary class based on grade
    Takes list of userId values (not MongoDB _id values)
    Grade should be 10, 11, or 12
    Only sets classId field on Student records
    """
    if grade not in [10, 11, 12]:
        return ErrorResponseModel(
            "Invalid grade",
            400,
            "Grade must be 10, 11, or 12"
        )
    
    if not user_ids:
        return ErrorResponseModel(
            "No students provided",
            400,
            "At least one student ID must be provided"
        )
    
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Generate temporary class name
        temp_class_name = str(grade)
        
        # Check if temporary class already exists
        existing_class = db.Class.find_one({"className": temp_class_name})
        
        # Get current academic year
        current_year = datetime.datetime.now().year
        academic_year = f"{current_year}-{current_year+1}"
        
        if not existing_class:
            # Get next class ID
            last_class = db.Class.find_one(sort=[("classId", -1)])
            class_id = 1
            if last_class and "classId" in last_class:
                try:
                    class_id = int(last_class["classId"]) + 1
                except (ValueError, TypeError):
                    class_id = 1
            
            # Create temporary class (only required fields)
            class_doc = {
                "classId": class_id,
                "className": temp_class_name,
                "grade": grade,  # Store as int, not string
                "academicYear": academic_year,
                "createdAt": datetime.datetime.now(),
                "updatedAt": datetime.datetime.now(),
                "isActive": True
            }
            
            db.Class.insert_one(class_doc)
        else:
            # Get the classId from the existing class
            class_id = existing_class.get("classId")
            if not isinstance(class_id, int):
                # If classId is not already an int, update it
                last_class = db.Class.find_one(sort=[("classId", -1)])
                class_id = 1
                if last_class and "classId" in last_class:
                    try:
                        class_id = int(last_class["classId"]) + 1
                    except (ValueError, TypeError):
                        class_id = 1
                
                # Update the existing class with integer classId and grade
                db.Class.update_one(
                    {"_id": existing_class["_id"]},
                    {"$set": {
                        "classId": class_id,
                        "grade": grade,  # Ensure grade is an int
                        "updatedAt": datetime.datetime.now()
                    }}
                )
        
        # Update students with temporary class
        updated_students = []
        for user_id in user_ids:
            try:
                # Find student by userId (not by MongoDB _id)
                student = db.Student.find_one({"userId": user_id})
                
                if student:
                    # Update student with only classId
                    update_result = db.Student.update_one(
                        {"userId": user_id},
                        {"$set": {
                            "classId": class_id,  # Use integer classId
                            "updatedAt": datetime.datetime.now()
                        }}
                    )
                    
                    if update_result.modified_count > 0:
                        updated_students.append(user_id)
                else:
                    print(f"Student with userId {user_id} not found")
            except Exception as e:
                print(f"Error updating student {user_id}: {str(e)}")
        
        return ResponseModel(
            {
                "class_id": class_id,
                "class_name": temp_class_name,
                "updated_students": updated_students
            },
            f"Assigned {len(updated_students)} students to temporary class {temp_class_name}"
        )
    except Exception as e:
        return ErrorResponseModel(
            "Assignment failed",
            500,
            f"Failed to assign students to temporary class: {str(e)}"
        )
    finally:
        client.close()

@router.post("/distribute-classes")
async def distribute_classes(class_capacity: int = Body(20)):
    """
    Distribute students from temporary classes to permanent classes
    Each class will have up to class_capacity students
    Classes will be named like: 10A1, 10A2, 11A1, etc.
    Takes temporary classes with names "10", "11", "12" and distributes students
    Only sets classId field on Student records (not className or grade)
    """
    if class_capacity <= 0:
        return ErrorResponseModel(
            "Invalid parameter",
            400,
            "class_capacity must be greater than zero"
        )
    
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Get temporary classes (10, 11, 12)
        temp_classes = list(db.Class.find(
            {"className": {"$in": ["10", "11", "12"]}},
            {"_id": 1, "className": 1, "grade": 1, "classId": 1}
        ))
        
        print(f"Found {len(temp_classes)} temporary classes: {[c.get('className') for c in temp_classes]}")
        
        if not temp_classes:
            return ErrorResponseModel(
                "No temporary classes",
                404,
                "No temporary classes (10, 11, 12) found. Assign students to temporary classes first."
            )
        
        results = {}
        
        # Get current academic year
        current_year = datetime.datetime.now().year
        academic_year = f"{current_year}-{current_year+1}"
        
        # Process each temporary class
        for temp_class in temp_classes:
            temp_class_id = temp_class.get("classId")
            if not temp_class_id:
                # If no classId field, use MongoDB _id as fallback
                temp_class_id = str(temp_class["_id"])
                print(f"Warning: Using MongoDB _id {temp_class_id} for class {temp_class.get('className')} because classId is missing")
            
            grade = temp_class.get("grade")
            if isinstance(grade, str):
                grade = int(grade)
                
            className = temp_class.get("className")
            
            print(f"Processing temporary class {className} (grade {grade}, id {temp_class_id})")
            
            # Find students in this temporary class
            students = list(db.Student.find(
                {"classId": temp_class_id},
                {"_id": 1, "fullName": 1, "studentId": 1}
            ))
            
            print(f"Found {len(students)} students in class {className}")
            
            student_count = len(students)
            
            if student_count == 0:
                print(f"No students found in class {className}, skipping")
                continue
                
            # Calculate how many permanent classes we need
            num_classes = (student_count + class_capacity - 1) // class_capacity
            
            print(f"Need {num_classes} permanent classes for grade {grade} students")
            
            # Create or find existing permanent classes for this grade
            permanent_classes = []
            
            # Find existing permanent classes with pattern like "10A1", "10A2", etc.
            existing_classes = list(db.Class.find(
                {"grade": grade, "className": {"$regex": f"^{grade}A\\d+$"}},
                {"_id": 1, "className": 1, "classId": 1}
            ).sort("className", 1))
            
            print(f"Found {len(existing_classes)} existing permanent classes for grade {grade}")
            
            # Check how many more classes we need to create
            for existing_class in existing_classes:
                class_id = existing_class.get("classId")
                if not class_id:
                    # If using MongoDB _id
                    class_id = str(existing_class["_id"])
                    print(f"Warning: Using MongoDB _id for class {existing_class.get('className')}")
                
                # Check how many students are in this class
                class_students_count = db.Student.count_documents({"classId": class_id})
                
                print(f"Class {existing_class.get('className')} has {class_students_count} students")
                
                # If the class is not full, add it to the list
                if class_students_count < class_capacity:
                    remaining_space = class_capacity - class_students_count
                    permanent_classes.append({
                        "class_id": class_id,
                        "class_name": existing_class.get("className"),
                        "available_seats": remaining_space
                    })
            
            # Get the highest class number from existing classes
            if existing_classes:
                last_class_name = existing_classes[-1].get("className", f"{grade}A0")
                match = re.search(rf"{grade}A(\d+)", last_class_name)
                last_class_num = int(match.group(1)) if match else 0
            else:
                last_class_num = 0
            
            print(f"Last class number: {last_class_num}")
                
            # Create additional classes if needed
            while len(permanent_classes) < num_classes:
                last_class_num += 1
                new_class_name = f"{grade}A{last_class_num}"
                
                print(f"Creating new class: {new_class_name}")
                
                # Get next class ID
                last_class = db.Class.find_one(sort=[("classId", -1)])
                next_class_id = 1
                if last_class and "classId" in last_class:
                    try:
                        next_class_id = int(last_class["classId"]) + 1
                    except (ValueError, TypeError):
                        next_class_id = 1
                
                # Create new class
                class_doc = {
                    "classId": next_class_id,
                    "className": new_class_name,
                    "grade": grade,
                    "academicYear": academic_year,
                    "createdAt": datetime.datetime.now(),
                    "updatedAt": datetime.datetime.now(),
                    "isActive": True
                }
                
                class_result = db.Class.insert_one(class_doc)
                print(f"Created class {new_class_name} with ID {next_class_id}")
                
                permanent_classes.append({
                    "class_id": next_class_id,
                    "class_name": new_class_name,
                    "available_seats": class_capacity
                })
            
            # Distribute students across permanent classes
            updated_students = []
            
            for student in students:
                # Find a class with available seats
                target_class = None
                for cls in permanent_classes:
                    if cls["available_seats"] > 0:
                        target_class = cls
                        break
                
                if not target_class:
                    # Create a new class if all are full
                    last_class_num += 1
                    new_class_name = f"{grade}A{last_class_num}"
                    
                    print(f"All classes full, creating additional class: {new_class_name}")
                    
                    # Get next class ID
                    last_class = db.Class.find_one(sort=[("classId", -1)])
                    next_class_id = 1
                    if last_class and "classId" in last_class:
                        try:
                            next_class_id = int(last_class["classId"]) + 1
                        except (ValueError, TypeError):
                            next_class_id = 1
                    
                    # Create new class
                    class_doc = {
                        "classId": next_class_id,
                        "className": new_class_name,
                        "grade": grade,
                        "academicYear": academic_year,
                        "createdAt": datetime.datetime.now(),
                        "updatedAt": datetime.datetime.now(),
                        "isActive": True
                    }
                    
                    class_result = db.Class.insert_one(class_doc)
                    print(f"Created class {new_class_name} with ID {next_class_id}")
                    
                    target_class = {
                        "class_id": next_class_id,
                        "class_name": new_class_name,
                        "available_seats": class_capacity
                    }
                    permanent_classes.append(target_class)
                
                # Update student with permanent class (only set classId)
                student_id = student["_id"]
                student_name = student.get("fullName", "Unknown")
                
                print(f"Assigning student {student_name} to class {target_class['class_name']}")
                
                update_result = db.Student.update_one(
                    {"_id": student_id},
                    {"$set": {
                        "classId": target_class["class_id"],
                        "updatedAt": datetime.datetime.now()
                    }}
                )
                
                if update_result.modified_count > 0:
                    updated_students.append(str(student_id))
                    # Decrease available seats
                    target_class["available_seats"] -= 1
                else:
                    print(f"Warning: Failed to update student {student_name}")
            
            results[str(grade)] = {
                "total_students": student_count,
                "created_classes": [cls["class_name"] for cls in permanent_classes],
                "updated_students": len(updated_students)
            }
            
            print(f"Successfully distributed {len(updated_students)} students to {len(permanent_classes)} classes")
        
        return ResponseModel(
            results,
            "Students distributed to permanent classes successfully"
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in distribute_classes: {str(e)}\n{error_trace}")
        return ErrorResponseModel(
            "Distribution failed",
            500,
            f"Failed to distribute students to permanent classes: {str(e)}"
        )
    finally:
        client.close()

@router.get("/students-by-grade/{grade}")
async def get_students_by_grade(grade: int):
    """
    Get all student userIds for a specific grade (10, 11, or 12)
    Finds all students in classes with className starting with the grade number
    (e.g., "10", "10A1", "10A2", etc.)
    """
    if grade not in [10, 11, 12]:
        return ErrorResponseModel(
            "Invalid grade",
            400,
            "Grade must be 10, 11, or 12"
        )
    
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Find all classes with className starting with grade number
        grade_prefix = str(grade)
        print(f"Searching for classes with className starting with '{grade_prefix}'")
        
        # First get all matching class IDs
        class_query = {
            "className": {"$regex": f"^{grade_prefix}"}
        }
        
        grade_classes = list(db.Class.find(class_query, {"_id": 1, "classId": 1, "className": 1}))
        
        print(f"Found {len(grade_classes)} classes: {[c.get('className') for c in grade_classes]}")
        
        # Extract class IDs (prefer classId field, fall back to _id)
        class_ids = []
        for cls in grade_classes:
            class_id = cls.get("classId")
            if class_id is None:
                # Fall back to _id if classId is not available
                class_id = str(cls["_id"])
                print(f"Warning: Using MongoDB _id for class {cls.get('className')}")
            
            class_ids.append(class_id)
        
        if not class_ids:
            print(f"No classes found for grade {grade}")
            return ResponseModel(
                [],
                f"No classes found for grade {grade}"
            )
        
        print(f"Searching for students in classes with IDs: {class_ids}")
        
        # Find all students in these classes
        students = list(db.Student.find(
            {"classId": {"$in": class_ids}},
            {"_id": 1, "userId": 1, "fullName": 1, "className": 1}
        ))
        
        print(f"Found {len(students)} students in grade {grade}")
        
        # Extract student userIds
        student_ids = [student["userId"] for student in students if "userId" in student]
        
        # Log some sample students for debugging
        sample_students = students[:5] if len(students) > 5 else students
        print(f"Sample students: {[{s.get('userId'): s.get('fullName')} for s in sample_students]}")
        
        return ResponseModel(
            student_ids,
            f"Found {len(student_ids)} students in grade {grade}"
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in get_students_by_grade: {str(e)}\n{error_trace}")
        return ErrorResponseModel(
            "Search failed",
            500,
            f"Failed to find students by grade: {str(e)}"
        )
    finally:
        client.close()
