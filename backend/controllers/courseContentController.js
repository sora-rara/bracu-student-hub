const CourseContent = require('../models/CourseContent');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Get database connection
const db = mongoose.connection;

// Helper function to extract courses from existing programs collection
const getAllCourses = async () => {
    try {
        // Query the existing programs collection directly
        const programs = await db.collection('programs').find({ active: true }).toArray();
        
        const courses = [];
        const courseMap = new Map(); // To avoid duplicates
        
        programs.forEach(program => {
            if (program.requirements && Array.isArray(program.requirements)) {
                program.requirements.forEach(category => {
                    if (category.courses && Array.isArray(category.courses)) {
                        category.courses.forEach(course => {
                            const courseKey = course.courseCode;
                            if (!courseMap.has(courseKey)) {
                                courseMap.set(courseKey, {
                                    courseCode: course.courseCode,
                                    courseName: course.courseName,
                                    credits: course.credits || 0,
                                    programCode: program.programCode,
                                    programName: program.programName,
                                    department: program.department,
                                    isRequired: course.isRequired !== false
                                });
                            }
                        });
                    }
                });
            }
        });
        
        return Array.from(courseMap.values()).sort((a, b) => 
            a.courseCode.localeCompare(b.courseCode)
        );
    } catch (error) {
        console.error('Error extracting courses:', error);
        return [];
    }
};

// @desc    Get all courses for dropdown/search
// @route   GET /api/course-content/courses
// @access  Public
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await getAllCourses();
        
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error getting courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Search courses
// @route   GET /api/course-content/courses/search
// @access  Public
exports.searchCourses = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }
        
        const courses = await getAllCourses();
        const searchTerm = query.toLowerCase();
        
        const filteredCourses = courses.filter(course => 
            course.courseCode.toLowerCase().includes(searchTerm) ||
            course.courseName.toLowerCase().includes(searchTerm) ||
            course.programCode.toLowerCase().includes(searchTerm)
        );
        
        res.json({
            success: true,
            count: filteredCourses.length,
            data: filteredCourses.slice(0, 20) // Limit results
        });
    } catch (error) {
        console.error('Error searching courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get course details
// @route   GET /api/course-content/courses/:courseCode
// @access  Public
exports.getCourseDetails = async (req, res) => {
    try {
        const courseCode = req.params.courseCode.toUpperCase();
        
        const programs = await db.collection('programs').find({ active: true }).toArray();
        let courseDetails = null;
        
        // Find course in programs
        for (const program of programs) {
            if (program.requirements && Array.isArray(program.requirements)) {
                for (const category of program.requirements) {
                    if (category.courses && Array.isArray(category.courses)) {
                        const course = category.courses.find(c => c.courseCode === courseCode);
                        if (course) {
                            courseDetails = {
                                courseCode: course.courseCode,
                                courseName: course.courseName,
                                credits: course.credits || 0,
                                programCode: program.programCode,
                                programName: program.programName,
                                department: program.department,
                                isRequired: course.isRequired !== false,
                                stream: course.stream || '',
                                prerequisites: {
                                    hard: course.hardPrerequisites || [],
                                    soft: course.softPrerequisites || []
                                }
                            };
                            break;
                        }
                    }
                }
            }
            if (courseDetails) break;
        }
        
        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Get course content statistics
        const contentStats = await CourseContent.aggregate([
            {
                $match: {
                    courseCode: courseCode,
                    status: 'approved',
                    isPublic: true
                }
            },
            {
                $group: {
                    _id: '$contentType',
                    count: { $sum: 1 },
                    totalDownloads: { $sum: '$downloadCount' },
                    totalViews: { $sum: '$viewCount' }
                }
            }
        ]);
        
        // Get recent content
        const recentContent = await CourseContent.find({
            courseCode: courseCode,
            status: 'approved',
            isPublic: true
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title contentType fileName fileSize uploadedBy viewCount downloadCount createdAt status');
        
        res.json({
            success: true,
            data: {
                course: courseDetails,
                contentStats,
                recentContent
            }
        });
    } catch (error) {
        console.error('Error getting course details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Upload course content
// @route   POST /api/course-content/upload
// @access  Private
exports.uploadContent = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email || !user.name) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        const studentName = user.name;
        const role = user.role || 'student';
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }
        
        const {
            courseCode,
            courseName,
            programCode,
            programName,
            semester,
            year,
            contentType,
            title,
            description,
            tags
        } = req.body;
        
        // Validate required fields
        if (!courseCode || !title || !contentType) {
            // Delete uploaded file if validation fails
            if (req.file.path) {
                await unlinkAsync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Course code, title, and content type are required'
            });
        }
        
        // Check file size (max 50MB)
        if (req.file.size > 50 * 1024 * 1024) {
            await unlinkAsync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'File size cannot exceed 50MB'
            });
        }
        
        // Allowed file types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        
        if (!allowedTypes.includes(req.file.mimetype)) {
            await unlinkAsync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'File type not allowed. Allowed types: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP, RAR, JPG, PNG, GIF'
            });
        }
        
        // Determine status based on user role
        const isAdminOrInstructor = role === 'admin' || role === 'instructor';
        const status = isAdminOrInstructor ? 'approved' : 'pending';
        const isApproved = isAdminOrInstructor;
        
        // Create course content document
        const contentData = {
            courseCode: courseCode.toUpperCase(),
            courseName: courseName || `Course ${courseCode}`,
            programCode: programCode ? programCode.toUpperCase() : 'OTHERS',
            programName: programName || 'Other Program',
            semester: semester || 'Fall',
            year: parseInt(year) || new Date().getFullYear(),
            contentType,
            title,
            description: description || '',
            fileUrl: `/uploads/course-content/${req.file.filename}`,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            uploadedBy: studentName,
            uploadedByEmail: studentEmail,
            uploadedByRole: role,
            status: status,
            isApproved: isApproved,
            tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : []
        };
        
        // Use create() instead of new + save() to avoid middleware conflict
        const content = await CourseContent.create(contentData);
        
        res.status(201).json({
            success: true,
            message: isAdminOrInstructor 
                ? 'Content uploaded and approved successfully' 
                : 'Content uploaded successfully. Waiting for admin approval.',
            data: content
        });
        
    } catch (error) {
        console.error('Error uploading content:', error);
        console.error('Error stack:', error.stack);
        
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                await unlinkAsync(req.file.path);
                console.log('Cleaned up uploaded file:', req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error while uploading content'
        });
    }
};

// @desc    Get all course content with filters
// @route   GET /api/course-content
// @access  Public
exports.getAllContent = async (req, res) => {
    try {
        const {
            courseCode,
            programCode,
            contentType,
            semester,
            year,
            search,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            userEmail
        } = req.query;
        
        // Get user from session if available
        const user = req.session.user || req.user;
        const currentUserEmail = user?.email || userEmail;
        const currentUserRole = user?.role;
        
        // Base filter - only show approved content to public
        let filter = { status: 'approved', isPublic: true };
        
        // If user is logged in, they can see their own content regardless of status
        if (currentUserEmail) {
            filter = {
                $or: [
                    { status: 'approved', isPublic: true },
                    { uploadedByEmail: currentUserEmail }
                ]
            };
        }
        
        // Admins and instructors see all content
        if (currentUserRole === 'admin' || currentUserRole === 'instructor') {
            filter = {}; // See everything
        }
        
        if (courseCode) {
            filter.courseCode = courseCode.toUpperCase();
        }
        
        if (programCode) {
            filter.programCode = programCode.toUpperCase();
        }
        
        if (contentType) {
            filter.contentType = contentType;
        }
        
        if (semester) {
            filter.semester = semester;
        }
        
        if (year) {
            filter.year = parseInt(year);
        }
        
        // Text search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
                { courseName: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }
        
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const content = await CourseContent.find(filter)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-reports -comments');
        
        const total = await CourseContent.countDocuments(filter);
        
        // Get unique filters for frontend
        const filters = await CourseContent.aggregate([
            { $match: { status: 'approved', isPublic: true } },
            {
                $group: {
                    _id: null,
                    courses: { $addToSet: '$courseCode' },
                    programs: { $addToSet: '$programCode' },
                    contentTypes: { $addToSet: '$contentType' },
                    semesters: { $addToSet: '$semester' },
                    years: { $addToSet: '$year' }
                }
            }
        ]);
        
        res.json({
            success: true,
            count: content.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            filters: filters[0] || {
                courses: [],
                programs: [],
                contentTypes: [],
                semesters: [],
                years: []
            },
            data: content
        });
    } catch (error) {
        console.error('Error getting course content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single content item
// @route   GET /api/course-content/:id
// @access  Public
exports.getContent = async (req, res) => {
    try {
        const content = await CourseContent.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } },
            { new: true }
        )
        .select('-reports');
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        // Check if user can view
        const user = req.session.user || req.user;
        const studentEmail = user?.email;
        const role = user?.role;
        
        const canView = content.status === 'approved' && content.isPublic ||
                       content.uploadedByEmail === studentEmail ||
                       role === 'admin' || role === 'instructor';
        
        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this content'
            });
        }
        
        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error getting content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Download content
// @route   GET /api/course-content/:id/download
// @access  Public
exports.downloadContent = async (req, res) => {
    try {
        const content = await CourseContent.findByIdAndUpdate(
            req.params.id,
            { $inc: { downloadCount: 1 } },
            { new: true }
        );
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        // Check if user can download
        const user = req.session.user || req.user;
        const studentEmail = user?.email;
        const role = user?.role;
        
        const canDownload = content.status === 'approved' && content.isPublic ||
                           content.uploadedByEmail === studentEmail ||
                           role === 'admin' || role === 'instructor';
        
        if (!canDownload) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to download this content'
            });
        }
        
        // Construct file path
        const filePath = path.join(__dirname, '..', 'public', content.fileUrl);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }
        
        res.download(filePath, content.fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
        });
        
    } catch (error) {
        console.error('Error downloading content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update content
// @route   PUT /api/course-content/:id
// @access  Private
exports.updateContent = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        const role = user.role;
        
        let content = await CourseContent.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        // Check ownership or admin
        if (content.uploadedByEmail !== studentEmail && role !== 'admin' && role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this content'
            });
        }
        
        // Allowed updates
        const allowedUpdates = [
            'title', 'description', 'contentType', 'semester', 'year',
            'tags', 'isPublic', 'metadata', 'status', 'isApproved'
        ];
        
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        
        // Ensure status and isApproved are synchronized
        if (updates.status === 'approved') {
            updates.isApproved = true;
        } else if (updates.status === 'pending' || updates.status === 'rejected') {
            updates.isApproved = false;
        }
        
        if (updates.isApproved === true) {
            updates.status = 'approved';
        } else if (updates.isApproved === false && content.status === 'approved') {
            updates.status = 'pending';
        }
        
        content = await CourseContent.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Content updated successfully',
            data: content
        });
        
    } catch (error) {
        console.error('Error updating content:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete content
// @route   DELETE /api/course-content/:id
// @access  Private
exports.deleteContent = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        const role = user.role;
        
        const content = await CourseContent.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        // Check ownership or admin
        if (content.uploadedByEmail !== studentEmail && role !== 'admin' && role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this content'
            });
        }
        
        // Delete file from storage
        const filePath = path.join(__dirname, '..', 'public', content.fileUrl);
        if (fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
        }
        
        await content.deleteOne();
        
        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Add comment
// @route   POST /api/course-content/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email || !user.name) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        const studentName = user.name;
        
        const { comment } = req.body;
        
        if (!comment || comment.trim().length < 1) {
            return res.status(400).json({
                success: false,
                message: 'Comment is required'
            });
        }
        
        const content = await CourseContent.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        // Check if user can comment
        const role = user.role;
        const canComment = content.status === 'approved' && content.isPublic ||
                          content.uploadedByEmail === studentEmail ||
                          role === 'admin' || role === 'instructor';
        
        if (!canComment) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to comment on this content'
            });
        }
        
        const newComment = {
            userEmail: studentEmail,
            userName: studentName,
            comment: comment.trim(),
            date: new Date()
        };
        
        content.comments.push(newComment);
        await content.save();
        
        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: newComment
        });
        
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Report content
// @route   POST /api/course-content/:id/report
// @access  Private
exports.reportContent = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email || !user.name) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        const studentName = user.name;
        
        const { reason } = req.body;
        
        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required and must be at least 10 characters'
            });
        }
        
        const content = await CourseContent.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        // Check if already reported by this user
        const alreadyReported = content.reports.some(
            report => report.reportedByEmail === studentEmail
        );
        
        if (alreadyReported) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this content'
            });
        }
        
        const report = {
            reportedBy: studentName,
            reportedByEmail: studentEmail,
            reason: reason.trim(),
            date: new Date()
        };
        
        content.reports.push(report);
        await content.save();
        
        res.json({
            success: true,
            message: 'Content reported successfully'
        });
        
    } catch (error) {
        console.error('Error reporting content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get user's uploaded content
// @route   GET /api/course-content/user/my-uploads
// @access  Private
exports.getMyUploads = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        
        if (!user || !user.email) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const studentEmail = user.email;
        
        const content = await CourseContent.find({ uploadedByEmail: studentEmail })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: content.length,
            data: content
        });
        
    } catch (error) {
        console.error('Error getting user uploads:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Get all content (including pending/flagged)
// @route   GET /api/course-content/admin/all
// @access  Admin
exports.adminGetAllContent = async (req, res) => {
    try {
        const {
            status,
            courseCode,
            contentType,
            page = 1,
            limit = 20,
            search
        } = req.query;
        
        let filter = {};
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (courseCode) {
            filter.courseCode = courseCode.toUpperCase();
        }
        
        if (contentType) {
            filter.contentType = contentType;
        }
        
        // Text search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
                { courseName: { $regex: search, $options: 'i' } },
                { uploadedBy: { $regex: search, $options: 'i' } },
                { uploadedByEmail: { $regex: search, $options: 'i' } }
            ];
        }
        
        const content = await CourseContent.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await CourseContent.countDocuments(filter);
        
        // Get stats
        const stats = await CourseContent.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        res.json({
            success: true,
            count: content.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            stats: stats,
            data: content
        });
        
    } catch (error) {
        console.error('Error getting admin content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Get content statistics
// @route   GET /api/course-content/admin/stats
// @access  Admin
exports.adminGetStats = async (req, res) => {
    try {
        const stats = await CourseContent.aggregate([
            {
                $facet: {
                    totalContent: [
                        { $count: 'count' }
                    ],
                    byStatus: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    byType: [
                        {
                            $group: {
                                _id: '$contentType',
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    topCourses: [
                        {
                            $group: {
                                _id: '$courseCode',
                                count: { $sum: 1 },
                                downloads: { $sum: '$downloadCount' },
                                views: { $sum: '$viewCount' }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    topUploaders: [
                        {
                            $group: {
                                _id: '$uploadedBy',
                                count: { $sum: 1 },
                                email: { $first: '$uploadedByEmail' },
                                role: { $first: '$uploadedByRole' }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    recentActivity: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 10 },
                        {
                            $project: {
                                title: 1,
                                courseCode: 1,
                                uploadedBy: 1,
                                status: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            }
        ]);
        
        res.json({
            success: true,
            data: stats[0]
        });
        
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Approve content
// @route   PUT /api/course-content/admin/approve/:id
// @access  Admin
exports.adminApproveContent = async (req, res) => {
    try {
        const content = await CourseContent.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'approved',
                isApproved: true,
                reports: [] // Clear any reports when approving
            },
            { new: true }
        );
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Content approved successfully',
            data: content
        });
        
    } catch (error) {
        console.error('Error approving content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Reject content
// @route   PUT /api/course-content/admin/reject/:id
// @access  Admin
exports.adminRejectContent = async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required (minimum 5 characters)'
            });
        }
        
        const content = await CourseContent.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'rejected',
                isApproved: false,
                rejectionReason: reason.trim()
            },
            { new: true }
        );
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Content rejected successfully',
            data: content
        });
        
    } catch (error) {
        console.error('Error rejecting content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Delete content permanently
// @route   DELETE /api/course-content/admin/:id
// @access  Admin
exports.adminDeleteContent = async (req, res) => {
    try {
        const content = await CourseContent.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        // Delete file from storage
        const filePath = path.join(__dirname, '..', 'public', content.fileUrl);
        if (fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
        }
        
        await content.deleteOne();
        
        res.json({
            success: true,
            message: 'Content deleted permanently'
        });
        
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Admin: Get pending content count
// @route   GET /api/course-content/admin/pending-count
// @access  Admin
exports.getPendingCount = async (req, res) => {
    try {
        const count = await CourseContent.countDocuments({ status: 'pending' });
        
        res.json({
            success: true,
            count: count
        });
        
    } catch (error) {
        console.error('Error getting pending count:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};