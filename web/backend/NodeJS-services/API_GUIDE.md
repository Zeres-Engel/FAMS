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
  - `academicYear`: Lọc theo năm học (VD: 2022-2023, 2023-2024)
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

7. **Lọc theo năm học**:
   ```
   http://fams.io.vn/api-nodejs/users?academicYear=2022-2023
   ```
   Lọc này sẽ trả về:
   - Học sinh có tham gia lớp học trong năm học 2022-2023
   - Giáo viên đã dạy trong năm học 2022-2023
   - Phụ huynh có con học trong năm học 2022-2023

8. **Kết hợp nhiều điều kiện lọc**:
   ```
   http://fams.io.vn/api-nodejs/users?roles=teacher&grade=11&academicYear=2023-2024
   ```
   Lọc này sẽ trả về tất cả giáo viên dạy khối 11 trong năm học 2023-2024.

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
      "rfid": {
        "RFID_ID": "TEACH12345",
        "IssueDate": "2024-05-01T00:00:00Z",
        "ExpiryDate": "2026-05-01T00:00:00Z",
        "Status": "Active"
      },
      "academicYears": ["2022-2023", "2023-2024", "2024-2025"],
      "details": {
        "teacherId": "5",
        "firstName": "Tuấn",
        "lastName": "Phạm Văn",
        "fullName": "Tuấn Phạm Văn",
        "phone": "0987950528",
        "major": "Toán học",
        "degree": "Tiến sĩ Giáo dục học",
        "classes": [
          {
            "classId": 2,
            "className": "10A1",
            "grade": "10"
          },
          {
            "classId": 3,
            "className": "10A2",
            "grade": "10"
          }
        ],
        "academicYears": ["2022-2023", "2023-2024", "2024-2025"]
      }
    },
    {
      "userId": "anhdmst37",
      "username": "anhdmst37",
      "email": "anhdmst37@fams.edu.vn",
      "role": "student",
      "academicYears": ["2022-2023", "2023-2024"],
      "rfid": {
        "RFID_ID": "STUD67890",
        "IssueDate": "2024-03-15T00:00:00Z",
        "ExpiryDate": "2025-03-15T00:00:00Z",
        "Status": "Active"
      },
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

**Lưu ý về RFID**: Nếu người dùng có thẻ RFID, thông tin thẻ sẽ được trả về trong trường `rfid` với các thuộc tính `RFID_ID`, `IssueDate`, `ExpiryDate` và `Status`.

**Lưu ý về academicYears**: Trường `academicYears` chứa danh sách các năm học mà người dùng đã tham gia, dựa trên dữ liệu lịch học (ClassSchedule) và điểm danh (AttendanceLog).

#### Get User by ID
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
```json
{
  "success": true,
  "data": {
    "userId": "tuanpv5",
    "email": "tuanpv5@fams.edu.vn",
    "role": "teacher",
    "rfid": {
      "RFID_ID": "TEACH12345",
      "IssueDate": "2024-05-01T00:00:00Z",
      "ExpiryDate": "2026-05-01T00:00:00Z",
      "Status": "Active"
    },
    // Other user information
  }
}
```

**Lưu ý về RFID**: Nếu người dùng có thẻ RFID, thông tin thẻ sẽ được trả về trong trường `rfid`.

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
  "email": "thanhnp@gmail.com",
  "backup_email": "thanhnp@gmail.com",
  "phone": "0987654321",
  "gender": "Male",
  "dateOfBirth": "2005-05-15",
  "address": "123 Đường ABC, Thành phố XYZ",
  "parentNames": ["Nguyễn Phước Hải", "Trần Thị Mai"],
  "parentCareers": ["Kỹ sư", "Giáo viên"],
  "parentPhones": ["0123456789", "0987123456"],
  "parentGenders": [true, false],
  "parentEmails": ["nph@gmail.com", "ttm@gmail.com"]
}
```

**Lưu ý về cách xử lý Batch mới:**
- Không cần nhập batchYear nữa, hệ thống sẽ tự lấy năm hiện tại (currentYear)
- Nếu batch của năm hiện tại đã tồn tại, sẽ sử dụng batch đó
- Nếu chưa tồn tại, hệ thống sẽ tự động tạo batch mới với:
  - startYear = năm hiện tại
  - startDate = 1 tháng 9 năm hiện tại
  - endDate = 30 tháng 6 năm hiện tại + 3 năm

**Lưu ý về cách sinh userId:**
- Student: `{firstName}{lastName initials}st{batchId}{studentId}`
  - Ví dụ: "Thành Nguyễn Phước" với batchId=2, studentId=5 sẽ có userId="thanhnpst25"
  
- Teacher: `{firstName[0]}{lastName initials}{teacherId}`
  - Ví dụ: "Hoa Trần Thị" có teacherId=5 sẽ có userId="htt5"
  
- Parent: `{firstName}{lastName initials}pr{parentId}`
  - Ví dụ: "Hải Nguyễn Phước" có parentId=196 sẽ có userId="hainppr196"

**Lưu ý về các trường mới:**
- `parentEmails`: Mảng email riêng của từng phụ huynh (khi tạo học sinh có nhiều phụ huynh)
- `parentEmail`: Email riêng của phụ huynh (khi tạo phụ huynh trực tiếp)
- `degree`: Bằng cấp/học vị của giáo viên

**Chú ý:**
- Password mặc định: FAMS@2023
- Email mặc định: {userId}@fams.edu.vn
- Email cá nhân của phụ huynh và giáo viên sẽ được lưu trữ riêng
- API tự động tạo phụ huynh khi tạo học sinh (nếu có thông tin)
- Batch tự động được tạo nếu chưa tồn tại

#### Update User (Admin Only)
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Admin only)
- **Body**: Updated user information

#### Unified Update User (Supports All Roles)
- **URL**: `http://fams.io.vn/api-nodejs/users/update/:userId`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Description**: Thống nhất API cập nhật thông tin người dùng cho cả 3 vai trò (Student, Teacher, Parent) dựa vào userId
- **Body**: Tùy thuộc vào vai trò của người dùng, chỉ cần gửi các trường cần cập nhật

**Cập nhật với RFID**: Bạn có thể cập nhật hoặc tạo thẻ RFID cho bất kỳ người dùng nào bằng cách thêm trường `rfid` vào request body.

**Ví dụ cập nhật Student với RFID:**
```json
{
  "firstName": "Đặng Thanh",
  "lastName": "Khoa",
  "email": "khoadt@gmail.com",
  "phone": "0890658326",
  "address": "Hải Phòng City", 
  "dateOfBirth": "2008-10-07",
  "gender": true,
  "classId": 2,
  "rfid": {
    "RFID_ID": "STUD12345",
    "ExpiryDate": "2y"
  }
}
```

**Ví dụ cập nhật Teacher với RFID:**
```json
{
  "firstName": "Đức",
  "lastName": "Hoàng",
  "fullName": "Hoàng Đức Hùng",
  "phone": "0377538640",
  "major": "Tin học, Lịch sử, Địa lý",
  "degree": "Tiến sĩ Giáo dục học",
  "weeklyCapacity": 12,
  "rfid": {
    "RFID_ID": "TEACH67890",
    "ExpiryDate": "3y"
  }
}
```

**Ví dụ cập nhật Parent:**
```json
{
  "fullName": "Lê Thị Lan",
  "phone": "0987654321",
  "career": "Giáo viên",
  "studentIds": [1, 2]
}
```

**Ví dụ chỉ cập nhật RFID:** Bạn có thể chỉ cập nhật thẻ RFID mà không thay đổi thông tin người dùng
```json
{
  "rfid": {
    "RFID_ID": "RFID98765",
    "ExpiryDate": "2026-12-31"
  }
}
```

**Xử lý đặc biệt:**

1. **Cập nhật Tên**: API hỗ trợ cập nhật qua `fullName` hoặc `firstName`/`lastName`:
   - Khi cập nhật `fullName`, hệ thống tự động tách thành `firstName` và `lastName`
   - Khi cập nhật `firstName`/`lastName`, hệ thống tự động tạo `fullName`

2. **Cập nhật RFID**: 
   - Nếu người dùng đã có thẻ RFID: Thẻ hiện tại sẽ được cập nhật
   - Nếu người dùng chưa có thẻ RFID: Thẻ mới sẽ được tạo
   - Trường `ExpiryDate` có thể là định dạng ngắn gọn ("2y", "3y") hoặc ngày cụ thể

3. **Cập nhật quan hệ Phụ huynh-Học sinh**: Khi cập nhật phụ huynh với `studentIds`, API tự động tạo quan hệ với các học sinh hiện có

**Response với RFID:**
```json
{
  "success": true,
  "message": "User khoaatst1 updated successfully",
  "data": {
    "user": {
      "userId": "khoaatst1", 
      "email": "khoaatst1@fams.edu.vn",
      "role": "Student"
    },
    "role": {
      "type": "student",
      "student": {
        "studentId": 1,
        "fullName": "Đặng Thanh Khoa",
        "dateOfBirth": "2008-10-07T00:00:00.000Z",
        "gender": true,
        "address": "Hải Phòng City",
        "phone": "890658326",
        "classId": 2,
        "batchId": 1
      },
      "rfid": {
        "RFID_ID": "STUD12345",
        "UserID": "khoaatst1",
        "IssueDate": "2024-05-15T10:13:45.000Z",
        "ExpiryDate": "2026-05-15T10:13:45.000Z",
        "Status": "Active"
      }
    }
  }
}
```

**Mã lỗi:**
- `USER_NOT_FOUND`: Không tìm thấy người dùng
- `STUDENT_RECORD_NOT_FOUND`: Không tìm thấy bản ghi học sinh
- `TEACHER_RECORD_NOT_FOUND`: Không tìm thấy bản ghi giáo viên
- `PARENT_RECORD_NOT_FOUND`: Không tìm thấy bản ghi phụ huynh
- `UPDATE_FAILED`: Cập nhật thất bại vì lỗi khác

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
    "user": {
      "userId": "khoaatst1",
      "email": "khoaatst1@fams.edu.vn",
      "role": "Student",
    },
    "role": {
      "type": "student",
      "student": {
        "studentId": 1,
        "fullName": "Đặng Thanh Khoa",
        "dateOfBirth": "2008-10-07T00:00:00.000Z",
        "gender": true,
        "address": "Hải Phòng",
        "phone": "890658326",
        "classId": 1,
        "batchId": 1
      },
      "batch": {
        "batchId": 1,
        "batchName": "K2023",
        "startYear": 2023
      },
      "class": {
        "classId": 1,
        "className": "10A1",
        "grade": "10"
      },
      "parents": [
        {
          "parentId": 1,
          "fullName": "Nguyễn Văn A",
          "phone": "0987654321",
          "career": "Kỹ sư",
          "relationship": "Father"
        },
      ],
      "rfid": {
        "RFID_ID": "STUD12345",
        "UserID": "khoaatst1",
        "IssueDate": "2024-05-01T00:00:00Z",
        "ExpiryDate": "2026-05-01T00:00:00Z"
      }
    }
  }
}
```

**Response cho Teacher:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "hunghu123",
      "email": "hoangduchung9796@gmail.com",
      "role": "Teacher"
    },
    "role": {
      "type": "teacher",
      "teacher": {
        "teacherId": 3,
        "fullName": "Hoàng Đức Hùng",
        "dateOfBirth": "1981-07-26T00:00:00.000Z",
        "gender": true,
        "address": "Bà Rịa - Vũng Tàu",
        "phone": "0377538640",
        "major": "Tin học, Lịch sử",
        "degree": "Tiến sĩ Giáo dục học",
        "weeklyCapacity": 10
      },
      "classes": [
        {
          "classId": 2,
          "className": "10A2",
          "grade": "10"
        }
      ],
      "rfid": {
        "RFID_ID": "TEACH67890",
        "UserID": "hunghu123",
        "IssueDate": "2024-05-15T10:15:22.000Z",
        "ExpiryDate": "2027-05-15T10:15:22.000Z"
      }
    }
  }
}
```

**Response cho Parent:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "dungbnpr0",
      "email": "buingocdung4439@gmail.com",
      "role": "Parent"
    },
    "role": {
      "type": "parent",
      "parent": {
        "parentId": 1,
        "fullName": "Bùi Ngọc Dũng",
        "career": "Doanh nhân",
        "phone": "973557557",
        "gender": true
      },
      "children": [
        {
          "studentId": 1,
          "fullName": "Đặng Thanh Khoa",
          "className": "10A1",
          "relationship": "Other"
        },
        {
          "studentId": 2,
          "fullName": "Nguyễn Văn Bình",
          "className": "11A2",
          "relationship": "Other"
        },
        {
          "studentId": 3,
          "fullName": "Trần Thị Hương",
          "className": "12A1",
          "relationship": "Other"
        }
      ],
      "rfid": {
        "RFID_ID": "PARENT12345",
        "UserID": "dungbnpr0",
        "IssueDate": "2024-05-01T00:00:00Z",
        "ExpiryDate": "2026-05-01T00:00:00Z"
      }
    }
  }
}
```

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
      "weekNumber": 1,
      "dayOfWeek": "Tuesday",
      "sessionDate": "2024-09-10T00:00:00.000Z",
      "sessionWeek": "09/09/2024 to 15/09/2024",
      "slotId": 3,
      "startTime": "08:50",
      "endTime": "09:35",
      "topic": "Đại số",
      "subjectName": "Toán học",
      "teacherName": "Tuấn Phạm Văn",
      "classroomNumber": "101",
      "teacherUserId": "tuanpv5"
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

**Note**: All schedule responses include `teacherUserId` which is the user ID of the teacher, in addition to `teacherId` and `teacherName`.

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

#### Create Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
```json
{
  "semesterId": 6,
  "semesterNumber": 1,
  "classId": 18,
  "subjectId": 10,
  "teacherId": 7,        // Either teacherId or teacherUserId must be provided
  "classroomId": 3,
  "slotId": 14,
  "topic": "Cầu Lông - Tuần 16",
  "sessionDate": "2025-04-19",
  "isActive": true
}
```

**Alternative using teacherUserId instead of teacherId**:
```json
{
  "semesterId": 6,
  "semesterNumber": 1,
  "classId": 18,
  "subjectId": 10,
  "teacherUserId": "buihuukhanh",  // Can use teacher's userId instead of teacherId
  "classroomId": 3,
  "slotId": 14,
  "topic": "Cầu Lông - Tuần 16",
  "sessionDate": "2025-04-19",
  "isActive": true
}
```

- **Required Fields**: `semesterId`, `classId`, `subjectId`, `teacherId` (or `teacherUserId`), `classroomId`, `slotId`, `sessionDate`
- **Response**:
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "scheduleId": 3978,
    "semesterId": 6,
    "semesterNumber": 1,
    "classId": 18,
    "subjectId": 10,
    "teacherId": 7,
    "classroomId": 3,
    "slotId": 14,
    "topic": "Cầu Lông - Tuần 16",
    "sessionDate": "2025-04-19T00:00:00.000Z",
    "sessionWeek": "14/04/2025 to 20/04/2025",
    "dayOfWeek": "Saturday",
    "createdAt": "2025-04-22T09:15:36.789Z",
    "updatedAt": "2025-04-22T09:15:36.789Z",
    "isActive": true,
    "startTime": "15:30",
    "endTime": "16:15"
  },
  "code": "SCHEDULE_CREATED"
}
```
- **Error Responses**:
  - `400` - Missing required fields:
    ```json
    {
      "success": false,
      "message": "Missing required fields",
      "code": "MISSING_FIELDS"
    }
    ```
  - `400` - Invalid date format:
    ```json
    {
      "success": false,
      "message": "Invalid date format",
      "code": "INVALID_DATE"
    }
    ```
  - `500` - Server error:
    ```json
    {
      "success": false,
      "message": "Error message details",
      "code": "SCHEDULE_CREATE_ERROR"
    }
    ```

#### Update Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules/:scheduleId`
- **Method**: `PUT`
- **Auth Required**: Yes
- **URL Parameters**:
  - `scheduleId`: ID of the schedule to update
- **Body**:
```json
{
  "semesterId": 6,
  "semesterNumber": 1,
  "classId": 18,
  "subjectId": 7,
  "teacherId": 8,        // Either teacherId or teacherUserId can be provided
  "classroomId": 3,
  "slotId": 11,
  "topic": "Dã Ngoại - Tuần 16 (Updated)",
  "sessionDate": "2025-04-20",
  "isActive": true
}
```

**Alternative using teacherUserId**:
```json
{
  "teacherUserId": "buixuanbinh",  // Can use teacher's userId instead of teacherId
  "topic": "Dã Ngoại - Tuần 16 (Updated)",
  "sessionDate": "2025-04-20"
}
```

- **Note**: Only include fields you want to update. All fields are optional. You can use either `teacherId` or `teacherUserId` to update the teacher.
- **Response**:
```json
{
  "success": true,
  "message": "Schedule updated successfully",
  "data": {
    "scheduleId": 3968,
    "semesterId": 6,
    "semesterNumber": 1,
    "classId": 18,
    "subjectId": 7,
    "teacherId": 8,
    "classroomId": 3,
    "sessionDate": "2025-04-20T00:00:00.000Z",
    "sessionWeek": "14/04/2025 to 20/04/2025",
    "slotId": 11,
    "dayOfWeek": "Sunday",
    "topic": "Dã Ngoại - Tuần 16 (Updated)",
    "subjectName": "Dã ngoại",
    "teacherName": "Bùi Xuân Bình",
    "classroomNumber": "101",
    "startTime": "09:40",
    "endTime": "10:25",
    "updatedAt": "2025-04-22T09:17:23.456Z",
    "isActive": true
  },
  "code": "SCHEDULE_UPDATED"
}
```
- **Error Responses**:
  - `404` - Schedule not found:
    ```json
    {
      "success": false,
      "message": "Schedule with ID 9999 not found",
      "code": "SCHEDULE_NOT_FOUND"
    }
    ```
  - `400` - Invalid date format:
    ```json
    {
      "success": false,
      "message": "Invalid date format",
      "code": "INVALID_DATE"
    }
    ```
  - `400` - No changes made:
    ```json
    {
      "success": false,
      "message": "No changes made to the schedule",
      "code": "NO_CHANGES"
    }
    ```
  - `500` - Server error:
    ```json
    {
      "success": false,
      "message": "Error message details",
      "code": "SCHEDULE_UPDATE_ERROR"
    }
    ```

#### Delete Schedule
- **URL**: `http://fams.io.vn/api-nodejs/schedules/:scheduleId`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Parameters**:
  - `scheduleId`: ID of the schedule to delete
- **Response**:
```json
{
  "success": true,
  "message": "Schedule with ID 3968 deleted successfully",
  "code": "SCHEDULE_DELETED"
}
```
- **Error Responses**:
  - `404` - Schedule not found:
    ```json
    {
      "success": false,
      "message": "Schedule with ID 9999 not found",
      "code": "SCHEDULE_NOT_FOUND"
    }
    ```
  - `400` - Delete failed:
    ```json
    {
      "success": false,
      "message": "Failed to delete schedule",
      "code": "DELETE_FAILED"
    }
    ```
  - `500` - Server error:
    ```json
    {
      "success": false,
      "message": "Error message details",
      "code": "SCHEDULE_DELETE_ERROR"
    }
    ```

**Note on Schedule Times**: 
Each schedule is associated with a slot (slotId) that has predefined start and end times. The API will automatically include these times in the response when available.

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
  - `className`: Lọc theo tên lớp (exact match hoặc partial match)
  - `homeroomTeacherId`: Lọc theo ID giáo viên chủ nhiệm
  - `academicYear`: Lọc theo năm học (ví dụ: "2022-2023", "2023-2024", "2024-2025")
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
      "grade": "10",
      "academicYear": "2023-2024"
    },
    // More classes...
  ]
}
```

**Ví dụ Filter:**
1. **Lọc theo khối lớp**:
   ```
   http://fams.io.vn/api-nodejs/classes?grade=10
   ```
   Lọc này sẽ trả về tất cả các lớp 10 (10A1, 10A2, 10A3, etc.).

2. **Lọc theo năm học**:
   ```
   http://fams.io.vn/api-nodejs/classes?academicYear=2023-2024
   ```
   Lọc này sẽ trả về tất cả các lớp trong năm học 2023-2024.

3. **Kết hợp điều kiện lọc**:
   ```
   http://fams.io.vn/api-nodejs/classes?grade=11&academicYear=2024-2025
   ```
   Lọc này sẽ trả về các lớp 11 trong năm học 2024-2025.

#### Get Class by ID or className
- **URL**: `http://fams.io.vn/api-nodejs/classes/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `id`: Có thể là ID của lớp (số) hoặc tên lớp (chuỗi)
- **Examples**:
  - `http://fams.io.vn/api-nodejs/classes/3` - Tìm lớp theo classId
  - `http://fams.io.vn/api-nodejs/classes/10A1` - Tìm lớp theo className
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

#### Update Class by ID or className
- **URL**: `http://fams.io.vn/api-nodejs/classes/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **URL Parameters**:
  - `id`: Có thể là ID của lớp (số) hoặc tên lớp (chuỗi)
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

#### Delete Class by ID or className with cascade effects
- **URL**: `http://fams.io.vn/api-nodejs/classes/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Parameters**:
  - `id`: Có thể là ID của lớp (số) hoặc tên lớp (chuỗi)
- **Response**:
```json
{
  "success": true,
  "message": "Class deleted successfully with cascade effects",
  "details": {
    "className": "10A3",
    "classId": 3,
    "studentsUpdated": 25,
    "schedulesDeleted": 15,
    "classDeleted": true
  }
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

**Lưu ý về cascade delete**: Khi xóa một lớp học, các tác động sau sẽ được thực hiện tự động:
- Tất cả học sinh trong lớp sẽ được cập nhật `classId` thành `null` (không còn thuộc lớp nào)
- Tất cả lịch học của lớp đó sẽ bị xóa khỏi ClassSchedule
- Dữ liệu lớp sẽ bị xóa

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
  - `Status`: Lọc theo trạng thái ('Active', 'Expired', 'Revoked', 'Lost')
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
      "Status": "Active",
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
      "Status": "Active",
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
    "Status": "Active",
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
  "ExpiryDate": "3y"
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
    "ExpiryDate": "2027-03-15T12:34:56.789Z",
    "Status": "Active"
  },
  "message": "RFID created successfully"
}
```
- **Error Responses**:
  - `400` - Missing required fields:
    ```json
    {
      "success": false,
      "message": "RFID_ID and UserID are required fields",
      "code": "MISSING_FIELDS"
    }
    ```
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
  - `400` - User already has RFID:
    ```json
    {
      "success": false,
      "message": "User tuanpv5 already has an RFID card: RFID12345",
      "code": "USER_HAS_RFID"
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
  "ExpiryDate": "2y",
  "Status": "Active"
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
    "ExpiryDate": "2026-03-15T12:34:56.789Z",
    "Status": "Active"
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
  - `400` - User already has RFID:
    ```json
    {
      "success": false,
      "message": "User dungpv1 already has an RFID card: RFID67890",
      "code": "USER_HAS_RFID"
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
    "Status": "Active",
    "user": {
      // Thông tin người dùng
    }
  }
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
- Nếu học sinh chưa có thẻ RFID: Hệ thống sẽ tạo thẻ mới

Response sẽ bao gồm cả thông tin học sinh và thẻ RFID:

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
    "Status": "Active",
    "user": {
      // Thông tin người dùng
    }
  }
}
```

## Avatar API
Base path: `/api/avatar`

Avatar API cho phép tải lên và lấy avatar của người dùng.

### Upload Avatar
- **URL**: `http://fams.io.vn/api-nodejs/avatar/upload`
- **Method**: `POST`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `avatar`: File ảnh (định dạng JPG, JPEG, PNG, GIF)
- **Response**:
```json
{
  "success": true,
  "message": "Avatar đã được tải lên thành công",
  "data": {
    "userId": "tuanpv5",
    "avatar": "http://fams.io.vn/avatars/tuanpv5-1720123456789-123456789_processed.jpg",
    "avatarUrl": "http://fams.io.vn/avatars/tuanpv5-1720123456789-123456789_processed.jpg"
  },
  "code": "AVATAR_UPLOADED"
}
```
- **Error Responses**:
  - `400` - No file uploaded:
    ```json
    {
      "success": false,
      "message": "Vui lòng upload một file hình ảnh",
      "code": "NO_FILE_UPLOADED"
    }
    ```
  - `400` - Invalid file type:
    ```json
    {
      "success": false,
      "message": "Chỉ chấp nhận file hình ảnh!",
      "code": "INVALID_FILE_TYPE"
    }
    ```
  - `404` - User not found:
    ```json
    {
      "success": false,
      "message": "Không tìm thấy người dùng",
      "code": "USER_NOT_FOUND"
    }
    ```

### Get User Avatar
- **URL**: `http://fams.io.vn/api-nodejs/avatar/:userId`
- **Method**: `GET`
- **Auth Required**: No
- **URL Parameters**:
  - `userId`: ID của người dùng cần lấy avatar
- **Response**:
```json
{
  "success": true,
  "data": {
    "userId": "tuanpv5",
    "avatar": "http://fams.io.vn/avatars/tuanpv5-1720123456789-123456789_processed.jpg",
    "avatarUrl": "http://fams.io.vn/avatars/tuanpv5-1720123456789-123456789_processed.jpg"
  },
  "code": "AVATAR_FOUND"
}
```
- **Error Responses**:
  - `404` - User not found:
    ```json
    {
      "success": false,
      "message": "Không tìm thấy người dùng",
      "code": "USER_NOT_FOUND"
    }
    ```
  - `404` - No avatar:
    ```json
    {
      "success": false,
      "message": "Người dùng chưa có avatar",
      "code": "NO_AVATAR"
    }
    ```

### Delete User Avatar
- **URL**: `http://fams.io.vn/api-nodejs/avatar`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Description**: Xóa avatar của người dùng hiện tại (dựa vào token)
- **Response**:
```json
{
  "success": true,
  "message": "Avatar đã được xóa thành công",
  "code": "AVATAR_DELETED"
}
```
- **Error Responses**:
  - `404` - User not found:
    ```json
    {
      "success": false,
      "message": "Không tìm thấy người dùng",
      "code": "USER_NOT_FOUND"
    }
    ```
  - `404` - No avatar:
    ```json
    {
      "success": false,
      "message": "Người dùng chưa có avatar",
      "code": "NO_AVATAR"
    }
    ```

### Direct Access Avatar Image
- **URL**: `http://fams.io.vn/avatars/:filename`
- **Method**: `GET`
- **Description**: Truy cập trực tiếp hình ảnh avatar từ URL được trả về trong trường `avatarUrl`

### Cải tiến mới về Avatar

#### URL đầy đủ trong Database
Hệ thống đã được cải tiến để lưu URL đầy đủ (full URL) của avatar trong database thay vì chỉ lưu đường dẫn tương đối. Điều này giúp:
- Đảm bảo avatar hiển thị đúng trên mọi trình duyệt và thiết bị
- Tránh lỗi đường dẫn khi truy cập từ các nguồn khác nhau
- Frontend có thể sử dụng URL trực tiếp mà không cần xử lý thêm

#### Xử lý hình ảnh tự động
Khi tải lên, avatar được xử lý tự động:
- Resize về kích thước 400x400 pixels
- Tối ưu hóa với định dạng JPEG chất lượng 80%
- Tệp gốc được xóa sau khi xử lý để tiết kiệm không gian lưu trữ

#### Cấu hình Nginx cho Avatar
Nginx được cấu hình để phục vụ tệp avatar với location riêng:
```nginx
location /avatars/ {
    proxy_pass http://api-nodejs:3000/avatars/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### Xử lý Domain tự động
Hệ thống tự động phát hiện và sử dụng domain thích hợp:
- Lấy domain từ headers HTTP request
- Tự động xác định protocol (http/https)
- Fallback về domain mặc định nếu không xác định được

### Sử dụng Avatar trong Frontend

#### Upload Avatar
```javascript
// Sử dụng FormData để upload file
const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  try {
    const response = await fetch('http://fams.io.vn/api-nodejs/avatar/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` // Token xác thực
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Hiển thị avatar mới
      const avatarUrl = data.data.avatarUrl;
      // Lưu avatarUrl vào state hoặc global store của ứng dụng
    } else {
      console.error('Upload error:', data.message);
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
  }
};
```

#### Hiển thị Avatar trong React
```jsx
import React, { useState, useEffect } from 'react';

const UserAvatar = ({ userId }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await fetch(`http://fams.io.vn/api-nodejs/avatar/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setAvatarUrl(data.data.avatarUrl);
        } else {
          // Sử dụng avatar mặc định nếu người dùng không có avatar
          setAvatarUrl('/default-avatar.png');
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
        setError('Failed to load avatar');
        // Sử dụng avatar mặc định nếu có lỗi
        setAvatarUrl('/default-avatar.png');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvatar();
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="avatar-container">
      <img 
        src={avatarUrl} 
        alt={`${userId}'s avatar`} 
        className="user-avatar"
        onError={(e) => {
          // Fallback nếu không tải được avatar
          e.target.src = '/default-avatar.png';
        }}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default UserAvatar;
```

#### Xóa Avatar
```javascript
const deleteAvatar = async () => {
  try {
    const response = await fetch('http://fams.io.vn/api-nodejs/avatar', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`, // Token xác thực
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Avatar đã được xóa thành công
      // Cập nhật giao diện người dùng về avatar mặc định
    } else {
      console.error('Delete error:', data.message);
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
  }
};
```

### Lưu ý về Avatar API

1. **Giới hạn kích thước file**:
   - Kích thước tối đa: 5MB
   - Định dạng hỗ trợ: JPG, JPEG, PNG, GIF

2. **Xử lý hình ảnh**:
   - Hình ảnh tải lên sẽ được tự động xử lý để tạo ra phiên bản tối ưu
   - Kích thước 400x400 pixels, chất lượng JPEG 80%
   - File gốc sẽ bị xóa sau khi xử lý

3. **Đường dẫn lưu trữ**:
   - Avatar được lưu trong thư mục `/public/avatars/` trên server
   - Tên file được tạo tự động theo định dạng: `{userId}-{timestamp}-{random}_processed.jpg`

4. **Cơ chế cache**:
   - Khách hàng (frontend) nên triển khai cache cho avatar để giảm tải server
   - Thêm version query string (ví dụ: `?v=1`) khi URL avatar thay đổi để cập nhật cache

5. **Tích hợp với API khác**:
   - Thông tin avatar sẽ được trả về trong `/api/auth/me` và `/api/users/details/:id`
   - Khi cập nhật thông tin người dùng, avatar sẽ không bị ảnh hưởng

6. **Docker và triển khai**:
   - File avatar được lưu trong thư mục `/public/avatars/` nên cần đảm bảo thư mục này tồn tại và có đủ quyền ghi
   - Khi sử dụng Docker, volume cho thư mục `/public/avatars/` đã được cấu hình trong Dockerfile

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

# Hướng dẫn Sử dụng API Cập nhật Thống Nhất Người Dùng trong FAMS

API này được thiết kế để cung cấp một điểm cuối duy nhất cho việc cập nhật thông tin người dùng thuộc bất kỳ vai trò nào (Student, Teacher, Parent). API sẽ tự động phát hiện vai trò của userId và cập nhật thông tin tương ứng.

## Thông tin cơ bản

- **URL**: `http://fams.io.vn/api-nodejs/users/update/:userId`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Description**: Cập nhật thông tin người dùng dựa vào userId, tự động xác định và cập nhật theo vai trò tương ứng
- **Parameters**:
  - `userId`: ID của người dùng cần cập nhật (truyền vào URL)

## Cấu trúc Dữ liệu Request

Request body có thể chứa bất kỳ trường dữ liệu nào dựa trên vai trò của người dùng. API sẽ tự động xác định vai trò và cập nhật các trường tương ứng.

### Các trường cơ bản (áp dụng cho mọi vai trò)

```json
{
  "email": "example@gmail.com",
  "backup_email": "backup@gmail.com",
  "name": "Họ và tên mới",
  "password": "newpassword",
  "rfid": {
    "RFID_ID": "RFID12345",
    "ExpiryDate": "2y"
  }
}
```

### Trường `rfid`

Tất cả các vai trò đều có thể cập nhật thông tin thẻ RFID bằng cách thêm trường `rfid`:

```json
"rfid": {
  "RFID_ID": "RFID12345",  // ID của thẻ RFID (bắt buộc nếu muốn cập nhật RFID)
  "ExpiryDate": "2y"        // Thời hạn (có thể là "1y", "2y", "3y" hoặc ngày cụ thể)
}
```

### Trường dành cho Student

```json
{
  "firstName": "Văn",           // Tên
  "lastName": "Nguyễn",         // Họ
  "fullName": "Nguyễn Văn A",   // Họ và tên đầy đủ
  "dateOfBirth": "2005-05-15",  // Ngày sinh
  "gender": true,               // Giới tính (true: Nam, false: Nữ) hoặc "Male"/"Female"
  "address": "123 ABC Street",  // Địa chỉ
  "phone": "0987654321",        // Số điện thoại
  "classId": 2,                 // ID lớp học
  "batchId": 1,                 // ID khóa học
  "isActive": true              // Trạng thái hoạt động
}
```

### Trường dành cho Teacher

```json
{
  "firstName": "Thị",             // Tên
  "lastName": "Trần",             // Họ
  "fullName": "Trần Thị B",       // Họ và tên đầy đủ
  "dateOfBirth": "1980-01-01",    // Ngày sinh
  "gender": false,                // Giới tính (true: Nam, false: Nữ) hoặc "Male"/"Female"
  "address": "456 XYZ Street",    // Địa chỉ
  "phone": "0123456789",          // Số điện thoại
  "major": "Toán, Lý, Hóa",       // Chuyên ngành
  "degree": "Tiến sĩ",            // Học vị
  "weeklyCapacity": 15,           // Số giờ dạy mỗi tuần
  "isActive": true                // Trạng thái hoạt động
}
```

### Trường dành cho Parent

```json
{
  "firstName": "Văn",           // Tên
  "lastName": "Lê",             // Họ
  "fullName": "Lê Văn C",       // Họ và tên đầy đủ
  "career": "Kỹ sư",            // Nghề nghiệp
  "phone": "0912345678",        // Số điện thoại
  "gender": true,               // Giới tính (true: Nam, false: Nữ) hoặc "Male"/"Female"
  "isActive": true,             // Trạng thái hoạt động
  "studentIds": [1, 2, 3]       // Danh sách ID học sinh là con của phụ huynh này
}
```

## Xử lý Đặc biệt

### Cập nhật Tên

Hệ thống hỗ trợ nhiều cách cập nhật tên:

1. **Cập nhật fullName**: API sẽ tự động tách và cập nhật `firstName` và `lastName`
2. **Cập nhật firstName/lastName**: API sẽ tự động tạo `fullName` từ `firstName` và `lastName`

Ví dụ, nếu gửi:
```json
{
  "fullName": "Nguyễn Văn A"
}
```

Hệ thống sẽ tự động tách thành:
- `firstName`: "A"
- `lastName`: "Nguyễn Văn"

### Cập nhật RFID

- Nếu người dùng đã có thẻ RFID: Hệ thống sẽ cập nhật thẻ hiện có
- Nếu người dùng chưa có thẻ RFID: Hệ thống sẽ tạo thẻ mới

Trường `ExpiryDate` có thể có các định dạng:
- "1y", "2y", "3y": Thời hạn 1, 2, 3 năm từ ngày hiện tại
- "2025-12-31": Ngày hết hạn cụ thể
- Nếu không cung cấp: Mặc định là 3 năm

### Cập nhật Quan hệ Phụ huynh-Học sinh

Khi cập nhật phụ huynh, bạn có thể thêm học sinh mới vào danh sách con của họ bằng cách cung cấp `studentIds`. API sẽ tự động tạo các quan hệ phụ huynh-học sinh cần thiết.

**Lưu ý**: API hiện chỉ hỗ trợ thêm quan hệ với các học sinh đã tồn tại, không tạo học sinh mới.

## Ví dụ Sử Dụng

### Cập nhật Thông tin Student

```json
// PUT http://fams.io.vn/api-nodejs/users/update/dungahst1
{
  "fullName": "Đặng Hữu Dũng",
  "phone": "0763037404",
  "address": "Điện Biên",
  "dateOfBirth": "2010-10-07",
  "classId": 2,
  "rfid": {
    "RFID_ID": "STUD12345",
    "ExpiryDate": "2y"
  }
}
```

### Cập nhật Thông tin Teacher

```json
// PUT http://fams.io.vn/api-nodejs/users/update/dunglv121
{
  "firstName": "Lê Việt",
  "lastName": "Dũng",
  "phone": "0764543211",
  "major": "Hóa học, Sinh học",
  "degree": "Thạc sĩ Giáo dục",
  "weeklyCapacity": 12,
  "address": "Hà Nội",
  "rfid": {
    "RFID_ID": "TEACH67890",
    "ExpiryDate": "3y"
  }
}
```

### Cập nhật Thông tin Parent

```json
// PUT http://fams.io.vn/api-nodejs/users/update/lanhpr1
{
  "fullName": "Lê Thị Lan",
  "phone": "0987654321",
  "career": "Giáo viên",
  "studentIds": [1, 2]
}
```

### Chỉ Cập nhật RFID

```json
// PUT http://fams.io.vn/api-nodejs/users/update/dungahst1
{
  "rfid": {
    "RFID_ID": "STUD98765",
    "ExpiryDate": "2026-12-31"
  }
}
```

## Phản hồi API

### Phản hồi Thành công

```json
{
  "success": true,
  "message": "User dungahst1 updated successfully",
  "data": {
    "user": {
      "userId": "dungahst1",
      "email": "dungahst1@fams.edu.vn",
      "role": "Student"
    },
    "role": {
      "type": "student",
      "student": {
        // Thông tin student đã cập nhật
      },
      "class": {
        // Thông tin lớp
      },
      "parents": [
        // Danh sách phụ huynh
      ],
      "rfid": {
        // Thông tin RFID (nếu có)
      }
    }
  }
}
```

### Phản hồi Lỗi

```json
{
  "success": false,
  "message": "User with ID invalid_user not found",
  "code": "USER_NOT_FOUND"
}
```

## Mã Lỗi

- `USER_NOT_FOUND`: Không tìm thấy người dùng
- `STUDENT_RECORD_NOT_FOUND`: Không tìm thấy bản ghi học sinh
- `TEACHER_RECORD_NOT_FOUND`: Không tìm thấy bản ghi giáo viên
- `PARENT_RECORD_NOT_FOUND`: Không tìm thấy bản ghi phụ huynh
- `UPDATE_FAILED`: Cập nhật thất bại vì lỗi khác

## Lưu ý

1. API này tuân thủ nguyên tắc cập nhật từng phần (partial update), chỉ cập nhật các trường được cung cấp trong request
2. Đối với các trường đặc biệt như `fullName`, API sẽ tự động xử lý tách và kết hợp với `firstName` và `lastName`
3. Khi cung cấp trường `gender`, bạn có thể sử dụng `true`/`false`, `"Male"`/`"Female"` hoặc `"true"`/`"false"`
4. Thông tin RFID sẽ được tự động cập nhật hoặc tạo mới tùy thuộc vào trạng thái hiện tại

## User Creation API with Avatar Upload

The FAMS system provides a unified API endpoint for creating users of different roles (student, teacher, parent) with the ability to upload avatars.

### Endpoint

```
POST http://fams.io.vn/api-nodejs/users/create
```

### Authentication

This endpoint requires admin authentication. Include the authorization token in the header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Request Format

Use **multipart/form-data** format to support file upload.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| role | string | User role: "student", "teacher", or "parent" |
| firstName | string | User's first name |
| lastName | string | User's last name |
| phone | string | Contact phone number |
| avatar | file | User's profile picture (optional) |

### Common Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| email | string | Primary email address |
| backup_email | string | Backup email address |
| gender | string | "Male" or "Female" |
| dateOfBirth | string | Date in YYYY-MM-DD format |
| address | string | Physical address |

### Role-Specific Fields

#### Student Fields

| Field | Type | Description |
|-------|------|-------------|
| parentNames | array | Array of parent names |
| parentCareers | array | Array of parent careers |
| parentPhones | array | Array of parent phone numbers |
| parentGenders | array | Array of parent genders (true for Male, false for Female) |
| parentEmails | array | Array of parent email addresses |

#### Teacher Fields

| Field | Type | Description |
|-------|------|-------------|
| major | string | Teacher's specialization |
| weeklyCapacity | number | Weekly teaching hours capacity |
| degree | string | Academic degree |

#### Parent Fields

| Field | Type | Description |
|-------|------|-------------|
| career | string | Parent's career |
| childrenIds | array | Array of existing student IDs to link with this parent |

### Example Request

Here's an example of a unified form that includes fields for all user types:

```json
{
  "role": "student",
  "firstName": "Thành",
  "lastName": "Nguyễn Phước",
  "email": "thanhnp@gmail.com",
  "backup_email": "thanhnp@gmail.com",
  "phone": "0987654321",
  "gender": "Male",
  "dateOfBirth": "2005-05-15",
  "address": "123 Đường ABC, Thành phố XYZ",
  "parentNames": ["Nguyễn Phước Hải", "Trần Thị Mai"],
  "parentCareers": ["Kỹ sư", "Giáo viên"],
  "parentPhones": ["0123456789", "0987654321"],
  "parentGenders": [true, false],
  "parentEmails": ["nph@gmail.com", "ttm@gmail.com"],
  "major": "Công nghệ",
  "degree": "Cử nhân Sư phạm",
  "weeklyCapacity": 10
}
```

> **Note**: When submitting the form, only fields relevant to the specified role will be processed. You can include all fields in a single form, making it easier to use the same form for different user types.

### Avatar Upload

To upload an avatar:
1. Use `multipart/form-data` encoding
2. Include the avatar file in the `avatar` field
3. Only image files (jpg, jpeg, png, gif) are accepted
4. Maximum file size: 5MB

### Response Format

On successful creation:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "userId": "thanhngst12345",
      "email": "thanhnp@gmail.com",
      "role": "student",
      "avatar": "http://fams.io.vn/avatars/student/thanhngst12345.jpg"
      // Additional user details
    },
    "student": {
      // Student-specific information
    },
    // Additional role-specific data
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Missing required fields or invalid data |
| 401 | Unauthorized - Invalid or missing authentication token |
| 403 | Forbidden - User doesn't have admin privileges |
| 500 | Server Error - Internal processing error |

### JavaScript Fetch Example

```javascript
const formData = new FormData();
formData.append('role', 'student');
formData.append('firstName', 'Thành');
formData.append('lastName', 'Nguyễn Phước');
formData.append('phone', '0987654321');
formData.append('email', 'thanhnp@gmail.com');
// Add more fields as needed
formData.append('avatar', fileInputElement.files[0]); // From input[type='file']

fetch('http://fams.io.vn/api-nodejs/users/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

# Attendance API Guide

## Overview
This API provides functionality for managing attendance records in the FAMS system. It allows retrieving, creating, and updating attendance logs for students, teachers, and classes.

## Authentication
All endpoints require authentication. Include a Bearer token in the Authorization header:
```
Authorization: Bearer your_jwt_token
```

## Base URL
```
/api/attendance
```

## Endpoints

### Get All Attendance Logs
```
GET /api/attendance
```

Retrieves attendance logs with various filters.

**Query Parameters:**
- `userId`: Filter by user ID (string)
- `classId`: Filter by class ID (number)
- `date`: Filter by single date (format: YYYY-MM-DD)
- `dateFrom`: Filter by start date for a range (format: YYYY-MM-DD)
- `dateTo`: Filter by end date for a range (format: YYYY-MM-DD)
- `slotNumber`: Filter by slot number (number)
- `slotId`: Filter by slot ID (number)
- `subjectId`: Filter by subject ID (number)
- `status`: Filter by status ('Present', 'Late', 'Absent', 'Not Now')
- `teacherName`: Filter by teacher name (string)
- `semesterNumber`: Filter by semester number (number)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of records per page (default: 10)

**Example Request:**
```
GET /api/attendance?classId=17&date=2025-04-23&status=Late
```

**Example Request with Date Range:**
```
GET /api/attendance?classId=17&dateFrom=2025-04-01&dateTo=2025-04-30&slotId=19
```

**Example Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "pagination": {
    "current": 1,
    "pages": 1
  },
  "data": [
    {
      "attendanceId": 2,
      "scheduleId": 1,
      "userId": "thanhnpst1",
      "checkIn": null,
      "checkInFace": "base64_encoded_image_data",
      "note": "",
      "status": "Late",
      "semesterNumber": 1,
      "isActive": true,
      "userRole": "student",
      "teacherId": 5,
      "teacherName": "Lê Văn Quân",
      "subjectId": 1,
      "subjectName": "Toán",
      "classId": 17,
      "className": "10A1",
      "studentId": 1,
      "studentName": "Nguyễn Phước Thành",
      "slotNumber": 9,
      "dayOfWeek": "Tuesday",
      "startTime": "15:30",
      "endTime": "16:15",
      "sessionDate": "2025-04-23T00:00:00.000Z",
      "topic": "Toán - Tuần 1",
      "avatar": "/avatars/students/thanhnpst1.jpg"
    },
    // More attendance records...
  ]
}
```

### Get Attendance Logs By Date Range
```
GET /api/attendance/date-range/:dateFrom/:dateTo
```

Retrieves attendance logs for a specific date range.

**Path Parameters:**
- `dateFrom`: Start date in YYYY-MM-DD format (string)
- `dateTo`: End date in YYYY-MM-DD format (string)

**Query Parameters:**
- `userId`: Filter by user ID (string)
- `classId`: Filter by class ID (number)
- `slotNumber`: Filter by slot number (number)
- `slotId`: Filter by slot ID (number)
- `subjectId`: Filter by subject ID (number)
- `status`: Filter by status ('Present', 'Late', 'Absent', 'Not Now')
- `teacherName`: Filter by teacher name (string)
- `semesterNumber`: Filter by semester number (number)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of records per page (default: 10)

**Example Request:**
```
GET /api/attendance/date-range/2025-04-01/2025-04-30?classId=17&slotId=19
```

**Example Response:**
```json
{
  "success": true,
  "count": 15,
  "total": 15,
  "pagination": {
    "current": 1,
    "pages": 1
  },
  "data": [
    {
      "attendanceId": 2,
      "scheduleId": 1,
      "userId": "thanhnpst1",
      "checkIn": null,
      "checkInFace": "base64_encoded_image_data",
      "note": "",
      "status": "Late",
      "semesterNumber": 1,
      "isActive": true,
      "userRole": "student",
      "teacherId": 5,
      "teacherName": "Lê Văn Quân",
      "subjectId": 1,
      "subjectName": "Toán",
      "classId": 17,
      "className": "10A1",
      "studentId": 1,
      "studentName": "Nguyễn Phước Thành",
      "slotNumber": 9,
      "dayOfWeek": "Tuesday",
      "startTime": "15:30",
      "endTime": "16:15",
      "sessionDate": "2025-04-23T00:00:00.000Z",
      "topic": "Toán - Tuần 1",
      "avatar": "/avatars/students/thanhnpst1.jpg"
    },
    // More attendance records...
  ]
}
```

### Get Attendance Logs for a User
```
GET /api/attendance/user/:userId
```

Retrieves attendance logs for a specific user.

**Path Parameters:**
- `userId`: ID of the user (string)

**Query Parameters:**
- `classId`: Filter by class ID (number)
- `date`: Filter by single date (format: YYYY-MM-DD)
- `dateFrom`: Filter by start date for a range (format: YYYY-MM-DD)
- `dateTo`: Filter by end date for a range (format: YYYY-MM-DD)
- `slotNumber`: Filter by slot number (number)
- `slotId`: Filter by slot ID (number)
- `subjectId`: Filter by subject ID (number)
- `status`: Filter by status ('Present', 'Late', 'Absent', 'Not Now')
- `page`: Page number for pagination (default: 1)
- `limit`: Number of records per page (default: 10)

**Example Request:**
```
GET /api/attendance/user/thanhnpst1?dateFrom=2025-04-01&dateTo=2025-04-30&slotId=19
```

**Example Response:**
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "pagination": {
    "current": 1,
    "pages": 1
  },
  "data": [
    {
      "attendanceId": 2,
      "scheduleId": 1,
      "userId": "thanhnpst1",
      "checkIn": null,
      "checkInFace": "base64_encoded_image_data",
      "note": "",
      "status": "Late",
      "semesterNumber": 1,
      "isActive": true,
      "userRole": "student",
      "teacherId": 5,
      "teacherName": "Lê Văn Quân",
      "subjectId": 1,
      "subjectName": "Toán",
      "classId": 17,
      "className": "10A1",
      "studentId": 1,
      "studentName": "Nguyễn Phước Thành",
      "slotNumber": 9,
      "dayOfWeek": "Tuesday",
      "startTime": "15:30",
      "endTime": "16:15",
      "sessionDate": "2025-04-23T00:00:00.000Z",
      "topic": "Toán - Tuần 1",
      "avatar": "/avatars/students/thanhnpst1.jpg"
    },
    // More attendance records...
  ]
}
```

### Get Attendance Summary for a User
```
GET /api/attendance/summary/:userId
```

Retrieves attendance summary statistics for a specific user.

**Path Parameters:**
- `userId`: ID of the user (string)

**Query Parameters:**
- `semesterNumber`: Filter by semester number (number)
- `classId`: Filter by class ID (number)
- `subjectId`: Filter by subject ID (number)

**Example Request:**
```
GET /api/attendance/summary/thanhnpst1?semesterNumber=1
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "present": 7,
    "late": 2,
    "absent": 1,
    "notNow": 0,
    "percentages": {
      "present": "70.00",
      "late": "20.00",
      "absent": "10.00"
    }
  }
}
```

### Get Attendance Logs for Class, Date and Slot
```
GET /api/attendance/class/:classId/date/:date/slot/:slotNumber
```

Retrieves attendance logs for a specific class, date, and slot.

**Path Parameters:**
- `classId`: ID of the class (number)
- `date`: Date in YYYY-MM-DD format (string)
- `slotNumber`: Number of the slot (number)

**Query Parameters:**
- `subjectId`: Filter by subject ID (number)
- `status`: Filter by status ('Present', 'Late', 'Absent', 'Not Now')
- `teacherName`: Filter by teacher name (string)
- `userId`: Filter by user ID (string)
- `slotId`: Filter by slot ID (number)

**Example Request:**
```
GET /api/attendance/class/17/date/2025-04-23/slot/9?subjectId=9
```

**Example Response:**
```json
{
  "success": true,
  "count": 25,
  "total": 25,
  "data": [
    {
      "attendanceId": 42,
      "scheduleId": 15,
      "userId": "thanhnpst1",
      "checkIn": null,
      "checkInFace": "base64_encoded_image_data",
      "note": "",
      "status": "Present",
      "semesterNumber": 1,
      "isActive": true,
      "userRole": "student",
      "teacherId": 5,
      "teacherName": "Lê Văn Quân",
      "subjectId": 9,
      "subjectName": "Vật Lý",
      "classId": 17,
      "className": "10A1",
      "studentId": 1,
      "studentName": "Nguyễn Phước Thành",
      "slotNumber": 9,
      "dayOfWeek": "Tuesday",
      "startTime": "15:30",
      "endTime": "16:15",
      "sessionDate": "2025-04-23T00:00:00.000Z",
      "topic": "Vật Lý - Tuần 1",
      "avatar": "/avatars/students/thanhnpst1.jpg"
    },
    // More attendance records...
  ]
}
```

### Get Attendance Logs for Class and Slot
```
GET /api/attendance/class/:classId/slot/:slotId
```

Retrieves attendance logs for a specific class and slot across all dates or date range.

**Path Parameters:**
- `classId`: ID of the class (number)
- `slotId`: ID of the slot (number)

**Query Parameters:**
- `date`: Filter by single date (format: YYYY-MM-DD)
- `dateFrom`: Filter by start date (format: YYYY-MM-DD)
- `dateTo`: Filter by end date (format: YYYY-MM-DD)
- `subjectId`: Filter by subject ID (number)
- `status`: Filter by status ('Present', 'Late', 'Absent', 'Not Now')
- `teacherName`: Filter by teacher name (string)
- `userId`: Filter by user ID (string)

**Example Request:**
```
GET /api/attendance/class/17/slot/19?dateFrom=2025-04-01&dateTo=2025-04-30
```

**Example Response:**
```json
{
  "success": true,
  "count": 100,
  "total": 100,
  "data": [
    {
      "attendanceId": 42,
      "scheduleId": 15,
      "userId": "thanhnpst1",
      "checkIn": null,
      "checkInFace": "base64_encoded_image_data",
      "note": "",
      "status": "Present",
      "semesterNumber": 1,
      "isActive": true,
      "userRole": "student",
      "teacherId": 5,
      "teacherName": "Lê Văn Quân",
      "subjectId": 9,
      "subjectName": "Vật Lý",
      "classId": 17,
      "className": "10A1",
      "studentId": 1,
      "studentName": "Nguyễn Phước Thành",
      "slotNumber": 9,
      "dayOfWeek": "Tuesday",
      "startTime": "15:30",
      "endTime": "16:15",
      "sessionDate": "2025-04-02T00:00:00.000Z",
      "topic": "Vật Lý - Tuần 1",
      "avatar": "/avatars/students/thanhnpst1.jpg"
    },
    // More attendance records...
  ]
}
```

### Get Attendance Log by ID
```
GET /api/attendance/:id
```

Retrieves an attendance log by its ID.

**Path Parameters:**
- `id`: ID of the attendance log (number)

**Example Request:**
```
GET /api/attendance/42
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "attendanceId": 42,
    "scheduleId": 15,
    "userId": "thanhnpst1",
    "checkIn": null,
    "checkInFace": "base64_encoded_image_data",
    "note": "",
    "status": "Present",
    "semesterNumber": 1,
    "isActive": true,
    "userRole": "student",
    "teacherId": 5,
    "teacherName": "Lê Văn Quân",
    "subjectId": 9,
    "subjectName": "Vật Lý",
    "classId": 17,
    "className": "10A1",
    "studentId": 1,
    "studentName": "Nguyễn Phước Thành",
    "slotNumber": 9,
    "dayOfWeek": "Tuesday",
    "startTime": "15:30",
    "endTime": "16:15",
    "sessionDate": "2025-04-23T00:00:00.000Z",
    "topic": "Vật Lý - Tuần 1",
    "avatar": "/avatars/students/thanhnpst1.jpg"
  }
}
```

### Create New Attendance Log
```
POST /api/attendance
```

Creates a new attendance log.

**Request Body:**
```json
{
  "scheduleId": 15,
  "userId": "thanhnpst1",
  "status": "Present",
  "note": "Student arrived on time",
  "semesterNumber": 1,
  "userRole": "student",
  "teacherId": 5,
  "teacherName": "Lê Văn Quân",
  "subjectId": 9,
  "subjectName": "Vật Lý",
  "classId": 17,
  "className": "10A1",
  "studentId": 1,
  "studentName": "Nguyễn Phước Thành"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Attendance log created successfully",
  "data": {
    "attendanceId": 43,
    "scheduleId": 15,
    "userId": "thanhnpst1",
    "checkIn": null,
    "checkInFace": "base64_encoded_image_data",
    "note": "Student arrived on time",
    "status": "Present",
    "semesterNumber": 1,
    "isActive": true,
    "userRole": "student",
    "teacherId": 5,
    "teacherName": "Lê Văn Quân",
    "subjectId": 9,
    "subjectName": "Vật Lý",
    "classId": 17,
    "className": "10A1",
    "studentId": 1,
    "studentName": "Nguyễn Phước Thành",
    "createdAt": "2025-04-23T14:25:36.779Z",
    "updatedAt": "2025-04-23T14:25:36.779Z"
  }
}
```

### Update Attendance Log
```
PUT /api/attendance/:id
```

Updates an attendance log by its ID.

**Path Parameters:**
- `id`: ID of the attendance log (number)

**Request Body:**
```json
{
  "status": "Late",
  "note": "Student arrived 5 minutes late",
  "checkIn": "2025-04-23T07:05:00.000Z",
  "checkInFace": "base64_encoded_image_data"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Attendance log updated successfully",
  "data": {
    "attendanceId": 42,
    "scheduleId": 15,
    "userId": "thanhnpst1",
    "checkIn": "2025-04-23T07:05:00.000Z",
    "checkInFace": "base64_encoded_image_data",
    "note": "Student arrived 5 minutes late",
    "status": "Late",
    "semesterNumber": 1,
    "isActive": true,
    "userRole": "student",
    "teacherId": 5,
    "teacherName": "Lê Văn Quân",
    "subjectId": 9,
    "subjectName": "Vật Lý",
    "classId": 17,
    "className": "10A1",
    "studentId": 1,
    "studentName": "Nguyễn Phước Thành",
    "createdAt": "2025-04-23T14:25:36.779Z",
    "updatedAt": "2025-04-23T14:30:11.454Z",
    "avatar": "/avatars/students/thanhnpst1.jpg"
  }
}
```

### Update Attendance for Class, Date and Slot
```
PUT /api/attendance/class/:classId/date/:date/slot/:slotNumber
```

Updates attendance status for all students in a class for a specific date and slot.

**Path Parameters:**
- `classId`: ID of the class (number)
- `date`: Date in YYYY-MM-DD format (string)
- `slotNumber`: Number of the slot (number)

**Request Body:**
```json
{
  "subjectId": 9,
  "status": "Late",
  "note": "Class delayed due to school assembly",
  "slotId": 19,
  "checkInFace": "base64_encoded_image_data"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Updated 25 attendance logs with 0 errors",
  "data": {
    "updated": [
      {
        "attendanceId": 42,
        "scheduleId": 15,
        "userId": "thanhnpst1",
        "checkIn": null,
        "checkInFace": "base64_encoded_image_data",
        "note": "Class delayed due to school assembly",
        "status": "Late",
        "semesterNumber": 1,
        "isActive": true,
        "userRole": "student",
        "teacherId": 5,
        "teacherName": "Lê Văn Quân",
        "subjectId": 9,
        "subjectName": "Vật Lý",
        "classId": 17,
        "className": "10A1",
        "studentId": 1,
        "studentName": "Nguyễn Phước Thành"
      },
      // More updated attendance records...
    ],
    "errors": []
  }
}
```

### Batch Update Attendance Logs
```
POST /api/attendance/batch-update
```

Updates multiple attendance logs at once.

**Request Body:**
```json
{
  "attendanceUpdates": [
    {
      "attendanceId": 42,
      "status": "Present",
      "note": "Student arrived on time",
      "checkInFace": "base64_encoded_image_data_1"
    },
    {
      "attendanceId": 43,
      "status": "Late",
      "note": "Student arrived 10 minutes late",
      "checkInFace": "base64_encoded_image_data_2"
    },
    {
      "attendanceId": 44,
      "status": "Absent",
      "note": "Student absence reported by parent"
    }
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Processed 3 updates with 0 errors",
  "data": {
    "updated": [
      {
        "attendanceId": 42,
        "scheduleId": 15,
        "userId": "thanhnpst1",
        "checkIn": null,
        "checkInFace": "base64_encoded_image_data_1",
        "note": "Student arrived on time",
        "status": "Present",
        "semesterNumber": 1,
        "isActive": true,
        "userRole": "student",
        "teacherId": 5,
        "teacherName": "Lê Văn Quân",
        "subjectId": 9,
        "subjectName": "Vật Lý",
        "classId": 17,
        "className": "10A1",
        "studentId": 1,
        "studentName": "Nguyễn Phước Thành"
      },
      // More updated attendance records...
    ],
    "errors": []
  }
}
```

## Status Codes
- 200: Success
- 201: Created (for POST requests)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Error Response Format
```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": "Original error message",
  "code": "ERROR_CODE"
}
```

## Notes
- When searching for users in attendance records, the `userId` field is of type String.
- For filtering by date, the format should be YYYY-MM-DD (e.g., 2025-04-23).
- Date range filtering is supported through either the dedicated endpoint or using the dateFrom and dateTo query parameters.
- The difference between `slotId` and `slotNumber`:
  - `slotId` is the unique identifier for a slot in the ScheduleFormat collection (e.g., 19)
  - `slotNumber` is a human-readable number for the slot during the day (e.g., 9 for the 9th period)
- Possible status values for attendance logs are: 'Present', 'Late', 'Absent', 'Not Now'.
- The batch update endpoint is useful for updating attendance for multiple students at once.
- When updating attendance for an entire class, use the class-specific endpoints for better performance.
- Attendance records returned by the API now include:
  - Slot details (slotNumber, dayOfWeek, startTime, endTime)
  - Session details (sessionDate, topic)
  - User avatar (if available)
  - Check-in face image data (checkInFace field, when available)

### About Avatar and Check-in Face Data
- `avatar`: Path to the user's avatar image. Can be used to display user profiles in attendance lists.
- `checkInFace`: Path to the facial image captured during check-in. This is a relative path to the image file on the server (e.g., "/check-in-images/2025-04-23/user123_1234567890.jpg").

When creating or updating attendance records, you can include the path to the check-in image in the `checkInFace` field. The system will store this path and make it available in subsequent queries.

To serve the images:
- Avatar images: available at `/avatars/[path]`
- Check-in face images: available at `/check-in-images/[path]`

### Check-In API
```
POST /api/attendance/check-in
```

Allows users to check in for a class. This endpoint simplifies attendance tracking by requiring only the minimum necessary information and automatically filling in other fields.

**Request Body:**
```json
{
  "userId": "thanhnpst1",
  "scheduleId": 15,
  "status": "Present",
  "checkInFace": "/check-in-images/2025-04-23/thanhnpst1_1234567890.jpg"
}
```

**Notes:**
- The `status` field is optional and defaults to "Present"
- The `checkInFace` field is optional and contains the path to the face image
- The check-in time is automatically set to the current time
- If an attendance record already exists, it will be updated
- If no record exists, a new one will be created with all necessary details

**Example Response:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "attendanceId": 45,
    "scheduleId": 15,
    "userId": "thanhnpst1",
    "checkIn": "2025-04-24T08:30:15.123Z",
    "checkInFace": "/check-in-images/2025-04-24/thanhnpst1_1587632541.jpg",
    "note": "Auto check-in at 08:30:15",
    "status": "Present",
    "semesterNumber": 1,
    "isActive": true,
    "userRole": "student",
    "teacherId": 5,
    "teacherName": "Lê Văn Quân",
    "subjectId": 9,
    "subjectName": "Vật Lý",
    "classId": 17,
    "className": "10A1",
    "studentId": 1,
    "studentName": "Nguyễn Phước Thành",
    "slotNumber": 9,
    "dayOfWeek": "Wednesday",
    "startTime": "08:00",
    "endTime": "08:45",
    "sessionDate": "2025-04-24T00:00:00.000Z",
    "topic": "Vật Lý - Tuần 2",
    "avatar": "/avatars/students/thanhnpst1.jpg",
    "createdAt": "2025-04-24T08:30:15.123Z",
    "updatedAt": "2025-04-24T08:30:15.123Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields:
  ```json
  {
    "success": false,
    "message": "userId and scheduleId are required",
    "code": "MISSING_REQUIRED_FIELDS"
  }
  ```
- `404` - Schedule not found:
  ```json
  {
    "success": false,
    "message": "Schedule not found",
    "code": "RESOURCE_NOT_FOUND"
  }
  ```
- `404` - User not found:
  ```json
  {
    "success": false,
    "message": "User not found",
    "code": "RESOURCE_NOT_FOUND"
  }
  ```

### Jetson Nano Facial Recognition Check-In API
```
POST /api/attendance/jetson-check-in
```

Special endpoint for Jetson Nano devices equipped with cameras for facial recognition-based attendance. This endpoint handles the complete check-in process including RFID verification, schedule matching, and attendance status determination based on time.

**Request Body:**
```json
{
  "userId": "thanhnpst1",
  "rfidId": "RFID12345",
  "checkInTime": "2025-04-24T08:05:30.000Z",
  "classroomId": 12,
  "checkInFace": "/check-in-images/2025-04-24/thanhnpst1_1587632541.jpg"
}
```

**Notes:**
- `userId`: The user ID of the person checking in
- `rfidId`: The RFID card ID scanned by the device
- `checkInTime`: ISO date-time string of when the check-in occurred
- `classroomId`: ID of the classroom where the Jetson device is located
- `checkInFace`: (Optional) Path to the captured facial image

**Process:**
1. Verifies that the RFID card belongs to the specified user
2. Finds any scheduled classes for the classroom at the given time
3. Checks if the user is scheduled to be in that classroom (as student or teacher)
4. Determines attendance status based on check-in time:
   - On time: Marked as "Present"
   - 15+ minutes late: Marked as "Late"
   - 30+ minutes late: Marked as "Absent"
5. Creates or updates the appropriate attendance record

**Example Success Response:**
```json
{
  "success": true,
  "message": "Check-in successful. Attendance marked as Present",
  "data": {
    "attendanceId": 45,
    "scheduleId": 15,
    "userId": "thanhnpst1",
    "checkIn": "2025-04-24T08:05:30.000Z",
    "checkInFace": "/check-in-images/2025-04-24/thanhnpst1_1587632541.jpg",
    "note": "Facial recognition check-in at 08:05:30 via Jetson Nano",
    "status": "Present",
    "semesterNumber": 1,
    "isActive": true,
    "userRole": "student",
    "teacherId": 5,
    "teacherName": "Lê Văn Quân",
    "subjectId": 9,
    "subjectName": "Vật Lý",
    "classId": 17,
    "className": "10A1",
    "studentId": 1,
    "studentName": "Nguyễn Phước Thành",
    "slotNumber": 9,
    "dayOfWeek": "Wednesday",
    "startTime": "08:00",
    "endTime": "08:45",
    "sessionDate": "2025-04-24T00:00:00.000Z",
    "topic": "Vật Lý - Tuần 2",
    "avatar": "/avatars/students/thanhnpst1.jpg",
    "createdAt": "2025-04-24T08:05:30.123Z",
    "updatedAt": "2025-04-24T08:05:30.123Z"
  },
  "details": {
    "minutesLate": 5,
    "scheduledStartTime": "08:00",
    "scheduledEndTime": "08:45"
  }
}
```

**Possible Error Responses:**
- `400` - Missing required fields:
  ```json
  {
    "success": false,
    "message": "Missing required fields: userId, rfidId, checkInTime, and classroomId are required",
    "code": "MISSING_REQUIRED_FIELDS"
  }
  ```
- `400` - Invalid time format:
  ```json
  {
    "success": false,
    "message": "Invalid check-in time format",
    "code": "INVALID_TIME_FORMAT"
  }
  ```
- `401` - RFID verification failed:
  ```json
  {
    "success": false,
    "message": "RFID verification failed. RFID does not match user or is not active.",
    "code": "RFID_VERIFICATION_FAILED"
  }
  ```
- `404` - No applicable schedule:
  ```json
  {
    "success": false,
    "message": "No scheduled class found for this classroom, date and time",
    "code": "NO_SCHEDULE_FOUND"
  }
  ```
- `404` - User not scheduled:
  ```json
  {
    "success": false,
    "message": "User is not scheduled for this classroom at this time",
    "code": "USER_NOT_SCHEDULED"
  }
  ```