"""
API response models for FAMS
"""
from typing import Any, Dict, List, Optional


def ResponseModel(data, message):
    """Standard API response model"""
    return {
        "data": data,
        "code": 200,
        "message": message,
    }


def ErrorResponseModel(error, code, message):
    """Standard API error response model"""
    return {
        "error": error,
        "code": code,
        "message": message,
    } 