# schedule_algorithm.py
import datetime, random
import os
import csv

def calculate_semester_slots(start_date, end_date, slots_per_day=10, weekdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]):
    """
    Tính toán tổng số slot trong một học kỳ dựa trên ngày bắt đầu và ngày kết thúc
    start_date: datetime - ngày bắt đầu học kỳ (phải là thứ Hai)
    end_date: datetime - ngày kết thúc học kỳ (nên là Chủ Nhật)
    slots_per_day: int - số tiết học mỗi ngày
    weekdays: list - các ngày trong tuần có lịch học
    """
    if start_date.weekday() != 0:  # 0 là thứ Hai trong Python
        raise ValueError("Ngày bắt đầu học kỳ phải là thứ Hai")
    
    total_days = (end_date - start_date).days + 1
    total_weeks = total_days // 7
    
    # Tính tổng số slot trong học kỳ
    total_slots = total_weeks * len(weekdays) * slots_per_day
    
    return total_slots, total_weeks

def get_day_info(slot_index, start_date, slots_per_day=10, weekdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]):
    """
    Tính ngày và tiết học từ slot index
    slot_index: int - chỉ số của slot (bắt đầu từ 0)
    start_date: datetime - ngày bắt đầu học kỳ
    slots_per_day: int - số tiết học mỗi ngày
    weekdays: list - các ngày trong tuần có lịch học
    """
    # Tính số ngày kể từ ngày bắt đầu
    day_index = slot_index // slots_per_day
    
    # Tính tiết học trong ngày
    period_index = slot_index % slots_per_day + 1  # +1 vì tiết học bắt đầu từ 1
    
    # Tính tuần
    week_number = day_index // len(weekdays) + 1  # +1 vì tuần bắt đầu từ 1
    
    # Tính ngày trong tuần
    weekday_index = day_index % len(weekdays)
    weekday = weekdays[weekday_index]
    
    # Tính ngày thực tế
    actual_date = start_date + datetime.timedelta(days=day_index)
    
    return {
        "week": week_number,
        "weekday": weekday,
        "date": actual_date,
        "period": period_index
    }

def get_period_time(period_index):
    """Lấy thông tin thời gian bắt đầu và kết thúc của tiết học"""
    periods = {
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
    return periods.get(period_index, {"start": "00:00", "end": "00:00"})

def generate_greedy_schedule(start_date, end_date, classes, curriculum_subjects, teachers, rooms, db=None):
    """
    Tạo lịch học bằng thuật toán tham lam
    
    start_date: datetime - ngày bắt đầu học kỳ (phải là thứ Hai)
    end_date: datetime - ngày kết thúc học kỳ (nên là Chủ Nhật)
    classes: list - danh sách các lớp
    curriculum_subjects: dict - ánh xạ từ curriculum_id đến danh sách môn học và số buổi cần học
    teachers: list - danh sách giáo viên
    rooms: list - danh sách phòng học
    db: database connection (optional) - kết nối đến database để lưu lịch
    
    return: tuple - (schedule_docs, warnings)
    """
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    slots_per_day = 10
    
    # Tính tổng số slot trong học kỳ
    total_slots, total_weeks = calculate_semester_slots(start_date, end_date, slots_per_day, weekdays)
    
    # Khởi tạo cấu trúc dữ liệu
    # Số buổi học của mỗi môn cho mỗi lớp
    class_subjects = {}
    for c in classes:
        batch_id = c.get("BatchID")
        curr_id = 0
        if batch_id == 3:
            curr_id = 10
        elif batch_id == 2:
            curr_id = 11
        else:
            curr_id = 12
            
        # Lấy danh sách môn học và số buổi cần học
        subjects = curriculum_subjects.get(curr_id, [])
        class_subjects[c["classId"]] = {s["subjectId"]: s["sessions"] for s in subjects}
    
    # Khởi tạo lịch rảnh của giáo viên, lớp và phòng học
    teacher_free = {t["teacherId"]: set(range(total_slots)) for t in teachers}
    class_free = {c["classId"]: set(range(total_slots)) for c in classes}
    room_free = {r["classroomId"]: set(range(total_slots)) for r in rooms}
    
    # Khởi tạo lịch dạy hàng tuần của giáo viên
    teacher_weekly_schedule = {t["teacherId"]: {w: 0 for w in range(1, total_weeks + 1)} for t in teachers}
    teacher_weekly_capacity = {t["teacherId"]: int(t.get("WeeklyCapacity", 10)) for t in teachers}
    
    # Khởi tạo kết quả
    schedule_docs = []
    warnings = []
    schedule_id = 1
    
    # Ánh xạ subject_id -> subject
    subjects_map = {}
    if db is not None:  # Sửa lại kiểm tra db
        subjects_map = {s["subjectId"]: s for s in db.subjects.find()}
    
    # Duyệt qua từng slot
    for slot_index in range(total_slots):
        # Lấy thông tin ngày tương ứng với slot
        day_info = get_day_info(slot_index, start_date, slots_per_day, weekdays)
        week = day_info["week"]
        weekday = day_info["weekday"]
        period = day_info["period"]
        
        # Lấy thông tin thời gian của tiết học
        period_time = get_period_time(period)
        
        # Danh sách giáo viên rảnh tại slot này (và chưa vượt quá capacity trong tuần này)
        teachers_available = []
        for t in teachers:
            t_id = t["teacherId"]
            if (slot_index in teacher_free[t_id] and 
                teacher_weekly_schedule[t_id][week] < teacher_weekly_capacity[t_id]):
                teachers_available.append(t)
        
        # Duyệt qua các lớp
        for c in classes:
            c_id = c["classId"]
            
            # Nếu lớp đã có lịch tại slot này, bỏ qua
            if slot_index not in class_free[c_id]:
                continue
            
            # Duyệt qua các môn học cần xếp lịch
            for subject_id, sessions_left in list(class_subjects.get(c_id, {}).items()):
                if sessions_left <= 0:
                    continue
                
                # Tìm giáo viên có thể dạy môn này
                subject_name = subjects_map.get(subject_id, {}).get("name", "")
                candidate_teachers = [t for t in teachers_available 
                                     if subject_name.lower() in t.get("major", "").lower()]
                
                # Nếu không tìm thấy giáo viên chuyên môn, thử với bất kỳ giáo viên nào
                if not candidate_teachers:
                    candidate_teachers = teachers_available.copy()
                
                # Tìm giáo viên rảnh
                teacher_found = None
                for t in candidate_teachers:
                    t_id = t["teacherId"]
                    if slot_index in teacher_free[t_id]:
                        teacher_found = t
                        break
                
                if not teacher_found:
                    continue
                
                # Tìm phòng học rảnh
                room_found = None
                for r in rooms:
                    r_id = r["classroomId"]
                    if slot_index in room_free[r_id]:
                        room_found = r
                        break
                
                if not room_found:
                    continue
                
                # Xếp lịch
                t_id = teacher_found["teacherId"]
                r_id = room_found["classroomId"]
                
                # Cập nhật trạng thái
                teacher_free[t_id].remove(slot_index)
                class_free[c_id].remove(slot_index)
                room_free[r_id].remove(slot_index)
                
                # Cập nhật số buổi dạy trong tuần của giáo viên
                teacher_weekly_schedule[t_id][week] += 1
                
                # Giảm số buổi học cần xếp của môn học
                class_subjects[c_id][subject_id] -= 1
                
                # Tạo bản ghi lịch học
                schedule_docs.append({
                    "scheduleId": schedule_id,
                    "classId": c_id,
                    "subjectId": subject_id,
                    "teacherId": t_id,
                    "classroomId": r_id,
                    "WeekNumber": week,
                    "SlotID": period,
                    "dayOfWeek": weekday,
                    "startTime": period_time["start"],
                    "endTime": period_time["end"],
                    "date": day_info["date"]
                })
                
                schedule_id += 1
                break  # Đã xếp được một môn cho lớp này tại slot này, chuyển sang lớp tiếp theo
    
    # Kiểm tra các môn học chưa được xếp hết
    for c_id, subjects in class_subjects.items():
        for subject_id, sessions_left in subjects.items():
            if sessions_left > 0:
                subject_name = subjects_map.get(subject_id, {}).get("name", f"Subject ID {subject_id}")
                warnings.append(
                    f"Only {subjects[subject_id] - sessions_left}/{subjects[subject_id]} sessions scheduled for subject {subject_name} in class {c_id}. Extend semester required."
                )
    
    # Lưu vào database nếu có kết nối
    if db is not None and len(schedule_docs) > 0:
        db.schedules.insert_many(schedule_docs)
    
    return schedule_docs, warnings

def export_schedule_to_csv(schedules, teachers_data=None, classes_data=None, subjects_data=None, output_dir="src/data/schedules"):
    """
    Xuất thời khóa biểu ra file CSV
    
    schedules: list - danh sách các bản ghi thời khóa biểu
    teachers_data: dict - ánh xạ từ teacherId sang thông tin giáo viên
    classes_data: dict - ánh xạ từ classId sang thông tin lớp
    subjects_data: dict - ánh xạ từ subjectId sang thông tin môn học
    output_dir: str - thư mục đầu ra
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Chuẩn bị dữ liệu
    teacher_schedules = {}
    class_schedules = {}
    
    # Gom các bản ghi theo giáo viên và lớp
    for sched in schedules:
        teacher_id = sched["teacherId"]
        class_id = sched["classId"]
        
        if teacher_id not in teacher_schedules:
            teacher_schedules[teacher_id] = []
        teacher_schedules[teacher_id].append(sched)
        
        if class_id not in class_schedules:
            class_schedules[class_id] = []
        class_schedules[class_id].append(sched)
    
    # Xuất thời khóa biểu của giáo viên
    for teacher_id, schedules in teacher_schedules.items():
        teacher_name = teachers_data.get(teacher_id, {}).get("fullName", f"Teacher_{teacher_id}") if teachers_data is not None else f"Teacher_{teacher_id}"
        filename = os.path.join(output_dir, f"teacher_{teacher_id}_{teacher_name}.csv")
        
        # Sắp xếp theo tuần và ngày
        schedules.sort(key=lambda x: (x.get("WeekNumber", 0), 
                                    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].index(x.get("dayOfWeek", "Monday")), 
                                    x.get("SlotID", 0)))
        
        with open(filename, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["WeekNumber", "Date", "Day", "Slot", "Start", "End", "Class", "Subject", "Room"])
            
            for sched in schedules:
                class_name = classes_data.get(sched["classId"], {}).get("className", f"Class_{sched['classId']}") if classes_data is not None else f"Class_{sched['classId']}"
                subject_name = subjects_data.get(sched["subjectId"], {}).get("name", f"Subject_{sched['subjectId']}") if subjects_data is not None else f"Subject_{sched['subjectId']}"
                date_str = sched.get("date", "").strftime("%Y-%m-%d") if sched.get("date") else ""
                
                writer.writerow([
                    sched.get("WeekNumber", ""),
                    date_str,
                    sched.get("dayOfWeek", ""),
                    sched.get("SlotID", ""),
                    sched.get("startTime", ""),
                    sched.get("endTime", ""),
                    class_name,
                    subject_name,
                    sched.get("classroomId", "")
                ])
    
    # Xuất thời khóa biểu của lớp
    for class_id, schedules in class_schedules.items():
        class_name = classes_data.get(class_id, {}).get("className", f"Class_{class_id}") if classes_data is not None else f"Class_{class_id}"
        filename = os.path.join(output_dir, f"class_{class_id}_{class_name}.csv")
        
        # Sắp xếp theo tuần và ngày
        schedules.sort(key=lambda x: (x.get("WeekNumber", 0), 
                                    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].index(x.get("dayOfWeek", "Monday")), 
                                    x.get("SlotID", 0)))
        
        with open(filename, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["WeekNumber", "Date", "Day", "Slot", "Start", "End", "Teacher", "Subject", "Room"])
            
            for sched in schedules:
                teacher_name = teachers_data.get(sched["teacherId"], {}).get("fullName", f"Teacher_{sched['teacherId']}") if teachers_data is not None else f"Teacher_{sched['teacherId']}"
                subject_name = subjects_data.get(sched["subjectId"], {}).get("name", f"Subject_{sched['subjectId']}") if subjects_data is not None else f"Subject_{sched['subjectId']}"
                date_str = sched.get("date", "").strftime("%Y-%m-%d") if sched.get("date") else ""
                
                writer.writerow([
                    sched.get("WeekNumber", ""),
                    date_str,
                    sched.get("dayOfWeek", ""),
                    sched.get("SlotID", ""),
                    sched.get("startTime", ""),
                    sched.get("endTime", ""),
                    teacher_name,
                    subject_name,
                    sched.get("classroomId", "")
                ])
    
    return len(teacher_schedules), len(class_schedules)

def generate_strict_schedule(db, semester_doc, total_weeks=18):
    """
    Hàm tương thích với phiên bản cũ, sử dụng hàm mới generate_greedy_schedule
    """
    # Lấy dữ liệu từ database
    classes = [c for c in list(db.classes.find()) if c.get("BatchID") == semester_doc["BatchID"]]
    teachers = list(db.teachers.find())
    rooms = list(db.classrooms.find())
    
    # Lấy curriculum subjects
    curriculum_subjects = {}
    for grade in [10, 11, 12]:
        curriculum_subjects[grade] = list(db.curriculumSubjects.find({"curriculumId": grade}))
    
    # Lấy ngày bắt đầu và kết thúc học kỳ
    start_date = semester_doc.get("StartDate", datetime.datetime.now())
    end_date = semester_doc.get("EndDate", start_date + datetime.timedelta(days=18*7))
    
    # Đảm bảo ngày bắt đầu là thứ Hai
    while start_date.weekday() != 0:
        start_date += datetime.timedelta(days=1)
    
    # Đảm bảo ngày kết thúc là Chủ Nhật
    while end_date.weekday() != 6:
        end_date += datetime.timedelta(days=1)
    
    # Gọi hàm mới
    schedules, warnings = generate_greedy_schedule(start_date, end_date, classes, curriculum_subjects, teachers, rooms, db)
    
    # Chuẩn bị dữ liệu để xuất CSV
    teachers_data = {t["teacherId"]: t for t in teachers}
    classes_data = {c["classId"]: c for c in classes}
    subjects_data = {}
    if db is not None:
        subjects_data = {s["subjectId"]: s for s in db.subjects.find()}
    
    # Xuất dữ liệu ra CSV
    teacher_count, class_count = export_schedule_to_csv(
        schedules, 
        teachers_data=teachers_data, 
        classes_data=classes_data, 
        subjects_data=subjects_data
    )
    
    print(f"[SCHEDULE] Exported {teacher_count} teacher schedules and {class_count} class schedules to CSV files.")
    
    return schedules, warnings
