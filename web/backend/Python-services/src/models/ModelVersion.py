"""
ModelVersion model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class ModelVersion(BaseModel):
    """ModelVersion model representing versions of face recognition models"""
    modelId: int = Field(..., description="Unique identifier for the model version")
    modelName: str = Field(..., description="Name of the model")
    version: str = Field(..., description="Version number or identifier")
    deploymentDate: datetime = Field(default_factory=datetime.utcnow, description="Date when the model was deployed")
    description: Optional[str] = Field(None, description="Description of the model")
    deviceId: Optional[int] = Field(None, description="Reference to Device where model is deployed")
    checkpointPath: str = Field(..., description="Path to the model checkpoint file")
    status: str = Field(default="Active", description="Model status (Active or Inactive)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['MODEL_VERSION'] 