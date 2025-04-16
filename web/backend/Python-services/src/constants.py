"""
Collection names for MongoDB that match the SQL schema defined in FAMS.sql
Ensuring consistent naming convention across the application
"""

COLLECTIONS = {
    # User-related collections
    'USER_ACCOUNT': 'UserAccount',
    'STUDENT': 'Student',
    'TEACHER': 'Teacher',
    'PARENT': 'Parent',
    'PARENT_STUDENT': 'ParentStudent',
    'RFID': 'RFID',
    
    # Class and curriculum collections
    'CLASS': 'Class',
    'BATCH': 'Batch',
    'SUBJECT': 'Subject',
    'CLASSROOM': 'Classroom',
    'SEMESTER': 'Semester',
    'CURRICULUM': 'Curriculum',
    'CURRICULUM_SUBJECT': 'CurriculumSubject',
    
    # Schedule and attendance collections
    'CLASS_SCHEDULE': 'ClassSchedule',
    'ATTENDANCE_LOG': 'AttendanceLog',
    'SCHEDULE_FORMAT': 'ScheduleFormat',
    
    # Communication collections
    'ANNOUNCEMENT': 'Announcement',
    'NOTIFICATION': 'Notification',
    
    # Face recognition collections
    'FACE_VECTOR': 'FaceVector',
    'MODEL_VERSION': 'ModelVersion',
    'DEVICE': 'Device',
    
    # Field mapping to ensure consistent naming
    'FIELDS': {
        # Common fields
        'ID': '_id',  # MongoDB ObjectId
        
        # User fields
        'USER_ID': 'userId',
        'NAME': 'name',
        'EMAIL': 'email',
        'PASSWORD': 'password',
        'ROLE': 'role',
        'AVATAR': 'avatar',
        
        # Student fields
        'STUDENT_ID': 'studentId',
        'FULL_NAME': 'fullName',
        'DATE_OF_BIRTH': 'dateOfBirth',
        'CLASS_ID': 'classId',
        'GENDER': 'gender',
        'ADDRESS': 'address',
        'PHONE': 'phone',
        
        # Teacher fields
        'TEACHER_ID': 'teacherId',
        'HOMEROOM_TEACHER_ID': 'homeroomTeacherId',
        'EMAIL': 'email',
        'MAJOR': 'major',
        'WEEKLY_CAPACITY': 'weeklyCapacity',
        
        # Parent fields
        'PARENT_ID': 'parentId',
        'CAREER': 'career',
        
        # Class fields
        'CLASS_ID': 'classId',
        'CLASS_NAME': 'className',
        'GRADE': 'grade',
        
        # Batch fields
        'BATCH_ID': 'batchId',
        'BATCH_NAME': 'batchName',
        'START_YEAR': 'startYear',
        
        # Subject fields
        'SUBJECT_ID': 'subjectId',
        'SUBJECT_NAME': 'subjectName',
        'DESCRIPTION': 'description',
        'SUBJECT_TYPE': 'subjectType',
        
        # Classroom fields
        'CLASSROOM_ID': 'classroomId',
        'ROOM_NUMBER': 'roomNumber',
        'BUILDING': 'building',
        'CAPACITY': 'capacity',
        
        # Schedule fields
        'SCHEDULE_ID': 'scheduleId',
        'SEMESTER_ID': 'semesterId',
        'TOPIC': 'topic',
        'SESSION_DATE': 'sessionDate',
        'SESSION_WEEK': 'sessionWeek',
        
        # Schedule format fields
        'SLOT_ID': 'slotId',
        'SLOT_NUMBER': 'slotNumber',
        'DAY_OF_WEEK': 'dayOfWeek',
        'START_TIME': 'startTime',
        'END_TIME': 'endTime',
        
        # Attendance fields
        'ATTENDANCE_ID': 'attendanceId',
        'CHECK_IN_FACE': 'checkInFace',
        'CHECK_IN': 'checkIn',
        'STATUS': 'status',
        
        # Curriculum fields
        'CURRICULUM_ID': 'curriculumId',
        'CURRICULUM_NAME': 'curriculumName',
        'SESSIONS': 'sessions',
        
        # Semester fields
        'SEMESTER_ID': 'semesterId',
        'SEMESTER_NAME': 'semesterName',
        'START_DATE': 'startDate',
        'END_DATE': 'endDate',
        
        # Announcement fields
        'ANNOUNCEMENT_ID': 'announcementId',
        'CONTENT': 'content',
        'CREATED_AT': 'createdAt',
        
        # Notification fields
        'NOTIFICATION_ID': 'notificationId',
        'SENDER_ID': 'senderId',
        'RECEIVER_ID': 'receiverId',
        'MESSAGE': 'message',
        'SENT_DATE': 'sentDate',
        'READ_STATUS': 'readStatus',
        
        # Face recognition fields
        'FACE_VECTOR_ID': 'faceVectorId',
        'MODEL_ID': 'modelId',
        'VECTOR': 'vector',
        'CAPTURED_DATE': 'capturedDate',
        
        # Model version fields
        'MODEL_NAME': 'modelName',
        'VERSION': 'version',
        'DEPLOYMENT_DATE': 'deploymentDate',
        'CHECKPOINT_PATH': 'checkpointPath',
        'STATUS': 'status',
        
        # Device fields
        'DEVICE_ID': 'deviceId',
        'DEVICE_NAME': 'deviceName',
        'DEVICE_TYPE': 'deviceType',
        'LOCATION': 'location'
    }
}

# Fix the scheduling slot collection name - was incorrectly duplicated
COLLECTIONS['SLOT'] = 'ScheduleFormat' 