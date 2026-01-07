// controllers/jobController.js
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const SavedJob = require('../models/SavedJob');

// ==================== HELPER FUNCTIONS ====================
const checkAuth = (req) => {
  return req.session && req.session.userId;
};

const checkAdmin = (req) => {
  return req.session && req.session.userId && req.session.user && 
         (req.session.user.role === 'admin' || req.session.user.isAdmin === true);
};

const getUserId = (req) => {
  return req.session ? req.session.userId : null;
};

// ==================== PUBLIC METHODS ====================

// Get all active jobs
exports.getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      jobType,
      location,
      sortBy = 'newest'
    } = req.query;

    const query = { status: 'active' };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // Job type filter
    if (jobType && jobType !== 'all') {
      query.jobType = jobType;
    }

    // Location filter
    if (location && location !== 'all') {
      query.location = location;
    }

    // Sort
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'deadline':
        sort = { deadline: 1 };
        break;
      case 'salary-high':
        sort = { 'salary.amount': -1 };
        break;
      case 'salary-low':
        sort = { 'salary.amount': 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const jobs = await Job.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs'
    });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job details'
    });
  }
};

// Check application status
exports.checkApplicationStatus = async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.json({
        success: true,
        hasApplied: false,
        applicationStatus: null
      });
    }

    const application = await JobApplication.findOne({
      jobId: req.params.id,
      studentId: getUserId(req)
    });

    res.json({
      success: true,
      hasApplied: !!application,
      applicationStatus: application?.status || null
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check application status'
    });
  }
};

// ==================== STUDENT METHODS ====================

// Save job
exports.saveJob = async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Please login to save jobs'
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const existingSave = await SavedJob.findOne({
      jobId: req.params.id,
      studentId: getUserId(req)
    });

    if (existingSave) {
      return res.status(400).json({
        success: false,
        error: 'Job already saved'
      });
    }

    const savedJob = new SavedJob({
      jobId: req.params.id,
      studentId: getUserId(req)
    });

    await savedJob.save();

    res.json({
      success: true,
      message: 'Job saved successfully'
    });
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save job'
    });
  }
};

// Unsave job
exports.unsaveJob = async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Please login to unsave jobs'
      });
    }

    const deleted = await SavedJob.findOneAndDelete({
      jobId: req.params.id,
      studentId: getUserId(req)
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Saved job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job removed from saved'
    });
  } catch (error) {
    console.error('Error unsaving job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsave job'
    });
  }
};

// Check if job is saved
exports.checkIfSaved = async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.json({
        success: true,
        isSaved: false
      });
    }

    const saved = await SavedJob.findOne({
      jobId: req.params.id,
      studentId: getUserId(req)
    });

    res.json({
      success: true,
      isSaved: !!saved
    });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check saved status'
    });
  }
};

// Get saved jobs
exports.getSavedJobs = async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Please login to view saved jobs'
      });
    }

    const savedJobs = await SavedJob.find({ studentId: getUserId(req) })
      .populate({
        path: 'jobId',
        select: 'title company description shortDescription jobType location salary deadline'
      })
      .sort({ savedAt: -1 });

    res.json({
      success: true,
      data: savedJobs
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved jobs'
    });
  }
};

// Apply for job
exports.applyForJob = async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Please login to apply'
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      jobId: req.params.id,
      studentId: getUserId(req)
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'Already applied for this job'
      });
    }

    // Check if job is active
    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Job is not active for applications'
      });
    }

    // Check deadline
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Application deadline has passed'
      });
    }

    const application = new JobApplication({
      jobId: req.params.id,
      studentId: getUserId(req),
      applicationData: req.body,
      status: 'submitted',
      submittedAt: new Date()
    });

    await application.save();

    // Update applications count
    job.applicationsCount += 1;
    await job.save();

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  }
};

// Get my applications
exports.getMyApplications = async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Please login to view applications'
      });
    }

    const applications = await JobApplication.find({ studentId: getUserId(req) })
      .populate({
        path: 'jobId',
        select: 'title company description jobType location salary deadline'
      })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
};

// Withdraw application
exports.withdrawApplication = async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Please login to withdraw applications'
      });
    }

    const application = await JobApplication.findOne({
      _id: req.params.applicationId,
      studentId: getUserId(req)
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    application.status = 'withdrawn';
    await application.save();

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw application'
    });
  }
};

// ==================== ADMIN METHODS ====================

// Create job - SIMPLIFIED VERSION FOR DEBUGGING
exports.createJob = async (req, res) => {
  try {
    console.log('=== CREATE JOB REQUEST ===');
    console.log('Session:', req.session);
    console.log('User:', req.session.user);
    console.log('User ID:', req.session.userId);
    console.log('Request body:', req.body);

    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Create job with basic validation
    const jobData = {
      title: req.body.title || '',
      company: {
        name: req.body.company?.name || 'Company Name',
        website: req.body.company?.website || '',
        industry: req.body.company?.industry || '',
        size: req.body.company?.size || 'medium',
        description: req.body.company?.description || ''
      },
      description: req.body.description || '',
      shortDescription: req.body.shortDescription || '',
      jobType: req.body.jobType || 'part-time',
      location: req.body.location || 'Remote',
      schedule: req.body.schedule || 'flexible',
      duration: req.body.duration || 'Ongoing',
      salary: req.body.salary || {
        amount: 15,
        currency: 'USD',
        period: 'hourly'
      },
      responsibilities: req.body.responsibilities || [],
      requirements: req.body.requirements || [],
      benefits: req.body.benefits || [],
      deadline: req.body.deadline ? new Date(req.body.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      contactEmail: req.body.contactEmail || '',
      contactPhone: req.body.contactPhone || '',
      applicationInstructions: req.body.applicationInstructions || '',
      status: req.body.status || 'draft',
      isFeatured: req.body.isFeatured || false,
      tags: req.body.tags || [],
      createdBy: getUserId(req)
    };

    // Validate required fields
    if (!jobData.title.trim() || !jobData.company.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title and company name are required'
      });
    }

    const job = new Job(jobData);
    await job.save();

    console.log('Job created successfully:', job._id);

    res.json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job',
      details: error.message
    });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Update job fields
    Object.keys(req.body).forEach(key => {
      if (key === 'company' && typeof req.body[key] === 'object') {
        Object.keys(req.body[key]).forEach(subKey => {
          job.company[subKey] = req.body[key][subKey];
        });
      } else if (key === 'salary' && typeof req.body[key] === 'object') {
        Object.keys(req.body[key]).forEach(subKey => {
          job.salary[subKey] = req.body[key][subKey];
        });
      } else {
        job[key] = req.body[key];
      }
    });

    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job'
    });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Delete related applications and saved jobs
    await JobApplication.deleteMany({ jobId: req.params.id });
    await SavedJob.deleteMany({ jobId: req.params.id });

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job'
    });
  }
};

// Get all jobs for admin - SIMPLIFIED VERSION FOR DEBUGGING
exports.getAllJobsAdmin = async (req, res) => {
  try {
    console.log('=== ADMIN JOB REQUEST ===');
    console.log('Session:', req.session);
    console.log('User:', req.session.user);
    console.log('User ID:', req.session.userId);
    
    // Check admin access
    if (!checkAdmin(req)) {
      console.log('Admin check failed');
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log('Admin check passed, fetching jobs...');
    
    // Get all jobs
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for faster queries

    console.log(`Found ${jobs.length} jobs`);

    // Return success response
    res.json({
      success: true,
      data: jobs,
      message: `Found ${jobs.length} jobs`
    });
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      details: error.message
    });
  }
};

// Get job by ID for admin
exports.getJobByIdAdmin = async (req, res) => {
  try {
    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job for admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job details'
    });
  }
};

// Get job applications
exports.getJobApplications = async (req, res) => {
  try {
    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const applications = await JobApplication.find({ jobId: req.params.id })
      .populate('studentId', 'name email universityId department major')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
};

// Get application detail
exports.getApplicationDetail = async (req, res) => {
  try {
    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const application = await JobApplication.findById(req.params.applicationId)
      .populate('studentId', 'name email universityId phoneNumber department major year cgpa')
      .populate({
        path: 'jobId',
        select: 'title company description jobType location salary deadline'
      });

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
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { status } = req.body;
    const application = await JobApplication.findByIdAndUpdate(
      req.params.applicationId,
      { 
        status,
        reviewedAt: status !== 'pending' ? new Date() : null,
        reviewedBy: status !== 'pending' ? getUserId(req) : null
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

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

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const application = await JobApplication.findByIdAndDelete(req.params.applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Decrement applications count on job
    await Job.findByIdAndUpdate(req.params.jobId, {
      $inc: { applicationsCount: -1 }
    });

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete application'
    });
  }
};

// Get job statistics
exports.getJobStats = async (req, res) => {
  try {
    // Check admin access
    if (!checkAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    const totalApplications = await JobApplication.countDocuments();
    const featuredJobs = await Job.countDocuments({ isFeatured: true });

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        totalApplications,
        featuredJobs
      }
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};