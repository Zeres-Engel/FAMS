"""
User data generation for FAMS - Teachers, Students, Parents and Admin
"""
import csv
import os
import random
from ..utils import hash_password, generate_username, parse_date
from src.models.UserAccount import UserAccount
from src.models.Teacher import Teacher
from src.models.Student import Student
from src.models.Parent import Parent
from src.models.Batch import Batch
from src.models.ParentStudent import ParentStudent


def create_admin_user(db):
    """Create default admin user"""
    admin_user = UserAccount(
        userId="admin",
        name="Administrator",
        email="admin@fams.edu.vn",
        password=hash_password("1234"),
        role="admin",
        isActive=True
    )
    db.UserAccount.insert_one(admin_user.dict(exclude={"collection"}))
    return admin_user


def import_teachers(db):
    """Import teachers from CSV file"""
    teachers = []
    teacher_users = []
    teacher_id_counter = 1
    teacher_path = "src/data/teacher.csv"
    
    if not os.path.exists(teacher_path):
        print("[WARNING] Teacher data file not found.")
        return [], []
        
    with open(teacher_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            full_name = row["FullName"].strip()
            name_parts = full_name.split()
            
            # Đảo ngược FirstName và LastName cho phù hợp với tên tiếng Việt
            # LastName là họ (đầu cùng), FirstName là tên (cuối cùng)
            last_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else ""
            first_name = name_parts[-1] if name_parts else full_name
            
            date_of_birth = parse_date(row.get("DateOfBirth", ""))
            phone = row.get("Phone", "")
            gender = row.get("Gender", "False").lower() in ["true", "1", "yes"]
            major = row.get("Major", "")
            weekly_capacity = row.get("WeeklyCapacity", "10")
            username = generate_username(full_name, teacher_id_counter, role="teacher")
            
            # Tạo email
            email = f"{username}@fams.edu.vn"
            
            # Create user account
            user = UserAccount(
                userId=username,
                name=full_name,
                email=email,
                password=hash_password("123456"),
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
                "WeeklyCapacity": int(weekly_capacity)
            })
            teachers.append(teacher_dict)
            
            teacher_id_counter += 1
            
    if teacher_users:
        db.UserAccount.insert_many(teacher_users)
    if teachers:
        db.Teacher.insert_many(teachers)
        
    print(f"[INIT] Imported {len(teachers)} teachers.")
    return teachers, teacher_users


def import_students(db, csv_path, batch_id, student_id_start):
    """Import students from CSV for a specific batch"""
    students = []
    student_users = []
    sid = student_id_start
    
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            fn = row.get("FullName") or row.get("Full Name") or ""
            fn = fn.strip()
            if not fn:
                continue
            
            name_parts = fn.split()
            # Đảo ngược FirstName và LastName cho phù hợp với tên tiếng Việt
            # LastName là họ (đầu cùng), FirstName là tên (cuối cùng)
            last_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else ""
            first_name = name_parts[-1] if name_parts else fn
                
            dob = parse_date(row.get("DateOfBirth") or row.get("Date of Birth") or "")
            gender = row.get("Gender", "False").lower() in ["true", "1", "yes"]
            phone = row.get("Phone", "")
            address = row.get("Address", "")
            username = generate_username(fn, sid, batch_id, role="student")
            
            # Tạo email
            email = f"{username}@fams.edu.vn"
            
            # Xử lý thông tin phụ huynh
            parent_names = []
            parent_careers = []
            parent_phones = []
            parent_genders = []
            
            # Thử đọc từ các định dạng khác nhau
            try:
                # ParentNames: có thể là list hoặc string
                parent_names_str = row.get("ParentNames") or row.get("Parent Names") or "[]"
                if parent_names_str.startswith("[") and parent_names_str.endswith("]"):
                    parent_names = eval(parent_names_str)
                else:
                    parent_names = [parent_names_str]
                
                # Careers: có thể là list hoặc string
                careers_str = row.get("Careers") or row.get("ParentCareers") or "[]"
                if careers_str.startswith("[") and careers_str.endswith("]"):
                    parent_careers = eval(careers_str)
                else:
                    parent_careers = [careers_str]
                
                # Phones: có thể là list hoặc string
                phones_str = row.get("Phones") or row.get("ParentPhones") or "[]"
                if phones_str.startswith("[") and phones_str.endswith("]"):
                    parent_phones = eval(phones_str)
                else:
                    parent_phones = [phones_str]
                
                # ParentGenders: có thể là list hoặc string
                genders_str = row.get("ParentGenders") or "[]"
                if genders_str.startswith("[") and genders_str.endswith("]"):
                    parent_genders = eval(genders_str)
                else:
                    parent_genders = [genders_str.lower() in ["true", "1", "yes"]]
                
                # Loại bỏ các giá trị rỗng
                parent_names = [name for name in parent_names if name and name != ""]
                parent_careers = [career for career in parent_careers if career and career != ""]
                parent_phones = [phone for phone in parent_phones if phone and phone != ""]
                
                # Loại bỏ các dấu ngoặc nếu có
                parent_names = [name.strip("'\"") for name in parent_names]
                parent_careers = [career.strip("'\"") for career in parent_careers]
                parent_phones = [str(phone).strip("'\"") for phone in parent_phones]
                
            except Exception as e:
                print(f"DEBUG: Error parsing parent data for student {fn}: {str(e)}")
                print(f"DEBUG: Row data: {row}")
            
            # Create user account
            user = UserAccount(
                userId=username,
                name=fn,
                email=email,
                password=hash_password("123456"),
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
                dateOfBirth=dob,
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
    
    if student_users:
        db.UserAccount.insert_many(student_users)
            
    return students, sid


def generate_all_students(db):
    """Generate students for all grades"""
    student_id_counter = 1
    all_students = []
    
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
    s10_path = "src/data/student_class_10.csv" 
    s11_path = "src/data/student_class_11.csv"
    s12_path = "src/data/student_class_12.csv"
    
    students_10 = []
    students_11 = []
    students_12 = []
    
    if os.path.exists(s10_path):
        students_10, student_id_counter = import_students(db, s10_path, 3, student_id_counter)
    if os.path.exists(s11_path):
        students_11, student_id_counter = import_students(db, s11_path, 2, student_id_counter)
    if os.path.exists(s12_path):
        students_12, student_id_counter = import_students(db, s12_path, 1, student_id_counter)
        
    all_students = students_10 + students_11 + students_12
    
    if all_students:
        db.Student.insert_many(all_students)
        print(f"[INIT] Imported {len(all_students)} students.")
        
    return {
        "grade10": students_10,
        "grade11": students_11, 
        "grade12": students_12
    }


def import_parents(db):
    """
    Import parents from student data
    Returns a list of created parents
    """
    parents = []
    parent_users = []
    
    # Get all students from database
    all_students = list(db.Student.find())
    print(f"[INFO] Found {len(all_students)} students for parent creation")
    
    pid = 1
    for student in all_students:
        parent_names = student.get("parentNames", [])
        parent_careers = student.get("parentCareers", [])
        parent_phones = student.get("parentPhones", [])
        parent_genders = student.get("parentGenders", [])
        
        # Debug log
        if parent_names:
            print(f"[DEBUG] Student {student.get('fullName', '')}, ID: {student.get('studentId', '')} has {len(parent_names)} parents")
        
        student_parent_ids = []
        for i, parent_name in enumerate(parent_names):
            if not parent_name or parent_name.strip() == "":
                continue
                
            # Process parent name into Vietnamese name format
            name_parts = parent_name.split()
            last_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else ""
            first_name = name_parts[-1] if name_parts else parent_name
            
            # Get career, phone, and gender
            career = parent_careers[i] if i < len(parent_careers) else ""
            phone = parent_phones[i] if i < len(parent_phones) else ""
            gender = parent_genders[i] if i < len(parent_genders) else True
            
            # Ensure phone is a string
            phone = str(phone) if phone else ""
            
            # Generate username and email
            username = generate_username(parent_name, id_num=pid, role="parent")
            email = f"{username}@fams.edu.vn"
            
            # Check if parent already exists
            existing_parent = db.Parent.find_one({"$or": [
                {"fullName": parent_name, "phone": phone},
                {"email": email}
            ]})
            
            if existing_parent:
                parent_id = existing_parent.get("parentId")
                student_parent_ids.append(parent_id)
                print(f"[INFO] Using existing parent: {parent_name} (ID: {parent_id})")
                continue
            
            # Create user account
            user = UserAccount(
                userId=username,
                email=email,
                password=hash_password("123456"),
                role="parent",
                isActive=True
            )
            parent_users.append(user.dict(exclude={"collection"}))
            
            # Create parent record
            parent = Parent(
                parentId=pid,
                userId=username,
                fullName=parent_name,
                email=email,
                phone=phone,
                gender=gender,  # Store as boolean
                career=career
            )
            
            parent_dict = parent.dict(exclude={"collection"})
            parents.append(parent_dict)
            student_parent_ids.append(pid)
            
            pid += 1
            
        # Update student with parent IDs
        if student_parent_ids:
            db.Student.update_one(
                {"studentId": student.get("studentId")}, 
                {"$set": {"parentIds": student_parent_ids}}
            )
            
    # Add to database
    if parent_users:
        db.UserAccount.insert_many(parent_users)
        
    if parents:
        db.Parent.insert_many(parents)
        
    print(f"[INFO] Imported {len(parents)} parents for {len(all_students)} students")
    return parents


def link_parents_to_students(db):
    """
    Link parents to students by creating proper ParentStudent relationships
    Returns the number of created relationships
    """
    # Get collections
    parent_student_collection = db.ParentStudent
    student_collection = db.Student
    parent_collection = db.Parent
    
    # Find all students that have parent IDs
    students = list(student_collection.find({"parentIds": {"$exists": True, "$ne": []}}))
    
    # Check if parent-student relationships already exist
    existing_relations = list(parent_student_collection.find())
    if existing_relations:
        print(f"[INFO] Found {len(existing_relations)} existing parent-student relationships")
        return len(existing_relations)
    
    # Create relationships
    relation_id = 1
    parent_student_links = []
    
    for student in students:
        student_id = student.get("studentId")
        parent_ids = student.get("parentIds", [])
        
        # Get parent genders to determine relationship type
        for i, parent_id in enumerate(parent_ids):
            parent = parent_collection.find_one({"parentId": parent_id})
            if parent:
                # Determine relationship type based on gender
                gender = parent.get("gender")
                is_male = None
                
                # Handle different gender formats (boolean or string)
                if isinstance(gender, bool):
                    is_male = gender
                elif isinstance(gender, str):
                    is_male = gender.lower() in ["male", "nam", "true"]
                else:
                    is_male = True  # Default to male if unknown
                
                relationship_type = "Father" if is_male else "Mother"
                
                # Create parent-student relationship
                relation = ParentStudent(
                    parentStudentId=relation_id,
                    parentId=parent_id,
                    studentId=student_id,
                    relationship=relationship_type,
                    isEmergencyContact=(i == 0)  # First parent is emergency contact
                )
                
                parent_student_links.append(relation.dict(exclude={"collection"}))
                relation_id += 1
    
    # Insert all relationships at once if any exist
    if parent_student_links:
        parent_student_collection.insert_many(parent_student_links)
        print(f"[INFO] Created {len(parent_student_links)} parent-student relationships")
    
    return len(parent_student_links) 