# FAMS Python Service API Guide

## General Information
- **Base URL:** `http://fams.io.vn/api-python`
- **Content-Type:** `application/json`
- **Documentation:** 
  - Swagger UI: `/docs`
  - ReDoc: `/redoc`

## API Endpoints

### System Information
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API health check and welcome message |
| `/health` | GET | Detailed system health status |

### Database Management

#### Initialization
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/db/init` | POST | Initialize all database collections from Excel template files |
| `/api/db/initFAMS` | POST | Initialize basic system data (no students, teachers, or schedules) |

#### Data Upload & Import
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/db/upload/fams` | POST | Upload Excel file with user data (multipart/form-data) |
| `/api/db/import/users` | POST | Import users from uploaded Excel file with specified batch year |
| `/api/db/import/filtered-users` | POST | Import only selected users from the extracted data |

#### Student Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/db/promote/students` | POST | Promote students to next grade (optional: specify retained students) |

#### Teacher Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/db/teacher/expire-contract` | POST | Remove teachers with expired contracts |

### Scheduling

#### Schedule Generation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/schedules/generate` | POST | Generate class schedules for a specific semester |

#### Schedule Retrieval
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/db/schedules` | GET | Get schedules filtered by various parameters |

## Request/Response Examples

### Generate Class Schedules
**Request:**
```json
{
  "semesterNumber": 1,
  "startDate": "01/09/2024",
  "endDate": "31/12/2024"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bắt đầu sắp xếp thời khóa biểu cho Học kỳ 1",
  "totalEntries": 0,
  "warnings": [],
  "details": {
    "status": "processing",
    "updatedSemesters": 3
  }
}
```

### Get Schedules
**Query Parameters:**
- `semester_id` (optional)
- `class_id` (optional)
- `teacher_id` (optional)
- `subject_id` (optional)
- `date_from` (optional): YYYY-MM-DD
- `date_to` (optional): YYYY-MM-DD

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "semester": { "id": "string", "name": "string" },
      "class": { "id": "string", "name": "string" },
      "subject": { "id": "string", "name": "string" },
      "teacher": { "id": "string", "name": "string" },
      "classroom": { "id": "string", "name": "string" },
      "day_of_week": 1,
      "period": 1,
      "start_time": "07:30",
      "end_time": "08:15"
    }
  ],
  "message": "Schedules retrieved successfully"
}
``` 