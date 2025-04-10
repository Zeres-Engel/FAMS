"""
User data generation for FAMS - Teachers, Students, Parents and Admin
"""
import csv
import os
import random
from src.utils import hash_password, generate_username, parse_date
from src.models.user import UserAccount, Teacher, Student, Parent
from src.models.batch import Batch


def create_admin_user(db):
    """Create default admin user"""
    admin_user = UserAccount(
        userId="admin",
        username="admin",
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
            
            first_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else full_name
            last_name = name_parts[-1] if name_parts else ""
            
            date_of_birth = parse_date(row.get("DateOfBirth", ""))
            phone = row.get("Phone", "")
            gender = row.get("Gender", "False").lower() in ["true", "1", "yes"]
            major = row.get("Major", "")
            weekly_capacity = row.get("WeeklyCapacity", "10")
            username = generate_username(full_name, teacher_id_counter)
            
            # Create user account
            user = UserAccount(
                userId=username,
                username=username,
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
                email=f"{username}@fams.edu.vn",
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
            first_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else fn
            last_name = name_parts[-1] if name_parts else ""
                
            dob = parse_date(row.get("DateOfBirth") or row.get("Date of Birth") or "")
            gender = row.get("Gender", "False").lower() in ["true", "1", "yes"]
            phone = row.get("Phone", "")
            address = row.get("Address", "")
            username = generate_username(fn, sid, batch_id)
            
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
                username=username,
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
                email=f"{username}@fams.edu.vn",
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
    """Import parents and link to students"""
    parents = []
    parent_users = []
    parent_student_links = []
    
    # Lấy tất cả sinh viên từ database
    all_students = list(db.Student.find())
    print(f"DEBUG: Tìm thấy {len(all_students)} sinh viên để tạo phụ huynh")
    
    pid = 1
    for student in all_students:
        parent_names = student.get("parentNames", [])
        parent_careers = student.get("parentCareers", [])
        parent_phones = student.get("parentPhones", [])
        parent_genders = student.get("parentGenders", [])
        
        print(f"DEBUG: Student {student.get('firstName', '')} {student.get('lastName', '')} has parents: {parent_names}")
        
        student_parent_ids = []
        for i, parent_name in enumerate(parent_names):
            if not parent_name:
                continue
                
            # Nếu chưa có, tạo parent mới
            name_parts = parent_name.split()
            first_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else parent_name
            last_name = name_parts[-1] if name_parts else ""
            
            career = parent_careers[i] if i < len(parent_careers) else ""
            phone = parent_phones[i] if i < len(parent_phones) else ""
            gender = parent_genders[i] if i < len(parent_genders) else False
            
            # Đảm bảo phone là chuỗi
            phone = str(phone) if phone else ""
            
            username = generate_username(parent_name, id_num=pid)
            
            # Create user account
            user = UserAccount(
                userId=username,
                username=username,
                password=hash_password("123456"),
                role="parent",
                isActive=True
            )
            parent_users.append(user.dict(exclude={"collection"}))
            
            # Create parent
            parent = Parent(
                parentId=str(pid),
                userId=username,
                firstName=first_name,
                lastName=last_name,
                email=f"{username}@fams.edu.vn",
                phone=phone
            )
            
            parent_dict = parent.dict(exclude={"collection"})
            parent_dict.update({
                "career": career,
                "gender": gender
            })
            
            parents.append(parent_dict)
            student_parent_ids.append(str(pid))
            
            # Liên kết phụ huynh với học sinh
            parent_student_links.append({
                "parentId": str(pid),
                "studentId": student["studentId"],
                "relationship": "Father" if not gender else "Mother"
            })
            
            pid += 1
            
        # Cập nhật parentIds cho student
        if student_parent_ids:
            db.Student.update_one(
                {"studentId": student["studentId"]}, 
                {"$set": {"parentIds": student_parent_ids}}
            )
            
    # Thêm vào database
    if parent_users:
        db.UserAccount.insert_many(parent_users)
        
    if parents:
        db.Parent.insert_many(parents)
        
    if parent_student_links:
        db.ParentStudent.insert_many(parent_student_links)
        
    print(f"[INIT] Imported {len(parents)} parents for {len(all_students)} students.")
    return parents


# Không cần hàm link_parents_to_students nữa vì đã liên kết khi tạo
def link_parents_to_students(db):
    """Link parents to students - không cần thiết nữa"""
    print(f"[INIT] Parents already linked to students during creation.") 