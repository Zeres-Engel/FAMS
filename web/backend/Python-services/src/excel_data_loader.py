"""
Excel data loader for FAMS
This module provides functions to load data from Excel files
"""
import os
import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Any

from src.utils import hash_password, generate_username, parse_date, remove_accents
from src.models.user import UserAccount, Teacher, Student, Parent
from src.models.batch import Batch


def read_excel_file(file_path: str) -> Dict[str, pd.DataFrame]:
    """
    Read Excel file with multiple sheets
    Returns dictionary with sheet names as keys and dataframes as values
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Excel file not found: {file_path}")
        
    # Read Excel file with all sheets
    excel_data = pd.read_excel(file_path, sheet_name=None)
    
    return excel_data


def import_teachers_from_excel(db, file_path: str) -> List[Dict[str, Any]]:
    """Import teachers from Excel file"""
    teachers = []
    teacher_users = []
    teacher_id_counter = 1
    
    try:
        excel_data = read_excel_file(file_path)
        
        # Find sheet with teachers (look for sheet with "Giáo viên" in name)
        teacher_sheet = None
        for sheet_name, df in excel_data.items():
            if "giáo viên" in sheet_name.lower() or "teacher" in sheet_name.lower():
                teacher_sheet = df
                break
        
        # If no teacher sheet found, try the second sheet
        if teacher_sheet is None and len(excel_data) >= 2:
            teacher_sheet = list(excel_data.values())[1]
            
        if teacher_sheet is None:
            print("[WARNING] Teacher data sheet not found in Excel file.")
            return [], []
            
        # Convert column names to match expected format if needed
        column_mapping = {
            'Họ và Tên': 'FullName',
            'Số điện thoại': 'Phone',
            'Giới tính': 'Gender',
            'Ngày sinh': 'DateOfBirth',
            'Địa chỉ': 'Address',
            'Môn giảng dạy': 'Major',
            'Số tiết/tuần': 'WeeklyCapacity'
        }
        
        # Rename columns if they exist
        for old_col, new_col in column_mapping.items():
            if old_col in teacher_sheet.columns:
                teacher_sheet = teacher_sheet.rename(columns={old_col: new_col})
                
        # Process each row
        for _, row in teacher_sheet.iterrows():
            # Skip rows with empty name
            if pd.isna(row.get('FullName', '')):
                continue
                
            full_name = str(row.get('FullName', '')).strip()
            name_parts = full_name.split()
            
            # Đảo ngược FirstName và LastName cho phù hợp với tên tiếng Việt
            # LastName là họ (đầu cùng), FirstName là tên (cuối cùng)
            last_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else ""
            first_name = name_parts[-1] if name_parts else full_name
            
            # Convert gender from text to boolean if needed
            gender_value = row.get('Gender', False)
            if isinstance(gender_value, str):
                gender = gender_value.lower() in ["nam", "true", "1", "yes"]
            else:
                gender = bool(gender_value)
            
            # Parse date of birth
            if pd.isna(row.get('DateOfBirth', '')):
                date_of_birth = None
            else:
                dob_str = str(row.get('DateOfBirth', ''))
                date_of_birth = parse_date(dob_str)
            
            # Get phone number and ensure it's a string
            phone = str(row.get('Phone', ''))
            # Clean phone number (remove commas, spaces, etc.)
            phone = ''.join(c for c in phone if c.isdigit())
            
            # Get major and capacity
            major = str(row.get('Major', ''))
            try:
                weekly_capacity = int(row.get('WeeklyCapacity', 10))
            except (ValueError, TypeError):
                weekly_capacity = 10
                
            # Create username
            username = generate_username(full_name, teacher_id_counter, role="teacher")
            
            # Create email
            email = f"{username}@fams.edu.vn"
            
            # Create user account
            user = UserAccount(
                userId=username,
                username=username,
                password=hash_password("123456"),
                email=email,
                backup_email=None,
                role="teacher",
                isActive=True
            )
            teacher_users.append(user.dict(exclude={"collection"}))
            
            # Create teacher
            teacher = Teacher(
                teacherId=str(teacher_id_counter),
                userId=username,
                firstName=first_name,
                lastName=last_name,
                email=email,
                phone=phone
            )
            
            # Add additional fields for database
            teacher_dict = teacher.dict(exclude={"collection"})
            teacher_dict.update({
                "dateOfBirth": date_of_birth,
                "gender": gender,
                "major": major,
                "WeeklyCapacity": weekly_capacity
            })
            teachers.append(teacher_dict)
            
            teacher_id_counter += 1
            
    except Exception as e:
        print(f"[ERROR] Failed to import teachers from Excel: {str(e)}")
        import traceback
        traceback.print_exc()
        return [], []
            
    # Save to database if data exists
    if teacher_users:
        db.UserAccount.insert_many(teacher_users)
    if teachers:
        db.Teacher.insert_many(teachers)
        
    print(f"[INIT] Imported {len(teachers)} teachers from Excel.")
    return teachers, teacher_users


def import_students_from_excel(db, file_path: str, batch_id: str, student_id_start: int) -> Tuple[List[Dict[str, Any]], int]:
    """Import students from Excel file for a specific batch"""
    students = []
    student_users = []
    sid = student_id_start
    
    try:
        excel_data = read_excel_file(file_path)
        
        # Find sheet with students (look for sheet with "Học sinh" in name)
        student_sheet = None
        for sheet_name, df in excel_data.items():
            if "học sinh" in sheet_name.lower() or "student" in sheet_name.lower():
                student_sheet = df
                break
        
        # If no student sheet found, try the first sheet
        if student_sheet is None and len(excel_data) > 0:
            student_sheet = list(excel_data.values())[0]
            
        if student_sheet is None:
            print("[WARNING] Student data sheet not found in Excel file.")
            return [], student_id_start
            
        # Create column mappings for flexibility
        column_mapping = {
            'Họ và Tên': 'FullName',
            'Ngày sinh': 'DateOfBirth',
            'Giới tính': 'Gender',
            'Địa chỉ': 'Address',
            'Số điện thoại': 'Phone',
            'Tên Phụ huynh 1': 'ParentName1',
            'Nghề nghiệp Phụ huynh 1': 'ParentCareer1',
            'SĐT Phụ huynh 1': 'ParentPhone1',
            'Giới tính Phụ huynh 1': 'ParentGender1',
            'Tên Phụ huynh 2': 'ParentName2',
            'Nghề nghiệp Phụ huynh 2': 'ParentCareer2',
            'SĐT Phụ huynh 2': 'ParentPhone2',
            'Giới tính Phụ huynh 2': 'ParentGender2'
        }
        
        # Rename columns if they exist
        for old_col, new_col in column_mapping.items():
            if old_col in student_sheet.columns:
                student_sheet = student_sheet.rename(columns={old_col: new_col})
                
        # Process each row
        for _, row in student_sheet.iterrows():
            # Skip rows with empty name
            if pd.isna(row.get('FullName', '')):
                continue
                
            full_name = str(row.get('FullName', '')).strip()
            name_parts = full_name.split()
            
            # Đảo ngược FirstName và LastName cho phù hợp với tên tiếng Việt
            # LastName là họ (đầu cùng), FirstName là tên (cuối cùng)
            last_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else ""
            first_name = name_parts[-1] if name_parts else full_name
            
            # Parse date of birth
            if pd.isna(row.get('DateOfBirth', '')):
                date_of_birth = None
            else:
                dob_str = str(row.get('DateOfBirth', ''))
                date_of_birth = parse_date(dob_str)
                
            # Convert gender
            gender_value = row.get('Gender', False)
            if isinstance(gender_value, str):
                gender = gender_value.lower() in ["nam", "true", "1", "yes"]
            else:
                gender = bool(gender_value)
                
            # Get address and phone
            address = str(row.get('Address', ''))
            phone = str(row.get('Phone', ''))
            # Clean phone number (remove commas, spaces, etc.)
            phone = ''.join(c for c in phone if c.isdigit())
            
            # Create username and email
            username = generate_username(full_name, sid, batch_id, role="student")
            email = f"{username}@fams.edu.vn"
            
            # Process parent information
            parent_names = []
            parent_careers = []
            parent_phones = []
            parent_genders = []
            
            # Parent 1
            if not pd.isna(row.get('ParentName1', '')):
                parent_names.append(str(row.get('ParentName1', '')))
                parent_careers.append(str(row.get('ParentCareer1', '')))
                
                # Clean phone number
                p_phone = str(row.get('ParentPhone1', ''))
                p_phone = ''.join(c for c in p_phone if c.isdigit())
                parent_phones.append(p_phone)
                
                # Convert gender
                p_gender = row.get('ParentGender1', False)
                if isinstance(p_gender, str):
                    parent_genders.append(p_gender.lower() in ["nam", "true", "1", "yes"])
                else:
                    parent_genders.append(bool(p_gender))
            
            # Parent 2
            if not pd.isna(row.get('ParentName2', '')):
                parent_names.append(str(row.get('ParentName2', '')))
                parent_careers.append(str(row.get('ParentCareer2', '')))
                
                # Clean phone number
                p_phone = str(row.get('ParentPhone2', ''))
                p_phone = ''.join(c for c in p_phone if c.isdigit())
                parent_phones.append(p_phone)
                
                # Convert gender
                p_gender = row.get('ParentGender2', False)
                if isinstance(p_gender, str):
                    parent_genders.append(p_gender.lower() in ["nam", "true", "1", "yes"])
                else:
                    parent_genders.append(bool(p_gender))
            
            # Create user account
            user = UserAccount(
                userId=username,
                username=username,
                password=hash_password("123456"),
                email=email,
                backup_email=None,
                role="student",
                isActive=True
            )
            student_users.append(user.dict(exclude={"collection"}))
            
            # Create student
            student = Student(
                studentId=str(sid),
                userId=username,
                firstName=first_name,
                lastName=last_name,
                email=email,
                phone=phone,
                dateOfBirth=date_of_birth,
                gender="Male" if gender else "Female",
                address=address
            )
            
            student_dict = student.dict(exclude={"collection"})
            student_dict.update({
                "classId": None,
                "batchId": batch_id,
                "parentIds": [],
                "parentNames": parent_names,
                "parentCareers": parent_careers,
                "parentPhones": parent_phones,
                "parentGenders": parent_genders
            })
            students.append(student_dict)
            
            sid += 1
    
    except Exception as e:
        print(f"[ERROR] Failed to import students from Excel: {str(e)}")
        import traceback
        traceback.print_exc()
        return [], student_id_start
    
    if student_users:
        db.UserAccount.insert_many(student_users)
            
    return students, sid


def generate_all_students_from_excel(db, excel_files: List[str] = None):
    """Generate students for all grades from Excel files"""
    student_id_counter = 1
    all_students = []
    
    # If no files specified, try default paths
    if not excel_files:
        excel_files = [
            "src/data/xlsx/sample/FAMS_10.xlsx",
            "src/data/xlsx/sample/FAMS_11.xlsx",
            "src/data/xlsx/sample/FAMS_12.xlsx"
        ]
    
    # Import batch info
    batches = [
        Batch(
            batchId="3",
            batchName="Khóa 2023-2026 (Lớp 10)",
            startDate=parse_date("2023-09-01"),
            endDate=parse_date("2026-06-30")
        ),
        Batch(
            batchId="2",
            batchName="Khóa 2022-2025 (Lớp 11)",
            startDate=parse_date("2022-09-01"),
            endDate=parse_date("2025-06-30")
        ),
        Batch(
            batchId="1",
            batchName="Khóa 2021-2024 (Lớp 12)",
            startDate=parse_date("2021-09-01"),
            endDate=parse_date("2024-06-30")
        )
    ]
    
    db.Batch.insert_many([batch.dict(exclude={"collection"}) for batch in batches])
    
    # Import students for each grade
    students_10 = []
    students_11 = []
    students_12 = []
    
    # Check each file and import if exists
    for file_idx, file_path in enumerate(excel_files):
        if os.path.exists(file_path):
            batch_id = str(3 - file_idx)  # 3, 2, 1 for grades 10, 11, 12
            students, student_id_counter = import_students_from_excel(
                db, file_path, batch_id, student_id_counter
            )
            
            if file_idx == 0:
                students_10 = students
            elif file_idx == 1:
                students_11 = students
            elif file_idx == 2:
                students_12 = students
                
            print(f"[INIT] Imported {len(students)} students from {file_path}")
    
    all_students = students_10 + students_11 + students_12
    
    if all_students:
        db.Student.insert_many(all_students)
        print(f"[INIT] Imported total of {len(all_students)} students from Excel files.")
        
    return {
        "grade10": students_10,
        "grade11": students_11, 
        "grade12": students_12
    }


def import_all_teachers_from_excel(db, excel_files: List[str] = None):
    """Import teachers from all Excel files"""
    all_teachers = []
    all_teacher_users = []
    
    # If no files specified, try default paths
    if not excel_files:
        excel_files = [
            "src/data/xlsx/sample/FAMS_10.xlsx",
            "src/data/xlsx/sample/FAMS_11.xlsx",
            "src/data/xlsx/sample/FAMS_12.xlsx"
        ]
    
    # Try to import from each file
    for file_path in excel_files:
        if os.path.exists(file_path):
            teachers, teacher_users = import_teachers_from_excel(db, file_path)
            all_teachers.extend(teachers)
            all_teacher_users.extend(teacher_users)
    
    return all_teachers, all_teacher_users 