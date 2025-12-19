const express = require('express');
const router = express.Router();
const courseContentController = require('../controllers/courseContentController');
const { requireAuth, requireAdmin, checkContentOwnership } = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create course-content specific upload directory
const courseContentDir = path.join(__dirname, '../public/uploads/course-content');
if (!fs.existsSync(courseContentDir)) {
    fs.mkdirSync(courseContentDir, { recursive: true });
    console.log('📁 Created course content upload directory:', courseContentDir);
}

// Configure multer specifically for course content (PDFs, documents, etc.)
const courseContentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, courseContentDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Clean filename for safety
        const cleanName = file.originalname
            .replace(ext, '')
            .replace(/[^a-z0-9]/gi, '-')
            .toLowerCase()
            .substring(0, 50);
        
        cb(null, `course-content-${cleanName}-${uniqueSuffix}${ext}`);
    }
});

// File filter for course content - ALLOW DOCUMENTS!
const courseContentFileFilter = (req, file, cb) => {
    console.log('📄 Course content file upload attempt:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });
    
    // Allow documents, PDFs, presentations, archives, images
    const allowedTypes = [
        // PDF
        'application/pdf',
        
        // Word documents
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        
        // PowerPoint
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        
        // Excel
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        
        // Text files
        'text/plain',
        'text/csv',
        
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    // Also check by extension for safety
    const allowedExtensions = [
        '.pdf',
        '.doc', '.docx',
        '.ppt', '.pptx',
        '.xls', '.xlsx',
        '.txt', '.csv',
        '.zip', '.rar', '.7z',
        '.jpg', '.jpeg', '.png', '.gif', '.webp'
    ];
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
        console.log('✅ Accepting course content file:', file.originalname);
        cb(null, true);
    } else {
        console.log('❌ Rejecting file. Type:', file.mimetype, 'Extension:', fileExt);
        cb(new Error(
            'Invalid file type. Allowed types: ' +
            'PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV, ZIP, RAR, 7Z, JPG, PNG, GIF, WEBP'
        ), false);
    }
};

// Create multer instance for course content
const courseContentUpload = multer({
    storage: courseContentStorage,
    fileFilter: courseContentFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for course content
        files: 1 // Only one file at a time
    }
});

// ==================== PUBLIC ROUTES ====================
router.get('/courses', courseContentController.getAllCourses);
router.get('/courses/search', courseContentController.searchCourses);
router.get('/courses/:courseCode', courseContentController.getCourseDetails);
router.get('/', courseContentController.getAllContent);
router.get('/:id', courseContentController.getContent);
router.get('/:id/download', courseContentController.downloadContent);

// ==================== PRIVATE ROUTES (AUTHENTICATED) ====================
router.post('/upload', requireAuth, courseContentUpload.single('file'), courseContentController.uploadContent);
router.put('/:id', requireAuth, checkContentOwnership, courseContentController.updateContent);
router.delete('/:id', requireAuth, checkContentOwnership, courseContentController.deleteContent);
router.post('/:id/comments', requireAuth, courseContentController.addComment);
router.post('/:id/report', requireAuth, courseContentController.reportContent);
router.get('/user/my-uploads', requireAuth, courseContentController.getMyUploads);

// ==================== ADMIN ROUTES ====================
router.get('/admin/all', requireAdmin, courseContentController.adminGetAllContent);
router.get('/admin/stats', requireAdmin, courseContentController.adminGetStats);
router.get('/admin/pending-count', requireAdmin, courseContentController.getPendingCount);
router.put('/admin/approve/:id', requireAdmin, courseContentController.adminApproveContent);
router.put('/admin/reject/:id', requireAdmin, courseContentController.adminRejectContent);
router.delete('/admin/:id', requireAdmin, courseContentController.adminDeleteContent);

module.exports = router;