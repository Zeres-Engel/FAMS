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
    """
    Initialize FAMS with basic data only (no students, teachers, or schedules)
    
    This endpoint will:
    1. Create all collections based on FAMS.sql schema
    2. Create appropriate indexes for performance
    3. Load basic data (subjects, classrooms, time slots)
    4. Create admin user
    5. Generate semester structure
    
    Returns a response when initialization has started.
    """
    background_tasks.add_task(init_fams)
    return ResponseModel(
        "FAMS initialization started in background",
        "FAMS initialization process with database structure based on SQL schema has been queued. Check logs for progress."
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
        # Assuming columns: Name, dayOfBirth, Gender, Address, Phone, Role (or similar)
        user_data = []
        
        # Check if the Role column exists to determine if students or teachers
        if 'Role' in df.columns:
            # If roles are explicitly defined in the file
            for _, row in df.iterrows():
                user_info = {
                    "name": row.get('Họ và Tên', ''),
                    "dayOfBirth": row.get('Ngày sinh', ''),
                    "gender": row.get('Giới tính', ''),
                    "address": row.get('Địa chỉ', ''),
                    "phone": str(row.get('Số điện thoại', '')),
                    "role": row.get('Role', ''),
                    "chosen": True
                }
                user_data.append(user_info)
        else:
            # If roles are not explicitly defined, determine based on the sheet/tab name
            # Assuming first sheet is for Teachers and others for Students
            sheets = pd.ExcelFile(file_path).sheet_names
            
            for sheet in sheets:
                df = pd.read_excel(file_path, sheet_name=sheet)
                role = "teacher" if sheet.lower() == "teachers" else "student"
                
                for _, row in df.iterrows():
                    # Try various possible column names
                    name = row.get('Họ và Tên', row.get('Name', row.get('Họ Tên', '')))
                    dayOfBirth = row.get('Ngày sinh', row.get('dayOfBirth', row.get('DOB', row.get('Birthday', ''))))
                    gender = row.get('Giới tính', row.get('Gender', ''))
                    address = row.get('Địa chỉ', row.get('Address', ''))
                    phone = str(row.get('Số điện thoại', row.get('Phone', row.get('Điện thoại', ''))))
                    
                    user_info = {
                        "name": name,
                        "dayOfBirth": dayOfBirth,
                        "gender": gender,
                        "address": address,
                        "phone": phone,
                        "role": role,
                        "chosen": True
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

@router.post("/import/filtered-users")
async def import_filtered_users(user_data: List[Dict] = Body(...)):
    """
    Import filtered users to database
    
    Only users with chosen=True will be imported
    Returns the userIds of imported users
    """
    from pymongo import MongoClient
    from .init_db_excel import get_mongodb_connection
    import datetime
    
    # Filter only chosen users
    chosen_users = [user for user in user_data if user.get("chosen", False)]
    
    if not chosen_users:
        return ErrorResponseModel(
            "No users selected", 
            400, 
            "No users were selected for import"
        )
    
    # Connect to database
    client = get_mongodb_connection()
    db = client["fams"]
    
    # Prepare results to store userIds
    result_ids = []
    
    try:
        # Process users based on role
        for user in chosen_users:
            user_doc = {
                "name": user.get("name", ""),
                "dob": user.get("dayOfBirth", user.get("dob", "")),  # Use dayOfBirth with fallback to dob
                "gender": user.get("gender", ""),
                "address": user.get("address", ""),
                "phone": user.get("phone", ""),
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now()
            }
            
            # Add role-specific fields
            if user.get("role") == "student":
                user_doc["grade"] = user.get("grade", 10)  # Default to grade 10 if not specified
                user_doc["class_id"] = None  # Will be assigned later
                user_doc["class_name"] = None  # Will be assigned later
                
                # Insert student
                result = db.students.insert_one(user_doc)
                result_ids.append({"_id": str(result.inserted_id), "role": "student"})
                
            elif user.get("role") == "teacher":
                user_doc["subjects"] = user.get("subjects", [])
                user_doc["status"] = "active"
                
                # Insert teacher
                result = db.teachers.insert_one(user_doc)
                result_ids.append({"_id": str(result.inserted_id), "role": "teacher"})
        
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

