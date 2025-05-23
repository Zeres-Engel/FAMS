const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');

// Database info route
router.get('/info', databaseController.getInfo);

// Batch routes
router.get('/batches', databaseController.getAllBatches);
router.get('/batches/options', databaseController.getBatchOptions);
router.post('/batches/create-if-not-exists', databaseController.createBatchIfNotExists);
router.get('/batches/:id', databaseController.getBatchById);

// Class routes
router.get('/classes', databaseController.getAllClasses);
router.get('/classes/batch/:batchId', databaseController.getClassesByBatchId);
router.get('/classes/:id', databaseController.getClassById);

// Teacher routes
router.get('/teachers', databaseController.getAllTeachers);
router.get('/teachers/:id', databaseController.getTeacherById);

module.exports = router; 