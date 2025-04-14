const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectToFAMS, checkConnectionStatus, getDatabaseInfo, apiRouter } = require('./database');
const errorService = require('./services/errorService');
const databaseService = require('./services/databaseService');

// Route files
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const userRoutes = require('./routes/userRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const parentRoutes = require('./routes/parentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const classRoutes = require('./routes/classRoutes');
const rfidRoutes = require('./routes/rfidRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'Access-Control-Request-Method', 
    'Access-Control-Request-Headers',
    'X-Access-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'Authorization', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add security headers middleware
app.use((req, res, next) => {
  // Disable caching for API responses
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  // Help protect against clickjacking
  res.header('X-Frame-Options', 'DENY');
  
  // Help protect against XSS attacks
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.header('X-Content-Type-Options', 'nosniff');
  
  // Allow cross-origin resource sharing
  res.header('Access-Control-Allow-Origin', '*');
  
  next();
});

app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies with increased limit

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
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/database', apiRouter);

// Root route
app.get('/', (req, res) => {
  const apiInfo = {
    name: 'FAMS API',
    version: '1.0.0',
    description: 'Faculty/School Academic Management System API',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    server: {
      platform: process.platform,
      nodeVersion: process.version
    },
    endpoints: {
      auth: {
        base: '/api/auth',
        endpoints: [
          { method: 'POST', path: '/login', description: 'Đăng nhập (hỗ trợ userId/email/backup_email)' },
          { method: 'POST', path: '/register', description: 'Đăng ký tài khoản mới' },
          { method: 'GET', path: '/me', description: 'Lấy thông tin người dùng hiện tại' },
          { method: 'POST', path: '/refresh-token', description: 'Làm mới token' }
        ]
      },
      students: {
        base: '/api/students',
        endpoints: [
          { method: 'GET', path: '/', description: 'Lấy danh sách học sinh' },
          { method: 'GET', path: '/:id', description: 'Lấy thông tin chi tiết học sinh' },
          { method: 'POST', path: '/', description: 'Tạo học sinh mới' },
          { method: 'PUT', path: '/:id', description: 'Cập nhật thông tin học sinh' },
          { method: 'DELETE', path: '/:id', description: 'Xóa học sinh' }
        ]
      },
      teachers: {
        base: '/api/teachers',
        description: 'API quản lý giáo viên'
      },
      parents: {
        base: '/api/parents',
        description: 'API quản lý phụ huynh'
      },
      schedules: {
        base: '/api/schedules',
        description: 'API quản lý lịch học'
      },
      rfid: {
        base: '/api/rfid',
        endpoints: [
          { method: 'GET', path: '/', description: 'Lấy danh sách thẻ RFID (có phân trang)' },
          { method: 'GET', path: '/:id', description: 'Lấy thông tin chi tiết thẻ RFID' },
          { method: 'POST', path: '/', description: 'Tạo thẻ RFID mới (Admin)' },
          { method: 'PUT', path: '/:id', description: 'Cập nhật thông tin thẻ RFID (Admin)' },
          { method: 'DELETE', path: '/:id', description: 'Xóa thẻ RFID (Admin)' }
        ]
      }
    },
    status: {
      database: checkConnectionStatus() ? 'connected' : 'disconnected'
    }
  };

  res.json(apiInfo);
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
    
    await connectToFAMS();
    console.log(`MongoDB Connection Status: ${checkConnectionStatus()}`);
    
    const dbInfo = await getDatabaseInfo();
    console.log('Database info:', JSON.stringify(dbInfo, null, 2));
    console.log('======================================');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server is accessible at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

startServer(); 