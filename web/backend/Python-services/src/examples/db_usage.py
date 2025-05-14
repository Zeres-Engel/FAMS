"""
Example file demonstrating the correct usage of constants and helper functions
for MongoDB access in FAMS
"""
from ..db import connect_to_mongodb, get_collection, get_field_name
from ..constants import COLLECTIONS

def example_db_operations():
    """Example function showing proper MongoDB operations with constants"""
    # Connect to MongoDB
    client = connect_to_mongodb()
    db = client["fams"]
    
    # 1. Accessing collections using helper function
    user_collection = get_collection(db, 'USER_ACCOUNT')
    student_collection = get_collection(db, 'STUDENT')
    
    # 2. Accessing fields using helper function
    user_id_field = get_field_name('USER_ID')
    full_name_field = get_field_name('FULL_NAME')
    
    # 3. Querying example
    query = {
        user_id_field: 1,  # userId: 1
    }
    user = user_collection.find_one(query)
    
    # 4. Update example
    update_data = {
        "$set": {
            get_field_name('NAME'): "Updated Name",
            get_field_name('EMAIL'): "updated@example.com"
        }
    }
    user_collection.update_one(query, update_data)
    
    # 5. Insert example for student
    new_student = {
        get_field_name('USER_ID'): 10,
        get_field_name('FULL_NAME'): "New Student",
        get_field_name('DATE_OF_BIRTH'): "2005-01-01",
        get_field_name('CLASS_ID'): 1,
        get_field_name('GENDER'): True,
        get_field_name('ADDRESS'): "123 Student Address",
        get_field_name('PHONE'): "0123456789"
    }
    student_collection.insert_one(new_student)
    
    # 6. Using raw collection names (not recommended, but shown for comparison)
    raw_user_collection = db[COLLECTIONS['USER_ACCOUNT']]  # db['UserAccount']
    raw_result = raw_user_collection.find_one({"userId": 1})
    
    return {
        "user": user,
        "raw_result": raw_result,
        "example_query": query,
        "example_update": update_data,
        "example_insert": new_student
    }

if __name__ == "__main__":
    # Run the example
    result = example_db_operations()
    print("Example query:", result["example_query"])
    print("Example update:", result["example_update"])
    print("Example insert:", result["example_insert"]) 