# FAMS API - Faculty Academic Management System

Backend API cho hệ thống quản lý học sinh, giáo viên và lịch học

## Tính năng

- Xác thực người dùng (đăng nhập/đăng ký) với hỗ trợ đa phương thức (userId, email, backup_email)
- Quản lý học sinh, giáo viên, phụ huynh
- Quản lý lịch học và thời khóa biểu
- API RESTful với CORS được cấu hình để hoạt động với bất kỳ frontend nào
- API Testing Dashboard tích hợp

## Cài đặt và Chạy

### Cài đặt với Docker

1. Clone repository
2. Build và chạy container:

```
docker-compose up -d --build
```

### Cài đặt thủ công (không dùng Docker)

1. Clone repository
2. Cài đặt dependencies:

```
npm install
```

3. Tạo file .env với nội dung:

```
MONGO_URI=mongodb://localhost:27017/fams
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret
REFRESH_TOKEN_SECRET=your_secure_refresh_token_secret
JWT_EXPIRE=30d
REFRESH_TOKEN_EXPIRE=7d
```

4. Chạy server:

```
npm run dev
```

## API Endpoints

### Authentication

- **POST /api/auth/login** - Đăng nhập (hỗ trợ userId/email/backup_email)
- **POST /api/auth/register** - Đăng ký
- **GET /api/auth/me** - Lấy thông tin người dùng hiện tại
- **POST /api/auth/refresh-token** - Làm mới token

### Students

- **GET /api/students** - Lấy danh sách học sinh
- **GET /api/students/:id** - Lấy thông tin chi tiết học sinh
- **POST /api/students** - Tạo học sinh mới
- **PUT /api/students/:id** - Cập nhật thông tin học sinh
- **DELETE /api/students/:id** - Xóa học sinh

### Teachers

- **GET /api/teachers** - Lấy danh sách giáo viên
- **GET /api/teachers/:id** - Lấy thông tin chi tiết giáo viên
- **POST /api/teachers** - Tạo giáo viên mới
- **PUT /api/teachers/:id** - Cập nhật thông tin giáo viên
- **DELETE /api/teachers/:id** - Xóa giáo viên

### Parents

- **GET /api/parents** - Lấy danh sách phụ huynh
- **GET /api/parents/:id** - Lấy thông tin chi tiết phụ huynh
- **POST /api/parents** - Tạo phụ huynh mới
- **PUT /api/parents/:id** - Cập nhật thông tin phụ huynh
- **DELETE /api/parents/:id** - Xóa phụ huynh

### Schedules

- **GET /api/schedules** - Lấy danh sách lịch học
- **GET /api/schedules/:id** - Lấy thông tin chi tiết lịch học
- **POST /api/schedules** - Tạo lịch học mới
- **PUT /api/schedules/:id** - Cập nhật thông tin lịch học
- **DELETE /api/schedules/:id** - Xóa lịch học

## Tài liệu API

Truy cập `/api-test` sau khi chạy server để sử dụng trang tài liệu và test API tương tác.

## Kết nối từ Frontend

Nếu bạn đang phát triển frontend ở một domain khác, đảm bảo:

1. API Server đã được cấu hình CORS để chấp nhận domain của bạn
2. Frontend gửi token xác thực trong header Authorization dưới dạng Bearer:

```javascript
fetch('http://your-api-url/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## Khắc phục sự cố

### Lỗi kết nối MongoDB

Nếu bạn gặp lỗi kết nối MongoDB, hãy kiểm tra:
- URL MongoDB trong .env file
- MongoDB đang chạy và có thể truy cập được
- Network giữa API server và MongoDB server

### API không hoạt động với frontend

Kiểm tra:
- CORS đã được cấu hình đúng trong server.js
- Token xác thực đang được gửi đúng format
- Cú pháp Request và Response đúng với documentation 