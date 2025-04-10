# API GUIDE - Python Service

## Thông tin chung

- **Base URL:** `http://localhost:5000`
- **Content-Type:** `application/json`

## Lịch học (Scheduling)

### Tạo lịch học

- **URL:** `/api/db/scheduling`
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
- **Mô tả:** API này sẽ khởi tạo quá trình tạo lịch học cho năm học được chỉ định. Quá trình này sẽ chạy trong background và có thể mất vài phút để hoàn thành.

### Lấy lịch học

- **URL:** `/api/db/schedules`
- **Method:** `GET`
- **Query Parameters:**
  - `semester_id`: ID của học kỳ (optional)
  - `class_id`: ID của lớp học (optional)
  - `teacher_id`: ID của giáo viên (optional)
  - `subject_id`: ID của môn học (optional)
  - `date_from`: Ngày bắt đầu (format: YYYY-MM-DD, optional)
  - `date_to`: Ngày kết thúc (format: YYYY-MM-DD, optional)
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

## Quản lý cơ sở dữ liệu

### Khởi tạo dữ liệu

- **URL:** `/api/db/init`
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
- **Mô tả:** API này dùng để khởi tạo dữ liệu ban đầu cho hệ thống, chỉ nên sử dụng khi thiết lập hệ thống lần đầu.

### Thông tin cơ sở dữ liệu

- **URL:** `/api/db/info`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "data": {
      "database": "string",
      "collections": [
        {
          "name": "string",
          "count": "number"
        }
      ],
      "status": "connected|disconnected"
    },
    "message": "Database information retrieved successfully"
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

Bạn có thể truy cập `http://localhost:5000/docs` để xem tài liệu API đầy đủ với các schema và endpoint. 