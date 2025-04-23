from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Body, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import traceback

from src.api.database import get_db_connection, promote_students_to_next_grade
from src.data.generator import generate_improved_schedule

router = APIRouter()

class SchedulePayload(BaseModel):
    academic_year: str

@router.post("/generate/improved")
async def generate_improved_schedule_api(request: Request, payload: SchedulePayload = Body(...)):
    try:
        academic_year = payload.academic_year
        
        # Promote students if it's the target academic year
        if academic_year == "2023-2024":
            db = get_db_connection()
            previous_year = "2022-2023"
            
            print(f"Promoting students from {previous_year} to {academic_year}")
            promotion_result = promote_students_to_next_grade(
                db=db,
                current_academic_year=previous_year,
                next_academic_year=academic_year
            )
            
            if promotion_result and "errors" in promotion_result and not promotion_result["errors"]:
                print(f"Promotion successful: {promotion_result.get('promoted_students', 0)} students promoted")
            else:
                print(f"Warning: Promotion may have issues: {promotion_result.get('errors', ['Unknown error'])}")
        
        # Generate the schedule
        result = generate_improved_schedule(academic_year)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Schedule for {academic_year} generated successfully",
            "data": result
        })
    except Exception as e:
        error_message = str(e)
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Failed to generate schedule: {error_message}"
            }
        ) 