"""
Announcement model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Announcement(BaseModel):
    """Announcement model representing public announcements in the system"""
    announcementId: int = Field(..., description="Unique identifier for the announcement")
    userId: int = Field(..., description="Reference to UserAccount who created the announcement")
    content: Optional[str] = Field(None, description="Content of the announcement")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['ANNOUNCEMENT'] 