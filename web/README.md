# Student Management System

Hệ thống quản lý học sinh sinh viên với các tính năng:
- Đăng nhập / Xác thực người dùng
- Quản lý thông tin học sinh
- Import sinh viên từ file CSV

## Cấu trúc dự án

```
project/
├── backend/           # Server Node.js với Express và MongoDB
├── frontend/          # Client React
├── database/          # Cấu hình và models MongoDB
└── README.md          # Tài liệu dự án
```

## Yêu cầu

- Node.js (>= 14.x) và npm hoặc Docker
- MongoDB (nếu không sử dụng Docker)

## Cài đặt và chạy bằng Docker (Khuyên dùng)

1. Cài đặt Docker và Docker Compose:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - [Docker Compose](https://docs.docker.com/compose/install/)

2. Clone dự án:
```
git clone <repository-url>
```

3. Chạy ứng dụng với Docker Compose:
```
docker-compose up
```

4. Truy cập ứng dụng:
```
Frontend: http://localhost:3001
Backend API: http://localhost:3000
```

### Lợi ích khi sử dụng Docker:
- Tự động hot-reload khi code thay đổi, không cần khởi động lại container
- Môi trường đồng nhất trên mọi máy tính
- Đã bao gồm MongoDB, không cần cài đặt riêng

### Các lệnh Docker hữu ích:
- Khởi động ứng dụng ở background: `docker-compose up -d`
- Xem logs: `docker-compose logs -f`
- Dừng ứng dụng: `docker-compose down`
- Xóa volumes (reset database): `docker-compose down -v`
- Rebuild containers: `docker-compose up --build`

## Cài đặt thủ công (không sử dụng Docker)

1. Cài đặt MongoDB và đảm bảo nó đang chạy.

2. Cài đặt dependencies cho backend:
```
cd backend
npm install
```

3. Cài đặt dependencies cho frontend:
```
cd frontend
npm install
```

4. Tạo file .env trong thư mục gốc dự án với nội dung:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/studentManagement
JWT_SECRET=your_secret_key
```

5. Khởi động backend:
```
cd backend
npm run dev
```

6. Khởi động frontend trong terminal khác:
```
cd frontend
npm start
```

7. Truy cập ứng dụng:
```
Frontend: http://localhost:3000
Backend API: http://localhost:3000/api
```

## Tài khoản mặc định

Sau khi chạy ứng dụng lần đầu, bạn có thể tạo tài khoản admin bằng cách gọi API:
```
POST /api/auth/register
Body: {
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

## API Endpoints

### Xác thực:
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập và nhận token
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại (yêu cầu xác thực)

### Quản lý sinh viên:
- `GET /api/students` - Lấy danh sách sinh viên
- `GET /api/students/:id` - Lấy thông tin chi tiết sinh viên
- `POST /api/students` - Tạo sinh viên mới (yêu cầu quyền admin)
- `PUT /api/students/:id` - Cập nhật thông tin sinh viên (yêu cầu quyền admin)
- `DELETE /api/students/:id` - Xóa sinh viên (yêu cầu quyền admin)
- `POST /api/students/import` - Import sinh viên từ file CSV (yêu cầu quyền admin)

## Định dạng CSV

File CSV import cần có các trường sau:
```
studentId,firstName,lastName,email,dateOfBirth,gender,contactNumber,address,classGroup,major,enrollmentDate,status
```

Ví dụ:
```
studentId,firstName,lastName,email,dateOfBirth,gender,contactNumber,address,classGroup,major,enrollmentDate,status
SV001,Nguyen,Van A,vana@example.com,2000-01-01,male,0123456789,Ha Noi,Class A,Computer Science,2022-01-01,active
SV002,Tran,Thi B,thib@example.com,2001-02-02,female,0123456788,Ho Chi Minh,Class B,Business,2022-01-02,active
``` 