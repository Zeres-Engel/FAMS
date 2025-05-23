# FAMS Database Module

This module handles all database-related functionality for the Faculty/School Academic Management System (FAMS).

## Directory Structure

```
database/
├── connection.js         # Database connection functionality
├── models/               # Mongoose models
│   ├── Student.js        # Student model
│   ├── Teacher.js        # Teacher model
│   ├── ...               # Other models
│   └── index.js          # Models export file
├── controllers/          # API controllers
│   └── databaseController.js  # Database API controllers
├── routes/               # API routes
│   └── databaseRoutes.js # Database API routes
├── services/             # Business logic services
│   └── batchService.js   # Batch-related business logic
├── utils/                # Utility functions
│   └── dbUtils.js        # Database utility functions
├── constants.js          # Constants used across the module
├── config.js             # Configuration settings
├── index.js              # Main entry point
└── README.md             # This file
```

## Main Components

- **Models**: Mongoose schema definitions for all database entities
- **Controllers**: Handle API requests and responses
- **Routes**: Define API endpoints
- **Services**: Contain business logic
- **Utils**: Common utility functions

## Usage

```javascript
// Import the database module
const database = require('./database');

// Connect to the database
await database.connectToFAMS();

// Check connection status
const status = database.checkConnectionStatus();

// Access models
const { Student, Teacher } = database.models;

// Use batch service
const batchResult = await database.batchService.getAllBatches();
```

## API Routes

The database module exposes API routes through the `apiRouter`:

- `GET /api/database/info` - Get database information
- `GET /api/database/batches` - Get all batches
- `GET /api/database/batches/options` - Get batch options
- `POST /api/database/batches/create-if-not-exists` - Create batch if not exists
- `GET /api/database/batches/:id` - Get batch by ID
- `GET /api/database/classes` - Get all classes
- `GET /api/database/classes/batch/:batchId` - Get classes by batch ID
- `GET /api/database/classes/:id` - Get class by ID
- `GET /api/database/teachers` - Get all teachers
- `GET /api/database/teachers/:id` - Get teacher by ID 