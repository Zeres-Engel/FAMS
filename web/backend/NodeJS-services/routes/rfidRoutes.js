const express = require('express');
const { 
  getAllRFIDs, 
  getRFIDById, 
  createRFID, 
  updateRFID, 
  deleteRFID,
  getRFIDByUserId,
  getAllRFIDWithUserInfo,
  getUserRFID,
  createNewRFID,
  deleteUserRFID
} = require('../controllers/rfidController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes - không yêu cầu xác thực
router.route('/users').get(getAllRFIDWithUserInfo);
router.route('/debug').get(async (req, res) => {
  try {
    const RFID = require('../database/models/RFID');
    const all = await RFID.find({}).limit(10);
    res.status(200).json({
      success: true,
      count: all.length,
      data: all,
      raw_first: all.length > 0 ? all[0] : null,
      schema: all.length > 0 ? Object.keys(all[0]._doc || all[0]) : []
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply authentication to all routes below
router.use(protect);

// RFID routes
router
  .route('/')
  .get(getAllRFIDs)
  .post(authorize('admin'), createRFID);

// Route to create new RFID with correct schema
router.route('/create').post(authorize('admin'), createNewRFID);

// Get RFID by User ID (old endpoint)
router.route('/user/:userId')
  .get(getRFIDByUserId);

// Get/Delete user RFID
router.route('/users/:id')
  .get(getUserRFID)
  .delete(authorize('admin'), deleteUserRFID);

router
  .route('/:id')
  .get(getRFIDById)
  .put(authorize('admin'), updateRFID)
  .delete(authorize('admin'), deleteRFID);

module.exports = router; 