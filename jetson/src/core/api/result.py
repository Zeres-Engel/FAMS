from dataclasses import dataclass
from typing import Any, Dict, Optional
import json
from datetime import datetime

@dataclass
class Result:
    """Class to handle API response data and attendance results"""
    
    success: bool
    status_code: int
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary"""
        return {
            "success": self.success,
            "status_code": self.status_code,
            "message": self.message,
            "data": self.data,
            "timestamp": self.timestamp
        }
    
    def to_json(self) -> str:
        """Convert result to JSON string"""
        return json.dumps(self.to_dict())
    
    @classmethod
    def success_result(cls, data: Dict[str, Any], message: str = "Operation successful"):
        """Create a success result"""
        return cls(
            success=True,
            status_code=200,
            message=message,
            data=data
        )
    
    @classmethod
    def error_result(cls, message: str, status_code: int = 400, data: Optional[Dict[str, Any]] = None):
        """Create an error result"""
        return cls(
            success=False,
            status_code=status_code,
            message=message,
            data=data
        ) 