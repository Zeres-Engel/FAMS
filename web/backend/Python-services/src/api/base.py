"""
Base router for FAMS API
Contains core endpoints and health check
"""
from fastapi import APIRouter
from .models import ResponseModel, ErrorResponseModel

router = APIRouter()

@router.get("/")
async def root():
    """API health check and welcome message"""
    return {"message": "Welcome to FAMS API", "status": "running"} 