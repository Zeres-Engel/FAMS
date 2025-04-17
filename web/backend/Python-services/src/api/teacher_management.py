"""
Teacher Management API Endpoints
Handles teacher-specific operations
"""
from fastapi import APIRouter, Body, Query
from typing import List, Dict, Optional
import datetime
from bson.objectid import ObjectId

from ..db import connect_to_mongodb
from .models import ResponseModel, ErrorResponseModel

router = APIRouter()

@router.get("/teachers")
async def get_all_teachers():
    """Get all teachers in the system"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        teachers = list(db.Teacher.find())
    
        for teacher in teachers:
            if "_id" in teacher:
                teacher["_id"] = str(teacher["_id"])
        
        return ResponseModel(
            teachers,
            f"Retrieved {len(teachers)} teachers"
        )
    except Exception as e:
        return ErrorResponseModel(
            "Error", 
            500, 
            f"Error retrieving teachers: {str(e)}"
        )
    finally:
        client.close()