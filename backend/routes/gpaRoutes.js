// routes/gpaRoutes.js
const express = require('express');
const router = express.Router();
const gpaController = require('../controllers/gpaController');

// Existing routes
router.post('/semesters', gpaController.addSemesterGrades);
router.get('/semesters', gpaController.getAllSemesters);
router.get('/semesters/:id', gpaController.getSemester);
router.delete('/semesters/:id', gpaController.deleteSemester);
router.get('/calculate', gpaController.calculateCGPA);

// New routes for academic stats
router.get('/stats', gpaController.getAcademicStats);
router.post('/stats/update', gpaController.forceUpdateAcademicStats);
router.post('/preview', gpaController.calculateGPAPreview);

// New routes for retake functionality
router.post('/check-retakes', gpaController.checkRetakes);
router.get('/course-history', gpaController.getCourseHistory);

module.exports = router;