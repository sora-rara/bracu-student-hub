const express = require('express');
const router = express.Router();
const Scholarship = require('../models/Scholarship');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const SavedScholarship = require('../models/SavedScholarship');
const User = require('../models/User');
const mongoose = require('mongoose');
const { requireAuth, requireAdmin } = require('../middleware/adminMiddleware');
// ====================
// ADMIN SCHOLARSHIP ROUTES
// ====================

// Use requireAdmin middleware for all routes
router.use(requireAdmin);

// Test route
router.get('/test', (req, res) => {
  console.log('Admin scholarship test route hit by:', req.user.email);
  
  res.json({
    success: true,
    message: 'Admin scholarship routes are working',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// CREATE new scholarship
router.post('/', async (req, res) => {
  try {
    console.log('Creating scholarship by admin:', req.user.email);
    
    // Simplified data extraction
    const scholarshipData = {
      title: req.body.title?.trim(),
      organization: {
        name: req.body.organization?.name?.trim(),
        website: req.body.organization?.website?.trim() || '',
        industry: req.body.organization?.industry?.trim() || '',
        size: req.body.organization?.size || 'medium'
      },
      description: req.body.description?.trim(),
      shortDescription: req.body.shortDescription?.trim() || req.body.description?.substring(0, 250),
      category: req.body.category || 'other',
      type: req.body.type || 'award',
      awardAmount: Number(req.body.awardAmount) || 0,
      currency: req.body.currency || 'USD',
      isRenewable: Boolean(req.body.isRenewable),
      renewalConditions: req.body.renewalConditions?.trim() || '',
      numberOfAwards: Number(req.body.numberOfAwards) || 1,
      eligibility: {
        educationLevel: req.body.eligibility?.educationLevel || ['undergraduate'],
        nationality: req.body.eligibility?.nationality || ['any'],
        residencyStatus: req.body.eligibility?.residencyStatus || ['any'],
        fieldOfStudy: req.body.eligibility?.fieldOfStudy || [],
        minGPA: req.body.eligibility?.minGPA,
        incomeLevel: req.body.eligibility?.incomeLevel || 'any'
      },
      applicationDetails: {
        deadline: new Date(req.body.applicationDetails?.deadline),
        applicationLink: req.body.applicationDetails?.applicationLink?.trim(),
        contactEmail: req.body.applicationDetails?.contactEmail?.trim() || '',
        contactPhone: req.body.applicationDetails?.contactPhone?.trim() || '',
        documentsRequired: req.body.applicationDetails?.documentsRequired || [],
        instructions: req.body.applicationDetails?.instructions?.trim() || ''
      },
      dates: {
        applicationOpen: new Date(),
        applicationClose: new Date(req.body.applicationDetails?.deadline)
      },
      status: req.body.status || 'draft',
      isFeatured: Boolean(req.body.isFeatured),
      tags: req.body.tags || [],
      createdBy: req.user._id
    };
    
    // Validate required fields
    if (!scholarshipData.title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (!scholarshipData.organization.name) {
      return res.status(400).json({ success: false, error: 'Organization name is required' });
    }
    if (!scholarshipData.applicationDetails.deadline || isNaN(scholarshipData.applicationDetails.deadline)) {
      return res.status(400).json({ success: false, error: 'Valid deadline is required' });
    }
    
    // Create and save scholarship
    const newScholarship = new Scholarship(scholarshipData);
    const savedScholarship = await newScholarship.save();
    
    console.log('Scholarship created successfully:', savedScholarship._id);
    
    res.status(201).json({
      success: true,
      message: 'Scholarship created successfully',
      data: savedScholarship
    });
    
  } catch (error) {
    console.error('Error creating scholarship:', error);
    
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
      error: 'Failed to create scholarship',
      message: error.message
    });
  }
});

// GET all scholarships for admin
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      category = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    let query = {};
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'organization.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await Scholarship.countDocuments(query);
    
    const scholarships = await Scholarship.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
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
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    });
    
  } catch (error) {
    console.error('Error fetching scholarships for admin:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch scholarships' });
  }
});

// GET single scholarship for admin
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid scholarship ID' });
    }
    
    const scholarship = await Scholarship.findById(id).lean();
    
    if (!scholarship) {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    
    const applicationsCount = await ScholarshipApplication.countDocuments({ 
      scholarshipId: scholarship._id 
    });
    
    res.json({
      success: true,
      data: {
        ...scholarship,
        applicationsCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching scholarship for admin:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch scholarship' });
  }
});

// DELETE scholarship
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid scholarship ID' });
    }
    
    const scholarship = await Scholarship.findById(id);
    
    if (!scholarship) {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    
    await ScholarshipApplication.deleteMany({ scholarshipId: id });
    await SavedScholarship.deleteMany({ scholarshipId: id });
    await Scholarship.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Scholarship deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting scholarship:', error);
    res.status(500).json({ success: false, error: 'Failed to delete scholarship' });
  }
});

// PUT update scholarship
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid scholarship ID' });
    }
    
    const scholarship = await Scholarship.findById(id);
    
    if (!scholarship) {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    
    // Update fields from request
    const updatableFields = [
      'title', 'description', 'shortDescription', 'category', 'type',
      'awardAmount', 'currency', 'status', 'isFeatured', 'numberOfAwards', 'tags'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        scholarship[field] = req.body[field];
      }
    });
    
    // Update organization
    if (req.body.organization) {
      scholarship.organization = { ...scholarship.organization, ...req.body.organization };
    }
    
    // Update application details
    if (req.body.applicationDetails) {
      if (req.body.applicationDetails.deadline) {
        req.body.applicationDetails.deadline = new Date(req.body.applicationDetails.deadline);
      }
      scholarship.applicationDetails = { 
        ...scholarship.applicationDetails, 
        ...req.body.applicationDetails 
      };
    }
    
    // Update eligibility
    if (req.body.eligibility) {
      scholarship.eligibility = { ...scholarship.eligibility, ...req.body.eligibility };
    }
    
    scholarship.updatedAt = new Date();
    scholarship.updatedBy = req.user._id;
    
    await scholarship.save();
    
    res.json({
      success: true,
      message: 'Scholarship updated successfully',
      data: scholarship
    });
    
  } catch (error) {
    console.error('Error updating scholarship:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error',
        details: errors 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update scholarship' });
  }
// Add this route after your other routes (before module.exports):

// GET applications for a specific scholarship (admin only)
router.get('/:id/applications', async (req, res) => {
  try {
    console.log('📋 GET scholarship applications for:', req.params.id);
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid scholarship ID' });
    }
    
    // Check if scholarship exists
    const scholarship = await Scholarship.findById(id);
    if (!scholarship) {
      return res.status(404).json({ success: false, error: 'Scholarship not found' });
    }
    
    console.log('Found scholarship:', scholarship.title);
    
    // Get applications for this scholarship
    const applications = await ScholarshipApplication.find({ scholarshipId: id })
      .populate('studentId', 'name email universityId major cgpa phoneNumber department year')
      .sort({ submittedAt: -1 })
      .lean();
    
    console.log(`Found ${applications.length} applications`);
    
    res.json({
      success: true,
      data: applications,
      scholarship: {
        _id: scholarship._id,
        title: scholarship.title,
        organization: scholarship.organization,
        applicationsCount: applications.length
      }
    });
  } catch (error) {
    console.error('Error fetching scholarship applications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
});

// Also add a route to get application details
router.get('/applications/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, error: 'Invalid application ID' });
    }
    
    const application = await ScholarshipApplication.findById(applicationId)
      .populate('studentId', 'name email universityId major cgpa phoneNumber department year')
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
});

module.exports = router;
