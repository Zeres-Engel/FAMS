"""
Database management router for FAMS API
Handles database initialization and other database operations
"""
from fastapi import APIRouter, BackgroundTasks
from .init_db import init_database
from .models import ResponseModel, ErrorResponseModel

router = APIRouter()

@router.post("/init")
async def initialize_database(background_tasks: BackgroundTasks):
    """Initialize database with sample data"""
    background_tasks.add_task(init_database)
    return ResponseModel(
        "Database initialization started in background",
        "Database initialization process has been queued. Check logs for progress."
    ) 