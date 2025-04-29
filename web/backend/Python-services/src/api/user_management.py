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
from fastapi.responses import FileResponse
from pathlib import Path

from ..db import get_database, connect_to_mongodb
from ..constants import COLLECTIONS
from ..utils import hash_password, generate_username
from .models import ResponseModel, ErrorResponseModel

# Create main router
router = APIRouter()

@router.get("/download/template")
async def download_user_template():
    """
    Download the FAMS user import template file
    """
    template_path = "src/data/xlsx/sample/FAMS.xlsx"
    
    # Check if file exists
    if not os.path.exists(template_path):
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(template_path), exist_ok=True)
        
        # If template doesn't exist, create a simple one
        try:
            # Create a simple template with pandas
            student_df = pd.DataFrame({
                'Họ và Tên': ['Học sinh mẫu 1', 'Học sinh mẫu 2'],
                'Ngày sinh': ['01/01/2010', '02/02/2010'],
                'Giới tính': ['Nam', 'Nữ'],
                'Địa chỉ': ['Hồ Chí Minh', 'Hà Nội'],
                'Số điện thoại': ['0987654321', '0123456789'],
                'Tên Phụ huynh 1': ['Nguyễn Văn A', 'Trần Thị B'],
                'Nghề nghiệp Phụ huynh 1': ['Kỹ sư', 'Giáo viên'],
                'SĐT Phụ huynh 1': ['0912345678', '0987654321'],
                'Giới tính Phụ huynh 1': ['Nam', 'Nữ'],
                'Email Phụ huynh 1': ['nguyenvana@gmail.com', 'tranthib@gmail.com'],
                'Tên Phụ huynh 2': ['Nguyễn Thị C', 'Trần Văn D'],
                'Nghề nghiệp Phụ huynh 2': ['Bác sĩ', 'Kinh doanh'],
                'SĐT Phụ huynh 2': ['0823456789', '0765432198'],
                'Giới tính Phụ huynh 2': ['Nữ', 'Nam'],
                'Email Phụ huynh 2': ['nguyenthic@gmail.com', 'tranvand@gmail.com']
            })
            
            teacher_df = pd.DataFrame({
                'Họ và Tên': ['Giáo viên mẫu 1', 'Giáo viên mẫu 2'],
                'Ngày sinh': ['01/01/1985', '02/02/1990'],
                'Giới tính': ['Nam', 'Nữ'],
                'Địa chỉ': ['Hồ Chí Minh', 'Hà Nội'],
                'Số điện thoại': ['0987654321', '0123456789'],
                'Email': ['giaovien1@fams.edu.vn', 'giaovien2@fams.edu.vn'],
                'Chuyên môn': ['Toán', 'Văn'],
                'Bằng cấp': ['Thạc sĩ', 'Cử nhân']
            })
            
            # Write to Excel file with multiple sheets
            with pd.ExcelWriter(template_path) as writer:
                student_df.to_excel(writer, sheet_name='Học sinh', index=False)
                teacher_df.to_excel(writer, sheet_name='Giáo viên', index=False)
                
        except Exception as e:
            return ErrorResponseModel(
                "Template creation failed",
                500,
                f"Failed to create template file: {str(e)}"
            )
    
    return FileResponse(
        path=template_path,
        filename="FAMS_template.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

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
                    
                    # Thêm xử lý weeklyCapacity (số tiết dạy mỗi tuần)
                    weekly_capacity = row.get('Weekcapacity', row.get('WeeklyCapacity', row.get('Số tiết/tuần', row.get('weekly_capacity', row.get('weeklyCapacity', None)))))
                    if weekly_capacity is not None and not pd.isna(weekly_capacity):
                        try:
                            user_info["weeklyCapacity"] = int(weekly_capacity)
                        except (ValueError, TypeError):
                            user_info["weeklyCapacity"] = 10  # Giá trị mặc định
                
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
    Returns a quick acknowledgment and processes the import in background
    """
    # Filter only chosen users
    chosen_users = [user for user in user_data if user.get("chosen", False)]
    
    if not chosen_users:
        return ErrorResponseModel(
            "No users selected", 
            400, 
            "No users selected for import"
        )
    
    # Start a background task for importing
    import asyncio
    import threading
    
    def import_users_in_background(users_to_import):
        # Create a new event loop for the thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Connect to database
            client = connect_to_mongodb()
            db = client["fams"]
            current_year = datetime.datetime.now().year
            
            # Process users in background
            for index, user in enumerate(users_to_import):
                try:
                    # Process user code from original function...
                    role = user.get("role", "")
                    name = user.get("name", "")
                    
                    # Generate username based on name and counter
                    username = generate_username(name, index + 1, role=role)
                    
                    # Create email
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
                    
                    # Process role-specific data
                    # ... Rest of the user processing code
                    # Process gender field (handle Vietnamese input)
                    gender_str = user.get("gender", "").lower()
                    gender = True if gender_str in ["nam", "male", "true", "1"] else False
                    
                    # Format date of birth
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
                        # Student processing...
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
                        db.Student.insert_one(student_doc)
                        
                        # Process parent information if available
                        if "parent1" in user and user["parent1"]:
                            parent1 = user["parent1"]
                            process_parent(db, parent1, index)
                            
                        if "parent2" in user and user["parent2"]:
                            parent2 = user["parent2"]
                            process_parent(db, parent2, index + 1000)  # Offset to avoid conflicts
                            
                    elif role == "teacher":
                        # Teacher processing...
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
                        db.Teacher.insert_one(teacher_doc)
                except Exception as user_error:
                    print(f"Error processing user {index}: {str(user_error)}")
                    # Continue with other users even if one fails
                    continue
                
            client.close()
        except Exception as e:
            print(f"Background import error: {str(e)}")
        finally:
            loop.close()
    
    # Start the background thread for importing
    import_thread = threading.Thread(
        target=import_users_in_background, 
        args=(chosen_users,),
        daemon=True
    )
    import_thread.start()
    
    # Return an immediate success response
    return ResponseModel(
        {"status": "importing", "count": len(chosen_users)},
        f"Import of {len(chosen_users)} users has been started successfully in the background"
    )

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