// routes/needPostRoutes.js
const express = require('express');
const router = express.Router();
const {
    createNeedPost,
    getAllNeedPosts,
    getNeedPost,
    expressInterest,
    createGroupFromPost,
    getUserNeedPosts,
    deleteNeedPost,
    closeNeedPost
} = require('../controllers/needPostController');
const { requireAuth } = require('../middleware/adminMiddleware');

// All routes require authentication
router.use(requireAuth);

router.route('/')
    .post(createNeedPost)
    .get(getAllNeedPosts);

router.get('/user/my-posts', getUserNeedPosts);

router.route('/:id')
    .get(getNeedPost);

router.post('/:id/express-interest', expressInterest);
router.post('/:id/create-group', createGroupFromPost);
router.delete('/:id', deleteNeedPost);
router.put('/:id/close', closeNeedPost); // Add this line

module.exports = router;