from pymongo.collection import Collection
from bson import ObjectId
from typing import Dict, Any, Optional

class Student:
    def __init__(self, db_collection: Collection):
        self.collection = db_collection
    
    async def create(self, student_data: Dict[str, Any]) -> str:
        result = await self.collection.insert_one(student_data)
        return str(result.inserted_id)
    
    async def get_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"_id": ObjectId(student_id)})
    
    async def get_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"userId": user_id})
    
    async def update(self, student_id: str, student_data: Dict[str, Any]) -> bool:
        result = await self.collection.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": student_data}
        )
        return result.modified_count > 0
    
    async def delete(self, student_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(student_id)})
        return result.deleted_count > 0
