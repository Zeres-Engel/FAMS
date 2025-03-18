# FAMS - Web Service

Phần web server của hệ thống FAMS (Face Attendance Management System).

## Tổng Quan

Web service cung cấp giao diện quản lý và API cho hệ thống điểm danh:
- Dashboard cho admin và giáo viên
- Quản lý thông tin học sinh, lớp học, giáo viên
- API cho Jetson Orin gửi dữ liệu điểm danh
- Báo cáo và thống kê

## Cài Đặt

### Yêu Cầu
- Python 3.8+
- MongoDB
- pip

### Cài Đặt Bằng Docker
```bash
# Clone repository
git clone [url-repository]

# Di chuyển vào thư mục
cd web

# Chạy với Docker
docker-compose up -d
```

### Cài Đặt Thủ Công
```bash
# Clone repository
git clone [url-repository]

# Di chuyển vào thư mục
cd web

# Cài đặt dependencies
pip install -r requirements.txt

# Thiết lập biến môi trường
cp .env.example .env
# Chỉnh sửa tệp .env với thông tin cấu hình của bạn

# Khởi tạo cơ sở dữ liệu
python manage.py migrate

# Khởi chạy ứng dụng
python manage.py runserver
```

## Cấu Trúc Dự Án
