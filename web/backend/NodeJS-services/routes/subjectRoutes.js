const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const models = require('../database/models');

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await models.Subject.find({ isActive: true }).sort({ subjectName: 1 });
    
    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      code: 'SUBJECT_GET_ERROR'
    });
  }
});

// Get subject by ID
router.get('/:id', async (req, res) => {
  try {
    const subject = await models.Subject.findOne({ 
      subjectId: parseInt(req.params.id),
      isActive: true 
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      code: 'SUBJECT_GET_BY_ID_ERROR'
    });
  }
});

// Search subjects by name
router.get('/search/name', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Search name is required',
        code: 'SEARCH_NAME_REQUIRED'
      });
    }
    
    // Create a regex search pattern that is case insensitive
    const searchPattern = new RegExp(name, 'i');
    
    const subjects = await models.Subject.find({ 
      subjectName: searchPattern,
      isActive: true 
    }).sort({ subjectName: 1 });
    
    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      code: 'SUBJECT_SEARCH_ERROR'
    });
  }
});

// Create a new subject (Admin only)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { subjectName, description, subjectType } = req.body;
    
    // Validate required fields
    if (!subjectName || !subjectType) {
      return res.status(400).json({
        success: false,
        message: 'Subject name and type are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Check if subject name already exists
    const existingSubject = await models.Subject.findOne({ 
      subjectName: subjectName,
      isActive: true
    });
    
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this name already exists',
        code: 'SUBJECT_NAME_EXISTS'
      });
    }
    
    // Get the next available subjectId
    const lastSubject = await models.Subject.findOne().sort({ subjectId: -1 });
    const nextSubjectId = lastSubject ? lastSubject.subjectId + 1 : 1;
    
    // Create new subject
    const subject = await models.Subject.create({
      subjectId: nextSubjectId,
      subjectName,
      description,
      subjectType,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      code: 'SUBJECT_CREATE_ERROR'
    });
  }
});

// Update a subject (Admin only)
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { subjectName, description, subjectType } = req.body;
    
    // Find subject by ID
    let subject = await models.Subject.findOne({ 
      subjectId: parseInt(req.params.id),
      isActive: true 
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
    }
    
    // Check if updating to a name that already exists (excluding current subject)
    if (subjectName) {
      const existingSubject = await models.Subject.findOne({ 
        subjectName: subjectName,
        subjectId: { $ne: parseInt(req.params.id) },
        isActive: true
      });
      
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject with this name already exists',
          code: 'SUBJECT_NAME_EXISTS'
        });
      }
    }
    
    // Update subject
    subject = await models.Subject.findOneAndUpdate(
      { subjectId: parseInt(req.params.id) },
      { 
        subjectName: subjectName || subject.subjectName,
        description: description !== undefined ? description : subject.description,
        subjectType: subjectType || subject.subjectType,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      code: 'SUBJECT_UPDATE_ERROR'
    });
  }
});

// Delete a subject (logical delete) (Admin only)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    // Find subject by ID
    const subject = await models.Subject.findOne({ 
      subjectId: parseInt(req.params.id),
      isActive: true 
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
    }
    
    // Check if subject is being used in any class schedules
    const usedInSchedules = await models.ClassSchedule.findOne({
      subjectId: parseInt(req.params.id),
      isActive: true
    });
    
    if (usedInSchedules) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subject as it is being used in class schedules',
        code: 'SUBJECT_IN_USE'
      });
    }
    
    // Logical delete - set isActive to false
    await models.Subject.findOneAndUpdate(
      { subjectId: parseInt(req.params.id) },
      { isActive: false, updatedAt: new Date() }
    );
    
    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      code: 'SUBJECT_DELETE_ERROR'
    });
  }
});

module.exports = router; 