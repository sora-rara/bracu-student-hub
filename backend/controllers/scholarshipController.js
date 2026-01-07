// backend/controllers/adminScholarshipController.js
const Scholarship = require('../models/Scholarship');
const ScholarshipApplication = require('../models/ScholarshipApplication');
//const { validationResult } = require('express-validator');

// @desc    Get all scholarships (admin view)
// @route   GET /api/career/admin/scholarships
// @access  Private/Admin
exports.getAllScholarshipsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { 'organization.name': searchRegex }
      ];
    }

    const [scholarships, total] = await Promise.all([
      Scholarship.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Scholarship.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: scholarships,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching scholarships (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scholarships'
    });
  }
};

// @desc    Get single scholarship (admin)
// @route   GET /api/career/admin/scholarships/:id
// @access  Private/Admin
exports.getScholarshipByIdAdmin = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id).lean();
    
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        error: 'Scholarship not found'
      });
    }

    res.json({
      success: true,
      data: scholarship
    });
  } catch (error) {
    console.error('Error fetching scholarship (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scholarship'
    });
  }
};

// @desc    Create new scholarship
// @route   POST /api/career/admin/scholarships
// @access  Private/Admin
exports.createScholarship = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      organization,
      description,
      shortDescription,
      category,
      type,
      level,
      funding,
      eligibility,
      applicationDetails,
      applicationProcess,
      benefits,
      timeline,
      status,
      isFeatured,
      numberOfAwards,
      tags
    } = req.body;

    // Create scholarship
    const scholarship = new Scholarship({
      title,
      organization: {
        name: organization.name,
        website: organization.website || '',
        description: organization.description || '',
        industry: organization.industry || ''
      },
      description,
      shortDescription,
      category,
      type,
      level,
      funding: {
        type: funding.type,
        amount: funding.amount ? parseFloat(funding.amount) : 0,
        currency: funding.currency || 'USD',
        coverage: funding.coverage || [],
        renewable: funding.renewable || false,
        renewalConditions: funding.renewalConditions || '',
        disbursement: funding.disbursement || 'Annual',
        duration: funding.duration || '1 year'
      },
      eligibility: {
        academicLevel: eligibility.academicLevel || 'any',
        minGPA: eligibility.minGPA ? parseFloat(eligibility.minGPA) : 0,
        fieldOfStudy: eligibility.fieldOfStudy || [],
        nationality: eligibility.nationality || 'Any Nationality',
        countries: eligibility.countries || [],
        institution: eligibility.institution || '',
        ageLimit: eligibility.ageLimit || '',
        additionalRequirements: eligibility.additionalRequirements || []
      },
      applicationDetails: {
        deadline: applicationDetails.deadline,
        applicationLink: applicationDetails.applicationLink || '',
        contactEmail: applicationDetails.contactEmail || '',
        contactPhone: applicationDetails.contactPhone || '',
        documentsRequired: applicationDetails.documentsRequired || [],
        instructions: applicationDetails.instructions || '',
        interviewRequired: applicationDetails.interviewRequired || false,
        interviewProcess: applicationDetails.interviewProcess || ''
      },
      applicationProcess: applicationProcess || [],
      benefits: benefits || [],
      timeline: timeline || {},
      status: status || 'draft',
      isFeatured: isFeatured || false,
      numberOfAwards: parseInt(numberOfAwards) || 1,
      tags: tags || [],
      createdBy: req.user._id,
      views: 0,
      applicationsCount: 0,
      savesCount: 0
    });

    await scholarship.save();

    res.status(201).json({
      success: true,
      message: 'Scholarship created successfully',
      data: scholarship
    });
  } catch (error) {
    console.error('Error creating scholarship:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Scholarship with similar details already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create scholarship'
    });
  }
};

// @desc    Update scholarship
// @route   PUT /api/career/admin/scholarships/:id
// @access  Private/Admin
exports.updateScholarship = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const scholarship = await Scholarship.findById(req.params.id);
    
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        error: 'Scholarship not found'
      });
    }

    const updates = req.body;
    
    // Update fields
    Object.keys(updates).forEach(key => {
      if (key === 'organization' && updates.organization) {
        scholarship.organization = {
          ...scholarship.organization,
          ...updates.organization
        };
      } else if (key === 'funding' && updates.funding) {
        scholarship.funding = {
          ...scholarship.funding,
          ...updates.funding
        };
      } else if (key === 'eligibility' && updates.eligibility) {
        scholarship.eligibility = {
          ...scholarship.eligibility,
          ...updates.eligibility
        };
      } else if (key === 'applicationDetails' && updates.applicationDetails) {
        scholarship.applicationDetails = {
          ...scholarship.applicationDetails,
          ...updates.applicationDetails
        };
      } else if (key === 'timeline' && updates.timeline) {
        scholarship.timeline = {
          ...scholarship.timeline,
          ...updates.timeline
        };
      } else if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
        scholarship[key] = updates[key];
      }
    });

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
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update scholarship'
    });
  }
};

// @desc    Update scholarship status
// @route   PUT /api/career/admin/scholarships/:id/status
// @access  Private/Admin
exports.updateScholarshipStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'active', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: new Date(),
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        error: 'Scholarship not found'
      });
    }

    res.json({
      success: true,
      message: 'Scholarship status updated',
      data: scholarship
    });
  } catch (error) {
    console.error('Error updating scholarship status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update scholarship status'
    });
  }
};

// @desc    Toggle scholarship featured status
// @route   PUT /api/career/admin/scholarships/:id/feature
// @access  Private/Admin
exports.toggleFeaturedStatus = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        error: 'Scholarship not found'
      });
    }

    scholarship.isFeatured = !scholarship.isFeatured;
    scholarship.updatedAt = new Date();
    scholarship.updatedBy = req.user._id;

    await scholarship.save();

    res.json({
      success: true,
      message: `Scholarship ${scholarship.isFeatured ? 'featured' : 'unfeatured'}`,
      data: scholarship
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update featured status'
    });
  }
};

// @desc    Delete scholarship
// @route   DELETE /api/career/admin/scholarships/:id
// @access  Private/Admin
exports.deleteScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        error: 'Scholarship not found'
      });
    }

    // Check if there are applications
    const applicationCount = await ScholarshipApplication.countDocuments({
      scholarshipId: req.params.id
    });

    if (applicationCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete scholarship with existing applications'
      });
    }

    await scholarship.deleteOne();

    res.json({
      success: true,
      message: 'Scholarship deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scholarship:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete scholarship'
    });
  }
};

// @desc    Get scholarship applications
// @route   GET /api/career/admin/scholarships/:id/applications
// @access  Private/Admin
exports.getScholarshipApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      ScholarshipApplication.find({ scholarshipId: req.params.id })
        .populate('studentId', 'name email universityId')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ScholarshipApplication.countDocuments({ scholarshipId: req.params.id })
    ]);

    res.json({
      success: true,
      data: applications,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching scholarship applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
};

// @desc    Update application status
// @route   PUT /api/career/admin/scholarships/applications/:applicationId/status
// @access  Private/Admin
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    
    if (!['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const application = await ScholarshipApplication.findByIdAndUpdate(
      req.params.applicationId,
      { 
        status,
        feedback: feedback || '',
        reviewedAt: new Date(),
        reviewedBy: req.user._id
      },
      { new: true }
    )
    .populate('studentId', 'name email')
    .populate('scholarshipId', 'title');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // TODO: Send notification to student about status update

    res.json({
      success: true,
      message: 'Application status updated',
      data: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application status'
    });
  }
};

// @desc    Bulk actions on scholarships
// @route   POST /api/career/admin/scholarships/bulk-action
// @access  Private/Admin
exports.bulkActions = async (req, res) => {
  try {
    const { scholarshipIds, action } = req.body;
    
    if (!scholarshipIds || !Array.isArray(scholarshipIds) || scholarshipIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No scholarships selected'
      });
    }

    if (!['activate', 'deactivate', 'feature', 'unfeature', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }

    let update = {};
    switch (action) {
      case 'activate':
        update = { status: 'active' };
        break;
      case 'deactivate':
        update = { status: 'closed' };
        break;
      case 'feature':
        update = { isFeatured: true };
        break;
      case 'unfeature':
        update = { isFeatured: false };
        break;
      case 'delete':
        // Check if any scholarships have applications
        const applicationsCount = await ScholarshipApplication.countDocuments({
          scholarshipId: { $in: scholarshipIds }
        });
        
        if (applicationsCount > 0) {
          return res.status(400).json({
            success: false,
            error: 'Cannot delete scholarships with existing applications'
          });
        }
        
        await Scholarship.deleteMany({ _id: { $in: scholarshipIds } });
        
        return res.json({
          success: true,
          message: `Deleted ${scholarshipIds.length} scholarship(s)`
        });
    }

    update.updatedAt = new Date();
    update.updatedBy = req.user._id;

    const result = await Scholarship.updateMany(
      { _id: { $in: scholarshipIds } },
      { $set: update }
    );

    res.json({
      success: true,
      message: `${action}d ${result.modifiedCount} scholarship(s)`,
      data: result
    });
  } catch (error) {
    console.error('Error performing bulk actions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk actions'
    });
  }
};

// @desc    Get scholarship statistics
// @route   GET /api/career/admin/scholarships/statistics
// @access  Private/Admin
exports.getStatistics = async (req, res) => {
  try {
    const [
      totalScholarships,
      activeScholarships,
      featuredScholarships,
      draftScholarships,
      totalApplications,
      recentApplications
    ] = await Promise.all([
      Scholarship.countDocuments(),
      Scholarship.countDocuments({ status: 'active' }),
      Scholarship.countDocuments({ isFeatured: true }),
      Scholarship.countDocuments({ status: 'draft' }),
      ScholarshipApplication.countDocuments(),
      ScholarshipApplication.countDocuments({
        appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get applications by status
    const applicationsByStatus = await ScholarshipApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top scholarships by applications
    const topScholarships = await Scholarship.aggregate([
      {
        $lookup: {
          from: 'scholarshipapplications',
          localField: '_id',
          foreignField: 'scholarshipId',
          as: 'applications'
        }
      },
      {
        $project: {
          title: 1,
          'organization.name': 1,
          applicationCount: { $size: '$applications' }
        }
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        totalScholarships,
        activeScholarships,
        featuredScholarships,
        draftScholarships,
        totalApplications,
        recentApplications,
        applicationsByStatus: applicationsByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        topScholarships
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};