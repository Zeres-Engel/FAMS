"""
Batch model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from src.constants import COLLECTIONS


class Batch(BaseModel):
    """Batch model for student cohorts"""
    batchId: str = Field(..., description="Unique identifier for the batch")
    batchName: str = Field(..., description="Name of the batch")
    startDate: datetime = Field(..., description="Start date of the batch")
    endDate: datetime = Field(..., description="End date of the batch")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['BATCH'] 