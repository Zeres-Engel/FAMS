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
- **Description**: Cập nhật thông tin học sinh. Có thể cập nhật một hoặc nhiều trường cùng lúc.
- **Body**:
```json
{
  // Thông tin cơ bản
  "firstName": "Thành",
  "lastName": "Nguyễn Văn",
  "email": "thanhnvst@fams.edu.vn",
  "phone": "0987654321",
  "address": "456 Đường XYZ, Quận 2, TP.HCM",
  "dateOfBirth": "2005-05-15",
  "gender": "Male", // Chấp nhận cả "Male"/"Female" và true/false
  "isActive": true,

  // Thông tin lớp và khóa
  "classId": 2,
  "batchId": 3,
  "parentNames": ["Nguyễn Văn A", "Trần Thị B"],
  "parentCareers": ["Kỹ sư", "Giáo viên"],
  "parentPhones": ["0123456789", "0987123456"],
  "parentGenders": [true, false], // true = Male, false = Female

  "rfid": {
    "RFID_ID": "RFID12345",  // ID của thẻ RFID
    "ExpiryDate": "2y"       // Thời hạn 2 năm
  }
}
```

- **Response**:
```json
{
  "success": true,
  "data": {
    "studentId": "7",
    "userId": "thanhnvst",
    "firstName": "Thành",
    "lastName": "Nguyễn Văn",
    "fullName": "Thành Nguyễn Văn",
    "email": "thanhnvst@fams.edu.vn",
    "phone": "0987654321",
    "address": "456 Đường XYZ, Quận 2, TP.HCM",
    "dateOfBirth": "2005-05-15T00:00:00.000Z",
    "classId": 2,
    "batchId": 3,
    "gender": "Male",
    "isActive": true,
    "parentIds": ["1", "2"],
    "parentNames": ["Nguyễn Văn A", "Trần Thị B"],
    "parentCareers": ["Kỹ sư", "Giáo viên"],
    "parentPhones": ["0123456789", "0987123456"],
    "parentGenders": [true, false],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "parentUpdates": [
    "Updated parent: 1",
    "Updated parent: 2"
  ],
  "rfid": {
    "RFID_ID": "RFID12345",
    "UserID": "thanhnvst",
    "IssueDate": "2024-05-25T12:34:56.789Z",
    "ExpiryDate": "2026-05-25T12:34:56.789Z"
  }
}
```

**Lưu ý quan trọng về cập nhật phụ huynh:**
1. Khi cập nhật thông tin phụ huynh:
   - Nếu tên phụ huynh thay đổi, hệ thống sẽ tự động:
     - Tạo `userId` mới theo định dạng: `{firstName}{lastNameInitials}pr{parentId}`
     - Tạo email mới: `{newUserId}@fams.edu.vn`
     - Xóa tài khoản User cũ và tạo tài khoản mới
     - Cập nhật thông tin phụ huynh với `userId` và email mới
   - Ví dụ: Nếu phụ huynh "Nguyễn Văn A" (parentId=1) đổi tên thành "Nguyễn Văn B":
     - `userId` cũ: `angvpr1`
     - `userId` mới: `bngvpr1`
     - Email mới: `bngvpr1@fams.edu.vn`

2. Các trường phụ huynh:
   - `parentNames`: Tên đầy đủ của phụ huynh
   - `parentCareers`: Nghề nghiệp của phụ huynh
   - `parentPhones`: Số điện thoại của phụ huynh
   - `parentGenders`: Giới tính phụ huynh (true = Male, false = Female)
   - Không cần cung cấp `parentIds` khi cập nhật, hệ thống sẽ tự động quản lý

3. Khi xóa phụ huynh:
   - Xóa bản ghi phụ huynh
   - Xóa tài khoản User tương ứng
   - Cập nhật danh sách phụ huynh trong bản ghi học sinh

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
- API nhận userId làm tham số (không phải MongoDB _id)
- Hệ thống sẽ kiểm tra role của User (student, teacher, parent, admin)
- Dữ liệu liên quan sẽ bị xóa dựa trên role:
  - **Student**: Xóa thông tin học sinh, quan hệ phụ huynh-học sinh (nếu có)
  - **Teacher**: Xóa thông tin giáo viên, tất cả lịch dạy, bỏ chủ nhiệm lớp (nếu có)
  - **Parent**: Xóa thông tin phụ huynh, quan hệ phụ huynh-học sinh (không xóa thông tin học sinh)
  - **Admin**: Chỉ xóa tài khoản User
- Response sẽ bao gồm thông tin chi tiết về dữ liệu đã xóa

- **Error Responses**:
  - `404` - User not found:
    ```json
    {
      "success": false,
      "message": "User not found",
      "code": "USER_NOT_FOUND"
    }
    ```
  - `500` - Server error:
    ```json
    {
      "success": false,
      "message": "Error message",
      "code": "DELETE_FAILED"
    }
    ```

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
  "backup_email": "personal-email@example.com",  // Optional - Updates the backup email in User account

  "rfid": {
    "RFID_ID": "RFID67890",
    "ExpiryDate": "3y"       // Thời hạn 3 năm
  }
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
  "deletedScheduleIds": ["67fbf6003539fdaeaa0881f3", "67fbf6003539fdaeaa0881f4"],  // IDs of deleted schedules (if any)
  "rfid": {
    "RFID_ID": "RFID67890",
    "UserID": "tanhd",
    "IssueDate": "2024-05-25T12:34:56.789Z",
    "ExpiryDate": "2027-05-25T12:34:56.789Z"
  }
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

### Sử dụng Form Chung để Cập Nhật Teacher và Student
API hỗ trợ việc sử dụng cùng một form để gửi dữ liệu cập nhật cho cả giáo viên và học sinh. Mỗi API sẽ tự động bỏ qua các trường không liên quan và chỉ xử lý các trường phù hợp với entity.

#### Form Chung
```json
{
  // Các trường chung
  "firstName": "Hoa",
  "lastName": "Nguyễn Thị",
  "phone": "0987654321",
  "address": "123 Đường XYZ, Quận ABC",
  "gender": "Female",
  "dateOfBirth": "1990-01-15",
  "backup_email": "hoa.nguyen@gmail.com",
  
  // Các trường dành cho teacher
  "major": "Toán, Lý",
  "weeklyCapacity": 20,
  
  // Các trường dành cho student
  "className": "10A2",
  "parentNames": ["Nguyễn Văn A"],
  "parentCareers": ["Kỹ sư"],
  "parentPhones": ["0123456789"],
  "parentGenders": [true]
}
```

#### Xử lý Form
1. Khi gửi đến `/api/teachers/:id`:
   - Các trường dành cho teacher (major, weeklyCapacity) và các trường chung sẽ được xử lý
   - Các trường dành cho student (className, parentNames, v.v.) sẽ bị bỏ qua

2. Khi gửi đến `/api/students/:id`:
   - Các trường dành cho student (className, parentNames, v.v.) và các trường chung sẽ được xử lý
   - Các trường dành cho teacher (major, weeklyCapacity) sẽ bị bỏ qua

Điều này cho phép sử dụng cùng một form frontend để quản lý cả giáo viên và học sinh mà không cần phải tách biệt dữ liệu gửi đi.

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

#### Get All Schedules (with advanced filtering)
- **URL**: `http://fams.io.vn/api-nodejs/schedules/all`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `className`: Filter by class name (e.g., "10A1")
  - `userId`: Filter by user ID (works for students, teachers, and parents)
  - `teacherId`: Filter by teacher ID
  - `classId`: Filter by class ID
  - `subjectId`: Filter by subject ID
  - `fromDate`: Start date for range filter (format: YYYY-MM-DD)
  - `toDate`: End date for range filter (format: YYYY-MM-DD)
  - `dayOfWeek`: Filter by day of week (e.g., "Monday", "Tuesday")
  - `slotId`: Filter by slot ID (e.g., 1, 2, 3)
  - `weekNumber`: Filter by week number in semester
  - `semesterId`: Filter by semester ID
  - `status`: Filter by schedule status ("scheduled", "completed", "cancelled", "rescheduled")
  - `studentId`: When using with parent userId, specifies which child's schedule to retrieve
- **Response**:
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "scheduleId": 1,
      "semesterId": "1",
      "classId": 3,
      "subjectId": 2,
      "teacherId": 5,
      "classroomId": 10,
      "WeekNumber": 1,
      "DayNumber": 2,
      "SessionDate": "2024-09-10",
      "SlotID": 3,
      "dayOfWeek": "Tuesday",
      "startTime": "08:50",
      "endTime": "09:35",
      "Topic": "Đại số",
      "status": "scheduled",
      "className": "10A3",
      "subjectName": "Toán học",
      "teacherName": "Tuấn Phạm Văn"
    }
    // More schedules...
  ],
  "query": {
    "classId": 3,
    "fromDate": "2024-09-01",
    "toDate": "2024-09-30"
  }
}
```

#### Get Schedules by Class Name
- **URL**: `http://fams.io.vn/api-nodejs/schedules/class/:className`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `className`: The name of the class (e.g., "10A1")
- **Query Parameters**:
  - `fromDate`: Start date for range filter (format: YYYY-MM-DD)
  - `toDate`: End date for range filter (format: YYYY-MM-DD)
- **Response**:
```json
{
  "success": true,
  "count": 15,
  "class": {
    "classId": 1,
    "className": "10A1",
    "homeroomTeacherId": "dungpv1",
    "batchId": 3,
    "grade": "10"
  },
  "data": [
    // Array of schedule objects with enhanced information
  ]
}
```

#### Get Schedules by User ID
- **URL**: `http://fams.io.vn/api-nodejs/schedules/user/:userId`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `userId`: The ID of the user (works for students, teachers, and parents)
- **Query Parameters**:
  - `fromDate`: Start date for range filter (format: YYYY-MM-DD)
  - `toDate`: End date for range filter (format: YYYY-MM-DD)
  - `studentId`: For parent users, specifies which child's schedule to retrieve
- **Response**:
```json
{
  "success": true,
  "count": 20,
  "context": {
    "userId": "anhdmst37",
    "role": "Student",
    "student": {
      "studentId": "37",
      "firstName": "Ánh",
      "lastName": "Dương Minh",
      "classId": 3
      // Other student details
    },
    "classId": 3
  },
  "data": [
    // Array of schedule objects with enhanced information
  ]
}
```

#### Get All Schedules
- **URL**: `http://fams.io.vn/api-nodejs/schedules`
- **Method**: `GET`
- **Auth Required**: Yes

#### Get Schedule by ID
- **URL**: `http://fams.io.vn/api-nodejs/schedules/:id`
- **Method**: `GET`
- **Auth Required**: Yes

#### Create Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules/create`
- **Method**: `POST`
- **Auth Required**: Yes (Admin or Teacher only)
- **Body**: 
```json
{
  "date": "2024-09-10",               // Required - Format: YYYY-MM-DD
  "slotNumber": 3,                    // Required - Slot number (1-10)
  "classId": 3,                       // Required - Class ID
  "teacherId": 5,                     // Required - Teacher ID
  "subjectId": 2,                     // Required - Subject ID
  "topic": "Đại số",                  // Optional - Topic for the session
  "classroomId": 10,                  // Optional - Classroom ID
  "roomName": "Room 101",             // Optional - Room name
  "weekNumber": 1,                    // Optional - Week number in semester
  "semesterId": "1"                   // Optional - Semester ID
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Tạo lịch học thành công cho lớp 10A3 tiết 3 (08:50-09:35) vào Tuesday, 10/09/2024",
  "data": {
    "scheduleId": "650d1f4c8d43e21234567890",
    "classId": 3,
    "subjectId": 2,
    "teacherId": 5,
    "classroomId": 10,
    "slotId": "3",
    "SlotID": "3",
    "topic": "Đại số",
    "sessionDate": "2024-09-10T00:00:00.000Z",
    "SessionDate": "2024-09-10T00:00:00.000Z",
    "sessionWeek": "09/09/2024 to 15/09/2024",
    "SessionWeek": "09/09/2024 to 15/09/2024",
    "dayOfWeek": "Tuesday",
    "startTime": "08:50",
    "endTime": "09:35",
    "className": "10A3",
    "teacherName": "Tuấn Phạm Văn",
    "subjectName": "Toán học"
  }
}
```
- **Error Responses**:
  - `403` - Unauthorized:
    ```json
    {
      "success": false,
      "message": "Bạn không có quyền tạo lịch học",
      "code": "PERMISSION_DENIED"
    }
    ```
  - `400` - Missing required fields:
    ```json
    {
      "success": false,
      "message": "Thiếu thông tin bắt buộc (date, slotNumber, classId, teacherId, subjectId)",
      "code": "MISSING_REQUIRED_FIELDS"
    }
    ```
  - `409` - Schedule already exists:
    ```json
    {
      "success": false,
      "message": "Đã tồn tại lịch học cho lớp 3 vào ngày 10/09/2024 tiết 3",
      "code": "SCHEDULE_EXISTS"
    }
    ```

#### Update Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules/:id`
- **Method**: `PUT` 
- **Auth Required**: Yes (Admin or Teacher only)
- **URL Parameters**:
  - `id`: Schedule ID to update
- **Body**: 
```json
{
  "date": "2024-09-12",               // Optional - New date (YYYY-MM-DD)
  "slotNumber": 4,                    // Optional - New slot number (1-10)
  "classId": 3,                       // Optional - New class ID
  "teacherId": 5,                     // Optional - New teacher ID
  "subjectId": 2,                     // Optional - New subject ID
  "topic": "Hình học không gian",     // Optional - New topic
  "classroomId": 12,                  // Optional - New classroom ID
  "roomName": "Room 202",             // Optional - New room name
  "status": "rescheduled",            // Optional - New status 
  "weekNumber": 2,                    // Optional - New week number
  "semesterId": "1",                  // Optional - New semester ID
  "isActive": true,                   // Optional - Boolean flag
  "attendanceRecorded": false         // Optional - Boolean flag
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Cập nhật lịch học thành công",
  "data": {
    "scheduleId": "650d1f4c8d43e21234567890",
    "classId": 3,
    "subjectId": 2,
    "teacherId": 5,
    "classroomId": 12,
    "slotId": "4",
    "SlotID": "4",
    "topic": "Hình học không gian",
    "sessionDate": "2024-09-12T00:00:00.000Z",
    "SessionDate": "2024-09-12T00:00:00.000Z",
    "sessionWeek": "09/09/2024 to 15/09/2024",
    "SessionWeek": "09/09/2024 to 15/09/2024",
    "dayOfWeek": "Thursday",
    "startTime": "09:40",
    "endTime": "10:25",
    "status": "rescheduled",
    "className": "10A3",
    "teacherName": "Tuấn Phạm Văn",
    "subjectName": "Toán học"
  }
}
```
- **Error Responses**:
  - `403` - Unauthorized:
    ```json
    {
      "success": false,
      "message": "Bạn không có quyền cập nhật lịch học",
      "code": "PERMISSION_DENIED"
    }
    ```
  - `404` - Schedule not found:
    ```json
    {
      "success": false,
      "message": "Không tìm thấy lịch học với ID 650d1f4c8d43e21234567890",
      "code": "SCHEDULE_NOT_FOUND"
    }
    ```
  - `409` - Schedule already exists:
    ```json
    {
      "success": false,
      "message": "Đã tồn tại lịch học cho lớp 3 vào ngày 12/09/2024 tiết 4",
      "code": "SCHEDULE_EXISTS"
    }
    ```

#### Delete Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Admin or Teacher only)
- **URL Parameters**:
  - `id`: Schedule ID to delete
- **Response**:
```json
{
  "success": true,
  "message": "Đã xóa lịch học Toán học cho lớp 10A3 vào ngày 12/09/2024 tiết 4",
  "data": {
    "deletedSchedule": {
      "scheduleId": "650d1f4c8d43e21234567890",
      "classId": 3,
      "subjectId": 2,
      "teacherId": 5,
      "slotId": "4",
      "dayOfWeek": "Thursday",
      "topic": "Hình học không gian",
      "className": "10A3",
      "teacherName": "Tuấn Phạm Văn",
      "subjectName": "Toán học"
    }
  }
}
```
- **Error Responses**:
  - `403` - Unauthorized:
    ```json
    {
      "success": false,
      "message": "Bạn không có quyền xóa lịch học",
      "code": "PERMISSION_DENIED"
    }
    ```
  - `403` - Teacher permission denied:
    ```json
    {
      "success": false,
      "message": "Bạn không có quyền xóa lịch học của giáo viên khác",
      "code": "PERMISSION_DENIED_TEACHER"
    }
    ```
  - `404` - Schedule not found:
    ```json
    {
      "success": false,
      "message": "Không tìm thấy lịch học với ID 650d1f4c8d43e21234567890",
      "code": "SCHEDULE_NOT_FOUND"
    }
    ```

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

### RFID API
Base path: `/rfid`

#### Get All RFID Cards
- **URL**: `http://fams.io.vn/api-nodejs/rfid`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: Số trang (mặc định: 1)
  - `limit`: Số lượng kết quả mỗi trang (mặc định: 10)
  - `search`: Tìm kiếm theo RFID_ID hoặc UserID
  - **Chú ý**: Bạn có thể filter theo bất kỳ trường nào trong model RFID
- **Response**:
```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "pages": 1
  },
  "data": [
    {
      "RFID_ID": "RFID12345",
      "UserID": "tuanpv5",
      "IssueDate": "2024-03-15T00:00:00.000Z",
      "ExpiryDate": "2025-03-15T00:00:00.000Z",
      "user": {
        "userId": "tuanpv5",
        "username": "tuanpv5",
        "email": "tuanpv5@fams.edu.vn",
        "role": "teacher"
      }
    },
    {
      "RFID_ID": "RFID67890",
      "UserID": "anhdmst37",
      "IssueDate": "2024-02-20T00:00:00.000Z",
      "ExpiryDate": "2025-02-20T00:00:00.000Z",
      "user": {
        "userId": "anhdmst37",
        "username": "anhdmst37",
        "email": "anhdmst37@fams.edu.vn",
        "role": "student"
      }
    }
  ]
}
```

#### Get RFID by ID
- **URL**: `http://fams.io.vn/api-nodejs/rfid/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
```json
{
  "success": true,
  "data": {
    "RFID_ID": "RFID12345",
    "UserID": "tuanpv5",
    "IssueDate": "2024-03-15T00:00:00.000Z",
    "ExpiryDate": "2025-03-15T00:00:00.000Z",
    "user": {
      "userId": "tuanpv5",
      "username": "tuanpv5",
      "email": "tuanpv5@fams.edu.vn",
      "role": "teacher",
      "details": {
        // Teacher details
      }
    }
  }
}
```

#### Create RFID
- **URL**: `http://fams.io.vn/api-nodejs/rfid`
- **Method**: `POST`
- **Auth Required**: Yes (Admin only)
- **Body**:
```json
{
  "RFID_ID": "RFID12345",
  "UserID": "tuanpv5",
  "ExpiryDate": "2025-03-15T00:00:00.000Z"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "RFID_ID": "RFID12345",
    "UserID": "tuanpv5",
    "IssueDate": "2024-03-15T12:34:56.789Z",
    "ExpiryDate": "2025-03-15T00:00:00.000Z"
  },
  "message": "RFID created successfully"
}
```
- **Error Responses**:
  - `400` - User not found:
    ```json
    {
      "success": false,
      "message": "User with ID tuanpv5 not found",
      "code": "INVALID_USER_ID"
    }
    ```
  - `400` - Duplicate RFID:
    ```json
    {
      "success": false,
      "message": "RFID with ID RFID12345 already exists",
      "code": "DUPLICATE_RFID"
    }
    ```

#### Update RFID
- **URL**: `http://fams.io.vn/api-nodejs/rfid/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Admin only)
- **Body**:
```json
{
  "UserID": "dungpv1",
  "ExpiryDate": "2026-03-15T00:00:00.000Z"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "RFID_ID": "RFID12345",
    "UserID": "dungpv1",
    "IssueDate": "2024-03-15T12:34:56.789Z",
    "ExpiryDate": "2026-03-15T00:00:00.000Z"
  },
  "message": "RFID updated successfully"
}
```
- **Error Responses**:
  - `404` - RFID not found:
    ```json
    {
      "success": false,
      "message": "RFID with ID RFID12345 not found",
      "code": "RFID_NOT_FOUND"
    }
    ```
  - `400` - Invalid user:
    ```json
    {
      "success": false,
      "message": "User with ID dungpv1 not found",
      "code": "INVALID_USER_ID"
    }
    ```

#### Delete RFID
- **URL**: `http://fams.io.vn/api-nodejs/rfid/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Admin only)
- **Response**:
```json
{
  "success": true,
  "message": "RFID deleted successfully"
}
```
- **Error Responses**:
  - `404` - RFID not found:
    ```json
    {
      "success": false,
      "message": "RFID with ID RFID12345 not found",
      "code": "RFID_NOT_FOUND"
    }
    ```

#### Các tùy chọn ExpiryDate cho RFID
Khi tạo hoặc cập nhật thẻ RFID, trường `ExpiryDate` hỗ trợ các định dạng sau:

1. **Định dạng năm ngắn gọn**: 
   - `"1y"`: Thẻ có thời hạn 1 năm kể từ hiện tại
   - `"2y"`: Thẻ có thời hạn 2 năm kể từ hiện tại
   - `"3y"`: Thẻ có thời hạn 3 năm kể từ hiện tại
   - Có thể sử dụng bất kỳ số năm nào: `"5y"`, `"10y"`, v.v.

2. **Ngày cụ thể**:
   - Cung cấp ngày hết hạn cụ thể: `"2025-12-31"`

3. **Mặc định**:
   - Nếu không cung cấp, thời hạn mặc định là 3 năm kể từ hiện tại

#### Cập nhật Student với RFID
Khi cập nhật thông tin học sinh, bạn có thể đồng thời cập nhật hoặc tạo mới thẻ RFID cho học sinh:

```json
{
  "firstName": "Thành",
  "lastName": "Nguyễn Văn",
  // Các trường khác của học sinh

  "rfid": {
    "RFID_ID": "RFID12345",  // ID của thẻ RFID
    "ExpiryDate": "2y"       // Thời hạn 2 năm
  }
}
```

- Nếu học sinh đã có thẻ RFID: Hệ thống sẽ cập nhật thẻ hiện có
- Nếu học sinh chưa có thẻ RFID: Hệ thống sẽ tạo thẻ mới (nếu RFID_ID được cung cấp)
- Response sẽ bao gồm cả thông tin học sinh và thẻ RFID:

```json
{
  "success": true,
  "data": {
    // Thông tin học sinh
  },
  "rfid": {
    "RFID_ID": "RFID12345",
    "UserID": "thanhnv5",
    "IssueDate": "2024-05-25T12:34:56.789Z",
    "ExpiryDate": "2026-05-25T12:34:56.789Z"
  }
}
```

#### Cập nhật Teacher với RFID
Tương tự, bạn có thể cập nhật hoặc tạo mới thẻ RFID cho giáo viên:

```json
{
  "firstName": "Tuấn",
  "lastName": "Phạm Văn",
  // Các trường khác của giáo viên

  "rfid": {
    "RFID_ID": "RFID67890",
    "ExpiryDate": "3y"       // Thời hạn 3 năm
  }
}
```

- Response cũng sẽ bao gồm cả thông tin giáo viên và thẻ RFID.

#### Get RFID By User ID
- **URL**: `http://fams.io.vn/api-nodejs/rfid/user/:userId`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Lấy thông tin thẻ RFID của người dùng cụ thể dựa trên userId
- **Response**:
```json
{
  "success": true,
  "data": {
    "RFID_ID": "RFID12345",
    "UserID": "tuanpv5",
    "IssueDate": "2024-03-15T00:00:00.000Z",
    "ExpiryDate": "2027-03-15T00:00:00.000Z",
    "user": {
      // Thông tin người dùng
    }
  }
}
```

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
