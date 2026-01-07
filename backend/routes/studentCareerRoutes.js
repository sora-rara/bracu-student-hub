// routes/studentCareerRoutes.js - NEW FILE
const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');

// ✅ 1. Get all active internships for students
router.get('/internships', async (req, res) => {
  try {
    const { 
      category, 
      type, 
      location, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter for active internships only
    let filter = {
      status: { $in: ['active', 'Active'] }
    };

    // Apply filters
    if (category && category !== 'all') filter.category = category;
    if (type && type !== 'all') filter.type = type;
    if (location && location !== 'all') filter['location.type'] = location;
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'organization.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sort = {};
    if (sortBy === 'newest') {
      sort.createdAt = -1;
    } else if (sortBy === 'deadline') {
      sort['applicationDetails.deadline'] = 1;
    } else if (sortBy === 'title') {
      sort.title = 1;
    } else {
      sort.createdAt = -1;
    }

    // Add featured sorting
    sort.isFeatured = -1;

    const internships = await Internship.find(filter)
      .select('-postedBy -approvedBy -__v') // Hide sensitive fields
      .sort(sort)
      .limit(100);

    // Increment views for each internship
    internships.forEach(async (internship) => {
      internship.views = (internship.views || 0) + 1;
      await internship.save();
    });

    res.json({ 
      success: true, 
      data: internships,
      count: internships.length
    });
    
  } catch (error) {
    console.error('Error fetching internships for students:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch internships',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ 2. Get single internship by ID (public view)
router.get('/internships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const internship = await Internship.findById(id)
      .select('-postedBy -approvedBy -__v');
    
    if (!internship) {
      return res.status(404).json({ 
        success: false, 
        error: 'Internship not found' 
      });
    }

    // Increment view count
    internship.views = (internship.views || 0) + 1;
    await internship.save();
    
    // Find similar internships (same category)
    const similarInternships = await Internship.find({
      _id: { $ne: id },
      category: internship.category,
      status: { $in: ['active', 'Active'] }
    })
    .select('-postedBy -approvedBy -__v')
    .limit(3)
    .sort({ isFeatured: -1, createdAt: -1 });

    res.json({ 
      success: true, 
      data: internship,
      similarInternships
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ 3. Get internship categories for filtering
router.get('/categories', async (req, res) => {
  try {
    const categories = await Internship.distinct('category', {
      status: { $in: ['active', 'Active'] }
    });
    
    res.json({
      success: true,
      data: categories.filter(cat => cat).sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ 4. Get internship statistics (public)
router.get('/stats', async (req, res) => {
  try {
    const totalActive = await Internship.countDocuments({ 
      status: { $in: ['active', 'Active'] } 
    });
    
    const featured = await Internship.countDocuments({ 
      status: { $in: ['active', 'Active'] },
      isFeatured: true
    });

    const categories = await Internship.aggregate([
      { $match: { status: { $in: ['active', 'Active'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const types = await Internship.aggregate([
      { $match: { status: { $in: ['active', 'Active'] } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalActive,
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

module.exports = router;