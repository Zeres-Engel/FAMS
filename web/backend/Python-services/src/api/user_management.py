"""
User Management API Endpoints
Handles general user management functions, importing users, and parent relationships
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

from ..db import get_database, connect_to_mongodb
from ..constants import COLLECTIONS
from ..utils import hash_password, generate_username
from .models import ResponseModel, ErrorResponseModel

# Create main router
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
                
                # For teachers, get email, major and degree
                if role == "teacher":
                    email = row.get('Email', '')
                    if email and not pd.isna(email):
                        user_info = {
                            "name": str(name),
                            "dayOfBirth": dayOfBirth,
                            "gender": str(gender),
                            "address": str(address),
                            "phone": str(phone),
                            "email": str(email),
                            "role": role,
                            "chosen": True  # Add chosen=True for all records
                        }
                    
                    major = row.get('Chuyên môn', row.get('Major', ''))
                    if major and not pd.isna(major):
                        user_info["major"] = str(major)
                    
                    degree = row.get('Bằng cấp', row.get('Degree', ''))
                    if degree and not pd.isna(degree):
                        user_info["degree"] = str(degree)
                
                # For students, build basic info
                else:
                    user_info = {
                        "name": str(name),
                        "dayOfBirth": dayOfBirth,
                        "gender": str(gender),
                        "address": str(address),
                        "phone": str(phone),
                        "role": role,
                        "chosen": True  # Add chosen=True for all records
                    }
                
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
            
            # Format date of birth - now using dayOfBirth with fallback to dob for backward compatibility
            dob_str = user.get("dayOfBirth", user.get("dob", ""))
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