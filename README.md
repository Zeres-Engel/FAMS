# FAMS - Face Attendance Management System

Hệ thống điểm danh tự động FAMS sử dụng công nghệ nhận diện khuôn mặt trên nền tảng Jetson Orin, kết hợp với ứng dụng web để quản lý điểm danh cho trường học.

## Tổng Quan

Hệ thống bao gồm hai thành phần chính:
- **Jetson Orin**: Thiết bị gắn tại mỗi lớp học, thực hiện nhận diện khuôn mặt học sinh và gửi dữ liệu điểm danh về server.
- **Web Server**: Cung cấp giao diện quản lý cho giáo viên và admin, hiển thị thông tin điểm danh, thời khóa biểu và báo cáo.

## Kiến Trúc Hệ Thống

### Jetson Orin Service
- Xử lý hình ảnh từ camera
- Thực hiện nhận diện khuôn mặt
- Gửi dữ liệu điểm danh về server trung tâm
- Lưu cache dữ liệu khi mất kết nối

### Web Service
- Quản lý người dùng (Admin, Giáo viên)
- Quản lý thông tin học sinh
- Quản lý thời khóa biểu và lớp học
- Hiển thị báo cáo điểm danh
- API cho phép Jetson Orin gửi dữ liệu

## Cài Đặt

### Yêu Cầu Hệ Thống
- Jetson Orin với JetPack 5.0+
- Máy chủ web: Ubuntu 20.04+ hoặc tương đương
- Python 3.8+
- MongoDB
- Camera tương thích với Jetson Orin

### Cài Đặt Bằng Docker

#### Web Service
```bash
cd web
docker-compose up -d
```

#### Jetson Orin Service
```bash
cd jetson
docker-compose up -d
```

### Cài Đặt Thủ Công

#### Web Service
```bash
cd web
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Jetson Orin Service
```bash
cd jetson
pip install -r requirements.txt
python setup.py
python app.py
```

## Phân Quyền

### Admin
- Quản lý tài khoản giáo viên
- Quản lý thông tin trường, lớp
- Xem báo cáo toàn trường
- Cấu hình hệ thống

### Giáo Viên
- Xem điểm danh của lớp phụ trách
- Chỉnh sửa điểm danh thủ công nếu cần
- Quản lý thông tin học sinh
- Xem thời khóa biểu

## Công Nghệ Sử Dụng

### Jetson Orin
- Python
- OpenCV
- TensorFlow/PyTorch
- MQTT

### Web Service
- Python (Django/Flask)
- React/Vue.js
- MongoDB/PostgreSQL
- REST API/WebSocket

## Đóng Góp

Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết chi tiết về quy trình đóng góp.

## Giấy Phép

Dự án này được phân phối dưới giấy phép [MIT](LICENSE).
