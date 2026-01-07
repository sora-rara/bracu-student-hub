// routes/adminApplicationRoutes.js - COMPLETE
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const User = require('../models/User');

// Middleware to check admin access
const checkAdminAccess = (req, res, next) => {
  console.log('🔐 Checking admin access...');
  console.log('Session:', req.session);
  console.log('User ID:', req.session.userId);
  
  if (!req.session.userId) {
    console.log('❌ No user ID in session');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized. Please login.' 
    });
  }
  
  // In a real app, check if user is admin
  // For now, just check if userId exists
  next();
};

// Test endpoint
router.get('/test', checkAdminAccess, (req, res) => {
  console.log('✅ Test endpoint accessed by user:', req.session.userId);
  res.json({
    success: true,
    message: 'Admin applications API is working!',
    userId: req.session.userId,
    timestamp: new Date().toISOString()
  });
});

// Get all applications
router.get('/', checkAdminAccess, async (req, res) => {
  try {
    console.log('📋 Fetching all applications for admin:', req.session.userId);
    
    // Get applications
    const applications = await Application.find({})
      .sort({ appliedAt: -1 })
      .lean(); // Convert to plain objects
    
    console.log(`✅ Found ${applications.length} applications`);
    
    // Get internship details for each application
    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        let internshipDetails = null;
        
        if (app.internshipId) {
          try {
            const internship = await Internship.findById(app.internshipId)
              .select('title organization.name location type category')
              .lean();
            
            if (internship) {
              internshipDetails = {
                title: internship.title || 'Unknown',
                company: internship.organization?.name || 'Unknown',
                location: internship.location || {},
                type: internship.type,
                category: internship.category
              };
            }
          } catch (err) {
            console.error(`Error fetching internship ${app.internshipId}:`, err);
          }
        }
        
        // Get student details
        let studentDetails = null;
        if (app.studentId) {
          try {
            const student = await User.findById(app.studentId)
              .select('name email phoneNumber studentInfo')
              .lean();
            
            if (student) {
              studentDetails = {
                name: student.name,
                email: student.email,
                phoneNumber: student.phoneNumber,
                studentInfo: student.studentInfo || {}
              };
            }
          } catch (err) {
            console.error(`Error fetching student ${app.studentId}:`, err);
          }
        }
        
        return {
          _id: app._id,
          studentName: app.studentName || studentDetails?.name || 'Unknown',
          studentEmail: app.studentEmail || studentDetails?.email || 'No email',
          phoneNumber: app.phoneNumber || studentDetails?.phoneNumber,
          cgpa: app.cgpa || studentDetails?.studentInfo?.gpa,
          semester: app.semester || studentDetails?.studentInfo?.semester,
          department: app.department || studentDetails?.studentInfo?.department,
          major: app.major || studentDetails?.studentInfo?.major,
          year: app.year || studentDetails?.studentInfo?.year,
          status: app.status || 'pending',
          appliedAt: app.appliedAt,
          coverLetterText: app.coverLetterText,
          additionalInfo: app.additionalInfo,
          skills: app.skills || [],
          workExperience: app.workExperience || [],
          projects: app.projects || [],
          documents: {
            resume: app.resume,
            coverLetterFile: app.coverLetterFile,
            transcript: app.transcript,
            portfolio: app.portfolio,
            otherDocuments: app.otherDocuments || []
          },
          adminNotes: app.adminNotes,
          internship: internshipDetails,
          student: studentDetails
        };
      })
    );
    
    res.json({
      success: true,
      count: applicationsWithDetails.length,
      data: applicationsWithDetails,
      message: `Successfully retrieved ${applicationsWithDetails.length} applications`
    });
    
  } catch (error) {
    console.error('❌ Error in /api/admin/applications:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single application by ID
router.get('/:id', checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching application ${id}`);
    
    const application = await Application.findById(id).lean();
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // Get internship details
    let internshipDetails = null;
    if (application.internshipId) {
      const internship = await Internship.findById(application.internshipId)
        .select('title organization.name description requirements compensation location')
        .lean();
      
      if (internship) {
        internshipDetails = internship;
      }
    }
    
    // Get student details
    let studentDetails = null;
    if (application.studentId) {
      const student = await User.findById(application.studentId)
        .select('name email phoneNumber studentInfo')
        .lean();
      
      if (student) {
        studentDetails = student;
      }
    }
    
    res.json({
      success: true,
      data: {
        ...application,
        internship: internshipDetails,
        student: studentDetails
      }
    });
    
  } catch (error) {
    console.error('Error fetching single application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
});

// Update application status
router.put('/:id/status', checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log(`🔄 Updating application ${id} to status: ${status}`);
    
    // Validate status
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const updateData = { status };
    
    // Add admin notes if provided
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    // If moving to reviewed/accepted/rejected, add reviewed info
    if (['reviewed', 'accepted', 'rejected'].includes(status)) {
      updateData.reviewedBy = req.session.userId;
      updateData.reviewedAt = new Date();
    }
    
    const application = await Application.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      data: application
    });
    
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application status',
      message: error.message
    });
  }
});

// Get application statistics
router.get('/stats/overview', checkAdminAccess, async (req, res) => {
  try {
    console.log('📊 Getting application statistics');
    
    const total = await Application.countDocuments();
    const pending = await Application.countDocuments({ status: 'pending' });
    const reviewed = await Application.countDocuments({ status: 'reviewed' });
    const accepted = await Application.countDocuments({ status: 'accepted' });
    const rejected = await Application.countDocuments({ status: 'rejected' });
    const withdrawn = await Application.countDocuments({ status: 'withdrawn' });
    
    // Recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCount = await Application.countDocuments({
      appliedAt: { $gte: sevenDaysAgo }
    });
    
    // Applications by department
    const byDepartment = await Application.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        reviewed,
        accepted,
        rejected,
        withdrawn,
        recentCount,
        byDepartment: byDepartment.map(dept => ({
          department: dept._id || 'Unknown',
          count: dept.count
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

module.exports = router;