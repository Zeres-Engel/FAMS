const express = require('express');
const { uploadAvatar, getAvatar, deleteAvatar } = require('../controllers/avatarController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route for uploading avatar (requires authentication)
router.post('/upload', protect, uploadAvatar);

// Route for getting user's avatar (public)
router.get('/:userId', getAvatar);

// Route for deleting user's avatar (requires authentication)
router.delete('/', protect, deleteAvatar);

module.exports = router; 