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

### Student API (Deprecated)
Base path: `/students`

**⚠️ DEPRECATED ⚠️:** The Student API has been deprecated and will be removed in future versions. Please use the User API instead.

All requests to `/api/students` will return a 301 status code with instructions to use the User API.

**Migration Guide:**
- Use `/api/users?roles=student` instead of `/api/students`
- Use `/api/users/create` with `role: "student"` instead of `/api/students` (POST)
- Use `/api/users/:id` instead of `/api/students/:id`
- Use `/api/users/details/:id` to get detailed student information

### Teacher API (Deprecated)
Base path: `/teachers`

**⚠️ DEPRECATED ⚠️:** The Teacher API has been deprecated and will be removed in future versions. Please use the User API instead.

All requests to `/api/teachers` will return a 301 status code with instructions to use the User API.

**Migration Guide:**
- Use `/api/users?roles=teacher` instead of `/api/teachers`
- Use `/api/users/create` with `role: "teacher"` instead of `/api/teachers` (POST)
- Use `/api/users/:id` instead of `/api/teachers/:id`
- Use `/api/users/details/:id` to get detailed teacher information
- Use `/api/users/teachers/:id/schedule` to get teacher schedule

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

#### Unified Update User (Supports All Roles)
- **URL**: `http://fams.io.vn/api-nodejs/users/update/:userId`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Description**: Thống nhất API cập nhật thông tin người dùng cho cả 3 vai trò (Student, Teacher, Parent) dựa vào userId
- **Body**: Tùy thuộc vào vai trò của người dùng, chỉ cần gửi các trường cần cập nhật

**Ví dụ cập nhật Student:**
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
  "parentNames": ["Nguyễn Văn An"],
  "parentCareers": ["Bác sĩ"],
  "parentPhones": ["0987654321"],
  "parentGenders": [true],
  "rfid": {
    "RFID_ID": "STUD12345",
    "ExpiryDate": "2y"
  }
}
```

**Ví dụ cập nhật Teacher:**
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
  "fullName": "Bùi Ngọc Dũng", 
  "career": "Doanh nhân",
  "phone": "0973557557",
  "gender": true,
  "studentIds": [1, 2, 3]
}
```

**Response Student:**
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
      "batch": {
        "batchId": 1,
        "batchName": "K2023"
      },
      "class": {
        "classId": 2,
        "className": "10A2",
        "grade": "10"
      },
      "parents": [
        {
          "parentId": 3,
          "fullName": "Nguyễn Văn An",
          "phone": "0987654321",
          "career": "Bác sĩ",
          "relationship": "Father"
        }
      ],
      "rfid": {
        "RFID_ID": "STUD12345",
        "UserID": "khoaatst1",
        "IssueDate": "2024-05-15T10:13:45.000Z",
        "ExpiryDate": "2026-05-15T10:13:45.000Z"
      }
    }
  }
}
```

**Response Teacher:**
```json
{
  "success": true,
  "message": "User hunghu123 updated successfully",
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

**Response Parent:**
```json
{
  "success": true,
  "message": "User dungbnpr0 updated successfully",
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

**Error Responses:**
- `404` - User not found:
  ```json
  {
    "success": false,
    "message": "User with ID khoaatst1 not found",
    "code": "USER_NOT_FOUND"
  }
  ```
- `404` - Student/Teacher/Parent record not found:
  ```json
  {
    "success": false,
    "message": "Student record for user khoaatst1 not found",
    "code": "STUDENT_RECORD_NOT_FOUND"
  }
  ```
- `500` - Server error:
  ```json
  {
    "success": false,
    "message": "Error message",
    "code": "UPDATE_FAILED"
  }
  ```

**Lưu ý về Parent:**
- Khi cập nhật Student, nếu cung cấp thông tin phụ huynh mới, hệ thống sẽ tự động tạo tài khoản mới cho phụ huynh
- Khi cung cấp thông tin số điện thoại đã tồn tại, hệ thống sẽ liên kết với phụ huynh có sẵn thay vì tạo mới
- Trong một lần cập nhật có thể thêm nhiều phụ huynh cho một học sinh

**Lưu ý về RFID:**
- Có thể cập nhật hoặc tạo mới thẻ RFID đồng thời với cập nhật thông tin người dùng
- ExpiryDate có thể là ngày cụ thể (YYYY-MM-DD) hoặc định dạng ngắn gọn ("1y", "2y", "3y")

#### Update User (Admin Only)
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Admin only)
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
  
  // Cách 1: Sử dụng ID (phương thức truyền thống)
  "classId": 3,                       // ID của lớp học
  "teacherId": 5,                     // ID của giáo viên
  "subjectId": 2,                     // ID của môn học
  
  // Cách 2: Sử dụng tên (phương thức thân thiện hơn)
  "className": "10A3",                // Tên lớp học (thay thế cho classId)
  "teacherUserId": "tuanpv5",         // UserID của giáo viên (thay thế cho teacherId)
  "subjectName": "Toán học",          // Tên môn học (thay thế cho subjectId)
  
  // Các thông tin khác
  "topic": "Đại số",                  // Optional - Chủ đề buổi học
  "roomName": "Room 101",             // Optional - Tên phòng học
  "classroomId": 10,                  // Optional - ID phòng học
  "weekNumber": 1,                    // Optional - Số tuần trong học kỳ
  "semesterId": "1"                   // Optional - ID học kỳ
}
```

**Ví dụ tạo lịch học đơn giản**:
```json
{
  "date": "2024-10-15",
  "slotNumber": 3,
  "className": "10A2", 
  "teacherUserId": "tuanpv5",
  "subjectName": "Toán học",
  "topic": "Đại số",
  "roomName": "B203"
}
```

**Lưu ý về kiểm tra xung đột lịch học:**

Khi tạo lịch học mới, hệ thống sẽ kiểm tra ba loại xung đột có thể xảy ra:

1. **Xung đột lớp học**: Nếu lớp đã có lịch học vào ngày và tiết đó
   ```json
   {
     "success": false,
     "message": "Lớp 10A3 đã có lịch học môn Toán học vào ngày 10/09/2024 tiết 3 (08:50-09:35) với giáo viên Tuấn Phạm Văn",
     "code": "CLASS_SCHEDULE_CONFLICT",
     "conflict": {
       // Chi tiết về lịch học xung đột
     }
   }
   ```

2. **Xung đột giáo viên**: Nếu giáo viên đã dạy lớp khác vào ngày và tiết đó
   ```json
   {
     "success": false,
     "message": "Giáo viên đã có lịch dạy lớp 10A1 môn Toán học vào ngày 10/09/2024 tiết 3 (08:50-09:35)",
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
