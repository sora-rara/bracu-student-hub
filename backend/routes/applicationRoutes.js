// routes/applicationRoutes.js - FIXED
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/applications');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, ZIP allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ✅ Apply for internship
router.post('/apply', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetterFile', maxCount: 1 },
  { name: 'transcript', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
  { name: 'otherDocuments', maxCount: 5 }
]), async (req, res) => {
  let uploadedFiles = {};
  
  try {
    const userId = req.session.userId;
    console.log('User ID from session:', userId);
    
    if (!userId) {
      // Clean up any uploaded files
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            const filePath = path.join(uploadDir, file.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        error: 'Please login to apply' 
      });
    }

    const {
      internshipId,
      phoneNumber,
      cgpa,
      semester,
      department,
      major,
      year,
      expectedGraduation,
      universityId,
      coverLetterText,
      additionalInfo,
      skills,
      workExperience,
      projects
    } = req.body;

    console.log('Application data received:', {
      internshipId,
      studentId: userId,
      hasFiles: !!req.files
    });

    // Validate required fields
    if (!internshipId) {
      return res.status(400).json({
        success: false,
        error: 'Internship ID is required'
      });
    }

    // Check existing application
    const existing = await Application.findOne({ 
      internshipId, 
      studentId: userId 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already applied for this internship',
        applicationId: existing._id,
        status: existing.status
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found. Please login again.' 
      });
    }

    // Get internship
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ 
        success: false, 
        error: 'Internship not found' 
      });
    }

    // Check if active
    const status = internship.status?.toLowerCase();
    if (!['active', 'published', 'open'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'This internship is no longer accepting applications' 
      });
    }

    // Check deadline
    if (internship.applicationDetails?.deadline) {
      const deadline = new Date(internship.applicationDetails.deadline);
      if (deadline < new Date()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Application deadline has passed' 
        });
      }
    }

    // Process files
    const files = {};
    if (req.files?.resume) {
      files.resume = `/uploads/applications/${req.files.resume[0].filename}`;
      uploadedFiles.resume = req.files.resume[0];
    }
    
    if (req.files?.coverLetterFile) {
      files.coverLetterFile = `/uploads/applications/${req.files.coverLetterFile[0].filename}`;
      uploadedFiles.coverLetterFile = req.files.coverLetterFile[0];
    }
    
    if (req.files?.transcript) {
      files.transcript = `/uploads/applications/${req.files.transcript[0].filename}`;
      uploadedFiles.transcript = req.files.transcript[0];
    }
    
    if (req.files?.portfolio) {
      files.portfolio = `/uploads/applications/${req.files.portfolio[0].filename}`;
      uploadedFiles.portfolio = req.files.portfolio[0];
    }
    
    if (req.files?.otherDocuments) {
      files.otherDocuments = req.files.otherDocuments.map(f => {
        uploadedFiles.otherDocuments = uploadedFiles.otherDocuments || [];
        uploadedFiles.otherDocuments.push(f);
        return `/uploads/applications/${f.filename}`;
      });
    }

    // Parse JSON data
    let skillsArray = [];
    let workExperienceArray = [];
    let projectsArray = [];

    try {
      if (skills && skills.trim()) {
        skillsArray = JSON.parse(skills);
        if (!Array.isArray(skillsArray)) skillsArray = [skillsArray];
      }
      
      if (workExperience && workExperience.trim()) {
        workExperienceArray = JSON.parse(workExperience);
        if (!Array.isArray(workExperienceArray)) workExperienceArray = [workExperienceArray];
      }
      
      if (projects && projects.trim()) {
        projectsArray = JSON.parse(projects);
        if (!Array.isArray(projectsArray)) projectsArray = [projectsArray];
      }
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      // Continue with empty arrays
    }

    // Validate required fields
    if (!files.resume) {
      return res.status(400).json({
        success: false,
        error: 'Resume is required'
      });
    }

    if (!coverLetterText || coverLetterText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a meaningful cover letter (at least 50 characters)'
      });
    }

    // Create application with error handling for duplicates
    try {
      const application = new Application({
        internshipId,
        studentId: userId,
        studentEmail: user.email,
        studentName: user.name || user.email.split('@')[0],
        phoneNumber: phoneNumber || user.phoneNumber,
        cgpa: cgpa ? parseFloat(cgpa) : user.cgpa,
        semester: semester || user.semester,
        department: department || user.department,
        major: major || user.major,
        year: year || user.year,
        expectedGraduation: expectedGraduation || user.expectedGraduation,
        universityId: universityId || user.universityId,
        resume: files.resume,
        coverLetterFile: files.coverLetterFile,
        transcript: files.transcript,
        portfolio: files.portfolio,
        otherDocuments: files.otherDocuments || [],
        coverLetterText: coverLetterText.trim(),
        additionalInfo: additionalInfo?.trim() || '',
        skills: skillsArray.filter(s => s && s.trim()),
        workExperience: workExperienceArray.filter(exp => exp && exp.company),
        projects: projectsArray.filter(proj => proj && proj.name),
        status: 'pending'
      });

      await application.save();
      console.log('Application saved successfully:', application._id);

      // Update internship application count
      await Internship.findByIdAndUpdate(internshipId, {
        $inc: { applicationCount: 1 }
      });

      res.json({
        success: true,
        message: 'Application submitted successfully!',
        data: {
          _id: application._id,
          internshipId: application.internshipId,
          status: application.status,
          appliedAt: application.appliedAt
        }
      });

    } catch (saveError) {
      console.error('Error saving application:', saveError);
      
      // Check if it's a duplicate key error
      if (saveError.code === 11000 || saveError.message.includes('duplicate')) {
        // Clean up uploaded files
        Object.values(uploadedFiles).forEach(fileArray => {
          if (Array.isArray(fileArray)) {
            fileArray.forEach(file => {
              const filePath = path.join(uploadDir, file.filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });
          } else if (fileArray && fileArray.filename) {
            const filePath = path.join(uploadDir, fileArray.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
        
        // Try to find the existing application
        const existingApp = await Application.findOne({ internshipId, studentId: userId });
        
        if (existingApp) {
          return res.status(400).json({
            success: false,
            error: 'You have already applied for this internship',
            applicationId: existingApp._id,
            status: existingApp.status
          });
        }
        
        return res.status(400).json({
          success: false,
          error: 'Duplicate application detected'
        });
      }
      
      throw saveError;
    }

  } catch (error) {
    console.error('Apply error:', error);
    
    // Clean up uploaded files on error
    if (uploadedFiles) {
      Object.values(uploadedFiles).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach(file => {
            const filePath = path.join(uploadDir, file.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
        } else if (fileArray && fileArray.filename) {
          const filePath = path.join(uploadDir, fileArray.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }

    // Handle specific errors
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'You have already applied for this internship'
      });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit application',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// ✅ Check if student has applied
router.get('/check/:internshipId', async (req, res) => {
  try {
    const userId = req.session.userId;
    const { internshipId } = req.params;

    if (!userId) {
      return res.json({
        success: true,
        hasApplied: false,
        message: 'Not logged in'
      });
    }

    const application = await Application.findOne({ 
      internshipId, 
      studentId: userId 
    });

    res.json({
      success: true,
      hasApplied: !!application,
      applicationStatus: application?.status,
      applicationId: application?._id
    });
  } catch (error) {
    console.error('Check application error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Get student's applications
router.get('/my-applications', async (req, res) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Please login to view your applications'
      });
    }

    const applications = await Application.find({ studentId: userId })
      .populate('internshipId', 'title organization.name location type')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });

  } catch (error) {
    console.error('My applications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Withdraw application
router.post('/withdraw/:applicationId', async (req, res) => {
  try {
    const userId = req.session.userId;
    const { applicationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Please login to withdraw application'
      });
    }

    const application = await Application.findOne({
      _id: applicationId,
      studentId: userId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.status === 'withdrawn') {
      return res.json({
        success: true,
        message: 'Application already withdrawn'
      });
    }

    application.status = 'withdrawn';
    await application.save();

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;