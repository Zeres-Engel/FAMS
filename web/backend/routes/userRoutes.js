const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET all users (Admin only)
router.get('/', protect, authorize('Admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User route is setup but not implemented yet'
  });
});

module.exports = router; 