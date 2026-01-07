require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();

// ====================
// MIDDLEWARE
// ====================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));

// Session configuration
app.use(session({
    secret: 'student-hub-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Session debugging middleware
app.use((req, res, next) => {
    console.log('🔐 [SESSION]', {
        path: req.path,
        method: req.method,
        sessionId: req.sessionID?.slice(0, 10) + '...',
        userId: req.session?.userId,
        hasSession: !!req.session
    });
    next();
});

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ====================
// DEBUG MIDDLEWARE
// ====================
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

    // Log body for POST requests
    if (req.method === 'POST' && req.body) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }

    // Log headers for debugging
    if (req.headers['content-type']) {
        console.log('Content-Type:', req.headers['content-type']);
    }

    next();
});

// ====================
// VIEW ENGINE (EJS)
// ====================
app.set("view engine", "ejs");
app.set("views", "./views");

// ====================
// IMPORT ROUTES
// ====================
const authRoutes = require('./routes/authRoutes');
const gpaRoutes = require('./routes/gpaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { requireAuth, requireAdmin } = require('./middleware/adminMiddleware');
const EventRoutes = require('./routes/EventRoutes');
const deadlineRoutes = require('./routes/deadlineRoutes');

// ====== IMPORT CAFETERIA ROUTES ======
const cafeteriaRoutes = require('./routes/cafeteriaRoutes');

// ====== IMPORT GRADUATION ROUTES ======
const graduationRoutes = require('./routes/graduationRoutes');
const semesterPlannerRoutes = require('./routes/semesterPlannerRoutes');


// ====== IMPORT GROUP ROUTES ======
const needPostRoutes = require('./routes/needPostRoutes');
const groupRoutes = require('./routes/groupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminGroupRoutes = require('./routes/adminGroupRoutes');

// ====== IMPORT BUDGET ROUTES ======
const budgetRoutes = require('./routes/budgetRoutes');
const courseReviewRoutes = require('./routes/courseReviewRoutes');
const courseContentRoutes = require('./routes/courseContentRoutes'); // NEW

const connectProxyRoutes = require('./routes/connectProxyRoutes');
const freeLabRoutes = require('./routes/freeLabRoutes');
const routinePickRoutes = require('./routes/routinePickRoutes');
const questionRoutes = require("./routes/questionRoutes");

// ====== IMPORT TEXTBOOK EXCHANGE ROUTES ======
const textbookRoutes = require('./routes/textbookRoutes');


const careerRoutes = require('./routes/careerRoutes');
const studentCareerRoutes = require('./routes/studentCareerRoutes');
const adminCareerRoutes = require('./routes/adminCareerRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminApplicationRoutes = require('./routes/adminApplicationRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const Faculty = require('./models/Faculty');
const scholarshipRoutes = require('./routes/scholarshipRoutes');
const adminScholarshipRoutes = require('./routes/adminScholarshipRoutes');
const jobRoutes = require('./routes/jobRoutes');

// ====================
// FRONTEND REDIRECT MIDDLEWARE (ADDED HERE - BEFORE ROUTES)
// ====================
app.use((req, res, next) => {
    const originalUrl = req.originalUrl;

    // Handle /cafeteria/* redirects
    if (originalUrl.startsWith('/cafeteria/')) {
        const newPath = originalUrl.replace('/cafeteria/', '/api/cafeteria/');
        req.url = newPath;
        console.log(`🔄 Redirecting: ${originalUrl} -> ${req.url}`);
        return next();
    }

    // Handle /admin/* redirects
    if (originalUrl.startsWith('/admin/')) {
        const newPath = originalUrl.replace('/admin/', '/api/cafeteria/admin/');
        req.url = newPath;
        console.log(`🔄 Redirecting: ${originalUrl} -> ${req.url}`);
        return next();
    }

    next();
});

// ====================
// ROUTES
// ====================
// Auth routes
app.use('/api/auth', authRoutes);

// GPA routes (protected with requireAuth from adminMiddleware)
app.use('/api/gpa', requireAuth, gpaRoutes);

// Admin routes (protected)
app.use('/api/admin', requireAdmin, adminRoutes);

// ====== CAFETERIA ROUTES ======
app.use('/api/cafeteria', cafeteriaRoutes);

// ====== CALENDAR ROUTES ======
app.use('/api/calendar', EventRoutes); // Let EventRoutes.js handle its own auth

// ====== GRADUATION ROUTES ======
app.use('/api/graduation', graduationRoutes);
app.use('/api/semester-planner', semesterPlannerRoutes);

// Mount routes under /api/deadlines
app.use('/api/deadlines', deadlineRoutes);

app.use('/api/connect', connectProxyRoutes);
app.use('/api/labs', freeLabRoutes);
app.use('/api/routine', routinePickRoutes);
app.use("/api/questions", questionRoutes);

// ====== GROUP ROUTES ======
// Add these routes after other routes in server.js
app.use('/api/need-posts', needPostRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/groups', adminGroupRoutes);


// ====== BUDGET ROUTES ======
// Budget routes
app.use('/api/budget', budgetRoutes);

// Course Review routes
app.use('/api/course-reviews', courseReviewRoutes);

// Course Content routes
app.use('/api/course-content', courseContentRoutes);

// ====== TEXTBOOK EXCHANGE ROUTES ======
app.use('/api/textbooks', textbookRoutes);

// Career routes (public+protected)
app.use('/api/career', careerRoutes);
app.use('/api/career', studentCareerRoutes);
app.use('/api/career/admin', requireAdmin, adminCareerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin/applications', requireAdmin, adminApplicationRoutes);

// Rating routes
app.use('/api/ratings', ratingRoutes);

//Scholarship
app.use('/api/career/admin/scholarships', adminScholarshipRoutes);
app.use('/api/career/scholarships', scholarshipRoutes);
app.use('/api/scholarships', scholarshipRoutes)

//Job ROUTES
app.use('/api/career/jobs', requireAuth, jobRoutes);

// ====================
// SEEDER ROUTE (For development only)
// ====================
const programSeeder = require('./seeders/programSeeder');

app.get('/api/seed-programs', async (req, res) => {
    try {
        // Only allow in development
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Seeder only available in development mode'
            });
        }

        await programSeeder();
        res.json({
            success: true,
            message: 'Programs seeded successfully'
        });
    } catch (error) {
        console.error('Seeder error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});



// ====================
// DEBUG: LOG ALL ROUTES
// ====================
console.log('\n📋 Registered Routes:');
console.log('=====================');
console.log('API Routes:');
console.log('  GET  /api/test');
console.log('  GET  /api/health');
console.log('  GET  /api/cafeteria/health');
console.log('  GET  /api/cafeteria/menu/today');
console.log('  GET  /api/cafeteria/featured');
console.log('  GET  /api/cafeteria/food-items/active');
console.log('  GET  /api/cafeteria/reviews/all');
console.log('  POST /api/cafeteria/review');
console.log('  GET  /api/cafeteria/admin/food-items');
console.log('  🗓️  Calendar Routes:');
console.log('  GET  /api/calendar/events');
console.log('  GET  /api/calendar/events/:id');
console.log('  POST /api/calendar/events');
console.log('  POST /api/calendar/events/university');
console.log('  DELETE /api/calendar/events/:id');
console.log('  🎓  Graduation Routes:');
console.log('  GET  /api/graduation/progress');
console.log('  POST /api/graduation/initialize');
console.log('  GET  /api/graduation/courses/remaining');
console.log('  GET  /api/graduation/timeline');
console.log('  POST /api/graduation/courses/completed');
console.log('  GET  /api/graduation/courses/:courseCode/prerequisites');
console.log('  GET  /api/graduation/courses/recommended');
console.log('\n📚 Textbook Exchange Routes:');
console.log('  GET  /api/textbooks');
console.log('  GET  /api/textbooks/stats');
console.log('  GET  /api/textbooks/featured');
console.log('  GET  /api/textbooks/search/:query');
console.log('  GET  /api/textbooks/course/:courseCode');
console.log('  GET  /api/textbooks/:id');
console.log('  POST /api/textbooks');
console.log('  PUT  /api/textbooks/:id');
console.log('  DELETE /api/textbooks/:id');
console.log('  PATCH /api/textbooks/:id/status');
console.log('  POST /api/textbooks/:id/toggle-favorite');
console.log('  GET  /api/textbooks/user/my-listings');
console.log('  GET  /api/textbooks/user/favorites');

console.log('  🎓 Career Routes:');
console.log('  GET  /api/career/*');
console.log('  🎓 Admin Career Routes:');
console.log('  GET  /api/admin/career/test');
console.log('  GET  /api/admin/career/dashboard/stats');
console.log('  GET  /api/admin/career/opportunities');
console.log('  POST /api/admin/career/opportunities');
console.log('  PUT  /api/admin/career/opportunities/:type/:id');
console.log('  DELETE /api/admin/career/opportunities/:type/:id');
console.log('  GET  /api/admin/career/applications');
console.log('  PUT  /api/admin/career/applications/:id');
console.log('  GET  /api/admin/career/analytics');
console.log('  GET  /api/admin/career/export/applications')
console.log('  🎓 Faculty Rating Routes:');
console.log('  GET  /api/ratings/test');
console.log('  GET  /api/ratings/faculty-list');
console.log('  GET  /api/ratings/faculty/:facultyId');
console.log('  POST /api/ratings/submit');
console.log('  POST /api/ratings/create-faculty');
console.log('  DELETE /api/ratings/faculty/:id');
console.log('\nFrontend redirects active:');
console.log('  /cafeteria/* → /api/cafeteria/*');
console.log('  /admin/* → /api/cafeteria/admin/*');
console.log('  🎓 Scholarship Routes:');
console.log('  GET  /api/scholarships');
console.log('  GET  /api/scholarships/:id');
console.log('  POST /api/scholarships/apply');
console.log('  POST /api/scholarships');
console.log('  PUT  /api/scholarships/:id');
console.log('  DELETE /api/scholarships/:id');

console.log('\nFrontend redirects active:');
console.log('  /cafeteria/* → /api/cafeteria/*');
console.log('  /admin/* → /api/cafeteria/admin/*');
console.log('  GET  /api/connect/raw');
console.log('  GET  /api/connect/health');

// Add to your debug routes list
console.log('\n🎯 Find My Group Routes:');
console.log('  GET  /api/need-posts');
console.log('  POST /api/need-posts');
console.log('  GET  /api/need-posts/:id');
console.log('  POST /api/need-posts/:id/express-interest');
console.log('  POST /api/need-posts/:id/create-group');
console.log('  GET  /api/need-posts/user/my-posts');
console.log('  GET  /api/groups');
console.log('  GET  /api/groups/:id');
console.log('  POST /api/groups/:id/join-request');
console.log('  GET  /api/groups/user/my-groups');
console.log('  PUT  /api/groups/:groupId/requests/:requestId');
console.log('  GET  /api/notifications');
console.log('  PUT  /api/notifications/read-all');
console.log('  👑  Admin Routes:');
console.log('  GET  /api/admin/groups/need-posts');
console.log('  PUT  /api/admin/groups/need-posts/:id/status');
console.log('  GET  /api/admin/groups/groups');
console.log('  PUT  /api/admin/groups/groups/:id/status');
console.log('  GET  /api/admin/groups/analytics');


// ====================
// SESSION TEST ENDPOINTS
// ====================
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            loggedIn: true,
            userId: req.session.userId,
            user: req.session.user // Include full user data
        });
    } else {
        res.json({
            success: true,
            loggedIn: false
        });
    }
});

// Session persistence test
app.get('/api/session-test', (req, res) => {
    if (!req.session.views) {
        req.session.views = 1;
        console.log('🆕 New session created, views:', req.session.views);
    } else {
        req.session.views++;
        console.log('📈 Session views increased to:', req.session.views);
    }

    res.json({
        success: true,
        message: 'Session persistence test',
        views: req.session.views,
        sessionId: req.sessionID,
        userId: req.session.userId,
        user: req.session.user
    });
});

// Set test user in session
app.get('/api/session-set-test', (req, res) => {
    req.session.userId = 'test-user-123';
    req.session.email = 'test@example.com';
    req.session.user = {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        isAdmin: true
    };

    console.log('✅ Test session data set');

    res.json({
        success: true,
        message: 'Test session data set',
        sessionId: req.sessionID,
        data: {
            userId: req.session.userId,
            email: req.session.email,
            user: req.session.user
        }
    });
});

// ====================
// TEST ROUTES
// ====================
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        session: req.sessionID ? 'active' : 'none',
        services: {
            auth: 'active',
            calendar: 'active',
            cafeteria: 'active',
            gpa: 'active',
            graduation: 'active',
            deadlines: 'active'
        }
    });
});

// ====================
// TEST GPA ENDPOINTS
// ====================
app.get('/api/test/semesters', requireAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Test endpoint works!',
            userId: req.userId,
            data: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Test failed'
        });
    }
});

// ====================
// TEST REVIEW ENDPOINT
// ====================
app.post('/api/test-review', (req, res) => {
    console.log('Test review received:', req.body);
    res.json({
        success: true,
        message: 'Test review endpoint works!',
        data: req.body
    });
});

// ====================
// CALENDAR TEST ROUTES
// ====================
app.get('/api/calendar/test', (req, res) => {
    res.json({
        success: true,
        message: 'Calendar API is working!',
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            'GET /api/calendar/events',
            'GET /api/calendar/events/:id',
            'POST /api/calendar/events',
            'POST /api/calendar/events/university',
            'DELETE /api/calendar/events/:id'
        ]
    });
});

// ====================
// BUDGET TEST ROUTES
// ====================

app.get('/api/budget/test-public', (req, res) => {
    res.json({
        success: true,
        message: 'Budget API public test endpoint is working!',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/budget/health',
            test: '/api/budget/test',
            testAuth: '/api/budget/test-auth',
            transactions: '/api/budget/transactions (protected)',
            summary: '/api/budget/summary (protected)',
            goals: '/api/budget/goals (protected)'
        }
    });
});

// ====================
// COURSE-CONTENT TEST ROUTES
// ====================

app.get('/api/course-content/test', (req, res) => {
    res.json({
        success: true,
        message: 'Course Content API is working!',
        timestamp: new Date().toISOString(),
        availableEndpoints: {
            getAllCourses: 'GET /api/course-content/courses',
            searchCourses: 'GET /api/course-content/courses/search?query=',
            getContent: 'GET /api/course-content',
            uploadContent: 'POST /api/course-content/upload',
            downloadContent: 'GET /api/course-content/:id/download'
        }
    });
});

// ====================
// DEBUG: Check if graduationRoutes is loaded
// ====================
console.log('📦 Checking graduationRoutes import...');
try {
    const graduationRoutes = require('./routes/graduationRoutes');
    console.log('✅ graduationRoutes loaded successfully');

    // Check if it has the test route
    const router = graduationRoutes;
    console.log('📋 Graduation routes registered:');
    console.log('  POST /api/graduation/initialize');
    console.log('  GET  /api/graduation/progress');
    console.log('  GET  /api/graduation/test');
} catch (error) {
    console.error('❌ Error loading graduationRoutes:', error);
}


// ====================
// GRADUATION TEST ROUTES
// ====================
app.get('/api/graduation/test', requireAuth, (req, res) => {
    res.json({
        success: true,
        message: 'Graduation API is working!',
        user: req.user,
        endpoints: [
            'GET /api/graduation/progress',
            'POST /api/graduation/initialize',
            'GET /api/graduation/courses/remaining',
            'GET /api/graduation/timeline',
            'POST /api/graduation/courses/completed',
            'GET /api/graduation/courses/:courseCode/prerequisites',
            'GET /api/graduation/courses/recommended'
        ]
    });
});

// ====================
// CGPA CALCULATOR PAGE
// ====================
app.get("/cgpa", (req, res) => {
    res.render("cgpa", { result: null });
});

app.post("/cgpa", (req, res) => {
    const { grades, credits } = req.body;

    if (!grades || !credits || !Array.isArray(grades) || !Array.isArray(credits)) {
        return res.render("cgpa", {
            result: null,
            error: "Invalid input"
        });
    }

    let totalCredits = 0;
    let totalPoints = 0;

    for (let i = 0; i < grades.length; i++) {
        totalCredits += Number(credits[i]) || 0;
        totalPoints += (Number(grades[i]) || 0) * (Number(credits[i]) || 0);
    }

    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    res.render("cgpa", { result: cgpa });
});

// ====================
// ROOT ROUTE
// ====================
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Student Hub Backend</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
            }
            .container {
                max-width: 1000px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.95);
                padding: 30px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                color: #333;
            }
            h1 {
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
                margin-top: 0;
            }
            h2, h3 {
                color: #34495e;
            }
            .section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 5px solid #3498db;
            }
            ul {
                list-style: none;
                padding: 0;
            }
            li {
                margin: 10px 0;
                padding: 10px;
                background: white;
                border-radius: 5px;
                border: 1px solid #e0e0e0;
                transition: all 0.3s;
            }
            li:hover {
                transform: translateX(5px);
                border-color: #3498db;
                box-shadow: 0 5px 15px rgba(52, 152, 219, 0.1);
            }
            a {
                color: #3498db;
                text-decoration: none;
                font-weight: 500;
                display: flex;
                align-items: center;
            }
            a:hover {
                color: #2980b9;
                text-decoration: underline;
            }
            a:before {
                content: "→ ";
                margin-right: 5px;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            .card h3 {
                margin-top: 0;
                color: #2c3e50;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            .badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                margin-left: 10px;
            }
            .badge.new {
                background: #2ecc71;
                color: white;
            }
            .badge.auth {
                background: #3498db;
                color: white;
            }
            .badge.test {
                background: #f39c12;
                color: white;
            }
            form {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            input, button {
                padding: 10px;
                margin: 5px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            button {
                background: #3498db;
                color: white;
                border: none;
                cursor: pointer;
            }
            button:hover {
                background: #2980b9;
            }
        </style>
</head>
<body>
    <div class="container">
        <h1>🎓 Student Hub Backend</h1>
        <p>Backend server is running successfully!</p>
        
        <div class="grid">
            <div class="card">
                <h3>🆕 New Features <span class="badge new">NEW</span></h3>
                <ul>
                    <li><a href="/api/graduation/test">🎓 Graduation Planner API</a></li>
                    <li><a href="/api/graduation/progress">Graduation Progress</a></li>
                    <li><a href="/api/graduation/courses/remaining">Remaining Courses</a></li>
                    <li><a href="/api/seed-programs">Seed Programs (Dev)</a></li>
                </ul>
            </div>

            <div class="card">
                <h3>🔐 Session Tests <span class="badge auth">AUTH</span></h3>
                <ul>
                    <li><a href="/api/session-set-test">Set Test Session</a></li>
                    <li><a href="/api/session-test">Test Session Persistence</a></li>
                    <li><a href="/api/auth/check">Check Auth Status</a></li>
                    <li><a href="/api/check-auth">Check Auth (Legacy)</a></li>
                </ul>
            </div>

            <div class="card">
                <h3>🧪 Test Endpoints <span class="badge test">TEST</span></h3>
                <ul>
                    <li><a href="/api/test">Test API</a></li>
                    <li><a href="/api/health">Health Check</a></li>
                    <li><a href="/api/calendar/test">Calendar API Test</a></li>
                    <li><a href="/api/cafeteria/health">Cafeteria Health</a></li>
                    <li><a href="/api/graduation/test">Graduation Test</a></li>
                </ul>
            </div>

            <div class="card">
                <h3>📊 Core Services</h3>
                <ul>
                    <li><a href="/api/calendar/events">Calendar Events</a></li>
                    <li><a href="/api/cafeteria/menu/today">Today's Menu</a></li>
                    <li><a href="/api/cafeteria/featured">Featured Items</a></li>
                    <li><a href="/cgpa">CGPA Calculator</a></li>
                    <li><a href="/public/uploads">View Uploads</a></li>
                </ul>
            </div>

            <div class="card">
                <h3>💰 Budget & Course APIs</h3>
                <ul>
                    <li><a href="/api/budget/test-public">Budget API Test</a></li>
                    <li><a href="/api/budget/health">Budget Health Check</a></li>
                    <li><a href="/api/course-reviews">Course Reviews</a></li>
                    <li><a href="/api/course-reviews/courses/list">Course List</a></li>
                    <li><a href="/api/course-content/test">Course Content Test</a></li>
                    <li><a href="/api/course-content/courses">All Courses</a></li>
                    <li><a href="/api/course-content">Course Content</a></li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h3>Test Review Endpoint</h3>
            <form action="/api/test-review" method="POST">
                <input type="text" name="foodItemId" placeholder="foodItemId" value="test123"><br>
                <input type="number" name="rating" placeholder="rating" value="5"><br>
                <input type="text" name="comment" placeholder="comment" value="Test comment"><br>
                <input type="text" name="studentName" placeholder="studentName" value="John"><br>
                <button type="submit">Test POST /api/test-review</button>
            </form>
        </div>

        <div class="section">
            <h3>🚀 API Status</h3>
            <p><strong>Database:</strong> ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Port:</strong> ${process.env.PORT || 5000}</p>
            <p><strong>Frontend URLs:</strong> http://localhost:3000, http://localhost:5173</p>
        </div>
    </div>
</body>
</html>

    `);
});

// ====================
// HEALTH ENDPOINTS (FOR FRONTEND COMPATIBILITY)
// ====================

// Cafeteria health endpoint (for /api/cafeteria/health)
app.get('/api/cafeteria/health', (req, res) => {
    res.json({
        success: true,
        service: 'cafeteria',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            menu: '/api/cafeteria/menu/today',
            reviews: '/api/cafeteria/review',
            foodItems: '/api/cafeteria/food-items/active'
        }
    });
});

// Textbook exchange health endpoint
app.get('/api/textbooks/health', (req, res) => {
    res.json({
        success: true,
        service: 'textbook-exchange',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            getAll: '/api/textbooks',
            getStats: '/api/textbooks/stats',
            getFeatured: '/api/textbooks/featured',
            search: '/api/textbooks/search/:query',
            getById: '/api/textbooks/:id'
        }
    });
});


// Legacy health endpoints (without /api prefix)
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        message: 'Use /api/health for API health checks',
        timestamp: new Date().toISOString()
    });
});

app.get('/cafeteria/health', (req, res) => {
    res.json({
        success: true,
        service: 'cafeteria',
        status: 'healthy',
        message: 'Use /api/cafeteria/health for API health checks',
        timestamp: new Date().toISOString()
    });
});

// ====================
// SPECIFIC REDIRECTS FOR COMPATIBILITY
// ====================
// Handle /cafeteria/menu/date/:date specifically
app.get('/cafeteria/menu/date/:date', (req, res, next) => {
    const { date } = req.params;
    req.url = `/api/cafeteria/menu/date/${date}`;
    console.log(`📅 Redirecting menu date: ${req.originalUrl} -> ${req.url}`);
    next();
});

// ====================
// 404 HANDLER
// ====================
app.use((req, res) => {
    console.error(`❌ 404 Error: ${req.method} ${req.originalUrl}`);
    console.log(`   Request came from: ${req.headers.origin || 'Unknown'}`);
    console.log(`   Full URL attempted: http://localhost:5000${req.originalUrl}`);

    // Provide helpful debugging info
    const helpMessage = `
    Available endpoints:
    - GET  /api/health
    - GET  /api/cafeteria/health
    - GET  /api/calendar/test
    - GET  /api/calendar/events
    - GET  /api/cafeteria/menu/today
    - GET  /api/cafeteria/admin/food-items
    - POST /api/cafeteria/admin/food-items
    - 🎓  Graduation Routes:
    - GET  /api/graduation/progress
    - POST /api/graduation/initialize
    - GET  /api/graduation/courses/remaining
    - GET  /api/graduation/timeline
    - POST /api/graduation/courses/completed
    - 📚  Textbook Exchange Routes:s
    - GET  /api/textbooks
    - GET  /api/textbooks/stats
    - GET  /api/textbooks/featured
    - GET  /api/textbooks/search/:query
    - POST /api/textbooks
    - GET  /api/textbooks/user/my-listings
    ratingTest: '/api/ratings/test',
    facultyList: '/api/ratings/faculty-list',
    career: '/api/career',
    adminCareerTest: '/api/admin/career/test',
    `;

    console.log(helpMessage);

    res.status(404).json({
        success: false,
        error: 'Route not found',
        method: req.method,
        url: req.originalUrl,
        suggestion: 'Try using /api/prefix (e.g., /api/calendar/events)',
        availableEndpoints: {
            health: '/api/health',
            cafeteriaHealth: '/api/cafeteria/health',
            calendarTest: '/api/calendar/test',
            calendarEvents: '/api/calendar/events',
            adminFoodItems: '/api/cafeteria/admin/food-items',
            todayMenu: '/api/cafeteria/menu/today',
            graduationProgress: '/api/graduation/progress',
            seedPrograms: '/api/seed-programs',
            textbooks: '/api/textbooks',
            textbookStats: '/api/textbooks/stats',
            textbookFeatured: '/api/textbooks/featured'
        }
    });
});

// ====================
// ERROR HANDLER
// ====================
app.use((err, req, res, next) => {
    console.error('🔥 Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ====================
// START SERVER
// ====================
const connectDBAndStartServer = async () => {
    try {
        console.log('Connecting to MongoDB...');

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected Successfully');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`=================================`);
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`=================================`);
            console.log(`🌐 Backend: http://localhost:${PORT}`);
            console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
            console.log(`📊 Health: http://localhost:${PORT}/api/health`);
            console.log(`🔐 Session Tests:`);
            console.log(`   Set Test: http://localhost:${PORT}/api/session-set-test`);
            console.log(`   Test Persistence: http://localhost:${PORT}/api/session-test`);
            console.log(`🗓️  Calendar Test: http://localhost:${PORT}/api/calendar/test`);
            console.log(`🗓️  Calendar Events: http://localhost:${PORT}/api/calendar/events`);
            console.log(`🔐 Auth Status: http://localhost:${PORT}/api/auth/check`);
            console.log(`🍽️  Cafeteria Health: http://localhost:${PORT}/api/cafeteria/health`);
            console.log(`📅 Today's Menu: http://localhost:${PORT}/api/cafeteria/menu/today`);
            console.log(`🎓  Graduation Test: http://localhost:${PORT}/api/graduation/test`);
            console.log(`🧮 CGPA Calc: http://localhost:${PORT}/cgpa`);
            console.log(`🌱 Seeder: http://localhost:${PORT}/api/seed-programs`);
            console.log(`📚 Textbook Seeder: http://localhost:${PORT}/api/seed-textbooks`);
            console.log(`=================================`);
            console.log(`\n🔀 Frontend redirects active:`);
            console.log(`   /cafeteria/* → /api/cafeteria/*`);
            console.log(`   /admin/* → /api/cafeteria/admin/*`);
            console.log(`=================================`);
            console.log(`\n📦 Session Storage: Memory Store`);
            console.log(`🔑 Note: Sessions will be lost on server restart`);
            console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
            console.log('💰 Budget Routes:');
            console.log('  GET  /api/budget/health');
            console.log('  GET  /api/budget/test');
            console.log('  GET  /api/budget/transactions');

            console.log('📚 Course Review Routes:');
            console.log('  GET  /api/course-reviews');
            console.log('  POST /api/course-reviews');
            console.log('  GET  /api/course-reviews/stats/:courseCode');
            console.log('  GET  /api/course-reviews/courses/list');

            console.log('\n📚 Textbook Exchange Routes:');
            console.log('  GET  /api/textbooks');
            console.log('  GET  /api/textbooks/stats');
            console.log('  GET  /api/textbooks/featured');
            console.log('  GET  /api/textbooks/search/:query');
            console.log('  GET  /api/textbooks/course/:courseCode');
            console.log('  GET  /api/textbooks/:id');
            console.log('  POST /api/textbooks');
            console.log('  PUT  /api/textbooks/:id');
            console.log('  DELETE /api/textbooks/:id');
            console.log('  PATCH /api/textbooks/:id/status');
            console.log('  POST /api/textbooks/:id/toggle-favorite');
            console.log('  GET  /api/textbooks/user/my-listings');
            console.log('  GET  /api/textbooks/user/favorites');
            console.log(`🎓 Career: http://localhost:${PORT}/api/career`);
            console.log(`🎓 Admin Career Test: http://localhost:${PORT}/api/admin/career/test`);
            console.log(`🎓 Rating API Test: http://localhost:${PORT}/api/ratings/test`);
            console.log(`🎓 Faculty List: http://localhost:${PORT}/api/ratings/faculty-list`);

            console.log('📁 Course Content Routes:');
            console.log('  GET  /api/course-content');
            console.log('  POST /api/course-content/upload');
            console.log('  GET  /api/course-content/courses');
            console.log('  GET  /api/course-content/courses/search');
            console.log('  GET  /api/course-content/:id/download');

        });
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
};

// Start the application
connectDBAndStartServer();