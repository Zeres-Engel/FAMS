const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const connectDB = require('./database/config');
const { protect, authorize } = require('./middleware/authMiddleware');

// Route files
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Connect to database
connectDB();

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 