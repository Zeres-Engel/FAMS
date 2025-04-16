"""
Device model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Device(BaseModel):
    """Device model representing hardware devices used in the system"""
    deviceId: int = Field(..., description="Unique identifier for the device")
    deviceName: str = Field(..., description="Name of the device")
    deviceType: str = Field(default="Jetson Nano", description="Type of device")
    location: Optional[str] = Field(None, description="Location of the device")
    status: bool = Field(default=True, description="Whether the device is operational")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['DEVICE'] 