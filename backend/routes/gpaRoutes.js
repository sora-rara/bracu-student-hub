const express = require('express');
const router = express.Router();
const gpaController = require('../controllers/gpaController');


// GPA Calculation Routes
router.post('/semester', gpaController.addSemesterGrades);
router.get('/semesters', gpaController.getAllSemesters);
router.get('/semester/:id', gpaController.getSemester);
router.get('/calculate', gpaController.calculateCGPA);
router.delete('/semester/:id', gpaController.deleteSemester);

module.exports = router;