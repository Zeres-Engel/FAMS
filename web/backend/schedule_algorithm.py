import datetime, random
from datetime import timedelta

def generate_strict_schedule(db, semester_doc, skip_days=["Saturday", "Sunday"]):
    # Định nghĩa các ca học (slot) mặc định theo số thứ tự
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

    # Lấy ngày hiện tại để đảm bảo tính thời gian thực (ví dụ: 07/04/2025)
    current_date = datetime.date.today()
    # Chuyển StartDate, EndDate của học kỳ về kiểu date
    start_date = semester_doc["StartDate"]
    end_date = semester_doc["EndDate"]
    if not isinstance(start_date, datetime.date):
        start_date = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
    if not isinstance(end_date, datetime.date):
        end_date = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()

    # Nếu StartDate thuộc ngày bỏ qua, chuyển sang ngày học đầu tiên
    while start_date.strftime("%A") in skip_days:
        start_date += timedelta(days=1)

    # Xác định ngày đầu tuần (Monday) của tuần chứa ngày học đầu tiên
    week1_start = start_date - timedelta(days=start_date.weekday())

    # Tính toán các ngày học hợp lệ dựa trên StartDate và EndDate (loại bỏ các ngày trong skip_days)
    valid_days_by_week = {}
    current = start_date
    while current <= end_date:
        if current.strftime("%A") not in skip_days:
            week_num = ((current - week1_start).days // 7) + 1
            if week_num not in valid_days_by_week:
                valid_days_by_week[week_num] = []
            day_in_week = len(valid_days_by_week[week_num]) + 1
            valid_days_by_week[week_num].append({
                "date": current,
                "day_in_week": day_in_week,
                "day_name": current.strftime("%A"),
                "week_number": week_num
            })
        current += timedelta(days=1)

    # Lấy dữ liệu từ các collection
    classes = [c for c in list(db.Class.find()) if c.get("BatchID") == semester_doc["BatchID"]]
    teachers = list(db.Teacher.find())
    rooms = list(db.Classroom.find())
    subjects_map = {s["subjectId"]: s for s in db.Subject.find()}

    used_slots = {}       # used_slots[classId][week][day_in_week] = list các slot đã sử dụng
    teacher_schedule = {}   # teacher_schedule[teacherId][week][day_in_week] = list các slot đã xếp
    room_schedule = {}      # room_schedule[classroomId][week][day_in_week] = list các slot đã xếp
    schedule_docs = []
    warnings = []
    schedule_id = 1

    # Với mỗi lớp, ta sẽ xếp các phiên học cho các môn theo chương trình học
    for class_doc in classes:
        c_id = class_doc["classId"]
        batch_id = class_doc.get("BatchID")
        # Quy ước: Batch 3 -> curriculumId 10, Batch 2 -> 11, Batch 1 -> 12
        if batch_id == 3:
            curr_id = 10
        elif batch_id == 2:
            curr_id = 11
        else:
            curr_id = 12

        cs_list = list(db.CurriculumSubject.find({"curriculumId": curr_id}))
        used_slots[c_id] = {}
        for week, days in valid_days_by_week.items():
            used_slots[c_id][week] = {}
            for day_info in days:
                used_slots[c_id][week][day_info["day_in_week"]] = []

        for cs in cs_list:
            subject_id = cs["subjectId"]
            sessions_needed = cs["sessions"]
            subject = subjects_map.get(subject_id)
            candidate_teachers = []
            if subject:
                candidate_teachers = [t for t in teachers if t.get("major", "").lower() == subject.get("name", "").lower()]
            if not candidate_teachers:
                candidate_teachers = teachers.copy()
            sessions_assigned = 0

            # Khởi tạo lịch cho giáo viên và phòng học nếu chưa có
            for t in candidate_teachers:
                t_id = t["teacherId"]
                if t_id not in teacher_schedule:
                    teacher_schedule[t_id] = {}
                for week, days in valid_days_by_week.items():
                    if week not in teacher_schedule[t_id]:
                        teacher_schedule[t_id][week] = {}
                    for day_info in days:
                        d = day_info["day_in_week"]
                        if d not in teacher_schedule[t_id][week]:
                            teacher_schedule[t_id][week][d] = []
            for r in rooms:
                r_id = r["classroomId"]
                if r_id not in room_schedule:
                    room_schedule[r_id] = {}
                for week, days in valid_days_by_week.items():
                    if week not in room_schedule[r_id]:
                        room_schedule[r_id][week] = {}
                    for day_info in days:
                        d = day_info["day_in_week"]
                        if d not in room_schedule[r_id][week]:
                            room_schedule[r_id][week][d] = []

            assigned = False
            # Duyệt theo tuần và ngày học theo thứ tự
            for week in sorted(valid_days_by_week.keys()):
                for day_info in valid_days_by_week[week]:
                    day_in_week = day_info["day_in_week"]
                    available_periods = [p for p in periods if p not in used_slots[c_id][week][day_in_week]]
                    if not available_periods:
                        continue
                    teacher_found = None
                    chosen_period = None
                    for t in candidate_teachers:
                        t_id = t["teacherId"]
                        total_assigned = sum(len(teacher_schedule[t_id][week][d]) for d in teacher_schedule[t_id][week])
                        if total_assigned >= int(t.get("WeeklyCapacity", 10)):
                            continue
                        for p in available_periods:
                            if p not in teacher_schedule[t_id][week][day_in_week]:
                                teacher_found = t
                                chosen_period = p
                                break
                        if teacher_found:
                            break
                    if not teacher_found:
                        continue
                    room_found = None
                    for r in rooms:
                        r_id = r["classroomId"]
                        for p in available_periods:
                            if p not in room_schedule[r_id][week][day_in_week]:
                                room_found = r
                                chosen_period = p
                                break
                        if room_found:
                            break
                    if not room_found:
                        continue

                    schedule_docs.append({
                        "scheduleId": schedule_id,
                        "semesterId": semester_doc.get("SemesterID", semester_doc["_id"]),
                        "classId": c_id,
                        "subjectId": subject_id,
                        "teacherId": teacher_found["teacherId"],
                        "classroomId": room_found["classroomId"],
                        "WeekNumber": week,
                        "DayNumber": day_info["day_in_week"],
                        "SessionDate": day_info["date"].strftime("%Y-%m-%d"),
                        "SlotID": chosen_period,
                        "dayOfWeek": day_info["day_name"],
                        "startTime": periods[chosen_period]["start"],
                        "endTime": periods[chosen_period]["end"]
                    })
                    schedule_id += 1
                    used_slots[c_id][week][day_in_week].append(chosen_period)
                    teacher_schedule[teacher_found["teacherId"]][week][day_in_week].append(chosen_period)
                    room_schedule[room_found["classroomId"]][week][day_in_week].append(chosen_period)
                    sessions_assigned += 1
                    if sessions_assigned >= sessions_needed:
                        assigned = True
                        break
                if assigned:
                    break
            if sessions_assigned < sessions_needed:
                warnings.append(
                    f"Only {sessions_assigned}/{sessions_needed} sessions scheduled for subject {subject.get('name', 'Unknown')} in class {c_id}. Schedule exceeds semester period."
                )
    if schedule_docs:
        db.ClassSchedule.insert_many(schedule_docs)
    return schedule_docs, warnings
