"""
Schedule API endpoints
Handles schedule generation and management
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re
from bson import ObjectId
import os

from ..db import get_database
from ..schedule.generator import generate_all_schedules
from ..schedule.export import export_semester_schedules, export_all_schedules
from ..schedule.core import generate_schedule, generate_improved_schedule
from .models import ResponseModel, ErrorResponseModel

router = APIRouter()

# Define models for schedule requests
class ScheduleRequest(BaseModel):
    semesterNumber: int = Field(..., description="Học kỳ (1 hoặc 2)", ge=1, le=2)
    startDate: str = Field(..., description="Ngày bắt đầu học kỳ (định dạng DD/MM/YYYY)")
    endDate: str = Field(..., description="Ngày kết thúc học kỳ (định dạng DD/MM/YYYY)")
    academicYear: Optional[str] = Field(None, description="Năm học (ví dụ: 2022-2023). Nếu không cung cấp, sẽ áp dụng cho tất cả năm học.")
    
    @validator('startDate', 'endDate')
    def validate_date_format(cls, v):
        # Hỗ trợ format DD/MM/YYYY
        if re.match(r'^\d{1,2}/\d{1,2}/\d{4}$', v):
            day, month, year = v.split('/')
            try:
                return datetime(int(year), int(month), int(day))
            except ValueError:
                raise ValueError(f"Ngày không hợp lệ: {v}")
        # Nếu là ISO format, chuyển đổi trực tiếp
        try:
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError(f"Định dạng ngày không hợp lệ, yêu cầu DD/MM/YYYY hoặc ISO: {v}")
    
    @validator('academicYear')
    def validate_academic_year(cls, v):
        if v and not re.match(r'^\d{4}-\d{4}$', v):
            raise ValueError(f"Định dạng năm học không hợp lệ. Yêu cầu dạng XXXX-XXXX, ví dụ: 2022-2023")
        return v

class ScheduleResponse(BaseModel):
    success: bool
    message: str
    totalEntries: int
    warnings: List[str] = []
    details: Optional[Dict[str, Any]] = None

@router.post("/generate", response_model=ScheduleResponse)
async def generate_class_schedules(request: ScheduleRequest, background_tasks: BackgroundTasks):
    """
    Generate class schedules for a specific semester
    
    This API takes semester number (1 or 2), start and end dates, and generates:
    1. Class schedules using an improved algorithm that considers:
       - Teacher specialties (major)
       - Teacher weekly capacity
       - Classroom availability
       - Class subject requirements
    2. Attendance logs for each student in each class for every schedule entry with status "Not Now"
    
    Returns schedule generation status and starts a background task for generation
    """
    db = get_database()
    
    # Validate inputs
    if request.semesterNumber not in [1, 2]:
        return ScheduleResponse(
            success=False,
            message="Thất bại",
            totalEntries=0,
            warnings=["Học kỳ phải là 1 hoặc 2"]
        )
    
    if request.startDate >= request.endDate:
        return ScheduleResponse(
            success=False,
            message="Thất bại",
            totalEntries=0,
            warnings=["Ngày bắt đầu phải trước ngày kết thúc"]
        )
    
    try:
        # Tìm hoặc tạo semester theo semesterNumber và academicYear
        semester_name = f"Học kỳ {request.semesterNumber}"
        
        # Chuẩn bị thông tin semester
        semester_info = {
            "semesterNumber": request.semesterNumber,
            "semesterName": semester_name,
            "startDate": request.startDate,
            "endDate": request.endDate,
            "academicYear": request.academicYear  # Thêm thông tin năm học
        }
        
        # Start background task for schedule generation
        background_tasks.add_task(_generate_improved_schedules_task, semester_info)
        
        success_message = f"Bắt đầu sắp xếp thời khóa biểu và tạo attendance logs cho {semester_name}"
        if request.academicYear:
            success_message += f" trong năm học {request.academicYear}"
            
        return ScheduleResponse(
            success=True,
            message=success_message,
            totalEntries=0,
            details={
                "status": "processing", 
                "note": "Hệ thống sẽ tự động tạo attendance logs với trạng thái 'Not Now' cho mỗi học sinh trong lịch học"
            }
        )
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] Lỗi khi sắp xếp thời khóa biểu: {str(e)}")
        print(f"[ERROR] Chi tiết: {error_details}")
        
        return ScheduleResponse(
            success=False,
            message="Lỗi khi sắp xếp thời khóa biểu",
            totalEntries=0,
            warnings=[str(e)],
            details={"error": error_details}
        )

async def _generate_improved_schedules_task(semester_info: Dict[str, Any]):
    """Background task to generate schedules using improved algorithm"""
    db = get_database()
    
    try:
        print(f"[INFO] Bắt đầu sắp xếp thời khóa biểu cho {semester_info['semesterName']}")
        if semester_info.get('academicYear'):
            print(f"[INFO] Năm học: {semester_info['academicYear']}")
        
        # Chuẩn bị dữ liệu cho học kỳ
        semester_number = semester_info["semesterNumber"]
        start_date = semester_info["startDate"]
        end_date = semester_info["endDate"]
        academic_year = semester_info.get("academicYear")
        
        # Tìm hoặc tạo các bản ghi semester cho mỗi khối (grade)
        # Chỉ sử dụng semester để theo dõi, không phụ thuộc vào nó để lấy lớp học
        if academic_year:
            # Tìm tất cả grade từ bảng Class
            grades = set()
            class_query = {"academicYear": academic_year, "isActive": True}
            classes = list(db.Class.find(class_query))
            
            if not classes:
                print(f"[WARNING] Không tìm thấy lớp học nào cho năm học {academic_year}")
            else:
                print(f"[INFO] Tìm thấy {len(classes)} lớp học cho năm học {academic_year}")
                for cls in classes:
                    if "grade" in cls:
                        grades.add(cls["grade"])
            
            # Cập nhật hoặc tạo semester cho mỗi grade
            for grade in grades:
                # Tìm semester theo grade và academicYear
                semester_query = {
                    "SemesterName": semester_info["semesterName"], 
                    "grade": grade,
                    "academicYear": academic_year
                }
                
                existing_semester = db.Semester.find_one(semester_query)
                
                if existing_semester:
                    # Cập nhật thông tin
                    db.Semester.update_one(
                        {"_id": existing_semester["_id"]},
                        {"$set": {
                            "StartDate": start_date,
                            "EndDate": end_date,
                            "updatedAt": datetime.utcnow()
                        }}
                    )
                    print(f"[INFO] Đã cập nhật {semester_info['semesterName']} cho khối {grade} năm học {academic_year}")
                else:
                    # Tạo semester mới
                    # Lấy SemesterID tiếp theo
                    last_semester = db.Semester.find_one(sort=[("SemesterID", -1)])
                    next_semester_id = 1
                    if last_semester and "SemesterID" in last_semester:
                        next_semester_id = last_semester["SemesterID"] + 1
                    
                    new_semester = {
                        "SemesterID": next_semester_id,
                        "CurriculumID": 1,  # Default curriculum ID
                        "SemesterName": semester_info["semesterName"],
                        "StartDate": start_date,
                        "EndDate": end_date,
                        "grade": grade,
                        "academicYear": academic_year,
                        "createdAt": datetime.utcnow(),
                        "updatedAt": datetime.utcnow(),
                        "isActive": True
                    }
                    
                    db.Semester.insert_one(new_semester)
                    print(f"[INFO] Đã tạo mới {semester_info['semesterName']} cho khối {grade} năm học {academic_year}")
        
        # Xác định query để xóa dữ liệu
        delete_query = {"semesterNumber": semester_number}
        if academic_year:
            # Lấy danh sách class IDs thuộc năm học này để chỉ xóa schedules liên quan
            class_ids = [c["classId"] for c in db.Class.find({"academicYear": academic_year})]
            if class_ids:
                delete_query["classId"] = {"$in": class_ids}
                print(f"[INFO] Lọc theo {len(class_ids)} lớp thuộc năm học {academic_year}")
        
        # Clean existing schedules
        result = db.ClassSchedule.delete_many(delete_query)
        print(f"[INFO] Đã xóa {result.deleted_count} lịch học cũ")
        
        # Clean existing attendance logs related to this semester
        if result.deleted_count > 0:
            attendance_delete_result = db.AttendanceLog.delete_many({"semesterNumber": semester_number})
            print(f"[INFO] Đã xóa {attendance_delete_result.deleted_count} attendance logs cũ")
        
        # Generate schedules using improved algorithm
        schedules, warnings = generate_improved_schedule(
            db=db,
            semester_info=semester_info,
            total_weeks=18,  # Default to 18 weeks per semester
            academic_year=academic_year  # Thêm tham số để lọc lớp theo năm học
        )
        
        print(f"[INFO] Đã tạo {len(schedules)} lịch học mới")
        
        # Chuẩn bị dữ liệu để lưu vào database
        cleaned_schedules = []
        for schedule in schedules:
            # Đảm bảo các trường đúng định dạng theo model ClassSchedule
            clean_schedule = {
                "scheduleId": schedule["scheduleId"],
                "semesterId": schedule.get("semesterId", 1),  # Mặc định là 1
                "semesterNumber": schedule["semesterNumber"],
                "classId": schedule["classId"],
                "subjectId": schedule["subjectId"],
                "teacherId": schedule["teacherId"],
                "classroomId": schedule["classroomId"],
                "slotId": schedule["slotId"],
                "topic": schedule.get("topic", ""),
                "sessionDate": schedule["sessionDate"],
                "sessionWeek": schedule.get("sessionWeek", ""),
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "isActive": True
            }
            cleaned_schedules.append(clean_schedule)
            
        # Save generated schedules to database
        schedule_ids = []
        if cleaned_schedules:
            result = db.ClassSchedule.insert_many(cleaned_schedules)
            schedule_ids = result.inserted_ids
            print(f"[INFO] Đã lưu {len(result.inserted_ids)} lịch học vào cơ sở dữ liệu")
            
        # Log any warnings
        if warnings:
            print(f"[WARNING] Có {len(warnings)} cảnh báo khi tạo lịch:")
            for warning in warnings:
                print(f"  - {warning}")
        
        # Tạo attendance logs cho từng lịch học đã tạo
        print(f"[INFO] Bắt đầu tạo attendance logs cho {len(cleaned_schedules)} lịch học")
        attendance_logs = []
        attendance_count = 0
        
        # Tạo một bộ đếm cho attendanceId
        last_attendance = db.AttendanceLog.find_one(sort=[("attendanceId", -1)])
        next_attendance_id = 1 if not last_attendance else (last_attendance.get("attendanceId", 0) + 1)
        
        # Lặp qua từng lịch học đã tạo
        for schedule in cleaned_schedules:
            class_id = schedule["classId"]
            schedule_id = schedule["scheduleId"]
            
            # Lấy danh sách học sinh trong lớp - đã sửa từ classId thành classIds
            students = list(db.Student.find({"classIds": class_id, "isActive": True}))
            
            # Tạo attendance log cho từng học sinh
            for student in students:
                user_id = student.get("userId")  # userId là string
                
                if user_id:
                    attendance_log = {
                        "attendanceId": next_attendance_id,
                        "scheduleId": schedule_id,
                        "userId": user_id,  # userId là string
                        "checkIn": None,
                        "note": "",
                        "status": "Not Now",  # Đặt tất cả là Not Now như yêu cầu
                        "semesterNumber": schedule["semesterNumber"],  # Thêm để dễ quản lý
                        "createdAt": datetime.utcnow(),
                        "updatedAt": datetime.utcnow(),
                        "isActive": True
                    }
                    
                    attendance_logs.append(attendance_log)
                    next_attendance_id += 1
                    attendance_count += 1
                    
                    # Insert batch cứ mỗi 1000 records để tránh quá tải memory
                    if len(attendance_logs) >= 1000:
                        db.AttendanceLog.insert_many(attendance_logs)
                        print(f"[INFO] Đã lưu batch {len(attendance_logs)} attendance logs")
                        attendance_logs = []
        
        # Insert nốt các attendance logs còn lại
        if attendance_logs:
            db.AttendanceLog.insert_many(attendance_logs)
            print(f"[INFO] Đã lưu batch cuối cùng {len(attendance_logs)} attendance logs")
        
        print(f"[INFO] Hoàn thành: Đã tạo tổng cộng {attendance_count} attendance logs")
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Lỗi khi tạo lịch học hoặc attendance logs: {str(e)}")
        print(f"[ERROR] Chi tiết: {traceback.format_exc()}")