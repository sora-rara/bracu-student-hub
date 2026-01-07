// routes/careerRoutes.js - COMPLETE WORKING VERSION
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminMiddleware');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
// ====================
// HELPER FUNCTIONS
// ====================

const normalizeValue = (value) => {
  if (!value) return value;
  
  // Handle common frontend values
  const mappings = {
    // Type mappings
    'summer-internship': 'summer',
    'Summer Internship': 'summer',
    'fall-internship': 'fall',
    'Fall Internship': 'fall',
    'winter-internship': 'winter',
    'Winter Internship': 'winter',
    'spring-internship': 'spring',
    'Spring Internship': 'spring',
    'year-round-internship': 'year-round',
    'Year-Round': 'year-round',
    'Year Round Internship': 'year-round',
    'co-op-program': 'co-op',
    'Co-op Program': 'co-op',
    'virtual/remote': 'virtual',
    'Virtual/Remote': 'virtual',
    'part-time-internship': 'part-time',
    'Part-Time': 'part-time',
    'full-time-internship': 'full-time',
    'Full-Time': 'full-time',
    'project-based': 'project-based',
    'Project-Based': 'project-based',
    
    // Status mappings
    'Active': 'active',
    'Draft': 'draft',
    'Closed': 'closed',
    'Filled': 'filled',
    'Expired': 'expired',
    
    // Education level mappings
    'Undergraduate': 'undergraduate',
    'Graduate': 'graduate',
    'PhD': 'phd',
    'Any': 'any',
    'Any Level': 'any'
  };
  
  const lowerValue = typeof value === 'string' ? value.toLowerCase() : value;
  
  // First check exact mapping
  if (mappings[value]) {
    return mappings[value];
  }
  
  // Then check lowercase mapping
  if (mappings[lowerValue]) {
    return mappings[lowerValue];
  }
  
  // Default: return lowercase version
  return typeof value === 'string' ? value.toLowerCase() : value;
};

const normalizeInternshipData = (data) => {
  const normalized = { ...data };
  
  // Normalize category: "Computer Science" -> "computer-science"
  if (normalized.category) {
    if (typeof normalized.category === 'string') {
      normalized.category = normalized.category.toLowerCase().replace(/ /g, '-');
    }
  }
  
  // Normalize type
  if (normalized.type) {
    normalized.type = normalizeValue(normalized.type);
  }
  
  // Normalize status
  if (normalized.status) {
    normalized.status = normalizeValue(normalized.status);
  }
  
  // Normalize location type
  if (normalized.location?.type) {
    normalized.location.type = normalizeValue(normalized.location.type);
  }
  
  // Normalize compensation type
  if (normalized.compensation?.type) {
    normalized.compensation.type = normalizeValue(normalized.compensation.type);
  }
  
  // Normalize education level
  if (normalized.requirements?.educationLevel) {
    normalized.requirements.educationLevel = normalizeValue(normalized.requirements.educationLevel);
  }
  
  // Ensure arrays are properly formatted
  if (normalized.requirements?.skills) {
    if (typeof normalized.requirements.skills === 'string') {
      normalized.requirements.skills = normalized.requirements.skills.split(',').map(s => s.trim()).filter(s => s);
    }
  }
  
  if (normalized.majors) {
    if (typeof normalized.majors === 'string') {
      normalized.majors = normalized.majors.split(',').map(m => m.trim()).filter(m => m);
    }
  }
  
  if (normalized.tags) {
    if (typeof normalized.tags === 'string') {
      normalized.tags = normalized.tags.split(',').map(t => t.trim()).filter(t => t);
    }
  }
  
  return normalized;
};

// ====================
// PUBLIC ROUTES
// ====================

// Get all active internships
router.get('/internships', async (req, res) => {
  try {
    const internships = await Internship.find({ 
      status: { $in: ['active', 'Active'] }
    })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(100);
    
    res.json({ 
      success: true, 
      data: internships,
      count: internships.length
    });
    
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch internships'
    });
  }
});

// Get single internship
router.get('/internships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const internship = await Internship.findById(id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false, 
        error: 'Internship not found' 
      });
    }
    
    // Increment view count
    internship.views = (internship.views || 0) + 1;
    await internship.save();
    
    res.json({ 
      success: true, 
      data: internship 
    });
    
  } catch (error) {
    console.error('Error fetching internship:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Search internships
router.get('/search', async (req, res) => {
  try {
    const { q, category, location, type, page = 1, limit = 20 } = req.query;
    
    let filter = { status: { $in: ['active', 'Active'] } };
    
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { 'organization.name': { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (location && location !== 'all') {
      filter['location.type'] = location;
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const [internships, total] = await Promise.all([
      Internship.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Internship.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: internships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error searching internships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search internships'
    });
  }
});

// ====================
// ADMIN ROUTES
// ====================

// Test route
router.get('/admin/test', requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin career routes are working!',
    user: req.session?.user
  });
});

// Get all internships (admin)
router.get('/admin/internships', requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      category, 
      type, 
      search,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let filter = {};

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (type && type !== 'all') filter.type = type;
    if (featured && featured !== 'all') filter.isFeatured = featured === 'true';
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'organization.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [internships, total] = await Promise.all([
      Internship.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Internship.countDocuments(filter)
    ]);

    // Calculate statistics
    const stats = {
      total: await Internship.countDocuments({}),
      active: await Internship.countDocuments({ status: 'active' }),
      draft: await Internship.countDocuments({ status: 'draft' }),
      closed: await Internship.countDocuments({ status: 'closed' }),
      featured: await Internship.countDocuments({ isFeatured: true }),
      expired: await Internship.countDocuments({
        'applicationDetails.deadline': { $lt: new Date() },
        status: 'active'
      })
    };

    res.json({ 
      success: true, 
      data: internships,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin internships:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch internships'
    });
  }
});

// Create internship (admin)
router.post('/admin/internships', requireAdmin, async (req, res) => {
  try {
    console.log('=== Creating new internship ===');
    
    // Check authentication
    if (!req.session?.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Please login again'
      });
    }

    // Normalize incoming data
    const normalizedData = normalizeInternshipData(req.body);
    
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
      mentorship,
      tags
    } = normalizedData;

    // Validate required fields
    if (!title || !organization?.name || !description) {
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
        size: organization.size || 'medium'
      },
      description,
      shortDescription: shortDescription || description.substring(0, 200) + '...',
      category: category || 'computer-science',
      type: type || 'summer',
      location: location || {
        type: 'on-site',
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
        type: 'unpaid',
        amount: 0,
        currency: 'USD',
        benefits: []
      },
      requirements: requirements || {
        educationLevel: 'undergraduate',
        yearInSchool: [],
        minGPA: 0,
        skills: [],
        prerequisites: []
      },
      majors: majors || [],
      applicationDetails: applicationDetails || {
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationLink: '',
        contactEmail: '',
        documentsRequired: [],
        instructions: ''
      },
      status: status || 'draft',
      isFeatured: isFeatured || false,
      isEligibleForCredit: isEligibleForCredit || false,
      numberOfPositions: parseInt(numberOfPositions) || 1,
      learningOutcomes: learningOutcomes || [],
      skillsGained: skillsGained || [],
      mentorship: mentorship || {
        provided: false,
        details: ''
      },
      tags: tags || [],
      postedBy: req.session.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      applicationsCount: 0,
      savesCount: 0
    };

    // Create and save internship
    const internship = new Internship(internshipData);
    const savedInternship = await internship.save();
    
    res.status(201).json({
      success: true,
      message: 'Internship created successfully',
      data: savedInternship
    });
    
  } catch (error) {
    console.error('Error creating internship:', error);
    
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
      message: error.message
    });
  }
});

// Get single internship (admin)
router.get('/admin/internships/:id', requireAdmin, async (req, res) => {
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

// Update internship (admin)
router.put('/admin/internships/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = normalizeInternshipData(req.body);
    
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

// Delete internship (admin)
router.delete('/admin/internships/:id', requireAdmin, async (req, res) => {
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

// Get statistics
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const total = await Internship.countDocuments({});
    const active = await Internship.countDocuments({ status: 'active' });
    const draft = await Internship.countDocuments({ status: 'draft' });
    const closed = await Internship.countDocuments({ status: 'closed' });
    const featured = await Internship.countDocuments({ isFeatured: true });
    
    const categories = await Internship.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
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
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ====================
// UTILITY ROUTES
// ====================

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'career',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Get available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Internship.distinct('category');
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.get('/admin/applications', requireAdmin, async (req, res) => {
  try {
    const {
      internshipId,
      status,
      studentName,
      studentEmail,
      sortBy = 'appliedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let filter = {};

    // Filter by internship
    if (internshipId && internshipId !== 'all') {
      filter.internship = internshipId;
    }

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Search by student name or email
    if (studentName || studentEmail) {
      filter.$or = [];
      if (studentName) {
        filter.$or.push({ 'student.name': { $regex: studentName, $options: 'i' } });
      }
      if (studentEmail) {
        filter.$or.push({ 'student.email': { $regex: studentEmail, $options: 'i' } });
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [applications, total, stats] = await Promise.all([
      Application.find(filter)
        .populate('internship', 'title organization.name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Application.countDocuments(filter),
      Application.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Get unique internships for filter dropdown
    const internships = await Internship.find({})
      .select('title organization.name')
      .sort({ title: 1 });

    res.json({
      success: true,
      data: applications,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
        stats: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        internships: internships.map(i => ({
          id: i._id,
          title: i.title,
          company: i.organization.name
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

// Get single application
router.get('/admin/applications/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id)
      .populate('internship', 'title description organization.name location.type applicationDetails.deadline')
      .populate('reviewer', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
});

// Update application status
router.put('/admin/applications/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const updateData = {
      status,
      updatedAt: new Date(),
      reviewDate: new Date(),
      reviewer: req.session.userId
    };

    if (notes) {
      updateData.reviewNotes = notes;
    }

    const application = await Application.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('internship', 'title organization.name');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Add to communication log
    application.communications.push({
      type: 'note',
      content: `Status changed to ${status}${notes ? `: ${notes}` : ''}`,
      sender: 'Admin',
      recipient: application.student.email
    });

    await application.save();

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      data: application
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application status'
    });
  }
});

// Add communication note
router.post('/admin/applications/:id/communication', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, content, recipient } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    application.communications.push({
      type: type || 'note',
      content,
      sender: 'Admin',
      recipient: recipient || application.student.email,
      date: new Date()
    });

    await application.save();

    res.json({
      success: true,
      message: 'Communication note added',
      data: application.communications
    });

  } catch (error) {
    console.error('Error adding communication:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add communication'
    });
  }
});

// Schedule interview
router.post('/admin/applications/:id/interview', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, notes, interviewer } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Interview date is required'
      });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      {
        status: 'interview',
        interviewDate: new Date(date),
        interviewNotes: notes,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('internship', 'title organization.name');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Add to communication log
    application.communications.push({
      type: 'interview',
      content: `Interview scheduled for ${new Date(date).toLocaleString()}${notes ? `: ${notes}` : ''}`,
      sender: 'Admin',
      recipient: application.student.email
    });

    await application.save();

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: application
    });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule interview'
    });
  }
});

// Get applications statistics
router.get('/admin/applications/stats', requireAdmin, async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (timeframe === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { appliedAt: { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { appliedAt: { $gte: monthAgo } };
    } else if (timeframe === 'year') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      dateFilter = { appliedAt: { $gte: yearAgo } };
    }

    // Overall statistics
    const totalApplications = await Application.countDocuments({});
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const interviewApplications = await Application.countDocuments({ status: 'interview' });
    const acceptedApplications = await Application.countDocuments({ status: 'accepted' });

    // Applications by status
    const statusStats = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Applications over time
    const timeStats = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$appliedAt' },
            month: { $month: '$appliedAt' },
            day: { $dayOfMonth: '$appliedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top internships by applications
    const topInternships = await Application.aggregate([
      {
        $group: {
          _id: '$internship',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Populate internship details for top internships
    const populatedTopInternships = await Promise.all(
      topInternships.map(async (item) => {
        const internship = await Internship.findById(item._id).select('title organization.name');
        return {
          internship: internship ? {
            id: internship._id,
            title: internship.title,
            company: internship.organization.name
          } : null,
          applications: item.count
        };
      })
    );

    res.json({
      success: true,
      data: {
        total: totalApplications,
        pending: pendingApplications,
        interview: interviewApplications,
        accepted: acceptedApplications,
        statusStats: statusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        timeStats,
        topInternships: populatedTopInternships
      }
    });

  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application statistics'
    });
  }
});

// Export applications (CSV)
router.get('/admin/applications/export', requireAdmin, async (req, res) => {
  try {
    const applications = await Application.find({})
      .populate('internship', 'title organization.name')
      .select('student.name student.email student.major student.year status appliedAt')
      .sort({ appliedAt: -1 });

    const csvData = applications.map(app => ({
      'Student Name': app.student.name,
      'Student Email': app.student.email,
      'Student Major': app.student.major || '',
      'Student Year': app.student.year || '',
      'Internship Title': app.internship?.title || '',
      'Company': app.internship?.organization?.name || '',
      'Status': app.status,
      'Applied Date': app.appliedAt.toISOString().split('T')[0],
      'Applied Time': app.appliedAt.toISOString().split('T')[1].split('.')[0]
    }));

    res.json({
      success: true,
      data: csvData,
      count: csvData.length
    });

  } catch (error) {
    console.error('Error exporting applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export applications'
    });
  }
});
// Get available types
router.get('/types', async (req, res) => {
  try {
    const types = await Internship.distinct('type');
    res.json({
      success: true,
      data: types.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;