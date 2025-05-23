"""
FaceVector model for FAMS
"""
from datetime import datetime
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class FaceVector(BaseModel):
    """FaceVector model representing face recognition vectors"""
    faceVectorId: int = Field(..., description="Unique identifier for the face vector")
    userId: int = Field(..., description="Reference to UserAccount")
    modelId: Optional[int] = Field(None, description="Reference to ModelVersion")
    vector: Dict[str, Any] = Field(..., description="Face vector data")
    capturedDate: datetime = Field(default_factory=datetime.utcnow, description="Date when the vector was captured")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['FACE_VECTOR']