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
- **Auth Required**: Yes

### Student API
Base path: `/students`

#### Get All Students
- **URL**: `http://fams.io.vn/api-nodejs/students`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search term

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
- **Auth Required**: Yes
- **Body**: Updated student information

#### Delete Student
- **URL**: `http://fams.io.vn/api-nodejs/students/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes

### User API
Base path: `/users`

#### Get All Users
- **URL**: `http://fams.io.vn/api-nodejs/users`
- **Method**: `GET`
- **Auth Required**: Yes

#### Get User by ID
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `GET`
- **Auth Required**: Yes

#### Create User
- **URL**: `http://fams.io.vn/api-nodejs/users`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**: User information

#### Update User
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Body**: Updated user information

#### Delete User
- **URL**: `http://fams.io.vn/api-nodejs/users/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes

### Teacher API
Base path: `/teachers`

#### Get All Teachers
- **URL**: `http://fams.io.vn/api-nodejs/teachers`
- **Method**: `GET`
- **Auth Required**: Yes

#### Get Teacher by ID
- **URL**: `http://fams.io.vn/api-nodejs/teachers/:id`
- **Method**: `GET`
- **Auth Required**: Yes

#### Create Teacher
- **URL**: `http://fams.io.vn/api-nodejs/teachers`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**: Teacher information

#### Update Teacher
- **URL**: `http://fams.io.vn/api-nodejs/teachers/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Body**: Updated teacher information

#### Delete Teacher
- **URL**: `http://fams.io.vn/api-nodejs/teachers/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes

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
- **Body**: Updated parent information

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
