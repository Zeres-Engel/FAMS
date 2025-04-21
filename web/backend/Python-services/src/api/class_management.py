"""
Class Management Module
Provides functions for class-specific database operations
"""
import datetime
from bson.objectid import ObjectId
from typing import Dict, List, Optional

from ..db import connect_to_mongodb

async def get_all_classes():
    """Get all classes in the system"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        classes = list(db.Class.find())
        
        # Convert MongoDB ObjectId to string
        for cls in classes:
            if "_id" in cls:
                cls["_id"] = str(cls["_id"])
        
        return classes
    except Exception as e:
        raise e
    finally:
        client.close()

async def get_class(class_id: str):
    """Get a specific class by ID"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Try to find class by ID
        cls = db.Class.find_one({"classId": class_id})
        
        if not cls:
            # Try finding by ObjectId (in case the ID is a MongoDB ObjectId)
            try:
                obj_id = ObjectId(class_id)
                cls = db.Class.find_one({"_id": obj_id})
            except:
                pass
        
        if cls and "_id" in cls:
            cls["_id"] = str(cls["_id"])
            
        return cls
    except Exception as e:
        raise e
    finally:
        client.close()

async def add_class(class_data: Dict):
    """Add a new class"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Check if class with this ID already exists
        if "classId" in class_data:
            existing_class = db.Class.find_one({"classId": class_data["classId"]})
            if existing_class:
                raise ValueError(f"Class with ID {class_data['classId']} already exists")
        
        # Check if class with this className already exists
        if "className" in class_data:
            existing_class_name = db.Class.find_one({"className": class_data["className"]})
            if existing_class_name:
                raise ValueError(f"Class with name '{class_data['className']}' already exists")
        
        # Add creation timestamp
        class_data["createdAt"] = datetime.datetime.now()
        
        # Insert the class
        result = db.Class.insert_one(class_data)
        
        # Get the inserted class
        new_class = db.Class.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string
        if new_class and "_id" in new_class:
            new_class["_id"] = str(new_class["_id"])
        
        return new_class
    except Exception as e:
        raise e
    finally:
        client.close()

async def update_class(class_id: str, class_data: Dict):
    """Update an existing class"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Find the class
        cls = db.Class.find_one({"classId": class_id})
        if not cls:
            try:
                obj_id = ObjectId(class_id)
                cls = db.Class.find_one({"_id": obj_id})
            except:
                pass
        
        if not cls:
            raise ValueError(f"Class with ID {class_id} not found")
        
        # Check if className is being updated and if it's unique
        if "className" in class_data and class_data["className"] != cls.get("className"):
            existing_class = db.Class.find_one({"className": class_data["className"]})
            if existing_class:
                raise ValueError(f"Class with name '{class_data['className']}' already exists")
        
        # Add update timestamp
        class_data["updatedAt"] = datetime.datetime.now()
        
        # Update the class
        if "_id" in cls:
            result = db.Class.update_one(
                {"_id": cls["_id"]},
                {"$set": class_data}
            )
        else:
            result = db.Class.update_one(
                {"classId": class_id},
                {"$set": class_data}
            )
        
        # Get the updated class
        updated_class = db.Class.find_one({"classId": class_id})
        if not updated_class:
            updated_class = db.Class.find_one({"_id": cls["_id"]})
        
        # Convert ObjectId to string
        if updated_class and "_id" in updated_class:
            updated_class["_id"] = str(updated_class["_id"])
        
        return updated_class
    except Exception as e:
        raise e
    finally:
        client.close()

async def delete_class(class_id: str):
    """Delete a class"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Find the class
        cls = db.Class.find_one({"classId": class_id})
        if not cls:
            try:
                obj_id = ObjectId(class_id)
                cls = db.Class.find_one({"_id": obj_id})
            except:
                pass
        
        if not cls:
            raise ValueError(f"Class with ID {class_id} not found")
        
        # Delete the class
        if "_id" in cls:
            result = db.Class.delete_one({"_id": cls["_id"]})
        else:
            result = db.Class.delete_one({"classId": class_id})
        
        return {"classId": class_id}
    except Exception as e:
        raise e
    finally:
        client.close()

async def get_classes_by_subject(subject: str):
    """Get all classes for a specific subject"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Find classes for this subject
        classes = list(db.Class.find({"subject": subject}))
        
        # Convert MongoDB ObjectId to string
        for cls in classes:
            if "_id" in cls:
                cls["_id"] = str(cls["_id"])
        
        return classes
    except Exception as e:
        raise e
    finally:
        client.close()

async def get_classes_by_teacher(teacher_id: str):
    """Get all classes taught by a specific teacher"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Check if teacher exists
        teacher = db.Teacher.find_one({"teacherId": teacher_id})
        if not teacher:
            try:
                obj_id = ObjectId(teacher_id)
                teacher = db.Teacher.find_one({"_id": obj_id})
                if teacher:
                    teacher_id = teacher.get("teacherId")
            except:
                pass
        
        if not teacher:
            raise ValueError(f"Teacher with ID {teacher_id} not found")
        
        # Get classes taught by this teacher
        classes = list(db.Class.find({"teacherId": teacher_id}))
        
        # Also look at schedule for teacher assignments
        schedules = list(db.Schedule.find({"teacherId": teacher_id}))
        class_ids = list(set([s.get("classId") for s in schedules if "classId" in s]))
        
        # Add classes from schedule that aren't already included
        for class_id in class_ids:
            cls = db.Class.find_one({"classId": class_id})
            if cls and not any(c.get("classId") == class_id for c in classes):
                classes.append(cls)
        
        # Convert MongoDB ObjectId to string
        for cls in classes:
            if "_id" in cls:
                cls["_id"] = str(cls["_id"])
        
        return classes
    except Exception as e:
        raise e
    finally:
        client.close()

async def get_students_in_class(class_id: str):
    """Get all students in a specific class"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Check if class exists
        cls = db.Class.find_one({"classId": class_id})
        if not cls:
            try:
                obj_id = ObjectId(class_id)
                cls = db.Class.find_one({"_id": obj_id})
                if cls:
                    class_id = cls.get("classId")
            except:
                pass
        
        if not cls:
            raise ValueError(f"Class with ID {class_id} not found")
        
        # Find students in this class
        students = list(db.Student.find({"classId": class_id}))
        
        # Convert MongoDB ObjectId to string
        for student in students:
            if "_id" in student:
                student["_id"] = str(student["_id"])
        
        return students
    except Exception as e:
        raise e
    finally:
        client.close()

async def get_class_schedule(class_id: str):
    """Get schedule for a specific class"""
    client = connect_to_mongodb()
    db = client["fams"]
    
    try:
        # Check if class exists
        cls = db.Class.find_one({"classId": class_id})
        if not cls:
            try:
                obj_id = ObjectId(class_id)
                cls = db.Class.find_one({"_id": obj_id})
                if cls:
                    class_id = cls.get("classId")
            except:
                pass
        
        if not cls:
            raise ValueError(f"Class with ID {class_id} not found")
        
        # Get schedule
        schedule = list(db.Schedule.find({"classId": class_id}))
        
        # Convert MongoDB ObjectId to string
        for item in schedule:
            if "_id" in item:
                item["_id"] = str(item["_id"])
        
        return schedule
    except Exception as e:
        raise e
    finally:
        client.close() 