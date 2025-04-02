const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route for registering a new user
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Route for getting current user's profile (protected)
router.get('/me', protect, getMe);

module.exports = router; 