/**
 * Delete a curriculum by ID
 * @route DELETE /api/curriculum/:id
 * @access Private/Admin
 */
exports.deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the curriculum by ID
    const curriculum = await Curriculum.findOne({ curriculumId: id });
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // First, delete all curriculum-subject relationships
    await CurriculumSubject.deleteMany({ curriculumId: id });
    
    // Then delete the curriculum itself
    await Curriculum.deleteOne({ curriculumId: id });
    
    return res.json({
      success: true,
      message: 'Curriculum deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting curriculum:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Add a subject to a curriculum
 * @route POST /api/curriculum/:id/subjects
 * @access Private/Admin
 */
exports.addSubjectToCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectId, sessions } = req.body;
    
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID is required'
      });
    }
    
    // Validate curriculum exists
    const curriculum = await Curriculum.findOne({ curriculumId: id });
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }
    
    // Validate subject exists
    const subject = await Subject.findOne({ subjectId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Check if the relationship already exists
    const existingRelation = await CurriculumSubject.findOne({
      curriculumId: id,
      subjectId
    });
    
    if (existingRelation) {
      return res.status(400).json({
        success: false,
        message: 'Subject already exists in this curriculum'
      });
    }
    
    // Create new curriculum-subject relationship
    const newRelation = new CurriculumSubject({
      curriculumId: id,
      subjectId,
      sessions: sessions || 2 // Default to 2 sessions if not specified
    });
    
    await newRelation.save();
    
    // Get the updated relationship with populated data
    const populatedRelation = await CurriculumSubject.findById(newRelation._id)
      .populate('subject')
      .populate('curriculum');
    
    return res.status(201).json({
      success: true,
      message: 'Subject added to curriculum successfully',
      data: populatedRelation
    });
  } catch (error) {
    console.error('Error adding subject to curriculum:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Remove a subject from a curriculum
 * @route DELETE /api/curriculum/:id/subjects/:subjectId
 * @access Private/Admin
 */
exports.removeSubjectFromCurriculum = async (req, res) => {
  try {
    const { id, subjectId } = req.params;
    
    // Find the relationship
    const relation = await CurriculumSubject.findOne({
      curriculumId: id,
      subjectId
    });
    
    if (!relation) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found in this curriculum'
      });
    }
    
    // Delete the relationship
    await CurriculumSubject.deleteOne({
      curriculumId: id,
      subjectId
    });
    
    return res.json({
      success: true,
      message: 'Subject removed from curriculum successfully'
    });
  } catch (error) {
    console.error('Error removing subject from curriculum:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update subject's details in a curriculum (e.g., sessions)
 * @route PUT /api/curriculum/:id/subjects/:subjectId
 * @access Private/Admin
 */
exports.updateSubjectInCurriculum = async (req, res) => {
  try {
    const { id, subjectId } = req.params;
    const { sessions } = req.body;
    
    if (sessions === undefined || sessions < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid sessions count is required'
      });
    }
    
    // Find and update the relationship
    const updatedRelation = await CurriculumSubject.findOneAndUpdate(
      {
        curriculumId: id,
        subjectId
      },
      { sessions },
      { new: true }
    ).populate('subject').populate('curriculum');
    
    if (!updatedRelation) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found in this curriculum'
      });
    }
    
    return res.json({
      success: true,
      message: 'Subject updated in curriculum successfully',
      data: updatedRelation
    });
  } catch (error) {
    console.error('Error updating subject in curriculum:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 