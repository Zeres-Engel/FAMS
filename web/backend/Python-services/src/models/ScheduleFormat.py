"""
ScheduleFormat model for FAMS
"""
from datetime import datetime
from typing import Optional, ClassVar, Dict, Any
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class ScheduleFormat(BaseModel):
    """ScheduleFormat model representing time slots in the schedule"""
    slotId: int = Field(..., description="Unique identifier for the slot")
    slotNumber: int = Field(..., description="Number of the slot")
    dayOfWeek: str = Field(..., description="Day of week (Monday, Tuesday, etc.)")
    startTime: str = Field(..., description="Start time in HH:MM format")
    endTime: str = Field(..., description="End time in HH:MM format")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SCHEDULE_FORMAT']
    
    @classmethod
    def from_csv_row(cls, row: Dict[str, Any], slot_id: int) -> 'ScheduleFormat':
        """Create a ScheduleFormat instance from a CSV row"""
        return cls(
            slotId=slot_id,
            slotNumber=int(row.get("SlotNumber", 1)),
            dayOfWeek=row.get("DayOfWeek", "Monday"),
            startTime=row.get("StartTime", "08:00"),
            endTime=row.get("EndTime", "09:00"),
            isActive=True
        ) 