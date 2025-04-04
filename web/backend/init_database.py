# init_database.py
import os, csv, random, bcrypt, datetime, unicodedata
from dotenv import load_dotenv
from pymongo import MongoClient
from schedule_algorithm import generate_strict_schedule

load_dotenv()

def remove_accents(input_str: str) -> str:
    s = unicodedata.normalize('NFD', input_str)
    s = s.encode('ascii', 'ignore').decode('utf-8')
    return s

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def parse_date(date_str: str):
    try:
        if '/' in date_str:
            day, month, year = map(int, date_str.split('/'))
            return datetime.datetime(year, month, day)
        elif '-' in date_str:
            y, m, d = map(int, date_str.split('-'))
            return datetime.datetime(y, m, d)
    except:
        pass
    return None

def generate_username(full_name: str, id_num: int, batch: int = None) -> str:
    """
    Sinh username theo cấu trúc:
      - Lấy phần cuối (tên gọi) của full_name (sau khi xóa dấu, chuyển về chữ thường)
      - Lấy chữ cái đầu của các phần còn lại (họ và tên đệm)
      - Nếu có batch: username = <given_name><initials><batch><id>
      - Nếu không có batch: username = <given_name><initials><id>
    VD: "Nguyễn Phước Thành", id=12, batch=3 -> "thanh" + "np" + "3" + "12" = "thanhnp312"
    """
    parts = remove_accents(full_name).lower().strip().split()
    if not parts:
        return str(id_num)
    given_name = parts[-1]
    initials = "".join(part[0] for part in parts[:-1])
    if batch is not None:
        return f"{given_name}{initials}{batch}{id_num}"
    else:
        return f"{given_name}{initials}{id_num}"

def find_file_path(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    return None

def connect_to_mongodb():
    mongo_uri = os.getenv('MONGO_URI')
    client = MongoClient(mongo_uri, tlsAllowInvalidCertificates=True)
    client.admin.command('ping')
    return client

def drop_all_collections(db):
    for col_name in db.list_collection_names():
        db[col_name].drop()

def import_slot_format(db):
    slot_csv = find_file_path(["backend/database/scheduleformat.csv", "database/scheduleformat.csv"])
    if slot_csv:
        slots = []
        with open(slot_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                slots.append({
                    "SlotNumber": int(row["SlotNumber"]),
                    "DayOfWeek": row["DayOfWeek"],
                    "StartTime": row["StartTime"],
                    "EndTime": row["EndTime"]
                })
        if slots:
            db.slots.insert_many(slots)
            print(f"[INIT] Imported {len(slots)} slots from scheduleformat.csv.")

def import_curriculum_data(db, grade):
    paths = [f'backend/database/curriculum_{grade}.csv', f'database/curriculum_{grade}.csv']
    file_path = find_file_path(paths)
    if not file_path:
        print(f"[Warning] Curriculum file for grade {grade} not found.")
        return None
    curriculum_doc = db.curriculums.find_one({"curriculumId": grade})
    if not curriculum_doc:
        curriculum_doc = {
            "curriculumId": grade,
            "curriculumName": f"Chương trình lớp {grade}",
            "description": f"Curriculum for grade {grade}"
        }
        db.curriculums.insert_one(curriculum_doc)
        curriculum_doc = db.curriculums.find_one({"curriculumId": grade})
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            subject_name = row["SubjectName"]
            sessions = int(row.get("Sessions", 2))
            subj = db.subjects.find_one({"name": subject_name})
            if not subj:
                print(f"[!] Subject '{subject_name}' not found in DB. Skipping.")
                continue
            subject_id = subj["subjectId"]
            existing = db.curriculumSubjects.find_one({
                "curriculumId": grade,
                "subjectId": subject_id
            })
            if existing:
                db.curriculumSubjects.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"sessions": sessions}}
                )
            else:
                db.curriculumSubjects.insert_one({
                    "curriculumId": grade,
                    "subjectId": subject_id,
                    "sessions": sessions
                })
    return curriculum_doc

def init_database():
    client = connect_to_mongodb()
    db = client["fams"]
    drop_all_collections(db)
    
    # Tạo admin
    admin_user = {
        "userId": "admin",
        "name": "Administrator",
        "email": "admin@fams.edu.vn",
        "password": hash_password("1234"),
        "role": "Admin"
    }
    db.users.insert_one(admin_user)
    
    db.batches.insert_many([
        {"batchId": 3, "BatchName": "Khóa 2023-2026 (Lớp 10)", "StartYear": 2023, "EndYear": 2026},
        {"batchId": 2, "BatchName": "Khóa 2022-2025 (Lớp 11)", "StartYear": 2022, "EndYear": 2025},
        {"batchId": 1, "BatchName": "Khóa 2021-2024 (Lớp 12)", "StartYear": 2021, "EndYear": 2024}
    ])
    
    db.create_collection("classes")
    
    # Import phòng học
    room_csv = find_file_path(["backend/database/room.csv", "database/room.csv"])
    if room_csv:
        rooms = []
        counter = 1
        with open(room_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rooms.append({
                    "classroomId": counter,
                    "RoomNumber": row["room"],
                    "Building": row["building"],
                    "Capacity": int(row["capacity"])
                })
                counter += 1
        if rooms:
            db.classrooms.insert_many(rooms)
            print(f"[INIT] Imported {len(rooms)} rooms from room.csv.")
    else:
        db.classrooms.insert_many([
            {"classroomId": 1, "RoomNumber": "A101", "Building": "A", "Capacity": 40},
            {"classroomId": 2, "RoomNumber": "A102", "Building": "A", "Capacity": 40},
            {"classroomId": 3, "RoomNumber": "B101", "Building": "B", "Capacity": 40},
            {"classroomId": 4, "RoomNumber": "B102", "Building": "B", "Capacity": 40}
        ])
    
    import_slot_format(db)
    
    # Import subjects
    subjects_data = []
    subj_path = find_file_path(["backend/database/subject.csv", "database/subject.csv"])
    if subj_path:
        with open(subj_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=1):
                subjects_data.append({
                    "subjectId": i,
                    "name": row["Name"],
                    "type": row.get("Type", "Chinh"),
                    "description": row.get("Description", "")
                })
    if subjects_data:
        db.subjects.insert_many(subjects_data)
        print(f"[INIT] Imported {len(subjects_data)} subjects.")
    
    # Import teachers
    teachers = []
    teacher_users = []
    teacher_id_counter = 1
    teacher_path = find_file_path(["backend/database/teacher.csv", "database/teacher.csv"])
    if teacher_path:
        with open(teacher_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                full_name = row["FullName"].strip()
                date_of_birth = parse_date(row.get("DateOfBirth", ""))
                phone = row.get("Phone", "")
                gender = row.get("Gender", "False").lower() in ["true", "1", "yes"]
                major = row.get("Major", "")
                weekly_capacity = row.get("WeeklyCapacity", "10")
                # Với teacher, không có batch nên không truyền batch
                username = generate_username(full_name, teacher_id_counter)
                teacher_users.append({
                    "userId": username,
                    "name": full_name,
                    "email": f"{username}@fams.edu.vn",
                    "password": hash_password("123456"),
                    "role": "Teacher"
                })
                teachers.append({
                    "teacherId": teacher_id_counter,
                    "userId": username,
                    "fullName": full_name,
                    "email": f"{username}@fams.edu.vn",
                    "dateOfBirth": date_of_birth,
                    "address": row.get("Address", ""),
                    "phone": phone,
                    "gender": gender,
                    "major": major,
                    "WeeklyCapacity": int(weekly_capacity)
                })
                teacher_id_counter += 1
    if teacher_users:
        db.users.insert_many(teacher_users)
    if teachers:
        db.teachers.insert_many(teachers)
    print(f"[INIT] Imported {len(teachers)} teachers.")
    
    # Import students
    def import_students(csv_path, batch_id, student_id_start):
        students = []
        sid = student_id_start
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                fn = row.get("FullName") or row.get("Full Name") or ""
                fn = fn.strip()
                if not fn:
                    continue
                dob = parse_date(row.get("DateOfBirth") or row.get("Date of Birth") or "")
                gender = row.get("Gender", "False").lower() in ["true", "1", "yes"]
                phone = row.get("Phone", "")
                address = row.get("Address", "")
                # Với student, truyền thêm batch id để tạo username theo cấu trúc yêu cầu
                uname = generate_username(fn, sid, batch_id)
                db.users.insert_one({
                    "userId": uname,
                    "name": fn,
                    "email": f"{uname}@fams.edu.vn",
                    "password": hash_password("123456"),
                    "role": "Student"
                })
                students.append({
                    "studentId": sid,
                    "userId": uname,
                    "fullName": fn,
                    "dateOfBirth": dob,
                    "classId": None,
                    "batchId": batch_id,
                    "gender": gender,
                    "address": address,
                    "phone": phone,
                    "parentIds": []
                })
                sid += 1
        return students, sid
    
    student_id_counter = 1
    students_10 = []
    students_11 = []
    students_12 = []
    s10_path = find_file_path(["backend/database/student_class_10.csv", "database/student_class_10.csv"])
    s11_path = find_file_path(["backend/database/student_class_11.csv", "database/student_class_11.csv"])
    s12_path = find_file_path(["backend/database/student_class_12.csv", "database/student_class_12.csv"])
    if s10_path:
        students_10, student_id_counter = import_students(s10_path, 3, student_id_counter)
    if s11_path:
        students_11, student_id_counter = import_students(s11_path, 2, student_id_counter)
    if s12_path:
        students_12, student_id_counter = import_students(s12_path, 1, student_id_counter)
    all_students = students_10 + students_11 + students_12
    if all_students:
        db.students.insert_many(all_students)
        print(f"[INIT] Imported {len(all_students)} students.")
    
    def distribute_students(students, grade, batch_id):
        students_sorted = sorted(students, key=lambda s: s["fullName"])
        chunk_size = 20
        class_index = 1
        for i in range(0, len(students_sorted), chunk_size):
            chunk = students_sorted[i:i+chunk_size]
            class_name = f"{grade}A{class_index}"
            class_index += 1
            c_doc = {
                "className": class_name,
                "homeroomTeacherId": None,
                "BatchID": batch_id
            }
            r = db.classes.insert_one(c_doc)
            new_class_id = db.classes.count_documents({})
            db.classes.update_one({"_id": r.inserted_id}, {"$set": {"classId": new_class_id}})
            for st in chunk:
                db.students.update_one({"studentId": st["studentId"]}, {"$set": {"classId": new_class_id}})
    
    distribute_students(students_10, 10, 3)
    distribute_students(students_11, 11, 2)
    distribute_students(students_12, 12, 1)
    print("[INIT] Distributed students into classes.")
    
    # Import parents
    parent_users = []
    parents_data = []
    parent_id = 1
    parent_path = find_file_path(["backend/database/parent.csv", "database/parent.csv"])
    if parent_path:
        with open(parent_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                fn = row["FullName"].strip()
                gender = row.get("Gender", "False").lower() in ["true", "1", "yes"]
                phone = row.get("Phone", "")
                career = row.get("Career", "")
                # Với parent, không có batch nên chỉ truyền id
                uname = generate_username(fn, parent_id)
                parent_users.append({
                    "userId": uname,
                    "name": fn,
                    "email": f"{uname}@fams.edu.vn",
                    "password": hash_password("123456"),
                    "role": "Parent"
                })
                parents_data.append({
                    "parentId": parent_id,
                    "userId": uname,
                    "fullName": fn,
                    "career": career,
                    "phone": phone,
                    "gender": gender,
                    "studentIds": []
                })
                parent_id += 1
    if parent_users:
        db.users.insert_many(parent_users)
    if parents_data:
        db.parents.insert_many(parents_data)
    print(f"[INIT] Imported {len(parents_data)} parents.")
    
    all_stu_db = list(db.students.find())
    all_par_db = list(db.parents.find())
    for s in all_stu_db:
        how_many = random.randint(1, 2)
        chosen = random.sample(all_par_db, how_many)
        for p in chosen:
            db.parents.update_one({"parentId": p["parentId"]}, {"$addToSet": {"studentIds": s["studentId"]}})
            db.students.update_one({"studentId": s["studentId"]}, {"$addToSet": {"parentIds": p["parentId"]}})
    
    db.create_collection("curriculums")
    db.create_collection("curriculumSubjects")
    for g in [10, 11, 12]:
        import_curriculum_data(db, g)
    
    semester_docs = []
    batch_semester = [
        {"BatchID": 3, "CurriculumID": 10},
        {"BatchID": 2, "CurriculumID": 11},
        {"BatchID": 1, "CurriculumID": 12}
    ]
    for bs in batch_semester:
        for idx in [1, 2]:
            sem_doc = {
                "SemesterName": f"Học kỳ {idx}",
                "StartDate": datetime.datetime(2023, 9, 1) if idx == 1 else datetime.datetime(2024, 2, 1),
                "EndDate": datetime.datetime(2024, 1, 15) if idx == 1 else datetime.datetime(2024, 6, 15),
                "CurriculumID": bs["CurriculumID"],
                "BatchID": bs["BatchID"]
            }
            db.semesters.insert_one(sem_doc)
            sem = db.semesters.find_one({"SemesterName": sem_doc["SemesterName"], "BatchID": bs["BatchID"]})
            semester_docs.append(sem)
    
    total_schedules = 0
    for sem in semester_docs:
        scheds, warnings = generate_strict_schedule(db, sem, total_weeks=18)
        total_schedules += len(scheds)
        if warnings:
            for w in warnings:
                print("[WARNING]", w)
    print(f"[INIT] Completed database initialization! Total Schedules: {total_schedules}")

if __name__ == "__main__":
    init_database()
