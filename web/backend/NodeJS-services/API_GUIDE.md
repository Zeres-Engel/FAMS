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

### Announcement API
Base path: `/announcements`
- `GET /` - Lấy tất cả thông báo chung (với phân trang)
- `GET /:id` - Lấy chi tiết một thông báo chung
- `POST /` - Tạo thông báo chung mới (Admin, Teacher)
- `PUT /:id` - Cập nhật thông báo chung (Admin, Teacher)
- `DELETE /:id` - Xóa thông báo chung (Admin)
- `POST /send-all` - Gửi thông báo cho tất cả người dùng (Admin)
- `POST /send-teachers` - Gửi thông báo cho tất cả giáo viên (Admin)
- `POST /send-students` - Gửi thông báo cho tất cả học sinh (Admin, Teacher)

### Notification API
Base path: `/notifications`
- `GET /my-notifications` - Lấy tất cả thông báo của người dùng hiện tại
- `GET /:id` - Lấy chi tiết một thông báo
- `POST /` - Tạo thông báo mới
- `PATCH /:id/mark-as-read` - Đánh dấu thông báo đã đọc
- `PATCH /mark-all-as-read` - Đánh dấu tất cả thông báo đã đọc
- `DELETE /:id` - Xóa thông báo
- `POST /send-all-students` - Gửi thông báo cho tất cả học sinh (Admin, Teacher)
- `POST /send-all-teachers` - Gửi thông báo cho tất cả giáo viên (Admin)
- `POST /send-all-admins` - Gửi thông báo cho tất cả admin (Admin)
- `POST /send-all-parents` - Gửi thông báo cho tất cả phụ huynh (Admin, Teacher)
- `POST /send-to-user` - Gửi thông báo cho một người dùng cụ thể (Admin, Teacher)
- `POST /send-to-class` - Gửi thông báo cho tất cả học sinh của một lớp (Admin, Teacher)

### Database API
Base path: `/database`
- Check Database Status

## Chi tiết API Thông báo (Announcement & Notification)

### 1. Announcement API

#### 1.1 Lấy tất cả thông báo chung
```
GET /api/announcements
```

**Mô tả:** Trả về danh sách tất cả thông báo chung với phân trang

**Tham số query:**
- `page` (optional): Số trang hiện tại (mặc định: 1)
- `limit` (optional): Số lượng thông báo mỗi trang (mặc định: 10)

**Phản hồi:**
```json
{
  "success": true,
  "data": {
    "totalItems": 25,
    "totalPages": 3,
    "currentPage": 1,
    "announcements": [
      {
        "AnnouncementID": 1,
        "UserID": "admin123",
        "Title": "Thông báo mới",
        "Content": "Nội dung thông báo...",
        "TargetAudience": "All",
        "CreatedAt": "2023-08-20T10:15:30.000Z",
        "IsActive": true,
        "creator": {
          "UserID": "admin123",
          "Avatar": "/avatars/admin123.jpg"
        }
      },
      // ... các thông báo khác
    ]
  }
}
```

#### 1.2 Tạo thông báo chung mới
```
POST /api/announcements
```

**Quyền hạn:** Admin, Teacher

**Request body:**
```json
{
  "content": "Nội dung thông báo...",
  "title": "Tiêu đề thông báo (tùy chọn)"
}
```

**Phản hồi:**
```json
{
  "success": true,
  "message": "Đã tạo thông báo chung thành công",
  "data": {
    "AnnouncementID": 26,
    "UserID": "teacher456",
    "Title": "Tiêu đề thông báo",
    "Content": "Nội dung thông báo...",
    "TargetAudience": "All",
    "CreatedAt": "2023-08-22T14:30:00.000Z",
    "IsActive": true,
    "creator": {
      "UserID": "teacher456",
      "Avatar": "/avatars/teacher456.jpg"
    }
  }
}
```

#### 1.3 Gửi thông báo cho tất cả học sinh
```
POST /api/announcements/send-students
```

**Quyền hạn:** Admin, Teacher

**Request body:**
```json
{
  "content": "Nội dung thông báo cho học sinh...",
  "title": "Tiêu đề thông báo (tùy chọn)"
}
```

**Phản hồi:**
```json
{
  "success": true,
  "message": "Đã tạo thông báo cho tất cả học sinh thành công",
  "data": {
    "AnnouncementID": 27,
    "UserID": "admin123",
    "Title": "Tiêu đề thông báo",
    "Content": "Nội dung thông báo cho học sinh...",
    "TargetAudience": "Student",
    "CreatedAt": "2023-08-22T14:35:00.000Z",
    "IsActive": true
  }
}
```

### 2. Notification API

#### 2.1 Lấy thông báo của người dùng hiện tại
```
GET /api/notifications/my-notifications
```

**Mô tả:** Trả về danh sách thông báo của người dùng đang đăng nhập

**Tham số query:**
- `page` (optional): Số trang hiện tại (mặc định: 1)
- `limit` (optional): Số lượng thông báo mỗi trang (mặc định: 10)
- `unreadOnly` (optional): Chỉ lấy thông báo chưa đọc (mặc định: false)

**Phản hồi:**
```json
{
  "success": true,
  "data": {
    "totalItems": 15,
    "totalPages": 2,
    "currentPage": 1,
    "notifications": [
      {
        "NotificationID": 50,
        "SenderID": "admin123",
        "ReceiverID": "student789",
        "Message": "Nội dung thông báo...",
        "Title": "Thông báo mới",
        "SentDate": "2023-08-22T14:40:00.000Z",
        "ReadStatus": false,
        "IsActive": true,
        "sender": {
          "UserID": "admin123",
          "Avatar": "/avatars/admin123.jpg"
        }
      },
      // ... các thông báo khác
    ],
    "unreadCount": 5
  }
}
```

#### 2.2 Đánh dấu thông báo đã đọc
```
PATCH /api/notifications/:id/mark-as-read
```

**Mô tả:** Đánh dấu một thông báo cụ thể là đã đọc

**Tham số đường dẫn:**
- `id`: ID của thông báo cần đánh dấu đã đọc

**Phản hồi:**
```json
{
  "success": true,
  "message": "Đã đánh dấu thông báo là đã đọc"
}
```

#### 2.3 Gửi thông báo cho tất cả học sinh của một lớp
```
POST /api/notifications/send-to-class
```

**Quyền hạn:** Admin, Teacher

**Request body:**
```json
{
  "message": "Nội dung thông báo...",
  "title": "Tiêu đề thông báo (tùy chọn)",
  "classId": 5
}
```

**Phản hồi:**
```json
{
  "success": true,
  "message": "Đã tạo 32 thông báo thành công",
  "data": {
    "classId": 5,
    "className": "10A5",
    "studentCount": 32
  }
}
```

#### 2.4 Gửi thông báo cho một người dùng cụ thể
```
POST /api/notifications/send-to-user
```

**Quyền hạn:** Admin, Teacher

**Request body:**
```json
{
  "message": "Nội dung thông báo...",
  "title": "Tiêu đề thông báo (tùy chọn)",
  "userId": "student789"
}
```

**Phản hồi:**
```json
{
  "success": true,
  "message": "Đã gửi thông báo thành công",
  "data": {
    "recipient": "student789",
    "notification": {
      "message": "Nội dung thông báo...",
      "title": "Tiêu đề thông báo"
    }
  }
}
```

## Ví dụ tích hợp với AI khác

### Sử dụng AI để tạo nội dung thông báo
Bạn có thể sử dụng các AI như ChatGPT hoặc Claude để tạo nội dung thông báo phù hợp. Ví dụ:

```javascript
// Mẫu yêu cầu cho AI
const aiPrompt = `Viết thông báo cho học sinh lớp 10A về lịch thi học kỳ sắp tới. Ngày thi: 20/11/2023. Môn thi: Toán, Văn, Anh.`;

// Nhận phản hồi từ AI và sử dụng để tạo thông báo
const aiResponse = "Thông báo lịch thi học kỳ 1\n\nKính gửi các em học sinh lớp 10A,\n\nNhà trường thông báo lịch thi học kỳ 1 như sau:\nNgày thi: 20/11/2023\nCác môn thi: Toán, Văn, Anh\n\nĐề nghị các em chuẩn bị và ôn tập thật tốt.\n\nBan giám hiệu.";

// Gửi thông báo tới lớp 10A
fetch('http://fams.io.vn/api-nodejs/notifications/send-to-class', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    message: aiResponse,
    title: "Thông báo lịch thi học kỳ 1",
    classId: 15  // ID của lớp 10A
  })
});
```

### Sử dụng AI để phân tích phản hồi thông báo
Bạn có thể sử dụng API để lấy dữ liệu về các thông báo đã được đọc, sau đó sử dụng AI để phân tích:

```javascript
// Lấy dữ liệu thông báo
fetch('http://fams.io.vn/api-nodejs/notifications/stats', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(response => response.json())
.then(data => {
  // Đưa dữ liệu vào AI để phân tích
  const aiAnalysisPrompt = `Phân tích dữ liệu thông báo sau: ${JSON.stringify(data)}. Cho biết tỷ lệ đọc thông báo và đề xuất cách cải thiện.`;
  
  // Tiếp tục xử lý với AI...
});
```

## See Detailed Documentation

For detailed documentation including request/response formats for each endpoint, refer to the relevant sections below.

[The rest of the original API documentation with detailed endpoint information...]