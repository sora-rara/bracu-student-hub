const express = require('express');
const router = express.Router();
const courseReviewController = require('../controllers/courseReviewController');
const { requireAuth, requireAdmin } = require('../middleware/adminMiddleware');

// Public routes
router.get('/', courseReviewController.getAllReviews);
router.get('/courses/list', courseReviewController.getAllCoursesWithReviews);
router.get('/stats/:courseCode', courseReviewController.getCourseStats);
router.get('/:id', courseReviewController.getReview);
router.post('/:id/helpful', courseReviewController.markHelpful);

// Private routes (authenticated users)
router.post('/', requireAuth, courseReviewController.createReview);
router.put('/:id', requireAuth, courseReviewController.updateReview);
router.delete('/:id', requireAuth, courseReviewController.deleteReview);
router.post('/:id/report', requireAuth, courseReviewController.reportReview);
router.get('/user/my-reviews', requireAuth, courseReviewController.getMyReviews);

// Admin routes
router.get('/admin/all', requireAdmin, courseReviewController.adminGetAllReviews);
router.put('/admin/approve/:id', requireAdmin, courseReviewController.adminApproveReview);
router.delete('/admin/reject/:id', requireAdmin, courseReviewController.adminRejectReview);

module.exports = router;