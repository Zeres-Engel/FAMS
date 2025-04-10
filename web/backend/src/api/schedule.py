"""
Schedule API endpoints
Handles schedule generation and management
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import re
from bson import ObjectId

from ..db import get_database
from ..schedule.generator import generate_all_schedules
from .models import ResponseModel, ErrorResponseModel

router = APIRouter()

class ScheduleGenerationRequest(BaseModel):
    academic_year: str

@router.post("/scheduling")
async def generate_schedules(
    request: ScheduleGenerationRequest,
    background_tasks: BackgroundTasks
):
    """Generate schedules for specified academic year"""
    background_tasks.add_task(_generate_schedules_task, request.academic_year)
    return ResponseModel(
        {"task_started": True, "academic_year": request.academic_year},
        "Schedule generation started in background. Check logs for progress."
    )

async def _generate_schedules_task(academic_year: str):
    """Background task to generate schedules"""
    db = get_database()
    
    try:
        # Extract years from academic_year string (e.g., "2024-2025" or "2024-2025-2026")
        years = [int(year) for year in re.findall(r'\d{4}', academic_year)]
        print(f"[INFO] Looking for semesters with start dates in years: {years}")
        
        # Print collections for debugging
        collections = db.list_collection_names()
        print(f"[DEBUG] Available collections: {collections}")

        # Examine structure of ClassSchedule collection
        if 'ClassSchedule' in collections:
            sample = db.ClassSchedule.find_one()
            if sample:
                print(f"[DEBUG] Sample ClassSchedule document: {sample}")
                print(f"[DEBUG] Field names: {list(sample.keys())}")
        
        # Use correct collection name
        semester_collection = db.Semester
        
        # Find all semesters where startDate year is in the specified years
        semesters = []
        all_semesters = list(semester_collection.find())
        
        for semester in all_semesters:
            # Extract year from StartDate
            start_date = None
            
            if 'StartDate' in semester and isinstance(semester['StartDate'], datetime):
                start_date = semester['StartDate']
            
            if start_date and start_date.year in years:
                semesters.append(semester)
                print(f"[INFO] Found semester: {semester.get('SemesterName')} starting in {start_date.year}")
        
        if not semesters:
            print(f"[ERROR] No semesters found with start dates in years: {years}")
            return
        
        print(f"[INFO] Found {len(semesters)} semesters for academic years: {years}")
        
        # Always clean ALL existing schedules for simpler operation
        if 'ClassSchedule' in collections:
            # Force clean ALL class schedules regardless of semester
            result = db.ClassSchedule.delete_many({})
            print(f"[INFO] Deleted ALL {result.deleted_count} entries from ClassSchedule")
        else:
            print("[WARNING] ClassSchedule collection not found.")
        
        # Generate new schedules
        total_schedules = generate_all_schedules(db, semesters)
        print(f"[INFO] Generated {total_schedules} schedule entries")
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Failed to generate schedules: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
