# schedule_algorithm.py
import datetime, random

def generate_strict_schedule(db, semester_doc, total_weeks=18):
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
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    classes = [c for c in list(db.classes.find()) if c.get("BatchID") == semester_doc["BatchID"]]
    teachers = list(db.teachers.find())
    rooms = list(db.classrooms.find())
    subjects_map = {s["subjectId"]: s for s in db.subjects.find()}
    used_slots = {}
    teacher_schedule = {}
    room_schedule = {}
    schedule_docs = []
    warnings = []
    schedule_id = 1

    for class_doc in classes:
        c_id = class_doc["classId"]
        batch_id = class_doc.get("BatchID")
        if batch_id == 3:
            curr_id = 10
        elif batch_id == 2:
            curr_id = 11
        else:
            curr_id = 12
        cs_list = list(db.curriculumSubjects.find({"curriculumId": curr_id}))
        used_slots[c_id] = {w: {d: [] for d in weekdays} for w in range(1, total_weeks + 1)}
        for cs in cs_list:
            subject_id = cs["subjectId"]
            sessions_needed = cs["sessions"]
            subject = subjects_map.get(subject_id)
            candidate_teachers = []
            if subject:
                candidate_teachers = [t for t in teachers if t.get("major", "").lower() == subject.get("SubjectName", "").lower()]
            if not candidate_teachers:
                candidate_teachers = teachers.copy()
            sessions_assigned = 0
            for week in range(1, total_weeks + 1):
                for t in candidate_teachers:
                    if t["teacherId"] not in teacher_schedule:
                        teacher_schedule[t["teacherId"]] = {}
                    if week not in teacher_schedule[t["teacherId"]]:
                        teacher_schedule[t["teacherId"]][week] = {d: [] for d in weekdays}
                for r in rooms:
                    if r["classroomId"] not in room_schedule:
                        room_schedule[r["classroomId"]] = {}
                    if week not in room_schedule[r["classroomId"]]:
                        room_schedule[r["classroomId"]][week] = {d: [] for d in weekdays}
                for day in weekdays:
                    available_periods = [p for p in periods if p not in used_slots[c_id][week][day]]
                    if not available_periods:
                        continue
                    teacher_found = None
                    chosen_period = None
                    for t in candidate_teachers:
                        t_id = t["teacherId"]
                        total_assigned = sum(len(teacher_schedule[t_id][week][d]) for d in weekdays)
                        if total_assigned >= int(t.get("WeeklyCapacity", 10)):
                            continue
                        for p in available_periods:
                            if p not in teacher_schedule[t_id][week][day]:
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
                            if p not in room_schedule[r_id][week][day]:
                                room_found = r
                                chosen_period = p
                                break
                        if room_found:
                            break
                    if not room_found:
                        continue
                    schedule_docs.append({
                        "scheduleId": schedule_id,
                        # Sửa ở đây: dùng key "SemesterID" nếu có, nếu không dùng _id
                        "semesterId": semester_doc.get("SemesterID", semester_doc["_id"]),
                        "classId": c_id,
                        "subjectId": subject_id,
                        "teacherId": teacher_found["teacherId"],
                        "classroomId": room_found["classroomId"],
                        "WeekNumber": week,
                        "SlotID": chosen_period,
                        "dayOfWeek": day,
                        "startTime": periods[chosen_period]["start"],
                        "endTime": periods[chosen_period]["end"]
                    })
                    schedule_id += 1
                    used_slots[c_id][week][day].append(chosen_period)
                    teacher_schedule[teacher_found["teacherId"]][week][day].append(chosen_period)
                    room_schedule[room_found["classroomId"]][week][day].append(chosen_period)
                    sessions_assigned += 1
                    if sessions_assigned >= sessions_needed:
                        break
                if sessions_assigned >= sessions_needed:
                    break
            if sessions_assigned < sessions_needed:
                warnings.append(
                    f"Only {sessions_assigned}/{sessions_needed} sessions scheduled for subject {subject.get('SubjectName', 'Unknown')} in class {c_id}. Extend semester required."
                )
        # End for each subject
    if schedule_docs:
        db.schedules.insert_many(schedule_docs)
    return schedule_docs, warnings
