
const express = require('express');
const router = express.Router();
const textbookController = require('../controllers/textbookController');
const { requireAuth } = require('../middleware/adminMiddleware');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/', textbookController.getTextbooks);
router.get('/stats', textbookController.getStats);
router.get('/featured', textbookController.getFeaturedTextbooks);
router.get('/search/:query', textbookController.searchTextbooks);
router.get('/course/:courseCode', textbookController.getTextbooksByCourse);

// TEST endpoint - must come before :id
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Textbook Exchange API is working!',
        timestamp: new Date().toISOString(),
        endpoints: {
            getAll: 'GET /api/textbooks',
            getStats: 'GET /api/textbooks/stats',
            getFeatured: 'GET /api/textbooks/featured',
            search: 'GET /api/textbooks/search/:query',
            getByCourse: 'GET /api/textbooks/course/:courseCode',
            getById: 'GET /api/textbooks/:id',
            create: 'POST /api/textbooks',
            update: 'PUT /api/textbooks/:id',
            delete: 'DELETE /api/textbooks/:id',
            myListings: 'GET /api/textbooks/user/my-listings',
            favorites: 'GET /api/textbooks/user/favorites',
            toggleFavorite: 'POST /api/textbooks/:id/toggle-favorite',
            updateStatus: 'PATCH /api/textbooks/:id/status'
        }
    });
});

router.get('/:id', textbookController.getTextbookById);

// Protected routes
router.post('/', requireAuth, upload.textbookImages, textbookController.createTextbook);
router.put('/:id', requireAuth, upload.textbookImages, textbookController.updateTextbook);
router.delete('/:id', requireAuth, textbookController.deleteTextbook);
router.patch('/:id/status', requireAuth, textbookController.updateStatus);
router.post('/:id/toggle-favorite', requireAuth, textbookController.toggleFavorite);

// User-specific routes
router.get('/user/my-listings', requireAuth, textbookController.getMyListings);
router.get('/user/favorites', requireAuth, textbookController.getFavorites);

module.exports = router;
