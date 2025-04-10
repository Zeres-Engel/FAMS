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