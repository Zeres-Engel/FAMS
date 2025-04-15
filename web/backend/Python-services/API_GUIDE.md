# API GUIDE - Python Service

## Thông tin chung

- **Base URL:** `http://fams.io.vn/api-python`
- **Content-Type:** `application/json`

## Quản lý cơ sở dữ liệu

### Khởi tạo dữ liệu

- **URL:** `/db/init`
- **Method:** `POST`
- **Response:**
  ```json
  {
    "data": {
      "initialized": true,
      "collections": ["string", "string"]
    },
    "message": "Database initialized successfully"
  }
  ```
- **Mô tả:** API này dùng để khởi tạo dữ liệu ban đầu cho hệ thống từ file Excel mẫu, chỉ nên sử dụng khi thiết lập hệ thống lần đầu.

### Khởi tạo dữ liệu cơ bản

- **URL:** `/db/initFAMS`
- **Method:** `POST`
- **Response:**
  ```json
  {
    "data": {
      "initialized": true
    },
    "message": "FAMS initialization started in background"
  }
  ```
- **Mô tả:** API này chỉ khởi tạo dữ liệu cơ bản, không bao gồm học sinh, giáo viên hoặc lịch học.

### Upload file Excel

- **URL:** `/db/upload/fams`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file`: File Excel (`.xlsx`)
- **Response:**
  ```json
  {
    "data": {
      "uploaded_file": "path/to/file.xlsx",
      "user_data": [
        {
          "name": "string",
          "dob": "string",
          "gender": "string",
          "address": "string",
          "phone": "string",
          "role": "string"
        }
      ]
    },
    "message": "File uploaded successfully as FAMS.xlsx and user data extracted"
  }
  ```
- **Mô tả:** API này dùng để upload file Excel chứa dữ liệu học sinh và giáo viên.

### Import người dùng

- **URL:** `/db/import/users`
- **Method:** `POST`
- **Query Parameters:**
  - `batchYear`: Năm bắt đầu của khóa học (ví dụ: 2024 cho khóa 2024-2027)
- **Response:**
  ```json
  {
    "data": {
      "batch_year": 2024,
      "batch_name": "Khóa 2024-2027 (Lớp 10)",
      "grade": 10,
      "file_path": "string"
    },
    "message": "Users import started for batch 2024-2027 (Grade 10)"
  }
  ```
- **Mô tả:** API này import dữ liệu người dùng từ file Excel đã upload, tạo lớp học, phân bổ học sinh và tạo học kỳ.

### Chuyển lớp học sinh

- **URL:** `/db/promote/students`
- **Method:** `POST` 
- **Query Parameters:**
  - `retained_students` (optional): Danh sách ID học sinh không được lên lớp
- **Response:**
  ```json
  {
    "data": {
      "retained_students": ["string"]
    },
    "message": "Student promotion process started in background"
  }
  ```
- **Mô tả:** API này chuyển học sinh lên lớp cao hơn, có thể chỉ định học sinh ở lại lớp.

### Chấm dứt hợp đồng giáo viên

- **URL:** `/db/teacher/expire-contract`
- **Method:** `POST`
- **Query Parameters:**
  - `teacherIds`: Danh sách ID giáo viên cần chấm dứt hợp đồng
- **Response:**
  ```json
  {
    "data": {
      "expired_teachers": ["string"]
    },
    "message": "Teacher contract expiration process started in background"
  }
  ```
- **Mô tả:** API này xóa thông tin giáo viên hết hợp đồng và cập nhật lịch học.

## Lịch học (Scheduling)

### Tạo lịch học

- **URL:** `/db/scheduling`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "academic_year": "2024-2025"
  }
  ```
- **Response:**
  ```json
  {
    "data": {
      "task_started": true,
      "academic_year": "2024-2025"
    },
    "message": "Schedule generation started in background. Check logs for progress."
  }
  ```
- **Mô tả:** API này khởi tạo quá trình tạo lịch học cho năm học được chỉ định. Quá trình này chạy trong background và có thể mất vài phút.

### Lấy lịch học

- **URL:** `/db/schedules`
- **Method:** `GET`
- **Query Parameters:**
  - `semester_id` (optional): ID của học kỳ
  - `class_id` (optional): ID của lớp học
  - `teacher_id` (optional): ID của giáo viên
  - `subject_id` (optional): ID của môn học
  - `date_from` (optional): Ngày bắt đầu (format: YYYY-MM-DD)
  - `date_to` (optional): Ngày kết thúc (format: YYYY-MM-DD)
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "string",
        "semester": {
          "id": "string",
          "name": "string"
        },
        "class": {
          "id": "string",
          "name": "string"
        },
        "subject": {
          "id": "string",
          "name": "string"
        },
        "teacher": {
          "id": "string",
          "name": "string"
        },
        "classroom": {
          "id": "string",
          "name": "string"
        },
        "day_of_week": "number",
        "period": "number",
        "start_time": "string",
        "end_time": "string"
      }
    ],
    "message": "Schedules retrieved successfully"
  }
  ```

## Thông tin hệ thống

### Kiểm tra kết nối

- **URL:** `/health`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "string",
    "version": "string",
    "database": "connected|disconnected"
  }
  ```

### Thông tin API

- **URL:** `/`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "api": "FAMS API",
    "version": "1.0.0",
    "documentation": "/docs"
  }
  ```

## API Documentation

FastAPI tự động tạo API documentation tại các URL sau:

- **Swagger UI:** `/docs`
- **ReDoc:** `/redoc`

Bạn có thể truy cập `http://fams.io.vn/api-python/docs` để xem tài liệu API đầy đủ với các schema và endpoint. 