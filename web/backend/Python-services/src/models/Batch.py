"""
Batch model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Batch(BaseModel):
    """Batch model representing groups of students in the same academic year"""
    batchId: int = Field(..., description="Unique identifier for the batch")
    batchName: str = Field(..., description="Name of the batch")
    startYear: Optional[int] = Field(None, description="Starting year of the batch")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['BATCH'] 