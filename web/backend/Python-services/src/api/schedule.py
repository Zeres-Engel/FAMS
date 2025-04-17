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
    
    This API takes semester number (1 or 2), start and end dates, and generates 
    class schedules using an improved algorithm that considers:
    - Teacher specialties (major)
    - Teacher weekly capacity
    - Classroom availability
    - Class subject requirements
    
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
        # Tìm tất cả semester theo semesterNumber
        semester_name = f"Học kỳ {request.semesterNumber}"
        existing_semesters = list(db.Semester.find({"SemesterName": semester_name}))
        
        if not existing_semesters:
            return ScheduleResponse(
                success=False,
                message="Thất bại",
                totalEntries=0,
                warnings=[f"Không tìm thấy dữ liệu nào cho {semester_name} trong hệ thống"]
            )
        
        # Cập nhật StartDate và EndDate cho tất cả các semester có semesterName tương ứng
        for semester in existing_semesters:
            db.Semester.update_one(
                {"_id": semester["_id"]},
                {"$set": {
                    "StartDate": request.startDate,
                    "EndDate": request.endDate
                }}
            )
            print(f"[INFO] Đã cập nhật {semester_name} cho khối {semester.get('grade', 'Unknown')}")
        
        # Lấy semester cho khối 12 để sử dụng trong thuật toán xếp lịch
        # Vì thuật toán đã được sửa để lọc lớp theo tên (12A1, 12A2, ...)
        target_semester = next(
            (s for s in existing_semesters if s.get("grade") == 12), 
            existing_semesters[0]  # Fallback to first semester if no grade 12
        )
        
        semester_info = {
            "semesterNumber": request.semesterNumber,
            "semesterName": semester_name,
            "startDate": request.startDate,
            "endDate": request.endDate,
            "curriculumId": target_semester.get("CurriculumID", 1)
        }
        
        # Start background task for schedule generation
        background_tasks.add_task(_generate_improved_schedules_task, semester_info)
        
        return ScheduleResponse(
            success=True,
            message=f"Bắt đầu sắp xếp thời khóa biểu cho {semester_name}",
            totalEntries=0,
            details={
                "status": "processing", 
                "updatedSemesters": len(existing_semesters)
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
        
        # Chuẩn bị dữ liệu cho học kỳ
        semester_number = semester_info["semesterNumber"]
        start_date = semester_info["startDate"]
        end_date = semester_info["endDate"]
        
        # Clean existing schedules if needed
        result = db.ClassSchedule.delete_many({"semesterNumber": semester_number})
        print(f"[INFO] Đã xóa {result.deleted_count} lịch học cũ")
        
        # Generate schedules using improved algorithm
        schedules, warnings = generate_improved_schedule(
            db=db,
            semester_info=semester_info,
            total_weeks=18  # Default to 18 weeks per semester
        )
        
        print(f"[INFO] Đã tạo {len(schedules)} lịch học mới")
        
        # Chuẩn bị dữ liệu để lưu vào database
        cleaned_schedules = []
        for schedule in schedules:
            # Đảm bảo các trường đúng định dạng theo model ClassSchedule
            clean_schedule = {
                "scheduleId": schedule["scheduleId"],
                "semesterId": 1,  # Mặc định là 1
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
        if cleaned_schedules:
            result = db.ClassSchedule.insert_many(cleaned_schedules)
            print(f"[INFO] Đã lưu {len(result.inserted_ids)} lịch học vào cơ sở dữ liệu")
            
        # Log any warnings
        if warnings:
            print(f"[WARNING] Có {len(warnings)} cảnh báo khi tạo lịch:")
            for warning in warnings:
                print(f"  - {warning}")
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Lỗi khi tạo lịch học: {str(e)}")
        print(f"[ERROR] Chi tiết: {traceback.format_exc()}")