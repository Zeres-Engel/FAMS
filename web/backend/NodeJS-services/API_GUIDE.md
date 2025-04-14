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

### Auth API
Base path: `/auth`

#### Login
- **URL**: `http://fams.io.vn/api-nodejs/auth/login`
- **Method**: `POST`
- **Body**:
```json
{
  "userId": "username",  // Can also use "email" or "backup_email"
  "password": "yourpassword"
}
```
- **Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    // User details
  }
}
```

#### Register
- **URL**: `http://fams.io.vn/api-nodejs/auth/register`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "Full Name",
  "email": "email@example.com",
  "password": "password",
  "role": "student" // Or "teacher", "parent", "admin"
}
```

#### Get Current User
- **URL**: `http://fams.io.vn/api-nodejs/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes

#### Refresh Token
- **URL**: `http://fams.io.vn/api-nodejs/auth/refresh-token`
- **Method**: `POST`
- **Auth Required**: No (uses refresh token instead of access token)
- **Body**:
```json
{
  "refreshToken": "your_refresh_token_here"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token_here",
    "refreshToken": "new_refresh_token_here"
  },
  "code": "TOKEN_REFRESHED"
}
```
- **Error Responses**:
  - `401` - Missing refresh token:
    ```json
    {
      "success": false,
      "message": "No refresh token provided",
      "code": "MISSING_REFRESH_TOKEN"
    }
    ```
  - `401` - Invalid refresh token:
    ```json
    {
      "success": false,
      "message": "Invalid refresh token",
      "code": "INVALID_REFRESH_TOKEN"
    }
    ```
  - `401` - Expired refresh token:
    ```json
    {
      "success": false,
      "message": "Refresh token has expired, please log in again",
      "code": "REFRESH_TOKEN_EXPIRED"
    }
    ```
  - `401` - User not found:
    ```json
    {
      "success": false,
      "message": "User not found for this token",
      "code": "USER_NOT_FOUND"
    }
    ```

**Lưu ý về Token:**
- Access token thường có thời hạn ngắn (mặc định: 2 giờ)
- Refresh token có thời hạn dài hơn (mặc định: 2 ngày)
- Khi access token hết hạn, sử dụng refresh token để lấy cặp token mới
- Lưu trữ token an toàn ở phía client (HttpOnly cookies hoặc secure storage)
- **Quy trình làm việc với token**:
  1. Đăng nhập để nhận cặp access token và refresh token
  2. Sử dụng access token cho các yêu cầu API
  3. Khi nhận lỗi `TOKEN_EXPIRED`, gọi API refresh token để lấy cặp token mới
  4. Nếu refresh token cũng hết hạn, yêu cầu người dùng đăng nhập lại

### Student API
Base path: `/students`

#### Get All Students
- **URL**: `http://fams.io.vn/api-nodejs/students`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search term (tìm kiếm theo ID, tên, email, etc.)
  - `classId`: Lọc theo ID của lớp
  - `className`: Lọc theo tên lớp (ví dụ: "10A1")
  - `batchId`: Lọc theo ID của khóa học
  - `batchYear`: Lọc theo năm của khóa (ví dụ: "2023-2026" tương ứng với batchId=3)
  - **Chú ý**: Bạn có thể filter theo bất kỳ trường nào trong model Student (firstName, lastName, email, v.v.)
- **Response**: Danh sách học sinh với thông tin bổ sung:
  ```json
  {
    "success": true,
    "data": [
      {
        "studentId": "1",
        "firstName": "Nam",
        "lastName": "Ngô Ngọc",
        // ... other student fields
        "classId": 2,
        "className": "10A2", // Thông tin về lớp
        "batchId": 3,
        "batchName": "Khóa 2023-2026 (Lớp 10)", // Tên khóa
        "batchYear": "2023-2026" // Năm học
      }
    ],
    "count": 1,
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
  ```

#### Filter Students by Class and Batch
Hệ thống hỗ trợ hai cách để lọc học sinh theo lớp:
1. Sử dụng `classId`: Truy vấn trực tiếp theo ID của lớp
   ```
   http://fams.io.vn/api-nodejs/students?classId=1
   ```

2. Sử dụng `className`: Hệ thống sẽ tự động tìm kiếm classId tương ứng với tên lớp
   ```
   http://fams.io.vn/api-nodejs/students?className=10A1
   ```

Tương tự, để lọc theo khóa học, có hai cách:
1. Sử dụng `batchId`: Truy vấn trực tiếp theo ID của khóa
   ```
   http://fams.io.vn/api-nodejs/students?batchId=3
   ```

2. Sử dụng `batchYear`: Cung cấp năm bắt đầu và kết thúc, hệ thống sẽ tự động chuyển đổi thành batchId
   ```
   http://fams.io.vn/api-nodejs/students?batchYear=2023-2026
   ```

Các quy tắc áp dụng cho batchYear:
- "2021-2024" tương ứng với batchId=1
- "2022-2025" tương ứng với batchId=2
- "2023-2026" tương ứng với batchId=3
- v.v.

#### Advanced Filtering
1. **Filter theo bất kỳ trường nào**: Thêm tên trường và giá trị vào query string
   ```
   http://fams.io.vn/api-nodejs/students?firstName=Nam&gender=Male
   ```

2. **Bỏ qua filter với giá trị "none"**: Nếu một tham số có giá trị là "none", hệ thống sẽ bỏ qua filter này
   ```
   http://fams.io.vn/api-nodejs/students?classId=1&batchId=none
   ```
   Ví dụ này sẽ chỉ lọc theo classId mà không lọc theo batchId.

3. **Kết hợp nhiều filter**: Các filter có thể kết hợp với nhau
   ```
   http://fams.io.vn/api-nodejs/students?className=10A1&batchYear=2023-2026&isActive=true&page=1&limit=20
   ```

#### Get Student by ID
- **URL**: `http://fams.io.vn/api-nodejs/students/:id`
- **Method**: `GET`
- **Auth Required**: Yes

#### Create Student
- **URL**: `http://fams.io.vn/api-nodejs/students`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**: Student information (name, email, etc.)

#### Update Student
- **URL**: `http://fams.io.vn/api-nodejs/students/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Admin only)
- **Body**:
```json
{
  "firstName": "Thành",
  "lastName": "Nguyễn Văn",
  "phone": "0987654321",
  "address": "456 Đường XYZ, Quận 2, TP.HCM",
  "classId": 2,
  // Other fields to update
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "studentId": "7",
    "firstName": "Thành",
    "lastName": "Nguyễn Văn",
    "fullName": "Thành Nguyễn Văn",
    "email": "thanhnvst@fams.edu.vn",
    "phone": "0987654321",
    "userId": "thanhnvst",
    "classId": 2,
    // Other student fields
  }
}
```
- **Error Responses**:
  - `404` - Student not found:
    ```json
    {
      "success": false,
      "error": "Student not found or update failed",
      "code": "UPDATE_FAILED"
    }
    ```

#### Delete Student
- **URL**: `http://fams.io.vn/api-nodejs/students/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes

### User API
Base path: `/users`

#### Get All Users (with filtering)
- **URL**: `http://fams.io.vn/api-nodejs/users`
- **Method**: `GET`
- **Auth Required**: Yes (Admin only)
- **Query Parameters**:
  - `page`: Số trang (mặc định: 1)
  - `limit`: Số lượng kết quả mỗi trang (mặc định: 10)
  - `search`: Tìm kiếm theo userId, email, username
  - `className`: Lọc theo tên lớp (áp dụng cho học sinh và giáo viên liên quan đến lớp)
  - `roles`: Lọc theo nhiều vai trò, phân cách bằng dấu phẩy (VD: teacher,admin)
  - `phone`: Lọc theo số điện thoại
  - `grade`: Lọc theo khối lớp (10, 11, 12)
  - Có thể filter theo bất kỳ trường nào trong model User (userId, email, v.v.)

**Ví dụ Filter:**
1. **Lọc theo vai trò**:
   ```
   http://fams.io.vn/api-nodejs/users?roles=teacher
   ```

2. **Lọc theo nhiều vai trò**:
   ```
   http://fams.io.vn/api-nodejs/users?roles=teacher,student
   ```

3. **Lọc theo lớp học**:
   ```
   http://fams.io.vn/api-nodejs/users?className=10A1
   ```
   Lọc này sẽ trả về cả giáo viên dạy lớp 10A1 và học sinh trong lớp 10A1.

4. **Lọc theo khối lớp**:
   ```
   http://fams.io.vn/api-nodejs/users?grade=10
   ```
   Lọc này sẽ trả về tất cả giáo viên dạy và học sinh học khối 10.

5. **Lọc theo số điện thoại**:
   ```
   http://fams.io.vn/api-nodejs/users?phone=0987
   ```
   Lọc này sẽ tìm kiếm số điện thoại có chứa "0987".

6. **Tìm kiếm theo từ khóa**:
   ```
   http://fams.io.vn/api-nodejs/users?search=nguyen
   ```

7. **Kết hợp nhiều điều kiện lọc**:
   ```
   http://fams.io.vn/api-nodejs/users?roles=teacher&grade=11&phone=0987
   ```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "tuanpv5",
      "username": "tuanpv5",
      "email": "tuanpv5@fams.edu.vn",
      "role": "teacher",
      "details": {
        "teacherId": "5",
        "firstName": "Tuấn",
        "lastName": "Phạm Văn",
        "fullName": "Tuấn Phạm Văn",
        "phone": "0987950528",
        "major": "Toán học",
        "grades": ["10", "11"]
      }
    },
    {
      "userId": "anhdmst37",
      "username": "anhdmst37",
      "email": "anhdmst37@fams.edu.vn",
      "role": "student",
      "details": {
        "studentId": "7",
        "firstName": "Ánh",
        "lastName": "Dương Minh",
        "fullName": "Ánh Dương Minh",
        "phone": "984236917",
        "dateOfBirth": "2006-12-19T00:00:00.000Z",
        "address": "Yên Bái",
        "classId": 3,
        "batchId": 3,
        "className": "10A3",
        "grade": "10"
      }
    }
  ],
  "count": 2,
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

#### Get User by ID
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `GET`
- **Auth Required**: Yes

#### Create User
- **URL**: `http://fams.io.vn/api-nodejs/users/create`
- **Method**: `POST`
- **Auth Required**: Yes (Admin only)
- **Body**: Tùy thuộc vào loại người dùng cần tạo

##### Tạo Học Sinh (Student)
```json
{
  "role": "student",
  "firstName": "Thành",
  "lastName": "Nguyễn Phước",
  "email": "thanhnpst@fams.edu.vn",
  "backup_email": "thanhnp@gmail.com",
  "phone": "0987654321",
  "gender": "Male",
  "dateOfBirth": "2005-05-15",
  "address": "123 Đường ABC, Thành phố XYZ",
  "batchYear": "2022-2025",
  "parentNames": ["Nguyễn Phước Hải", "Trần Thị Mai"],
  "parentCareers": ["Kỹ sư", "Giáo viên"],
  "parentPhones": ["0123456789", "0987123456"],
  "parentGenders": [true, false]
}
```

##### Tạo Giáo Viên (Teacher)
```json
{
  "role": "teacher",
  "firstName": "Tuấn",
  "lastName": "Hoàng Đức",
  "email": "tuanhd@fams.edu.vn",
  "backup_email": "tuanhoang@gmail.com",
  "phone": "0987950527",
  "gender": "Male",
  "dateOfBirth": "1985-03-22",
  "address": "456 Đường DEF, Quận GHI",
  "major": "Bóng Chuyền, Hóa học",
  "weeklyCapacity": 16
}
```

##### Tạo Phụ Huynh (Parent)
```json
{
  "role": "parent",
  "firstName": "Dũng",
  "lastName": "Phạm Anh",
  "email": "dungpa@fams.edu.vn",
  "backup_email": "dungpham@gmail.com",
  "phone": "0919796269",
  "gender": "Male",
  "career": "Phát thanh viên"
}
```

**Lưu ý:**
- Password mặc định: FAMS@2023
- Email mặc định: {userId}@fams.edu.vn
- API tự động tạo phụ huynh khi tạo học sinh (nếu có thông tin)
- Batch tự động được tạo nếu chưa tồn tại

#### Update User
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Body**: Updated user information

#### Delete User
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Admin only)
- **Response**:
```json
{
  "success": true,
  "message": "User and related data deleted successfully",
  "deletedData": {
    "user": true,
    "studentData": true,  // Nếu là học sinh
    "teacherData": true,  // Nếu là giáo viên
    "parentData": true,   // Nếu là phụ huynh
    "schedules": ["67fbf6003539fdaeaa0881f3"]  // IDs của lịch bị xóa (nếu có)
  }
}
```

**Đặc biệt**: Khi xóa User:
- Hệ thống sẽ kiểm tra role của User (student, teacher, parent, admin)
- Dữ liệu liên quan sẽ bị xóa dựa trên role:
  - **Student**: Xóa thông tin học sinh, quan hệ phụ huynh-học sinh (nếu có)
  - **Teacher**: Xóa thông tin giáo viên, tất cả lịch dạy, bỏ chủ nhiệm lớp (nếu có)
  - **Parent**: Xóa thông tin phụ huynh, quan hệ phụ huynh-học sinh (không xóa thông tin học sinh)
  - **Admin**: Chỉ xóa tài khoản User
- Response sẽ bao gồm thông tin chi tiết về dữ liệu đã xóa

#### Get User Details
- **URL**: `http://fams.io.vn/api-nodejs/users/details/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Trả về thông tin chi tiết của người dùng dựa trên userId, bao gồm dữ liệu từ bảng liên quan theo role

**Response cho Student:**
```json
{
  "success": true,
  "data": {
    "user": { /* Thông tin từ bảng User */ },
    "student": { /* Thông tin từ bảng Student */ },
    "batch": { /* Thông tin về khóa học */ },
    "class": { /* Thông tin về lớp học (nếu có) */ }
  }
}
```

**Response cho Teacher:**
```json
{
  "success": true,
  "data": {
    "user": { /* Thông tin từ bảng User */ },
    "teacher": { /* Thông tin từ bảng Teacher */ },
    "classes": [ /* Danh sách các lớp giáo viên dạy */ ]
  }
}
```

**Response cho Parent:**
```json
{
  "success": true,
  "data": {
    "user": { /* Thông tin từ bảng User */ },
    "parent": { /* Thông tin từ bảng Parent */ },
    "students": [ /* Danh sách học sinh là con của phụ huynh */ ],
    "relations": [ /* Thông tin quan hệ giữa phụ huynh và học sinh */ ]
  }
}
```

### Teacher API
Base path: `/teachers`

#### Get All Teachers
- **URL**: `http://fams.io.vn/api-nodejs/teachers`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search term (tìm kiếm theo ID, tên, email, major, etc.)
  - `className`: Lọc theo tên lớp mà giáo viên dạy (ví dụ: "10A1")
  - **Chú ý**: Bạn có thể filter theo bất kỳ trường nào trong model Teacher (firstName, lastName, email, v.v.)

#### Filter Teachers by Class
- Lọc giáo viên dạy một lớp cụ thể:
  ```
  http://fams.io.vn/api-nodejs/teachers?className=10A1
  ```

- Response sẽ bao gồm danh sách các lớp mà giáo viên đang dạy:
  ```json
  {
    "success": true,
    "data": [
      {
        "teacherId": "1",
        "firstName": "Dũng",
        "lastName": "Phạm Văn",
        "email": "dungpv1@fams.edu.vn",
        // ... other teacher fields
        "classes": [
          {
            "classId": 1,
            "className": "10A1",
            "batchId": 3
          },
          {
            "classId": 2,
            "className": "10A2",
            "batchId": 3
          }
        ],
        "classesName": ["10A1", "10A2"], // Mảng chứa tên các lớp
        "classesId": [1, 2] // Mảng chứa ID các lớp
      }
    ],
    "count": 1,
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
  ```

#### Advanced Filtering for Teachers
1. **Filter theo bất kỳ trường nào**: Thêm tên trường và giá trị vào query string
   ```
   http://fams.io.vn/api-nodejs/teachers?firstName=Dũng&gender=true
   ```

2. **Bỏ qua filter với giá trị "none"**: Nếu một tham số có giá trị là "none", hệ thống sẽ bỏ qua filter này
   ```
   http://fams.io.vn/api-nodejs/teachers?firstName=Dũng&className=none
   ```

3. **Kết hợp tìm kiếm và filter**: Các filter có thể kết hợp với nhau
   ```
   http://fams.io.vn/api-nodejs/teachers?search=toán&className=10A1&isActive=true
   ```

#### Get Teacher by ID
- **URL**: `http://fams.io.vn/api-nodejs/teachers/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: Thông tin chi tiết giáo viên bao gồm danh sách các lớp đang dạy

#### Get Teacher Schedule
- **URL**: `http://fams.io.vn/api-nodejs/teachers/:id/schedule`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: Lịch dạy của giáo viên theo học kỳ hiện tại

#### Create Teacher
- **URL**: `http://fams.io.vn/api-nodejs/teachers`
- **Method**: `POST`
- **Auth Required**: Yes (Admin only)
- **Body**: Thông tin giáo viên cần tạo

#### Update Teacher
- **URL**: `http://fams.io.vn/api-nodejs/teachers/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Admin only)
- **Body**: 
```json
{
  "firstName": "Tấn",
  "lastName": "Hoàng Đức",
  "phone": "0987654321",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "major": "Toán học, Lý học",
  "weeklyCapacity": 20,
  "backup_email": "personal-email@example.com"  // Optional - Updates the backup email in User account
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Teacher updated successfully",
  "data": {
    "teacherId": "5",
    "firstName": "Tấn",
    "lastName": "Hoàng Đức",
    "fullName": "Tấn Hoàng Đức",
    "email": "tanhd@fams.edu.vn",
    "phone": "0987654321",
    "userId": "tanhd",
    "major": "Toán học, Lý học",
    "weeklyCapacity": 20,
    // Other teacher fields
  },
  "deletedScheduleIds": ["67fbf6003539fdaeaa0881f3", "67fbf6003539fdaeaa0881f4"]  // IDs of deleted schedules (if any)
}
```

**Đặc biệt**: Khi cập nhật `firstName` hoặc `lastName`:
- Hệ thống tự động tạo `userId` mới theo định dạng: `{firstName}{lastName}{teacherId}` (không dấu, viết thường)
- Email được cập nhật thành `{userId}@fams.edu.vn`
- Tài khoản User cũ sẽ bị xóa và tạo lại với thông tin mới
- Mật khẩu và backup_email được giữ nguyên từ tài khoản cũ

**Đặc biệt**: Khi cập nhật `major`:
- Nếu một môn học bị loại bỏ khỏi danh sách major, tất cả lịch dạy liên quan đến môn học đó của giáo viên sẽ bị xóa
- `deletedScheduleIds` trong response sẽ chứa ID của các lịch dạy bị xóa
- Nếu không có lịch dạy nào bị xóa, `deletedScheduleIds` sẽ là `null`

- **Error Responses**:
  - `404` - Teacher not found:
    ```json
    {
      "success": false,
      "error": "Teacher not found or update failed",
      "code": "UPDATE_FAILED"
    }
    ```

#### Delete Teacher
- **URL**: `http://fams.io.vn/api-nodejs/teachers/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Admin only)
- **Response**:
```json
{
  "success": true,
  "message": "Teacher and related data deleted successfully",
  "teacherDeleted": true,
  "deletedScheduleIds": ["67fbf6003539fdaeaa0881f3", "67fbf6003539fdaeaa0881f4"]  // IDs of deleted schedules (if any)
}
```

**Đặc biệt**: Khi xóa giáo viên:
- Tài khoản User liên quan cũng bị xóa
- Tất cả lịch dạy của giáo viên sẽ bị xóa
- `deletedScheduleIds` trong response sẽ chứa ID của các lịch dạy bị xóa

### Parent API
Base path: `/parents`

#### Get All Parents
- **URL**: `http://fams.io.vn/api-nodejs/parents`
- **Method**: `GET`
- **Auth Required**: Yes

#### Get Parent by ID
- **URL**: `http://fams.io.vn/api-nodejs/parents/:id`
- **Method**: `GET`
- **Auth Required**: Yes

#### Create Parent
- **URL**: `http://fams.io.vn/api-nodejs/parents`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**: Parent information

#### Update Parent
- **URL**: `http://fams.io.vn/api-nodejs/parents/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Body**:
```json
{
  "firstName": "Dũng",
  "lastName": "Trần Văn",
  "phone": "0987654321",
  "career": "Kỹ sư",
  "address": "789 Đường DEF, Quận 3, TP.HCM"
  // Other fields to update
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "parentId": "3",
    "firstName": "Dũng",
    "lastName": "Trần Văn",
    "fullName": "Dũng Trần Văn",
    "email": "dungtp@fams.edu.vn",
    "phone": "0987654321",
    "userId": "dungtp",
    "career": "Kỹ sư",
    "address": "789 Đường DEF, Quận 3, TP.HCM",
    // Other parent fields
  },
  "message": "Parent updated successfully"
}
```
- **Error Responses**:
  - `404` - Parent not found:
    ```json
    {
      "success": false,
      "error": "Parent not found",
      "code": "UPDATE_FAILED"
    }
    ```

#### Delete Parent
- **URL**: `http://fams.io.vn/api-nodejs/parents/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes

### Schedule API
Base path: `/schedules`

#### Get All Schedules
- **URL**: `http://fams.io.vn/api-nodejs/schedules`
- **Method**: `GET`
- **Auth Required**: Yes

#### Get Schedule by ID
- **URL**: `http://fams.io.vn/api-nodejs/schedules/:id`
- **Method**: `GET`
- **Auth Required**: Yes

#### Create Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**: Schedule information

#### Update Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Body**: Updated schedule information

#### Delete Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes

### Admin API
Base path: `/admin`

#### Admin Dashboard Data
- **URL**: `http://fams.io.vn/api-nodejs/admin/dashboard`
- **Method**: `GET`
- **Auth Required**: Yes (Admin role)

#### Manage System Settings
- **URL**: `http://fams.io.vn/api-nodejs/admin/settings`
- **Method**: `GET` / `PUT`
- **Auth Required**: Yes (Admin role)

### Class API
Base path: `/classes`

#### Get All Classes
- **URL**: `http://fams.io.vn/api-nodejs/classes`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `grade`: Lọc theo khối lớp (ví dụ: "10" cho lớp 10, "11" cho lớp 11)
  - `batchId`: Lọc theo ID khóa học
  - `search`: Tìm kiếm theo tên lớp
  - `homeroomTeacherId`: Lọc theo ID giáo viên chủ nhiệm
- **Response**:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "67fb35fa83b945d8f91ef670",
      "className": "10A1",
      "classId": 3,
      "homeroomTeacherId": "tuanpv5",
      "batchId": 3,
      "grade": "10"
    },
    // More classes...
  ]
}
```

#### Get Class by ID
- **URL**: `http://fams.io.vn/api-nodejs/classes/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
```json
{
  "success": true,
  "data": {
    "_id": "67fb35fa83b945d8f91ef672",
    "className": "10A3",
    "classId": 3,
    "homeroomTeacherId": "tuanpv5",
    "batchId": 3,
    "grade": "10"
  }
}
```

#### Create Class
- **URL**: `http://fams.io.vn/api-nodejs/classes`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
```json
{
  "className": "10A3",
  "homeroomTeacherId": "tuanpv5"  // Optional - Teacher's userId (string)
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "className": "10A3",
    "classId": 3,
    "homeroomTeacherId": "tuanpv5",
    "_id": "67fb35fa83b945d8f91ef672"
  },
  "message": "Class created successfully"
}
```
- **Error Responses**:
  - `400` - Missing class name:
    ```json
    {
      "success": false,
      "error": "Class name is required",
      "code": "MISSING_CLASSNAME"
    }
    ```
  - `400` - Duplicate class name:
    ```json
    {
      "success": false,
      "error": "Class name already exists",
      "code": "DUPLICATE_CLASSNAME"
    }
    ```
  - `400` - Invalid teacher ID:
    ```json
    {
      "success": false,
      "error": "Teacher ID does not exist",
      "code": "INVALID_TEACHER_ID"
    }
    ```

#### Update Class
- **URL**: `http://fams.io.vn/api-nodejs/classes/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Body**:
```json
{
  "className": "10A4",  // Optional - New class name
  "homeroomTeacherId": "dungpv1", // Optional - New homeroom teacher's userId
  "batchId": 3 // Optional - Batch ID
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "className": "10A4",
    "classId": 3,
    "homeroomTeacherId": "dungpv1",
    "batchId": 3,
    "grade": "10"
  },
  "message": "Class updated successfully"
}
```
- **Error Responses**:
  - `404` - Class not found:
    ```json
    {
      "success": false,
      "error": "Class not found",
      "code": "CLASS_NOT_FOUND"
    }
    ```
  - `400` - Duplicate class name:
    ```json
    {
      "success": false,
      "error": "Class name already exists",
      "code": "DUPLICATE_CLASSNAME"
    }
    ```
  - `400` - Invalid teacher ID:
    ```json
    {
      "success": false,
      "error": "Teacher ID does not exist",
      "code": "INVALID_TEACHER_ID"
    }
    ```

#### Delete Class
- **URL**: `http://fams.io.vn/api-nodejs/classes/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Response**:
```json
{
  "success": true,
  "message": "Class deleted successfully"
}
```
- **Error Responses**:
  - `404` - Class not found:
    ```json
    {
      "success": false,
      "error": "Class not found",
      "code": "CLASS_NOT_FOUND"
    }
    ```

### Database API
Base path: `/database`

#### Check Database Status
- **URL**: `http://fams.io.vn/api-nodejs/database/status`
- **Method**: `GET`
- **Auth Required**: Yes

## Testing with Postman

### Creating a Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "FAMS API"
4. Add folders for each API category (Auth, Students, etc.)

### Environment Setup
1. Click on "Environments" → "Create new"
2. Name it "FAMS Production"
3. Add these variables:
   - `baseUrl`: `http://fams.io.vn/api-nodejs`
   - `token`: (leave empty initially)

### Testing Authentication
1. Create a login request
2. Set method to POST and URL to `{{baseUrl}}/auth/login`
3. In the Body tab, select "raw" and "JSON"
4. Add login credentials
5. After successful login, use the "Tests" tab to save the token:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
}
```

### Testing Other Endpoints
1. Create a new request in the appropriate folder
2. Set the method and URL
3. In the Authorization tab, select "Bearer Token"
4. In the token field, enter `{{token}}`
5. Add required body or parameters
6. Send the request

### Running Collections
You can run an entire collection or folder to test multiple endpoints at once:
1. Click on the collection or folder
2. Click "Run"
3. Select the requests you want to run
4. Click "Run FAMS API"
