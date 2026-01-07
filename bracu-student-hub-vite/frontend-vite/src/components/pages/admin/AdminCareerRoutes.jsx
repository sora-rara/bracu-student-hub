// routes/adminCareerRoutes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminMiddleware');
const Internship = require('../models/Internship');

// ✅ Test route to check if admin routes are working
router.get('/test', requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin career routes are working!',
    user: req.session?.user
  });
});

// ✅ Get all internships (admin view)
router.get('/internships', requireAdmin, async (req, res) => {
  try {
    console.log('Fetching internships for admin...');
    
    // Check if user is authenticated
    if (!req.session?.userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized access' 
      });
    }

    const internships = await Internship.find({})
      .sort({ createdAt: -1 })
      .limit(100);
    
    console.log(`Found ${internships.length} internships`);
    
    res.json({ 
      success: true, 
      data: internships,
      count: internships.length
    });
    
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch internships',
      message: error.message
    });
  }
});

// ✅ Create internship (FIXED - handle all required fields)
router.post('/internships', requireAdmin, async (req, res) => {
  try {
    console.log('=== Creating new internship ===');
    console.log('Session user ID:', req.session?.userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Check authentication
    if (!req.session?.userId) {
      console.log('No user ID in session');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Please login again'
      });
    }

    const {
      title,
      organization,
      description,
      shortDescription,
      category,
      type,
      location,
      duration,
      compensation,
      requirements,
      majors,
      applicationDetails,
      status,
      isFeatured,
      isEligibleForCredit,
      numberOfPositions,
      learningOutcomes,
      skillsGained,
      mentorship
    } = req.body;

    // Validate required fields
    if (!title || !organization?.name || !description) {
      console.log('Missing required fields:', {
        title: !title,
        organizationName: !organization?.name,
        description: !description
      });
      
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, organization.name, description'
      });
    }

    // Prepare internship data
    const internshipData = {
      title,
      organization: {
        name: organization.name,
        website: organization.website || '',
        industry: organization.industry || '',
        size: organization.size || 'Medium'
      },
      description,
      shortDescription: shortDescription || description.substring(0, 200) + '...',
      category: category || 'Computer Science',
      type: type || 'Summer Internship',
      location: location || {
        type: 'On-Site',
        city: '',
        country: '',
        address: ''
      },
      duration: duration || {
        startDate: null,
        endDate: null,
        hoursPerWeek: {
          min: 20,
          max: 40
        }
      },
      compensation: compensation || {
        type: 'Unpaid',
        amount: 0,
        currency: 'USD',
        benefits: []
      },
      requirements: requirements || {
        educationLevel: 'Undergraduate',
        yearInSchool: [],
        minGPA: 0,
        skills: [],
        prerequisites: []
      },
      majors: majors || [],
      applicationDetails: applicationDetails || {
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        applicationLink: '',
        contactEmail: '',
        documentsRequired: [],
        instructions: ''
      },
      status: status || 'Draft',
      isFeatured: isFeatured || false,
      isEligibleForCredit: isEligibleForCredit || false,
      numberOfPositions: numberOfPositions || 1,
      learningOutcomes: learningOutcomes || [],
      skillsGained: skillsGained || [],
      mentorship: mentorship || {
        provided: false,
        details: ''
      },
      postedBy: req.session.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      applicationsCount: 0,
      savesCount: 0
    };

    // Log what we're about to save
    console.log('Creating internship with data:', internshipData);

    // Create and save internship
    const internship = new Internship(internshipData);
    const savedInternship = await internship.save();
    
    console.log('Internship created successfully:', savedInternship._id);
    
    res.status(201).json({
      success: true,
      message: 'Internship created successfully',
      data: savedInternship
    });
    
  } catch (error) {
    console.error('❌ Error creating internship:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate internship found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create internship',
      message: error.message
    });
  }
});

// ✅ Get single internship by ID
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

// ✅ Update internship
router.put('/internships/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Add updated timestamp
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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ Delete internship
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

// ✅ Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'admin-career',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /test',
      'GET /internships',
      'POST /internships',
      'GET /internships/:id',
      'PUT /internships/:id',
      'DELETE /internships/:id'
    ]
  });
});

module.exports = router;