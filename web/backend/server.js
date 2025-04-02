const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { DatabaseUtils } = require('./database');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const userRoutes = require('./routes/userRoutes');
// Remove imports that don't exist yet
// const teacherRoutes = require('./routes/teacherRoutes');
// const parentRoutes = require('./routes/parentRoutes');
// const classRoutes = require('./routes/classRoutes');
// const batchRoutes = require('./routes/batchRoutes');
// const scheduleRoutes = require('./routes/scheduleRoutes');

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
  origin: '*', // Cho phép mọi nguồn để dễ debug
  credentials: true
}));
app.use(express.json());

// Test route để kiểm tra kết nối
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API kết nối thành công!' });
});

// Test route để kiểm tra kết nối MongoDB
app.get('/api/test/db', async (req, res) => {
  try {
    // Kiểm tra trạng thái kết nối
    const connectionStatus = DatabaseUtils.checkConnectionStatus();
    
    // Lấy thông tin database
    const dbInfo = await DatabaseUtils.getDatabaseInfo();
    
    res.json({
      success: true,
      connection: connectionStatus,
      database: dbInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);
// Remove routes that don't exist yet
// app.use('/api/teachers', teacherRoutes);
// app.use('/api/parents', parentRoutes);
// app.use('/api/classes', classRoutes);
// app.use('/api/batches', batchRoutes);
// app.use('/api/schedules', scheduleRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Student Management API!' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Start the server
const startServer = async () => {
  try {
    // Kết nối đến cơ sở dữ liệu FAMS
    console.log('Attempting to connect to MongoDB...');
    await DatabaseUtils.connectToFAMS();
    console.log(`MongoDB Connection Status: ${DatabaseUtils.checkConnectionStatus()}`);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
};

// Khởi động server
startServer(); 