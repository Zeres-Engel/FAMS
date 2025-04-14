# Hướng dẫn cấu trúc file Excel

Để import dữ liệu học sinh và giáo viên vào hệ thống FAMS, bạn cần tạo file Excel có cấu trúc sau:

## File Excel

Mỗi file Excel nên có 2 sheet:
1. Sheet đầu tiên: Dữ liệu học sinh
2. Sheet thứ hai: Dữ liệu giáo viên

### Sheet Học sinh

Cần có các cột sau:
- Họ và Tên: Tên đầy đủ của học sinh
- Ngày sinh: Định dạng DD/MM/YYYY
- Giới tính: "Nam" hoặc "Nữ"
- Địa chỉ: Địa chỉ của học sinh
- Số điện thoại: Số điện thoại của học sinh
- Tên Phụ huynh 1: Tên đầy đủ của phụ huynh thứ nhất
- Nghề nghiệp Phụ huynh 1: Nghề nghiệp của phụ huynh thứ nhất
- SĐT Phụ huynh 1: Số điện thoại của phụ huynh thứ nhất
- Giới tính Phụ huynh 1: "Nam" hoặc "Nữ"
- Tên Phụ huynh 2: Tên đầy đủ của phụ huynh thứ hai (nếu có)
- Nghề nghiệp Phụ huynh 2: Nghề nghiệp của phụ huynh thứ hai (nếu có) 
- SĐT Phụ huynh 2: Số điện thoại của phụ huynh thứ hai (nếu có)
- Giới tính Phụ huynh 2: "Nam" hoặc "Nữ" (nếu có)

### Sheet Giáo viên

Cần có các cột sau:
- Họ và Tên: Tên đầy đủ của giáo viên
- Số điện thoại: Số điện thoại của giáo viên
- Giới tính: "Nam" hoặc "Nữ"
- Ngày sinh: Định dạng YYYY/MM/DD
- Địa chỉ: Địa chỉ của giáo viên
- Môn giảng dạy: Các môn dạy, phân cách bằng dấu phẩy
- Số tiết/tuần: Số tiết giảng dạy tối đa mỗi tuần

## Tên file

Đặt tên file theo định dạng:
- `FAMS_10.xlsx`: Cho học sinh lớp 10
- `FAMS_11.xlsx`: Cho học sinh lớp 11
- `FAMS_12.xlsx`: Cho học sinh lớp 12

## API sử dụng

### 1. Upload file Excel
```
POST /api/db/upload/excel
```
Form data:
- `files`: File Excel cần upload (nhiều file)
- `grade`: Khối lớp (10, 11, 12) - tùy chọn

### 2. Khởi tạo từ file Excel đã upload
```
POST /api/db/init/excel
```
Query parameters:
- `grade`: Khối lớp (10, 11, 12) - tùy chọn

### 3. API Đơn giản (khởi tạo từ tất cả file Excel có sẵn)
```
POST /api/db/init2
```
Không cần tham số, tự động tìm và sử dụng tất cả file Excel có trong thư mục.

### 4. Upload và khởi tạo trong một bước
```
POST /api/db/upload-init
```
Form data:
- `file`: File Excel cần upload (chỉ một file)
- `grade`: Khối lớp (10, 11, 12) - tùy chọn

## Kiểm tra API
### Curl
```
curl -X POST http://localhost:3001/api/db/init2
```

### Postman
- Upload và khởi tạo: `POST http://localhost:3001/api/db/upload-init` với form-data: file=@FAMS_10.xlsx
