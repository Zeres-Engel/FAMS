const express = require('express');
const { uploadAvatar, getAvatar, deleteAvatar, deleteAvatarByUserId, adminUploadAvatar } = require('../controllers/avatarController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Route for uploading avatar (requires authentication)
router.post('/upload', protect, uploadAvatar);

// Route for admin to upload avatar for a specific user
router.post('/admin/:userId', protect, authorize('Admin', 'admin'), adminUploadAvatar);

// Route for getting user's avatar (public)
router.get('/:userId', getAvatar);

// Route for deleting user's avatar (requires authentication)
router.delete('/', protect, deleteAvatar);

// Route for deleting a specific user's avatar (Admin only)
router.delete('/:userId', protect, authorize('Admin', 'admin'), deleteAvatarByUserId);

module.exports = router; 