# FAMS API Guide

## Base URL
`http://fams.io.vn/api-nodejs`

## Authentication
Most endpoints require authentication using a JWT token.

### Postman Setup for Authentication
1. After login, copy the token from the response
2. For authenticated requests, add an Authorization header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`

## API Endpoints

The following APIs are currently implemented in the system:

### Auth API
Base path: `/auth`
- Login
- Register
- Get Current User
- Refresh Token

### User API
Base path: `/users`
- Get All Users (with filtering)
- Get User by ID
- Create User
- Update User
- Delete User
- Get User Details
- Unified Update User (Supports All Roles)

### Student API
Base path: `/students`
- Get All Students
- Get Student by ID
- Create Student
- Update Student
- Delete Student

### Teacher API
Base path: `/teachers`
- Get All Teachers
- Get Teacher by ID
- Create Teacher
- Update Teacher
- Delete Teacher

### Parent API
Base path: `/parents`
- Get All Parents
- Get Parent by ID
- Create Parent
- Update Parent
- Delete Parent

### Class API
Base path: `/classes`
- Get All Classes
- Get Class by ID or className
- Create Class
- Update Class
- Delete Class with cascade effects

### Schedule API
Base path: `/schedules`
- Get All Schedules (with advanced filtering)
- Get Schedules by Class Name
- Get Schedules by User ID
- Create Schedule
- Update Schedule
- Delete Schedule

### Admin API
Base path: `/admin`
- Admin Dashboard Data
- Manage System Settings

### RFID API
Base path: `/rfid`
- Get All RFID Cards
- Get RFID by ID
- Create RFID
- Update RFID
- Delete RFID
- Get RFID By User ID

### Avatar API
Base path: `/avatar`
- Upload Avatar
- Get User Avatar
- Delete User Avatar

### Classroom API
Base path: `/classrooms`
- Endpoints for managing classrooms

### Subject API
Base path: `/subjects`
- Endpoints for managing subjects

### Attendance API
Base path: `/attendance`
- Get All Attendance Logs
- Get Attendance Logs By Date Range
- Get Attendance Logs for a User
- Get Attendance Summary for a User
- Get Attendance Logs for Class, Date and Slot
- Get Attendance Logs for Class and Slot
- Get Attendance Log by ID
- Create New Attendance Log
- Update Attendance Log
- Update Attendance for Class, Date and Slot
- Batch Update Attendance Logs
- Check-In API
- Jetson Nano Facial Recognition Check-In API

### Database API
Base path: `/database`
- Check Database Status

## See Detailed Documentation

For detailed documentation including request/response formats for each endpoint, refer to the relevant sections below.

[The rest of the original API documentation with detailed endpoint information...]