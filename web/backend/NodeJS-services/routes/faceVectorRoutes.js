const express = require('express');
const router = express.Router();
const faceVectorController = require('../controllers/faceVectorController');

// Lấy danh sách người dùng với điểm vector khuôn mặt
router.get('/user', faceVectorController.getAllUserVectors);

// Lấy thông tin vector khuôn mặt của một người dùng
router.get('/user/:id', faceVectorController.getUserVectorById);

// Cập nhật vector khuôn mặt
router.put('/user/:id', faceVectorController.updateUserVector);

module.exports = router; 