const express = require('express');
const { register, login, getMe, refreshToken, logout, resetAdminPassword, verifyToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route for registering a new user
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Route for refreshing access token
router.post('/refresh-token', refreshToken);

// Route for user logout
router.post('/logout', protect, logout);

// Route for getting current user's profile (protected)
router.get('/me', protect, getMe);

// Route for resetting admin password (development only)
router.get('/reset-admin-password', resetAdminPassword);

// Route for verifying token
router.post('/verify', verifyToken);

module.exports = router; 