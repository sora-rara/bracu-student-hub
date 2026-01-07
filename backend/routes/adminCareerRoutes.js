// routes/adminCareerRoutes.js - UPDATED & COMPLETE VERSION
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminMiddleware');
const Internship = require('../models/Internship');

// ✅ 1. Get all internships (admin view with filters)
router.get('/internships', requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      category, 
      type, 
      search,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};

    // Apply filters
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (type && type !== 'all') filter.type = type;
    if (featured && featured !== 'all') filter.isFeatured = featured === 'true';
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'organization.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const internships = await Internship.find(filter)
      .sort(sort)
      .limit(100); // Limit to prevent overload

    // Calculate statistics
    const total = await Internship.countDocuments({});
    const active = await Internship.countDocuments({ status: 'active' });
    const featuredCount = await Internship.countDocuments({ isFeatured: true });
    const expired = await Internship.countDocuments({
      'applicationDetails.deadline': { $lt: new Date() }
    });

    res.json({ 
      success: true, 
      data: internships,
      stats: { total, active, featured: featuredCount, expired }
    });
    
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch internships',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ 2. Get single internship by ID
router.get('/internships/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const internship = await Internship.findById(id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false, 
        error: 'Internship not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: internship 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ 3. Create internship (FIXED VERSION)
router.post('/internships', requireAdmin, async (req, res) => {
  try {
    console.log('Creating internship with data:', req.body);
    
    const data = req.body;
    
    // Validate required fields
    const requiredFields = ['title', 'organization', 'description'];
    for (const field of requiredFields) {
      if (field === 'organization') {
        if (!data.organization?.name) {
          return res.status(400).json({
            success: false,
            error: 'Organization name is required'
          });
        }
      } else if (!data[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }
    
    // Set default values
    data.status = data.status || 'active';
    data.postedBy = req.session.userId;
    data.createdAt = new Date();
    data.updatedAt = new Date();
    
    // Ensure arrays exist
    data.requirements = data.requirements || {};
    data.requirements.skills = data.requirements.skills || [];
    data.requirements.yearInSchool = data.requirements.yearInSchool || [];
    data.majors = data.majors || [];
    data.skillsGained = data.skillsGained || [];
    data.learningOutcomes = data.learningOutcomes || [];
    data.compensation = data.compensation || { type: 'unpaid', benefits: [] };
    
    // Create and save internship
    const internship = new Internship(data);
    await internship.save();
    
    console.log('Internship created successfully:', internship._id);
    
    res.status(201).json({
      success: true,
      message: 'Internship created successfully',
      data: internship
    });
    
  } catch (error) {
    console.error('Error creating internship:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create internship',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ 4. Update internship
router.put('/internships/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Prevent updating protected fields
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.postedBy;
    
    updateData.updatedAt = new Date();
    
    const internship = await Internship.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!internship) {
      return res.status(404).json({ 
        success: false, 
        error: 'Internship not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Internship updated successfully',
      data: internship
    });
    
  } catch (error) {
    console.error('Error updating internship:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ 5. Delete internship
router.delete('/internships/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const internship = await Internship.findByIdAndDelete(id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false, 
        error: 'Internship not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Internship deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ 6. Get internship statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const total = await Internship.countDocuments({});
    const active = await Internship.countDocuments({ status: 'active' });
    const draft = await Internship.countDocuments({ status: 'draft' });
    const closed = await Internship.countDocuments({ status: 'closed' });
    const featured = await Internship.countDocuments({ isFeatured: true });
    
    // Count by category
    const categories = await Internship.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count by type
    const types = await Internship.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        draft,
        closed,
        featured,
        categories,
        types
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ 7. Bulk operations
router.post('/internships/bulk/update', requireAdmin, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No IDs provided for bulk update'
      });
    }
    
    const result = await Internship.updateMany(
      { _id: { $in: ids } },
      { ...updates, updatedAt: new Date() }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} internships updated successfully`,
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ 8. Export internships
router.get('/export/internships', requireAdmin, async (req, res) => {
  try {
    const internships = await Internship.find({})
      .select('title organization.name type status category applicationDetails.deadline views createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    // Convert to CSV format
    const csvData = internships.map(internship => ({
      Title: internship.title,
      Organization: internship.organization?.name || '',
      Type: internship.type,
      Status: internship.status,
      Category: internship.category,
      Deadline: internship.applicationDetails?.deadline || '',
      Views: internship.views,
      Created: internship.createdAt
    }));
    
    res.json({
      success: true,
      data: csvData,
      count: csvData.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;