# Hướng dẫn sử dụng API FAMS

## Mục lục
1. [Xác thực (Authentication)](#xác-thực)
2. [Lịch học (Schedule)](#lịch-học)
3. [Cấu trúc dữ liệu](#cấu-trúc-dữ-liệu)
4. [Xử lý lỗi](#xử-lý-lỗi)

## Xác thực

### Đăng nhập
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "userId": "string",  // hoặc
  "email": "string",   // một trong hai
  "password": "string"
}
```

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "name": "string",
    "role": "string",  // "Admin", "Teacher", "Student", "Parent"
    "userId": "string"
  }
}
```

**Response thất bại:**
```json
{
  "success": false,
  "message": "string"
}
```

## Lịch học

### 1. Lấy lịch học của người dùng hiện tại
```http
GET /api/schedules/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "user": {
      "studentId": "string",  // nếu là học sinh
      "fullName": "string",
      "classId": "string",    // nếu là học sinh
      "userId": "string"
    },
    "role": "string",
    "schedules": [
      {
        "subjectId": "string",
        "subjectName": "string",
        "teacherId": "string",
        "teacherName": "string",
        "classroomId": "string",
        "classroomNumber": "string",
        "classId": "string",
        "className": "string",
        "slotId": "number",
        "startTime": "string",
        "endTime": "string",
        "topic": "string",
        "sessionDate": "string",
        "dayOfWeek": "string"
      }
    ],
    "semester": {
      "semesterId": "string",
      "semesterName": "string",
      "startDate": "string",
      "endDate": "string"
    }
  }
}
```

### 2. Lấy lịch học theo ngày
```http
GET /api/schedules/daily/:date
```

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `date`: Định dạng YYYY-MM-DD hoặc "today"/"tomorrow"

### 3. Lấy lịch học theo tuần
```http
GET /api/schedules/weekly
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `week`: Số tuần (optional)
- `semesterId`: ID học kỳ (optional)

### 4. Lấy lịch học theo học kỳ
```http
GET /api/schedules/semester/:semesterId
```

**Headers:**
```
Authorization: Bearer <token>
```

### 5. Lấy lịch học của học sinh (cho phụ huynh)
```http
GET /api/schedules/me?studentId=:studentId
```

**Headers:**
```
Authorization: Bearer <token>
```

## Cấu trúc dữ liệu

### Schedule Object
```typescript
interface Schedule {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classroomId: string;
  classroomNumber: string;
  classId: string;
  className: string;
  slotId: number;
  startTime: string;
  endTime: string;
  topic: string;
  sessionDate: string;
  dayOfWeek: string;
}
```

### Semester Object
```typescript
interface Semester {
  semesterId: string;
  semesterName: string;
  startDate: string;
  endDate: string;
}
```

## Xử lý lỗi

Tất cả các API đều trả về response với cấu trúc thống nhất:

**Response thành công:**
```json
{
  "success": true,
  "data": {}
}
```

**Response thất bại:**
```json
{
  "success": false,
  "message": "string",
  "code": "string"  // Mã lỗi (nếu có)
}
```

### Các mã lỗi thường gặp:
- `STUDENT_NOT_FOUND`: Không tìm thấy thông tin học sinh
- `NO_CLASS_ASSIGNED`: Học sinh chưa được phân lớp
- `PARENT_NOT_FOUND`: Không tìm thấy thông tin phụ huynh
- `NO_STUDENTS_LINKED`: Phụ huynh chưa liên kết với học sinh nào
- `UNAUTHORIZED_STUDENT_ACCESS`: Phụ huynh không có quyền xem lịch học của học sinh này
- `ACCESS_DENIED`: Không có quyền truy cập API
- `SERVER_ERROR`: Lỗi hệ thống

## Lưu ý quan trọng

1. Tất cả các API (trừ login) đều yêu cầu token xác thực trong header
2. Token phải được gửi theo format: `Bearer <token>`
3. Các API lịch học sẽ tự động trả về lịch phù hợp với vai trò của người dùng
4. Phụ huynh có thể xem lịch học của con bằng cách thêm `studentId` vào query parameter
5. Các ngày tháng được trả về theo định dạng ISO string
6. Nên xử lý các trường hợp lỗi và hiển thị thông báo phù hợp cho người dùng 