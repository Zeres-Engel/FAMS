const { getDatabaseInfo } = require('../utils/dbUtils');
const batchService = require('../services/batchService');
const { 
  Batch, 
  Class, 
  Teacher, 
  Student, 
  Parent,
  Subject, 
  Classroom, 
  Schedule 
} = require('../models');

/**
 * Get database information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getInfo = async (req, res) => {
  try {
    const info = await getDatabaseInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get all batches
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllBatches = async (req, res) => {
  try {
    const result = await batchService.getAllBatches();
    if (result.success) {
      res.json({ success: true, count: result.data.length, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get batch options
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getBatchOptions = async (req, res) => {
  try {
    const currentYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const count = req.query.count ? parseInt(req.query.count) : 5;
    
    const result = await batchService.generateBatchOptions(currentYear, count);
    
    if (result.success) {
      res.json({ 
        success: true, 
        count: result.data.length, 
        currentYear,
        data: result.data 
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create batch if not exists
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createBatchIfNotExists = async (req, res) => {
  try {
    const batchData = req.body;
    
    // Ensure we have either startDate or startYear
    if (!batchData.startDate && !batchData.startYear && !batchData.batchId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required batch fields: startDate, startYear, or batchId'
      });
    }
    
    // If startYear is provided but not startDate, generate startDate
    if (!batchData.startDate && batchData.startYear) {
      batchData.startDate = batchService.generateStartDate(parseInt(batchData.startYear));
    }
    
    // If endYear is provided but not endDate, generate endDate
    if (!batchData.endDate && batchData.endYear) {
      batchData.endDate = batchService.generateEndDate(parseInt(batchData.endYear));
    }
    
    // If we have a batchId but no dates, extract years from batchId and generate dates
    if (batchData.batchId && (!batchData.startDate || !batchData.endDate)) {
      const parts = batchData.batchId.split('-');
      if (parts.length === 2) {
        const startYear = parseInt(parts[0]);
        const endYear = parseInt(parts[1]);
        
        if (!batchData.startDate && !isNaN(startYear)) {
          batchData.startDate = batchService.generateStartDate(startYear);
        }
        
        if (!batchData.endDate && !isNaN(endYear)) {
          batchData.endDate = batchService.generateEndDate(endYear);
        }
      }
    }
    
    // Create the batch
    const result = await batchService.createBatchIfNotExists(batchData);
    
    if (result.success) {
      res.status(result.isNew ? 201 : 200).json({
        success: true,
        data: result.data,
        isNew: result.isNew
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get batch by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getBatchById = async (req, res) => {
  try {
    const result = await batchService.getBatchById(req.params.id);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(404).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get all classes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ classId: 1 });
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get classes by batch ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getClassesByBatchId = async (req, res) => {
  try {
    const classes = await Class.find({ batchId: req.params.batchId }).sort({ className: 1 });
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get class by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getClassById = async (req, res) => {
  try {
    const cls = await Class.findOne({ classId: req.params.id });
    if (!cls) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get all teachers
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ teacherId: 1 });
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get teacher by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ teacherId: req.params.id });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getInfo,
  getAllBatches,
  getBatchOptions,
  createBatchIfNotExists,
  getBatchById,
  getAllClasses,
  getClassesByBatchId,
  getClassById,
  getAllTeachers,
  getTeacherById
}; 