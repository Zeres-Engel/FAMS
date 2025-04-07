import os, csv, random, bcrypt, datetime, unicodedata
from datetime import timedelta
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
    # Nếu có file CSV thì import, nếu không thì gen mặc định 10 slot cho mỗi ngày trong tuần (Monday -> Sunday)
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
            db.Slot.insert_many(slots)
            print(f"[INIT] Imported {len(slots)} slots from scheduleformat.csv.")
    else:
        days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        default_periods = {
            1: {"start": "07:00", "end": "07:45"},
            2: {"start": "07:50", "end": "08:35"},
            3: {"start": "08:50", "end": "09:35"},
            4: {"start": "09:40", "end": "10:25"},
            5: {"start": "10:30", "end": "11:15"},
            6: {"start": "13:00", "end": "13:45"},
            7: {"start": "13:50", "end": "14:35"},
            8: {"start": "14:40", "end": "15:25"},
            9: {"start": "15:30", "end": "16:15"},
            10: {"start": "16:20", "end": "17:05"}
        }
        slots = []
        for day in days:
            for slot_number, times in default_periods.items():
                slots.append({
                    "SlotNumber": slot_number,
                    "DayOfWeek": day,
                    "StartTime": times["start"],
                    "EndTime": times["end"]
                })
        if slots:
            db.Slot.insert_many(slots)
            print(f"[INIT] Generated default {len(slots)} slots.")

def import_curriculum_data(db, grade):
    paths = [f'backend/database/curriculum_{grade}.csv', f'database/curriculum_{grade}.csv']
    file_path = find_file_path(paths)
    if not file_path:
        print(f"[Warning] Curriculum file for grade {grade} not found.")
        return None
    curriculum_doc = db.Curriculum.find_one({"curriculumId": grade})
    if not curriculum_doc:
        curriculum_doc = {
            "curriculumId": grade,
            "curriculumName": f"Chương trình lớp {grade}",
            "description": f"Curriculum for grade {grade}"
        }
        db.Curriculum.insert_one(curriculum_doc)
        curriculum_doc = db.Curriculum.find_one({"curriculumId": grade})
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            subject_name = row["SubjectName"]
            sessions = int(row.get("Sessions", 2))
            subj = db.Subject.find_one({"name": subject_name})
            if not subj:
                print(f"[!] Subject '{subject_name}' not found in DB. Skipping.")
                continue
            subject_id = subj["subjectId"]
            existing = db.CurriculumSubject.find_one({
                "curriculumId": grade,
                "subjectId": subject_id
            })
            if existing:
                db.CurriculumSubject.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"sessions": sessions}}
                )
            else:
                db.CurriculumSubject.insert_one({
                    "curriculumId": grade,
                    "subjectId": subject_id,
                    "sessions": sessions
                })
    return curriculum_doc

def init_database():
    client = connect_to_mongodb()
    db = client["fams"]
    drop_all_collections(db)

    # Insert Admin vào UserAccount
    admin_user = {
        "userId": "admin",
        "name": "Administrator",
        "email": "admin@fams.edu.vn",
        "password": hash_password("1234"),
        "role": "Admin"
    }
    db.UserAccount.insert_one(admin_user)

    db.Batch.insert_many([
        {"batchId": 3, "BatchName": "Khóa 2023-2026 (Lớp 10)", "StartYear": 2023, "EndYear": 2026},
        {"batchId": 2, "BatchName": "Khóa 2022-2025 (Lớp 11)", "StartYear": 2022, "EndYear": 2025},
        {"batchId": 1, "BatchName": "Khóa 2021-2024 (Lớp 12)", "StartYear": 2021, "EndYear": 2024}
    ])

    db.create_collection("Class")
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
            db.Classroom.insert_many(rooms)
            print(f"[INIT] Imported {len(rooms)} rooms from room.csv.")
    else:
        db.Classroom.insert_many([
            {"classroomId": 1, "RoomNumber": "A101", "Building": "A", "Capacity": 40},
            {"classroomId": 2, "RoomNumber": "A102", "Building": "A", "Capacity": 40},
            {"classroomId": 3, "RoomNumber": "B101", "Building": "B", "Capacity": 40},
            {"classroomId": 4, "RoomNumber": "B102", "Building": "B", "Capacity": 40}
        ])

    import_slot_format(db)

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
        db.Subject.insert_many(subjects_data)
        print(f"[INIT] Imported {len(subjects_data)} subjects.")

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
        db.UserAccount.insert_many(teacher_users)
    if teachers:
        db.Teacher.insert_many(teachers)
    print(f"[INIT] Imported {len(teachers)} teachers.")

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
                uname = generate_username(fn, sid, batch_id)
                db.UserAccount.insert_one({
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
        db.Student.insert_many(all_students)
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
            r = db.Class.insert_one(c_doc)
            new_class_id = db.Class.count_documents({})
            db.Class.update_one({"_id": r.inserted_id}, {"$set": {"classId": new_class_id}})
            for st in chunk:
                db.Student.update_one({"studentId": st["studentId"]}, {"$set": {"classId": new_class_id}})
    distribute_students(students_10, 10, 3)
    distribute_students(students_11, 11, 2)
    distribute_students(students_12, 12, 1)
    print("[INIT] Distributed students into classes.")

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
        db.UserAccount.insert_many(parent_users)
    if parents_data:
        db.Parent.insert_many(parents_data)
    print(f"[INIT] Imported {len(parents_data)} parents.")

    # Cập nhật mối quan hệ ParentStudent (insert vào collection ParentStudent)
    db.create_collection("ParentStudent")
    all_stu_db = list(db.Student.find())
    all_par_db = list(db.Parent.find())
    for s in all_stu_db:
        how_many = random.randint(1, 2)
        chosen = random.sample(all_par_db, how_many)
        for p in chosen:
            # Cập nhật mảng quan hệ
            db.Parent.update_one({"parentId": p["parentId"]}, {"$addToSet": {"studentIds": s["studentId"]}})
            db.Student.update_one({"studentId": s["studentId"]}, {"$addToSet": {"parentIds": p["parentId"]}})
            # Insert vào bảng quan hệ ParentStudent
            db.ParentStudent.insert_one({
                "ParentID": p["parentId"],
                "StudentID": s["studentId"]
            })

    # Tạo dữ liệu cho TeacherClassAssignment: với mỗi lớp, chọn ngẫu nhiên 1-2 giáo viên
    db.create_collection("TeacherClassAssignment")
    classes = list(db.Class.find())
    for c in classes:
        num_assign = random.randint(1, 2)
        assigned_teachers = random.sample(teachers, num_assign)
        # Cập nhật homeroomTeacherId cho lớp nếu chưa có
        if c.get("homeroomTeacherId") is None and assigned_teachers:
            db.Class.update_one({"classId": c["classId"]}, {"$set": {"homeroomTeacherId": assigned_teachers[0]["teacherId"]}})
        for t in assigned_teachers:
            db.TeacherClassAssignment.insert_one({
                "TeacherID": t["teacherId"],
                "ClassID": c["classId"]
            })

    # Gen RFID cho mỗi người dùng (trừ Admin)
    db.create_collection("RFID")
    all_users = list(db.UserAccount.find())
    for u in all_users:
        if u.get("role") != "Admin":
            rfid_code = f"RFID{u['userId']}"
            db.RFID.insert_one({
                "RFID_ID": rfid_code,
                "UserID": u["userId"],
                "IssueDate": datetime.datetime.now(),
                "ExpiryDate": datetime.datetime.now() + timedelta(days=365)
            })

    # Tạo các collection Curriculum và CurriculumSubject
    db.create_collection("Curriculum")
    db.create_collection("CurriculumSubject")
    for g in [10, 11, 12]:
        import_curriculum_data(db, g)

    # Tạo Semester cho mỗi Batch
    semester_docs = []
    current_date = datetime.date.today()
    batch_semester = [
        {"BatchID": 3, "CurriculumID": 10, "EndYear": 2026},
        {"BatchID": 2, "CurriculumID": 11, "EndYear": 2025},
        {"BatchID": 1, "CurriculumID": 12, "EndYear": 2024}
    ]
    for bs in batch_semester:
        graduation_date = datetime.date(bs["EndYear"] + 1, 6, 15)
        if current_date <= graduation_date:
            if current_date.month < 9:
                academic_year_start = current_date.year - 1
            else:
                academic_year_start = current_date.year
            sem1_start = datetime.date(academic_year_start, 9, 1)
            sem1_end = datetime.date(academic_year_start + 1, 1, 15)
            sem2_start = datetime.date(academic_year_start + 1, 2, 1)
            sem2_end = datetime.date(academic_year_start + 1, 6, 15)
            for idx, (s, e) in enumerate([(sem1_start, sem1_end), (sem2_start, sem2_end)], start=1):
                sem_doc = {
                    "SemesterName": f"Học kỳ {idx}",
                    "StartDate": s.strftime("%Y-%m-%d"),
                    "EndDate": e.strftime("%Y-%m-%d"),
                    "CurriculumID": bs["CurriculumID"],
                    "BatchID": bs["BatchID"]
                }
                db.Semester.insert_one(sem_doc)
                sem = db.Semester.find_one({"SemesterName": sem_doc["SemesterName"], "BatchID": bs["BatchID"]})
                semester_docs.append(sem)
        else:
            print(f"[INFO] Batch {bs['BatchID']} đã ra trường. Bỏ qua tạo thời khóa biểu.")

    # Sinh lịch học theo kỳ (ClassSchedule) với parameter skip_days được truyền vào
    total_schedules = 0
    for sem in semester_docs:
        scheds, warnings = generate_strict_schedule(db, sem, skip_days=["Saturday", "Sunday"])
        total_schedules += len(scheds)
        if warnings:
            for w in warnings:
                print("[WARNING]", w)
    print(f"[INIT] Completed database initialization! Total Schedules: {total_schedules}")


    # Sinh AttendanceLog cho mỗi phiên học (SemesterSchedule) cho các học sinh trong lớp đó
    db.create_collection("AttendanceLog")
    schedule_docs = list(db.SemesterSchedule.find())
    for sched in schedule_docs:
        class_id = sched["classId"]
        # Lấy danh sách học sinh của lớp
        class_students = list(db.Student.find({"classId": class_id}))
        for stu in class_students:
            # Random status: Present, Late hoặc Absent
            status = random.choices(['Present','Late','Absent'], weights=[70,10,20])[0]
            check_in = None
            # Nếu Present hoặc Late, tính thời gian check-in dựa theo SessionDate và startTime
            if status in ['Present','Late']:
                session_date = datetime.datetime.strptime(sched["SessionDate"], "%Y-%m-%d")
                start_time = datetime.datetime.strptime(sched["startTime"], "%H:%M").time()
                check_in = datetime.datetime.combine(session_date, start_time)
                if status == 'Late':
                    # Trễ từ 1 đến 15 phút
                    check_in += timedelta(minutes=random.randint(1,15))
            db.AttendanceLog.insert_one({
                "ScheduleID": sched["scheduleId"],
                "UserID": stu["userId"],
                "CheckIn": check_in,
                "Status": status
            })

if __name__ == "__main__":
    init_database()
