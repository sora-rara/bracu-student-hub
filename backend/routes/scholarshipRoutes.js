const express = require('express');
const router = express.Router();
const Scholarship = require('../models/Scholarship');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const SavedScholarship = require('../models/SavedScholarship');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/adminMiddleware');
const mongoose = require('mongoose');

// ====================
// MIDDLEWARE
// ====================

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return res.status(403).json({ success: false, error: 'This route is for students only' });
  }
  
  next();
};

// ====================
// DEBUG MIDDLEWARE
// ====================
router.use((req, res, next) => {
  console.log(`Scholarship API: ${req.method} ${req.originalUrl}`);
  console.log('User:', req.user?._id);
  next();
});

// ====================
// TEST ROUTES
// ====================
router.get('/test-working', (req, res) => {
  res.json({
    success: true,
    message: 'Scholarship routes are working',
    timestamp: new Date().toISOString()
  });
});

// ====================
// ADMIN ROUTES
// ====================

// GET all scholarships for admin
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'organization.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const total = await Scholarship.countDocuments(query);
    
    const scholarships = await Scholarship.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .lean();
    
    const scholarshipsWithCounts = await Promise.all(
      scholarships.map(async (scholarship) => {
        const applicationsCount = await ScholarshipApplication.countDocuments({
          scholarshipId: scholarship._id
        });
        
        return {
          ...scholarship,
          applicationsCount
        };
      })
    );
    
    res.json({
      success: true,
      data: scholarshipsWithCounts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum
    });
    
  } catch (error) {
    console.error('Error in GET /admin/all:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scholarships',
      message: error.message
    });
  }
});

// GET admin dashboard statistics
router.get('/admin/dashboard/stats', requireAdmin, async (req, res) => {
  try {
    const totalScholarships = await Scholarship.countDocuments();
    const activeScholarships = await Scholarship.countDocuments({ status: 'active' });
    const draftScholarships = await Scholarship.countDocuments({ status: 'draft' });
    const featuredScholarships = await Scholarship.countDocuments({ isFeatured: true });
    
    const totalApplications = await ScholarshipApplication.countDocuments();
    const pendingApplications = await ScholarshipApplication.countDocuments({ status: 'pending' });
    const acceptedApplications = await ScholarshipApplication.countDocuments({ status: 'accepted' });
    
    res.json({
      success: true,
      data: {
        scholarships: {
          total: totalScholarships,
          active: activeScholarships,
          draft: draftScholarships,
          featured: featuredScholarships
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          accepted: acceptedApplications
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
  }
});

// In scholarshipRoutes.js, update the /admin/:id/applications route:

// GET applications for a specific scholarship
router.get('/admin/:id/applications', requireAdmin, async (req, res) => {
  try {
    console.log('📋 GET scholarship applications for:', req.params.id);
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid scholarship ID' });
    }
    
    const scholarship = await Scholarship.findById(id);
    if (!scholarship) {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    
    // Get applications with populated student data
    const applications = await ScholarshipApplication.find({ scholarshipId: id })
      .populate({
        path: 'studentId',
        select: 'name email universityId phoneNumber major department year cgpa'
      })
      .sort({ submittedAt: -1 })
      .lean();
    
    console.log(`Found ${applications.length} applications`);
    
    // Format applications for frontend
    const formattedApplications = applications.map(app => {
      const student = app.studentId || {};
      const appData = app.applicationData || {};
      const academicInfo = app.academicInfo || {};
      
      return {
        _id: app._id,
        student: {
          _id: student._id,
          name: student.name || 'Anonymous',
          email: student.email || 'N/A',
          universityId: student.universityId || appData.universityId || 'N/A',
          phoneNumber: student.phoneNumber || appData.phoneNumber || 'N/A',
          major: student.major || academicInfo.major || appData.major || 'N/A',
          department: student.department || appData.department || 'N/A',
          year: student.year || appData.year || 'N/A'
        },
        cgpa: academicInfo.currentGPA || appData.cgpa || student.cgpa || 0,
        major: academicInfo.major || appData.major || student.major || 'N/A',
        status: app.status || 'pending',
        appliedAt: app.submittedAt || app.appliedAt || app.createdAt,
        // Include full application data
        fullApplication: {
          ...app,
          studentId: undefined // Remove duplicate
        }
      };
    });
    
    res.json({
      success: true,
      data: formattedApplications,
      scholarship: {
        _id: scholarship._id,
        title: scholarship.title,
        organization: scholarship.organization,
        applicationsCount: applications.length
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
});
// GET single application detail (admin only)
router.get('/admin/:scholarshipId/applications/:applicationId', requireAdmin, async (req, res) => {
  try {
    const { scholarshipId, applicationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(scholarshipId) || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    
    const application = await ScholarshipApplication.findOne({
      _id: applicationId,
      scholarshipId: scholarshipId
    })
    .populate('studentId', 'name email universityId phoneNumber major department year cgpa')
    .populate('scholarshipId', 'title organization')
    .lean();
    
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch application' });
  }
});

// UPDATE application status (admin only)
router.put('/admin/:scholarshipId/applications/:applicationId/status', requireAdmin, async (req, res) => {
  try {
    const { scholarshipId, applicationId } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(scholarshipId) || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    const application = await ScholarshipApplication.findOneAndUpdate(
      {
        _id: applicationId,
        scholarshipId: scholarshipId
      },
      {
        status: status,
        reviewedAt: status !== 'pending' ? new Date() : undefined
      },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, error: 'Failed to update application status' });
  }
});

// DELETE application (admin only)
router.delete('/admin/:scholarshipId/applications/:applicationId', requireAdmin, async (req, res) => {
  try {
    const { scholarshipId, applicationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(scholarshipId) || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    
    const application = await ScholarshipApplication.findOneAndDelete({
      _id: applicationId,
      scholarshipId: scholarshipId
    });
    
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ success: false, error: 'Failed to delete application' });
  }
});


// ====================
// PUBLIC ROUTES
// ====================

// Get all scholarships (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, type, level, page = 1, limit = 10 } = req.query;
    
    const query = {};
    query.status = 'active';
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'organization.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') query.category = category;
    if (type && type !== 'all') query.type = type;
    if (level && level !== 'all') query.level = level;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Scholarship.countDocuments(query);
    
    const scholarships = await Scholarship.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    res.json({
      success: true,
      data: scholarships,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get categories (public)
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Scholarship.distinct('category');
    res.json({ 
      success: true, 
      data: categories.filter(cat => cat).sort() 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get featured scholarships (public)
router.get('/featured/all', async (req, res) => {
  try {
    const featuredScholarships = await Scholarship.find({
      status: 'active',
      isFeatured: true
    })
      .sort('-createdAt')
      .limit(6)
      .select('title organization awardAmount currency level category shortDescription applicationDetails.deadline');
    
    res.json({ success: true, data: featuredScholarships });
  } catch (error) {
    console.error('Error fetching featured scholarships:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get recent scholarships (public)
router.get('/recent/all', async (req, res) => {
  try {
    const recentScholarships = await Scholarship.find({
      status: 'active'
    })
      .sort('-createdAt')
      .limit(8)
      .select('title organization awardAmount currency level category shortDescription applicationDetails.deadline');
    
    res.json({ success: true, data: recentScholarships });
  } catch (error) {
    console.error('Error fetching recent scholarships:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ====================
// SAVED SCHOLARSHIPS ROUTES
// ====================

// Get saved scholarships
router.get('/saved', requireAuth, isStudent, async (req, res) => {
  try {
    const savedScholarships = await SavedScholarship.find({ studentId: req.user._id })
      .populate('scholarshipId', 'title organization awardAmount currency level category shortDescription applicationDetails.deadline')
      .sort('-savedAt')
      .select('-__v');
    
    res.json({
      success: true,
      data: savedScholarships,
      count: savedScholarships.length,
      message: 'Saved scholarships retrieved successfully'
    });
  } catch (error) {
    console.error('Error in /saved route:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message
    });
  }
});

// Save a scholarship
router.post('/:id/save', requireAuth, isStudent, async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    
    const existingSave = await SavedScholarship.findOne({
      studentId: req.user._id,
      scholarshipId: req.params.id
    });
    
    if (existingSave) {
      return res.status(400).json({ 
        success: false, 
        error: 'Scholarship already saved',
        data: { scholarshipId: req.params.id, saved: true }
      });
    }
    
    const savedScholarship = new SavedScholarship({
      studentId: req.user._id,
      scholarshipId: req.params.id
    });
    
    await savedScholarship.save();
    
    res.json({
      success: true,
      message: 'Scholarship saved successfully',
      data: { scholarshipId: req.params.id, saved: true }
    });
  } catch (error) {
    console.error('Error saving scholarship:', error);
    res.status(500).json({ success: false, error: 'Failed to save scholarship' });
  }
});

// Unsave a scholarship
router.delete('/:id/save', requireAuth, isStudent, async (req, res) => {
  try {
    const result = await SavedScholarship.findOneAndDelete({
      studentId: req.user._id,
      scholarshipId: req.params.id
    });
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Saved scholarship not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Scholarship removed from saved',
      data: { scholarshipId: req.params.id, saved: false }
    });
  } catch (error) {
    console.error('Error unsaving scholarship:', error);
    res.status(500).json({ success: false, error: 'Failed to remove saved scholarship' });
  }
});

// Check if a scholarship is saved
router.get('/:id/is-saved', requireAuth, isStudent, async (req, res) => {
  try {
    const saved = await SavedScholarship.findOne({
      studentId: req.user._id,
      scholarshipId: req.params.id
    });
    
    res.json({
      success: true,
      isSaved: !!saved
    });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ====================
// APPLICATION ROUTES - UPDATED FOR FORM DATA
// ====================

// Apply for scholarship - Handle FormData
router.post('/:id/apply', requireAuth, isStudent, async (req, res) => {
  try {
    console.log('Applying for scholarship:', req.params.id);
    console.log('User:', req.user._id);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Check if it's FormData
    const isFormData = req.headers['content-type']?.includes('multipart/form-data');
    
    let formData = {};
    
    if (isFormData) {
      // For FormData, we need to parse it differently
      // In a real app, you'd use multer or busboy, but for simplicity:
      formData = req.body || {};
    } else {
      // For JSON
      formData = req.body || {};
    }
    
    console.log('Form data keys:', Object.keys(formData));
    
    const scholarship = await Scholarship.findById(req.params.id);
    
    if (!scholarship) {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    
    if (scholarship.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Scholarship is not currently accepting applications' });
    }
    
    if (scholarship.applicationDetails?.deadline) {
      const deadline = new Date(scholarship.applicationDetails.deadline);
      const now = new Date();
      if (deadline < now) {
        return res.status(400).json({ success: false, error: 'Application deadline has passed' });
      }
    }
    
    const existingApplication = await ScholarshipApplication.findOne({
      scholarshipId: scholarship._id,
      studentId: req.user._id
    });
    
    if (existingApplication) {
      return res.status(400).json({ success: false, error: 'You have already applied for this scholarship' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Parse arrays from form data
    let academicAchievements = [];
    let workExperience = [];
    let researchProjects = [];
    let references = [];
    let essays = [];
    
    try {
      if (formData.academicAchievements) {
        academicAchievements = typeof formData.academicAchievements === 'string' 
          ? JSON.parse(formData.academicAchievements) 
          : formData.academicAchievements;
      }
      
      if (formData.workExperience) {
        workExperience = typeof formData.workExperience === 'string'
          ? JSON.parse(formData.workExperience)
          : formData.workExperience;
      }
      
      if (formData.researchProjects) {
        researchProjects = typeof formData.researchProjects === 'string'
          ? JSON.parse(formData.researchProjects)
          : formData.researchProjects;
      }
      
      if (formData.references) {
        references = typeof formData.references === 'string'
          ? JSON.parse(formData.references)
          : formData.references;
      }
      
      // Create essays array from form fields
      essays = [
        {
          question: 'Why do you deserve this scholarship?',
          response: formData.essayText || '',
          wordCount: (formData.essayText || '').split(/\s+/).length
        },
        {
          question: 'Statement of Financial Need',
          response: formData.financialNeed || '',
          wordCount: (formData.financialNeed || '').split(/\s+/).length
        },
        {
          question: 'Career Goals & Aspirations',
          response: formData.careerGoals || '',
          wordCount: (formData.careerGoals || '').split(/\s+/).length
        }
      ];
      
      if (formData.extracurricular) {
        essays.push({
          question: 'Extracurricular Activities & Leadership',
          response: formData.extracurricular || '',
          wordCount: (formData.extracurricular || '').split(/\s+/).length
        });
      }
    } catch (parseError) {
      console.error('Error parsing form data:', parseError);
      return res.status(400).json({ success: false, error: 'Invalid form data format' });
    }
    
    // Validate required fields
    if (!formData.essayText || !formData.essayText.trim()) {
      return res.status(400).json({ success: false, error: 'Essay text is required' });
    }
    
    if (!formData.financialNeed || !formData.financialNeed.trim()) {
      return res.status(400).json({ success: false, error: 'Financial need statement is required' });
    }
    
    if (!formData.careerGoals || !formData.careerGoals.trim()) {
      return res.status(400).json({ success: false, error: 'Career goals statement is required' });
    }
    
    // Prepare application data
    const applicationData = {
      scholarshipId: scholarship._id,
      studentId: req.user._id,
      // Application data from form
      applicationData: {
        phoneNumber: formData.phoneNumber || user.phoneNumber || '',
        universityId: formData.universityId || user.universityId || '',
        department: formData.department || user.department || '',
        major: formData.major || user.major || '',
        semester: formData.semester || user.semester || '',
        year: formData.year || user.year || '',
        cgpa: parseFloat(formData.cgpa) || parseFloat(user.cgpa) || 0,
        expectedGraduation: formData.expectedGraduation || '',
        additionalInfo: formData.additionalInfo || ''
      },
      // Academic information
      academicInfo: {
        universityId: formData.universityId || user.universityId || '',
        major: formData.major || user.major || '',
        currentGPA: parseFloat(formData.cgpa) || parseFloat(user.cgpa) || 0,
        academicAchievements: academicAchievements.filter(a => a && a.trim())
      },
      // Extracurricular activities
      extracurriculars: workExperience.map(exp => ({
        activityType: 'work',
        organization: exp.organization || '',
        position: exp.position || '',
        description: exp.description || '',
        startDate: exp.duration ? new Date() : null,
        endDate: exp.duration ? new Date() : null
      })),
      // Essays
      essays: essays.filter(e => e.response && e.response.trim()),
      // References
      references: references.filter(ref => ref.name && ref.name.trim()),
      // Status
      status: 'submitted',
      submittedAt: new Date()
    };
    
    console.log('Creating application with data:', {
      scholarshipId: applicationData.scholarshipId,
      studentId: applicationData.studentId,
      essaysCount: applicationData.essays.length,
      referencesCount: applicationData.references.length
    });
    
    const application = new ScholarshipApplication(applicationData);
    await application.save();
    
    // Increment applications count
    scholarship.applicationsCount = (scholarship.applicationsCount || 0) + 1;
    await scholarship.save();
    
    console.log('Application submitted successfully:', application._id);
    
    res.status(201).json({
      success: true,
      data: {
        _id: application._id,
        scholarshipId: application.scholarshipId,
        status: application.status,
        submittedAt: application.submittedAt
      },
      message: 'Application submitted successfully'
    });
    
  } catch (error) {
    console.error('Error applying for scholarship:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already applied for this scholarship' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit application',
      message: error.message 
    });
  }
});

// Check application status
router.get('/check/:id', requireAuth, isStudent, async (req, res) => {
  try {
    const application = await ScholarshipApplication.findOne({
      scholarshipId: req.params.id,
      studentId: req.user._id
    }).select('status submittedAt');
    
    res.json({
      success: true,
      hasApplied: !!application,
      applicationStatus: application?.status,
      submittedAt: application?.submittedAt
    });
  } catch (error) {
    console.error('Error checking application:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get user's applications
router.get('/my-applications/all', requireAuth, isStudent, async (req, res) => {
  try {
    const applications = await ScholarshipApplication.find({ studentId: req.user._id })
      .populate('scholarshipId', 'title organization awardAmount currency level category')
      .sort('-submittedAt')
      .select('-__v');
    
    res.json({ 
      success: true, 
      data: applications 
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: 'Failed to load applications' });
  }
});

// Withdraw application
router.post('/withdraw/:id', requireAuth, isStudent, async (req, res) => {
  try {
    const application = await ScholarshipApplication.findOne({
      _id: req.params.id,
      studentId: req.user._id
    });
    
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    if (application.status === 'withdrawn') {
      return res.status(400).json({ success: false, error: 'Application already withdrawn' });
    }
    
    application.status = 'withdrawn';
    await application.save();
    
    res.json({ 
      success: true, 
      message: 'Application withdrawn successfully' 
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ success: false, error: 'Failed to withdraw application' });
  }
});

// ====================
// SINGLE SCHOLARSHIP ROUTE
// ====================

// Get single scholarship
router.get('/:id', async (req, res) => {
  try {
    // Check for special routes first
    const specialRoutes = ['saved', 'check', 'my-applications', 'withdraw', 'apply', 'admin', 'categories', 'featured', 'recent'];
    if (specialRoutes.includes(req.params.id)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Not found' 
      });
    }
    
    const scholarship = await Scholarship.findById(req.params.id).select('-__v');
    
    if (!scholarship) {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    
    // Increment view count
    scholarship.views = (scholarship.views || 0) + 1;
    await scholarship.save();
    
    // Get similar scholarships
    const similarScholarships = await Scholarship.find({
      _id: { $ne: scholarship._id },
      category: scholarship.category,
      status: 'active'
    })
      .limit(4)
      .select('title organization awardAmount currency level category');
    
    const responseData = {
      ...scholarship.toObject(),
      similarScholarships
    };
    
    res.json({ 
      success: true, 
      data: responseData 
    });
  } catch (error) {
    console.error('Error fetching scholarship:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ====================
// DEBUG & UTILITY ROUTES
// ====================

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Scholarship API is healthy',
    timestamp: new Date().toISOString(),
    session: req.session ? 'Active' : 'No session'
  });
});

// API info
router.get('/api-info', (req, res) => {
  res.json({
    success: true,
    message: 'Scholarship Management API',
    version: '1.0.0',
    endpoints: {
      public: {
        getAll: 'GET /',
        getById: 'GET /:id',
        categories: 'GET /categories/all',
        featured: 'GET /featured/all',
        recent: 'GET /recent/all'
      },
      student: {
        apply: 'POST /:id/apply',
        saved: 'GET /saved',
        save: 'POST /:id/save',
        unsave: 'DELETE /:id/save',
        checkSaved: 'GET /:id/is-saved',
        myApplications: 'GET /my-applications/all',
        checkApplication: 'GET /check/:id',
        withdraw: 'POST /withdraw/:id'
      },
      admin: {
        getAll: 'GET /admin/all',
        dashboard: 'GET /admin/dashboard/stats',
        applications: 'GET /admin/:id/applications'
      }
    }
  });
});

module.exports = router;
