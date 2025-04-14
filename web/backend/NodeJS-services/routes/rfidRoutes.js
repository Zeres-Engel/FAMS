const express = require('express');
const { 
  getAllRFIDs, 
  getRFIDById, 
  createRFID, 
  updateRFID, 
  deleteRFID,
  getRFIDByUserId
} = require('../controllers/rfidController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// RFID routes
router
  .route('/')
  .get(getAllRFIDs)
  .post(authorize('admin'), createRFID);

// Get RFID by User ID
router.route('/user/:userId')
  .get(getRFIDByUserId);

router
  .route('/:id')
  .get(getRFIDById)
  .put(authorize('admin'), updateRFID)
  .delete(authorize('admin'), deleteRFID);

module.exports = router; 