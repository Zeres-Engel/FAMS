"""
RFID model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class RFID(BaseModel):
    """RFID model representing RFID cards assigned to users"""
    rfidId: str = Field(..., description="Unique identifier for the RFID card")
    userId: int = Field(..., description="Reference to UserAccount")
    issueDate: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Date when the card was issued")
    expiryDate: Optional[datetime] = Field(None, description="Date when the card expires")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['RFID'] 