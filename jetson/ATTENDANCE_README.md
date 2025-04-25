# Hướng dẫn sử dụng Hệ thống Điểm danh FAMS Jetson

Hệ thống điểm danh FAMS Jetson sử dụng công nghệ nhận diện khuôn mặt và thẻ RFID để tự động điểm danh và gửi dữ liệu lên server.

## Cài đặt

1. Cài đặt các thư viện cần thiết:
```bash
pip install requests opencv-python PySide6 numpy
```

2. Chuẩn bị thư mục dữ liệu:
```bash
mkdir -p data/check-in-images
```

## Cách sử dụng

### 1. Chạy ứng dụng điểm danh

```bash
python app.py --api-url http://fams.io.vn/api-nodejs --classroom-id 1
```

Tham số:
- `--api-url`: URL của API (mặc định: http://fams.io.vn/api-nodejs)
- `--classroom-id`: ID của phòng học (mặc định: 1)
- `--mode`: Chế độ hoạt động (attendance hoặc gui, mặc định: attendance)

### 2. Điểm danh bằng thẻ RFID

Khi chạy ở chế độ điểm danh:
1. Hệ thống sẽ mở camera và chờ thẻ RFID
2. Khi quét thẻ RFID, hệ thống sẽ:
   - Xác thực thẻ RFID với API
   - Chụp hình khuôn mặt
   - Gửi dữ liệu điểm danh lên server

### 3. Thử nghiệm mà không cần thiết bị RFID

Nếu bạn không có thiết bị RFID, bạn có thể giả lập bằng cách:
1. Tạo file `data/last_rfid.txt` 
2. Ghi mã RFID vào file (ví dụ: "RFID12345")
3. Hệ thống sẽ phát hiện file và xử lý như khi quét thẻ RFID thật

## Quy trình điểm danh

1. Hệ thống đọc mã RFID từ thẻ
2. Gửi mã RFID lên API để xác thực và lấy thông tin người dùng
3. Chụp hình khuôn mặt người dùng
4. Lưu hình ảnh vào thư mục `data/check-in-images/YYYY-MM-DD/`
5. Gửi dữ liệu điểm danh lên server bao gồm:
   - userId: ID của người dùng
   - rfidId: ID thẻ RFID
   - checkInTime: Thời gian điểm danh (chuẩn ISO)
   - classroomId: ID của phòng học
   - checkInFace: Đường dẫn tới ảnh chụp khuôn mặt

## API Endpoints

Hệ thống sử dụng các API endpoints sau:

1. Xác thực:
```
POST http://fams.io.vn/api-nodejs/auth/login
{
  "userId": "admin",
  "password": "1234"
}
```

2. Lấy thông tin người dùng từ thẻ RFID:
```
GET http://fams.io.vn/api-nodejs/rfid/{rfid_id}
```

3. Gửi dữ liệu điểm danh:
```
POST http://fams.io.vn/api-nodejs/attendance/jetson-check-in
{
  "userId": "user_id",
  "rfidId": "rfid_id",
  "checkInTime": "2023-12-01T08:05:30.000Z",
  "classroomId": 1,
  "checkInFace": "/check-in-images/2023-12-01/user_id_12345678.jpg"
}
```

## Xử lý lỗi

- Nếu không thể xác thực với API, kiểm tra kết nối mạng và thông tin đăng nhập
- Nếu camera không hoạt động, đảm bảo camera được kết nối đúng và không bị ứng dụng khác sử dụng
- Nếu không nhận diện được thẻ RFID, kiểm tra xem thiết bị RFID đã được kết nối đúng chưa 