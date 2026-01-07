// routes/graduationRoutes.js
const express = require('express');
const router = express.Router();
const graduationController = require('../controllers/graduationController');
const semesterPlannerRoutes = require('./semesterPlannerRoutes');

// Add request logging
router.use((req, res, next) => {
    console.log('🎓 Graduation Route:', req.method, req.path, '| Session:', req.session?.userId || 'none');
    next();
});

// Initialize graduation plan
router.post('/initialize', graduationController.initializePlan);

// Get available programs
router.get('/programs', graduationController.getPrograms);

// Check program status
router.get('/check-status', graduationController.checkProgramStatus);

// Get graduation progress
router.get('/progress', graduationController.getProgress);

// Get timeline
router.get('/timeline', graduationController.getTimeline);

// Course operations
router.post('/courses/completed', graduationController.addCompletedCourse);
router.get('/courses/remaining', graduationController.getRemainingCourses);
router.get('/courses/:courseCode/prerequisites', graduationController.checkCoursePrerequisites);

// Get completed courses
router.get('/courses/completed', graduationController.getCompletedCourses);

// Sync grades with graduation planner
router.post('/sync-grades', graduationController.syncGrades);

router.use('/semester-planner', semesterPlannerRoutes);

// Simple test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Graduation API is working',
        session: req.session?.userId ? 'active' : 'none',
        endpoints: [
            'GET  /api/graduation/progress',
            'POST /api/graduation/initialize',
            'GET  /api/graduation/courses/remaining',
            'GET  /api/graduation/timeline',
            'POST /api/graduation/courses/completed',
            'GET  /api/graduation/courses/:courseCode/prerequisites',
            'GET  /api/graduation/check-status',
            'GET  /api/graduation/programs'
        ]
    });
});

module.exports = router;