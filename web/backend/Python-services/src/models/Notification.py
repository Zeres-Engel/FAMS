"""
Notification model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Notification(BaseModel):
    """Notification model representing messages sent between users"""
    notificationId: int = Field(..., description="Unique identifier for the notification")
    senderId: int = Field(..., description="Reference to UserAccount who sent the notification")
    receiverId: int = Field(..., description="Reference to UserAccount who receives the notification")
    message: str = Field(..., description="Content of the notification")
    sentDate: datetime = Field(default_factory=datetime.utcnow, description="Date when notification was sent")
    readStatus: bool = Field(default=False, description="Whether the notification has been read")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['NOTIFICATION'] 