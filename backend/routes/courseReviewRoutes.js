
const express = require('express');
const router = express.Router();
const courseReviewController = require('../controllers/courseReviewController');
const { requireAuth, requireAdmin } = require('../middleware/adminMiddleware');

// Public routes (no authentication required)
router.get('/', courseReviewController.getAllReviews);
router.get('/courses/list', courseReviewController.getAllCoursesWithReviews);
router.get('/stats/:courseCode', courseReviewController.getCourseStats);
router.get('/course/:courseCode', courseReviewController.getCourseReviews);
router.get('/:id', courseReviewController.getReview);
router.post('/:id/helpful', courseReviewController.markHelpful);

// Private routes (require authentication)
router.post('/', requireAuth, courseReviewController.createReview);
router.put('/:id', requireAuth, courseReviewController.updateReview);
router.delete('/:id', requireAuth, courseReviewController.deleteReview);
router.post('/:id/report', requireAuth, courseReviewController.reportReview);
router.get('/user/my-reviews', requireAuth, courseReviewController.getMyReviews);
router.get('/user-review/:courseCode', requireAuth, courseReviewController.getUserReview);

// Admin routes (require admin authentication)
router.get('/admin/all', requireAdmin, courseReviewController.adminGetAllReviews);
router.put('/admin/approve/:id', requireAdmin, courseReviewController.adminApproveReview);
router.put('/admin/reject/:id', requireAdmin, courseReviewController.adminRejectReview);
router.delete('/admin/:id', requireAdmin, courseReviewController.adminDeleteReview);

module.exports = router;
