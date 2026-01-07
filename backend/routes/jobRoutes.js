// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { requireAuth, requireAdmin } = require('../middleware/adminMiddleware'); // ADD THIS LINE

// ==================== PUBLIC ROUTES ====================
// Get all active jobs
router.get('/', jobController.getAllJobs);

// Get job by ID
router.get('/:id', jobController.getJobById);

// Check if user has applied
router.get('/check/:id', jobController.checkApplicationStatus);

// ==================== STUDENT ROUTES ====================
// Save/unsave job
router.post('/:id/save', requireAuth, jobController.saveJob);        // ADD requireAuth
router.delete('/:id/save', requireAuth, jobController.unsaveJob);    // ADD requireAuth
router.get('/:id/is-saved', requireAuth, jobController.checkIfSaved);// ADD requireAuth

// Get saved jobs
router.get('/saved/all', requireAuth, jobController.getSavedJobs);   // ADD requireAuth

// Apply for job
router.post('/:id/apply', requireAuth, jobController.applyForJob);   // ADD requireAuth

// Get my applications
router.get('/my-applications/all', requireAuth, jobController.getMyApplications); // ADD requireAuth

// Withdraw application
router.post('/withdraw/:applicationId', requireAuth, jobController.withdrawApplication); // ADD requireAuth

// ==================== ADMIN ROUTES ====================
// Job CRUD operations
router.post('/admin/create', requireAdmin, jobController.createJob);  // ADD requireAdmin
router.put('/admin/:id', requireAdmin, jobController.updateJob);      // ADD requireAdmin
router.delete('/admin/:id', requireAdmin, jobController.deleteJob);   // ADD requireAdmin

// Get all jobs (admin view)
router.get('/admin/all', requireAdmin, jobController.getAllJobsAdmin); // ADD requireAdmin

// Get single job (admin view)
router.get('/admin/:id', requireAdmin, jobController.getJobByIdAdmin); // ADD requireAdmin

// Application management
router.get('/admin/:id/applications', requireAdmin, jobController.getJobApplications); // ADD requireAdmin
router.get('/admin/:jobId/applications/:applicationId', requireAdmin, jobController.getApplicationDetail); // ADD requireAdmin
router.put('/admin/:jobId/applications/:applicationId/status', requireAdmin, jobController.updateApplicationStatus); // ADD requireAdmin
router.delete('/admin/:jobId/applications/:applicationId', requireAdmin, jobController.deleteApplication); // ADD requireAdmin

// Statistics
router.get('/admin/stats/overview', requireAdmin, jobController.getJobStats); // ADD requireAdmin

module.exports = router;