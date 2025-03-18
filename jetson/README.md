# FAMS - Jetson Orin Service

Phần Jetson Orin của hệ thống FAMS (Face Attendance Management System).

## Tổng Quan

Jetson Orin service thực hiện các chức năng:
- Thu thập hình ảnh từ camera
- Phát hiện và nhận diện khuôn mặt học sinh
- Gửi dữ liệu điểm danh về server
- Lưu cache khi mất kết nối internet

## Cài Đặt

### Yêu Cầu
- Jetson Orin với JetPack 5.0+
- Python 3.8+
- Camera USB hoặc CSI

### Cài Đặt Bằng Docker
```bash
# Clone repository
git clone [url-repository]

# Di chuyển vào thư mục
cd jetson

# Chạy với Docker
docker-compose up -d
```

### Cài Đặt Thủ Công
```bash
# Clone repository
git clone [url-repository]

# Di chuyển vào thư mục
cd jetson

# Cài đặt dependencies
pip install -r requirements.txt

# Thiết lập biến môi trường
cp .env.example .env
# Chỉnh sửa tệp .env với thông tin cấu hình của bạn

# Khởi chạy ứng dụng
python app.py
```

## Cấu Trúc Dự Án
```