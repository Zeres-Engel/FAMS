const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const { connectToFAMS, checkConnectionStatus, getDatabaseInfo, apiRouter } = require('./database');
const errorService = require('./services/errorService');
const databaseService = require('./services/databaseService');

// Load environment variables
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const userRoutes = require('./routes/userRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const parentRoutes = require('./routes/parentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5000000 } // 5MB limit
});

// Create uploads folder if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('backend/uploads')) {
  fs.mkdirSync('backend/uploads', { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Test route để kiểm tra kết nối
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API kết nối thành công!', code: 'CONNECTION_SUCCESS' });
});

// Test route để kiểm tra kết nối MongoDB
app.get('/api/test/db', async (req, res) => {
  try {
    // Kiểm tra trạng thái kết nối
    const connectionStatus = checkConnectionStatus();
    
    // Lấy thông tin database
    const dbInfo = await getDatabaseInfo();
    
    res.json({
      success: true,
      connection: connectionStatus,
      database: dbInfo,
      code: 'DB_STATUS_SUCCESS'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'DB_STATUS_ERROR'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/database', apiRouter);

// Serve the test API page
app.get('/api-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'api-test.html'));
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to FAMS API!',
    version: '1.0.0',
    documentation: '/api-test' 
  });
});

// Global error handler
app.use(errorService.errorHandler);

// Start the server
const startServer = async () => {
  try {
    // Kết nối đến cơ sở dữ liệu FAMS
    console.log('======================================');
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'Not defined');
    
    // Use the original connection method for backward compatibility
    await connectToFAMS();
    console.log(`MongoDB Connection Status: ${checkConnectionStatus()}`);
    
    const dbInfo = await getDatabaseInfo();
    console.log('Database info:', JSON.stringify(dbInfo, null, 2));
    console.log('======================================');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Test API page available at: http://localhost:${PORT}/api-test`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Khởi động server
startServer(); 