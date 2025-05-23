from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict
from datetime import datetime, date
from pymongo import DESCENDING
from ..db import get_database
from ..models.AttendanceLog import AttendanceLog
from .models import ResponseModel, ErrorResponseModel

router = APIRouter()

@router.get("/attendance/by-user/{user_id}", response_description="Lấy tất cả attendance log của một user")
async def get_attendance_by_user(
    user_id: str,
    limit: int = Query(100, description="Số lượng kết quả tối đa"),
    skip: int = Query(0, description="Số lượng kết quả bỏ qua"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    from_date: Optional[date] = Query(None, description="Lọc từ ngày"),
    to_date: Optional[date] = Query(None, description="Lọc đến ngày"), 
    subject_id: Optional[int] = Query(None, description="Lọc theo ID môn học"),
    class_id: Optional[int] = Query(None, description="Lọc theo ID lớp")
):
    """
    Tìm kiếm attendance log của một user cụ thể với nhiều điều kiện lọc
    """
    db = get_database()
    
    # Xây dựng query filter
    query = {"userId": user_id, "isActive": True}
    
    # Thêm các điều kiện lọc nếu có
    if status:
        query["status"] = status
    
    # Xử lý lọc theo khoảng thời gian
    date_filter = {}
    if from_date:
        from_datetime = datetime.combine(from_date, datetime.min.time())
        date_filter["$gte"] = from_datetime
    
    if to_date:
        to_datetime = datetime.combine(to_date, datetime.max.time())
        date_filter["$lte"] = to_datetime
    
    if date_filter:
        # Nếu lọc theo date, cần join với collection ClassSchedule để lấy sessionDate
        pipeline = [
            {"$match": query},
            {"$lookup": {
                "from": "ClassSchedule",
                "localField": "scheduleId",
                "foreignField": "scheduleId",
                "as": "schedule"
            }},
            {"$match": {"schedule.sessionDate": date_filter}},
            {"$skip": skip},
            {"$limit": limit},
            {"$sort": {"schedule.sessionDate": DESCENDING}}
        ]
        
        attendance_logs = await db.AttendanceLog.aggregate(pipeline).to_list(length=limit)
    else:
        # Thêm lọc theo subjectId nếu có
        if subject_id:
            query["subjectId"] = subject_id
            
        # Thêm lọc theo classId nếu có
        if class_id:
            query["classId"] = class_id
            
        attendance_logs = list(db.AttendanceLog.find(
            query
        ).sort("createdAt", DESCENDING).skip(skip).limit(limit))
    
    # Đếm tổng số lượng kết quả
    total_count = db.AttendanceLog.count_documents(query)
    
    return ResponseModel(
        attendance_logs, 
        "Attendance logs retrieved successfully",
        meta={
            "total": total_count,
            "limit": limit,
            "skip": skip,
            "filters": {
                "status": status,
                "from_date": from_date,
                "to_date": to_date,
                "subject_id": subject_id,
                "class_id": class_id
            }
        }
    )

@router.get("/attendance/statistics/user/{user_id}", response_description="Thống kê điểm danh của user")
async def get_attendance_statistics(
    user_id: str,
    academic_year: Optional[str] = Query(None, description="Năm học"),
    semester_number: Optional[int] = Query(None, description="Học kỳ"),
    subject_id: Optional[int] = Query(None, description="ID môn học")
):
    """
    Thống kê điểm danh của một user trong một năm học / học kỳ / môn học cụ thể
    """
    db = get_database()
    
    # Xây dựng query filter
    match_stage = {"userId": user_id, "isActive": True}
    
    # Thêm học kỳ nếu có
    if semester_number:
        match_stage["semesterNumber"] = semester_number
    
    # Thêm môn học nếu có
    if subject_id:
        match_stage["subjectId"] = subject_id
    
    # Lấy năm học nếu có (cần join với collection ClassSchedule)
    lookup_stage = {
        "$lookup": {
            "from": "ClassSchedule",
            "localField": "scheduleId",
            "foreignField": "scheduleId",
            "as": "schedule"
        }
    }
    
    unwind_stage = {"$unwind": "$schedule"}
    
    # Group và thống kê
    group_stage = {
        "$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "sessions": {"$push": {
                "scheduleId": "$scheduleId",
                "date": "$schedule.sessionDate", 
                "class": "$className",
                "subject": "$subjectName"
            }}
        }
    }
    
    # Bổ sung filter theo năm học
    if academic_year:
        lookup_stage["$lookup"]["pipeline"] = [
            {"$match": {"academicYear": academic_year}}
        ]
    
    # Thực hiện aggregation
    pipeline = [
        {"$match": match_stage},
        lookup_stage,
        unwind_stage,
        group_stage
    ]
    
    results = await db.AttendanceLog.aggregate(pipeline).to_list(length=100)
    
    # Định dạng lại kết quả
    statistics = {
        "user_id": user_id,
        "academic_year": academic_year,
        "semester_number": semester_number,
        "subject_id": subject_id,
        "attendance": {
            "Present": 0,
            "Late": 0,
            "Absent": 0,
            "Not Now": 0
        },
        "total_sessions": 0
    }
    
    for result in results:
        status = result["_id"]
        count = result["count"]
        statistics["attendance"][status] = count
        statistics["total_sessions"] += count
    
    return ResponseModel(statistics, "Attendance statistics retrieved successfully")

@router.put("/update/{attendance_id}", response_description="Cập nhật trạng thái điểm danh")
async def update_attendance_status(
    attendance_id: int,
    attendance_data: Dict = Body(...)
):
    """
    Cập nhật trạng thái điểm danh của một bản ghi
    
    Cho phép cập nhật status, checkIn và note
    """
    db = get_database()
    
    # Kiểm tra xem attendance_id có tồn tại không
    existing_attendance = db.AttendanceLog.find_one({"attendanceId": attendance_id})
    if not existing_attendance:
        return ErrorResponseModel(
            "Không tìm thấy bản ghi", 
            404, 
            f"Không tìm thấy bản ghi điểm danh với ID {attendance_id}"
        )
    
    # Lọc các trường được phép cập nhật
    update_data = {}
    allowed_fields = ["status", "checkIn", "note"]
    
    for field in allowed_fields:
        if field in attendance_data:
            # Nếu là checkIn, cần chuyển đổi sang datetime
            if field == "checkIn" and attendance_data[field]:
                try:
                    update_data[field] = datetime.fromisoformat(attendance_data[field].replace('Z', '+00:00'))
                except ValueError:
                    return ErrorResponseModel(
                        "Định dạng thời gian không hợp lệ", 
                        400, 
                        "Định dạng checkIn phải là ISO datetime string"
                    )
            else:
                update_data[field] = attendance_data[field]
    
    # Thêm trường updatedAt
    update_data["updatedAt"] = datetime.now()
    
    # Thực hiện cập nhật
    result = db.AttendanceLog.update_one(
        {"attendanceId": attendance_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 1:
        # Lấy bản ghi đã cập nhật
        updated_attendance = db.AttendanceLog.find_one({"attendanceId": attendance_id})
        return ResponseModel(
            updated_attendance,
            f"Cập nhật thành công bản ghi điểm danh {attendance_id}"
        )
    
    return ErrorResponseModel(
        "Cập nhật thất bại", 
        400, 
        "Không thể cập nhật bản ghi điểm danh"
    )

@router.get("/class/{class_id}", response_description="Lấy điểm danh theo lớp")
async def get_attendance_by_class(
    class_id: int,
    date: Optional[date] = None,
    subject_id: Optional[int] = None,
    limit: int = Query(100, description="Số lượng kết quả tối đa"),
    skip: int = Query(0, description="Số lượng kết quả bỏ qua")
):
    """
    Lấy danh sách điểm danh của một lớp học theo ngày và môn học
    """
    db = get_database()
    
    # Xây dựng query
    query = {"classId": class_id, "isActive": True}
    
    # Thêm filter môn học nếu có
    if subject_id:
        query["subjectId"] = subject_id
    
    if date:
        # Join với ClassSchedule để lọc theo ngày
        pipeline = [
            {"$match": query},
            {"$lookup": {
                "from": "ClassSchedule",
                "localField": "scheduleId",
                "foreignField": "scheduleId",
                "as": "schedule"
            }},
            {"$match": {"schedule.sessionDate": datetime.combine(date, datetime.min.time())}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        # Thực hiện aggregation
        attendance_logs = await db.AttendanceLog.aggregate(pipeline).to_list(length=limit)
    else:
        # Lấy attendance log không filter theo ngày
        attendance_logs = list(db.AttendanceLog.find(query).skip(skip).limit(limit))
    
    # Đếm tổng số bản ghi
    total_count = len(attendance_logs)
    
    return ResponseModel(
        attendance_logs,
        f"Lấy thành công {total_count} bản ghi điểm danh cho lớp {class_id}",
        meta={
            "total": total_count,
            "class_id": class_id,
            "date": date,
            "subject_id": subject_id
        }
    )

@router.get("/classroom/{classroom_id}", response_description="Lấy điểm danh theo phòng học")
async def get_attendance_by_classroom(
    classroom_id: int,
    date: Optional[date] = None,
    status: Optional[str] = None,
    limit: int = Query(100, description="Số lượng kết quả tối đa"),
    skip: int = Query(0, description="Số lượng kết quả bỏ qua")
):
    """
    Lấy danh sách điểm danh theo phòng học, có thể lọc theo ngày và trạng thái
    """
    db = get_database()
    
    # Xây dựng query
    query = {"classroomId": classroom_id, "isActive": True}
    
    # Thêm filter trạng thái nếu có
    if status:
        query["status"] = status
    
    if date:
        # Join với ClassSchedule để lọc theo ngày
        pipeline = [
            {"$match": query},
            {"$lookup": {
                "from": "ClassSchedule",
                "localField": "scheduleId",
                "foreignField": "scheduleId",
                "as": "schedule"
            }},
            {"$match": {"schedule.sessionDate": datetime.combine(date, datetime.min.time())}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        # Thực hiện aggregation
        attendance_logs = await db.AttendanceLog.aggregate(pipeline).to_list(length=limit)
    else:
        # Lấy attendance log không filter theo ngày
        attendance_logs = list(db.AttendanceLog.find(query).skip(skip).limit(limit))
    
    # Lấy thông tin phòng học
    classroom = db.Classroom.find_one({"classroomId": classroom_id})
    classroom_name = classroom.get("classroomName", f"Phòng {classroom_id}") if classroom else f"Phòng {classroom_id}"
    
    # Đếm tổng số bản ghi
    total_count = len(attendance_logs)
    
    return ResponseModel(
        attendance_logs,
        f"Lấy thành công {total_count} bản ghi điểm danh cho phòng {classroom_name}",
        meta={
            "total": total_count,
            "classroom_id": classroom_id,
            "classroom_name": classroom_name,
            "date": date,
            "status": status
        }
    )

@router.get("/statistics/classroom/{classroom_id}", response_description="Thống kê điểm danh theo phòng học")
async def get_classroom_attendance_statistics(
    classroom_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    academic_year: Optional[str] = None
):
    """
    Thống kê điểm danh của một phòng học trong một khoảng thời gian
    
    Trả về số lượng buổi học, tổng số điểm danh và tỷ lệ theo trạng thái
    """
    db = get_database()
    
    # Lấy thông tin phòng học
    classroom = db.Classroom.find_one({"classroomId": classroom_id})
    classroom_name = classroom.get("classroomName", f"Phòng {classroom_id}") if classroom else f"Phòng {classroom_id}"
    
    # Xây dựng query filter
    match_stage = {"classroomId": classroom_id, "isActive": True}
    
    # Xử lý lọc theo khoảng thời gian
    date_filter = {}
    if start_date:
        date_filter["$gte"] = datetime.combine(start_date, datetime.min.time())
    
    if end_date:
        date_filter["$lte"] = datetime.combine(end_date, datetime.max.time())
    
    if date_filter:
        # Cần join với lịch học để lấy ngày
        pipeline = [
            {"$match": match_stage},
            {"$lookup": {
                "from": "ClassSchedule",
                "localField": "scheduleId",
                "foreignField": "scheduleId",
                "as": "schedule"
            }},
            {"$unwind": "$schedule"},
            {"$match": {"schedule.sessionDate": date_filter}}
        ]
    else:
        # Không lọc theo ngày, chỉ join để lấy thông tin
        pipeline = [
            {"$match": match_stage},
            {"$lookup": {
                "from": "ClassSchedule",
                "localField": "scheduleId",
                "foreignField": "scheduleId",
                "as": "schedule"
            }},
            {"$unwind": "$schedule"}
        ]
    
    # Nếu có lọc theo năm học
    if academic_year:
        pipeline.append({"$match": {"schedule.academicYear": academic_year}})
    
    # Group theo trạng thái và theo môn học
    pipeline.extend([
        {"$group": {
            "_id": {
                "status": "$status",
                "subjectId": "$subjectId",
                "subjectName": "$subjectName"
            },
            "count": {"$sum": 1}
        }},
        {"$group": {
            "_id": "$_id.subjectId",
            "subjectName": {"$first": "$_id.subjectName"},
            "statuses": {"$push": {
                "status": "$_id.status",
                "count": "$count"
            }},
            "total": {"$sum": "$count"}
        }},
        {"$sort": {"subjectName": 1}}
    ])
    
    # Thực hiện aggregation
    results = await db.AttendanceLog.aggregate(pipeline).to_list(length=100)
    
    # Tạo cấu trúc thống kê
    statistics = {
        "classroom_id": classroom_id,
        "classroom_name": classroom_name,
        "start_date": start_date,
        "end_date": end_date,
        "academic_year": academic_year,
        "subjects": [],
        "summary": {
            "total_sessions": 0,
            "total_attendances": 0,
            "present_rate": 0,
            "late_rate": 0,
            "absent_rate": 0
        }
    }
    
    # Tổng hợp số liệu
    total_present = 0
    total_late = 0
    total_absent = 0
    total_attendances = 0
    
    for result in results:
        subject_id = result["_id"]
        subject_name = result["subjectName"]
        total = result["total"]
        
        subject_stats = {
            "subject_id": subject_id,
            "subject_name": subject_name,
            "total": total,
            "statuses": {}
        }
        
        # Thêm số lượng theo từng trạng thái
        for status_info in result["statuses"]:
            status = status_info["status"]
            count = status_info["count"]
            subject_stats["statuses"][status] = count
            
            # Cập nhật tổng số
            if status == "Present":
                total_present += count
            elif status == "Late":
                total_late += count
            elif status == "Absent":
                total_absent += count
            
            total_attendances += count
        
        statistics["subjects"].append(subject_stats)
    
    # Tính tỷ lệ
    statistics["summary"]["total_attendances"] = total_attendances
    statistics["summary"]["total_sessions"] = len(statistics["subjects"])
    
    if total_attendances > 0:
        statistics["summary"]["present_rate"] = round(total_present / total_attendances * 100, 2)
        statistics["summary"]["late_rate"] = round(total_late / total_attendances * 100, 2)
        statistics["summary"]["absent_rate"] = round(total_absent / total_attendances * 100, 2)
    
    return ResponseModel(
        statistics,
        f"Thống kê điểm danh cho phòng {classroom_name} đã được tạo thành công"
    )

# Endpoint nhận diện khuôn mặt và cập nhật điểm danh
@router.post("/face-recognition", response_description="Điểm danh bằng nhận diện khuôn mặt")
async def face_recognition_attendance(
    recognition_data: Dict = Body(...)
):
    """
    Xử lý điểm danh bằng nhận diện khuôn mặt
    
    Input:
    - userId: ID của người dùng được nhận diện
    - scheduleId: ID của lịch học
    - deviceId: ID của thiết bị nhận diện
    - confidence: Độ tin cậy của việc nhận diện (0-1)
    - capturedImage: Base64 của ảnh đã chụp (optional)
    - classroomId: ID của phòng học (optional, từ thiết bị)
    """
    db = get_database()
    
    # Validate input
    required_fields = ["userId", "scheduleId", "deviceId", "confidence"]
    for field in required_fields:
        if field not in recognition_data:
            return ErrorResponseModel(
                "Thiếu thông tin", 
                400, 
                f"Thiếu trường {field} trong dữ liệu gửi lên"
            )
    
    user_id = recognition_data["userId"]
    schedule_id = recognition_data["scheduleId"]
    confidence = float(recognition_data["confidence"])
    device_id = recognition_data["deviceId"]
    
    # Tìm bản ghi attendance log
    attendance = db.AttendanceLog.find_one({
        "scheduleId": schedule_id,
        "userId": user_id,
        "isActive": True
    })
    
    if not attendance:
        return ErrorResponseModel(
            "Không tìm thấy bản ghi", 
            404, 
            f"Không tìm thấy bản ghi điểm danh cho user {user_id} và lịch học {schedule_id}"
        )
    
    # Xác định trạng thái dựa trên thời gian điểm danh
    now = datetime.now()
    schedule = db.ClassSchedule.find_one({"scheduleId": schedule_id})
    
    if not schedule:
        return ErrorResponseModel(
            "Không tìm thấy lịch học", 
            404, 
            f"Không tìm thấy lịch học với ID {schedule_id}"
        )
    
    # Lấy thông tin time slot
    slot_id = schedule.get("slotId")
    time_slot = db.ScheduleFormat.find_one({"slotId": slot_id})
    
    if not time_slot:
        return ErrorResponseModel(
            "Không tìm thấy thông tin time slot", 
            404, 
            f"Không tìm thấy thông tin time slot với ID {slot_id}"
        )
    
    # Kiểm tra xem thiết bị có thuộc phòng học được chỉ định không
    device = db.Device.find_one({"deviceId": device_id})
    if not device:
        return ErrorResponseModel(
            "Không tìm thấy thiết bị", 
            404, 
            f"Không tìm thấy thiết bị với ID {device_id}"
        )
    
    # Phòng học của thiết bị
    device_classroom_id = device.get("classroomId")
    schedule_classroom_id = schedule.get("classroomId")
    
    # Nếu dữ liệu gửi lên có classroomId, ưu tiên sử dụng
    if "classroomId" in recognition_data:
        current_classroom_id = recognition_data["classroomId"]
    else:
        current_classroom_id = device_classroom_id
    
    # Lấy thông tin phòng học
    classroom = db.Classroom.find_one({"classroomId": current_classroom_id})
    classroom_name = classroom.get("classroomName", "") if classroom else ""
    
    # Tính toán thời gian bắt đầu và kết thúc tiết học trong ngày hiện tại
    class_date = schedule.get("sessionDate", now.date())
    start_time = time_slot.get("startTime")
    end_time = time_slot.get("endTime")
    
    # Tạo datetime từ date và time
    if isinstance(class_date, datetime):
        class_date = class_date.date()
    
    class_start = datetime.combine(class_date, start_time)
    class_end = datetime.combine(class_date, end_time)
    
    # Xác định trạng thái điểm danh
    status = "Present"  # Mặc định là đúng giờ
    
    # Nếu điểm danh sau khi bắt đầu 15 phút, coi là muộn
    if now > class_start + datetime.timedelta(minutes=15):
        status = "Late"
    
    # Nếu điểm danh sau khi kết thúc, coi là vắng
    if now > class_end:
        status = "Absent"
    
    # Kiểm tra phòng học có khớp với lịch học không
    classroom_mismatch = False
    if schedule_classroom_id and current_classroom_id != schedule_classroom_id:
        classroom_mismatch = True
        note = f"Phòng học không đúng: {classroom_name} (Dự kiến: {attendance.get('classroomName', '')})"
    else:
        note = ""
    
    # Cập nhật bản ghi điểm danh
    update_data = {
        "checkIn": now,
        "status": status,
        "confidence": confidence,
        "updatedAt": now
    }
    
    # Nếu có ghi chú về phòng học không khớp, thêm vào note
    if classroom_mismatch:
        update_data["note"] = note
    
    # Cập nhật thông tin classroom nếu phòng học hiện tại khác với phòng học trong bản ghi
    if current_classroom_id != attendance.get("classroomId"):
        update_data["classroomId"] = current_classroom_id
        update_data["classroomName"] = classroom_name
    
    # Lưu ảnh chụp nếu có
    if "capturedImage" in recognition_data:
        update_data["checkInFace"] = recognition_data["capturedImage"]
    
    # Thực hiện cập nhật
    result = db.AttendanceLog.update_one(
        {"attendanceId": attendance["attendanceId"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 1:
        # Lấy bản ghi đã cập nhật
        updated_attendance = db.AttendanceLog.find_one({"attendanceId": attendance["attendanceId"]})
        return ResponseModel(
            updated_attendance,
            f"Điểm danh thành công cho user {user_id}"
        )
    
    return ErrorResponseModel(
        "Điểm danh thất bại", 
        400, 
        "Không thể cập nhật bản ghi điểm danh"
    ) 