# FAMS API Guide

## Tổng quan hệ thống

Hệ thống FAMS cung cấp API thông qua hai backend:

- **NodeJS Backend**: Xử lý chính cho authentication và quản lý dữ liệu
- **Python Backend**: Xử lý tác vụ lập lịch và các thuật toán phức tạp

## Truy cập API

### Thông qua tên miền (fams.io.vn)

**NodeJS API:**
- Base URL: `http://fams.io.vn/api` hoặc `http://fams.io.vn/api-nodejs`
- API Docs: Không có Swagger UI

**Python API:**
- Base URL: `http://fams.io.vn/api-python`
- API Docs: 
  - Swagger UI: `http://fams.io.vn/python-docs`
  - ReDoc: `http://fams.io.vn/python-redoc`

### Thông qua localhost và port

**NodeJS API:**
- Base URL: `http://localhost:3002/api`

**Python API:**
- Base URL: `http://localhost:3001`
- API Docs:
  - Swagger UI: `http://localhost:3001/docs`
  - ReDoc: `http://localhost:3001/redoc`

## NodeJS API Endpoints

### Authentication

- **Login**
  - URL: `/api/auth/login`
  - Method: `POST`
  - Body:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
  - Response:
  ```json
  {
    "token": "string",
    "refreshToken": "string",
    "user": {
      "id": "string",
      "username": "string",
      "role": "string"
    }
  }
  ```

- **Refresh Token**
  - URL: `/api/auth/refresh`
  - Method: `POST`
  - Body:
  ```json
  {
    "refreshToken": "string"
  }
  ```
  - Response:
  ```json
  {
    "token": "string"
  }
  ```

### Quản lý người dùng

- **Lấy danh sách người dùng**
  - URL: `/api/users`
  - Method: `GET`
  - Headers: `Authorization: Bearer {token}`
  - Response:
  ```json
  {
    "data": [
      {
        "id": "string",
        "username": "string",
        "email": "string",
        "role": "string"
      }
    ]
  }
  ```

## Python API Endpoints

### Lịch học (Scheduling)

- **Tạo lịch học**
  - URL: `/api-python/api/db/scheduling`
  - Method: `POST`
  - Body:
  ```json
  {
    "academic_year": "2024-2025"
  }
  ```

- **Lấy lịch học**
  - URL: `/api-python/api/db/schedules`
  - Method: `GET`
  - Query Parameters:
    - `semester_id`: ID học kỳ (optional)
    - `class_id`: ID lớp học (optional)
    - `teacher_id`: ID giáo viên (optional)
    - `subject_id`: ID môn học (optional)

### Quản lý cơ sở dữ liệu

- **Khởi tạo dữ liệu**
  - URL: `/api-python/api/db/init`
  - Method: `POST`

- **Thông tin cơ sở dữ liệu**
  - URL: `/api-python/api/db/info`
  - Method: `GET`

## Tips khi sử dụng Postman

1. **Tạo các environment variables:**
   - `base_url`: http://fams.io.vn
   - `token`: lưu token từ response khi login

2. **Tạo collections riêng** cho NodeJS API và Python API

3. **Sử dụng các biến trong requests:**
   - NodeJS API: `{{base_url}}/api/users`
   - Python API: `{{base_url}}/api-python/api/db/schedules`
   - Headers: `Authorization: Bearer {{token}}`

4. **Authentication Flow:**
   - Login qua NodeJS API để lấy token
   - Sử dụng token cho các request khác

## Lỗi thường gặp và cách khắc phục

1. **CORS Error**: Đã cấu hình CORS trong Nginx, các request từ Postman và browser đều được chấp nhận.

2. **401 Unauthorized**: Kiểm tra token đã hết hạn chưa, login lại để lấy token mới.

3. **404 Not Found**: Kiểm tra URL đúng theo định dạng:
   - NodeJS API: `/api/...` hoặc `/api-nodejs/...`
   - Python API: `/api-python/...`

4. **500 Internal Server Error**: Kiểm tra logs để biết thêm chi tiết:
   ```bash
   docker logs fams_api_nodejs
   docker logs fams_api_python
   ```

# API GUIDE - NodeJS Service

## Thông tin chung

- **Base URL:** `http://localhost:3000/api`
- **Authentication:** Sử dụng JWT Bearer Token
- **Headers:**
  - Authentication: `Authorization: Bearer <token>`
  - Content-Type: `application/json`

## Xác thực

### Đăng nhập

- **URL:** `/auth/login`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "token": "JWT_TOKEN",
    "refreshToken": "REFRESH_TOKEN",
    "user": {
      "id": "string",
      "name": "string",
      "role": "string",
      "email": "string"
    }
  }
  ```

### Refresh Token

- **URL:** `/auth/refresh`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "refreshToken": "REFRESH_TOKEN"
  }
  ```
- **Response:**
  ```json
  {
    "token": "NEW_JWT_TOKEN"
  }
  ```

## Quản lý người dùng

### Lấy danh sách người dùng

- **URL:** `/users`
- **Method:** `GET`
- **Query Parameters:**
  - `role` (optional): Lọc theo vai trò (Teacher, Student, Parent, Admin)
  - `page` (optional): Trang hiện tại (mặc định: 1)
  - `limit` (optional): Số lượng kết quả trên mỗi trang (mặc định: 10)
- **Response:**
  ```json
  {
    "users": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "string"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```

### Lấy thông tin người dùng

- **URL:** `/users/:id`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "profile": {
      // Thông tin chi tiết tùy theo vai trò
    }
  }
  ```

## Quản lý giáo viên

### Lấy danh sách giáo viên

- **URL:** `/teachers`
- **Method:** `GET`
- **Query Parameters:**
  - `department` (optional): Lọc theo phòng ban
  - `page` (optional): Trang hiện tại
  - `limit` (optional): Số lượng kết quả trên mỗi trang
- **Response:**
  ```json
  {
    "teachers": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "department": "string",
        "subjects": ["string"]
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```

### Thêm giáo viên mới

- **URL:** `/teachers`
- **Method:** `POST`
- **Permissions:** Admin
- **Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "department": "string",
    "subjects": ["string"],
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "department": "string"
  }
  ```

## Quản lý học sinh

### Lấy danh sách học sinh

- **URL:** `/students`
- **Method:** `GET`
- **Query Parameters:**
  - `class` (optional): Lọc theo lớp
  - `year` (optional): Lọc theo năm học
  - `page` (optional): Trang hiện tại
  - `limit` (optional): Số lượng kết quả trên mỗi trang
- **Response:**
  ```json
  {
    "students": [
      {
        "id": "string",
        "name": "string",
        "class": "string",
        "year": "string"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```

### Thêm học sinh mới

- **URL:** `/students`
- **Method:** `POST`
- **Permissions:** Admin
- **Body:**
  ```json
  {
    "name": "string",
    "dateOfBirth": "string (YYYY-MM-DD)",
    "class": "string",
    "year": "string"
  }
  ```
- **Response:**
  ```json
  {
    "id": "string",
    "name": "string",
    "class": "string",
    "year": "string"
  }
  ```

## Quản lý điểm danh

### Lấy điểm danh theo buổi học

- **URL:** `/attendance/:sessionId`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "session": {
      "id": "string",
      "date": "string",
      "class": "string",
      "subject": "string"
    },
    "attendances": [
      {
        "student": {
          "id": "string",
          "name": "string"
        },
        "status": "present|absent|late",
        "note": "string"
      }
    ]
  }
  ```

### Ghi nhận điểm danh

- **URL:** `/attendance/:sessionId`
- **Method:** `POST`
- **Permissions:** Teacher, Admin
- **Body:**
  ```json
  {
    "attendances": [
      {
        "studentId": "string",
        "status": "present|absent|late",
        "note": "string"
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Attendance recorded successfully"
  }
  ```

## Quản lý phòng học

### Lấy danh sách phòng học

- **URL:** `/classrooms`
- **Method:** `GET`
- **Response:**
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "capacity": "number",
      "building": "string",
      "floor": "number"
    }
  ]
  ```

### Thêm phòng học mới

- **URL:** `/classrooms`
- **Method:** `POST`
- **Permissions:** Admin
- **Body:**
  ```json
  {
    "name": "string",
    "capacity": "number",
    "building": "string",
    "floor": "number"
  }
  ```
- **Response:**
  ```json
  {
    "id": "string",
    "name": "string",
    "capacity": "number",
    "building": "string",
    "floor": "number"
  }
  ```

## Quản lý chương trình học

### Lấy danh sách chương trình học

- **URL:** `/curriculum`
- **Method:** `GET`
- **Response:**
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "year": "string",
      "description": "string"
    }
  ]
  ```

### Lấy môn học trong chương trình

- **URL:** `/curriculum/:id/subjects`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "curriculum": {
      "id": "string",
      "name": "string",
      "year": "string"
    },
    "subjects": [
      {
        "id": "string",
        "name": "string",
        "credits": "number",
        "hours": "number"
      }
    ]
  }
  ```

## Phụ huynh

### Lấy thông tin học sinh của phụ huynh

- **URL:** `/parents/:id/students`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "parent": {
      "id": "string",
      "name": "string"
    },
    "students": [
      {
        "id": "string",
        "name": "string",
        "class": "string"
      }
    ]
  }
  ``` 