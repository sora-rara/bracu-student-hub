// server.js
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

// ✅ Session configuration
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
const cafeteriaRoutes = require('./routes/cafeteriaRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const courseReviewRoutes = require('./routes/courseReviewRoutes');
const courseContentRoutes = require('./routes/courseContentRoutes'); // NEW

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

// Cafeteria routes
app.use('/api/cafeteria', cafeteriaRoutes);

// Calendar routes
app.use('/api/calendar', EventRoutes);

// Deadline routes
app.use('/api/deadlines', deadlineRoutes);

// Budget routes
app.use('/api/budget', budgetRoutes);

// Course Review routes
app.use('/api/course-reviews', courseReviewRoutes);

// Course Content routes - NEW
app.use('/api/course-content', courseContentRoutes);

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
console.log('  POST /api/cafeteria/review');
console.log('  💰 Budget Routes:');
console.log('  GET  /api/budget/health');
console.log('  GET  /api/budget/test');
console.log('  GET  /api/budget/transactions');
console.log('  🗓️  Calendar Routes:');
console.log('  GET  /api/calendar/events');
console.log('  POST /api/calendar/events');
console.log('  📚 Course Review Routes:');
console.log('  GET  /api/course-reviews');
console.log('  POST /api/course-reviews');
console.log('  GET  /api/course-reviews/stats/:courseCode');
console.log('  GET  /api/course-reviews/courses/list');
console.log('  📁 Course Content Routes:');
console.log('  GET  /api/course-content');
console.log('  POST /api/course-content/upload');
console.log('  GET  /api/course-content/courses');
console.log('  GET  /api/course-content/courses/search');
console.log('  GET  /api/course-content/:id/download');
console.log('\nFrontend redirects active:');
console.log('  /cafeteria/* → /api/cafeteria/*');
console.log('  /admin/* → /api/cafeteria/admin/*');

// ====================
// SESSION TEST ENDPOINTS
// ====================
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            loggedIn: true,
            userId: req.session.userId,
            user: req.session.user
        });
    } else {
        res.json({
            success: true,
            loggedIn: false
        });
    }
});

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
        session: req.sessionID ? 'active' : 'none'
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
// COURSE CONTENT TEST ENDPOINT
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
    <h1>Student Hub Backend</h1>
    <p>Backend is running!</p>
    <h3>Session Tests:</h3>
    <ul>
      <li><a href="/api/session-set-test">Set Test Session</a></li>
      <li><a href="/api/session-test">Test Session Persistence (refresh multiple times)</a></li>
    </ul>
    <h3>Other Endpoints:</h3>
    <ul>
      <li><a href="/api/test">Test API</a></li>
      <li><a href="/api/health">Health Check</a></li>
      <li><a href="/api/calendar/test">Calendar API Test</a></li>
      <li><a href="/api/calendar/events">Calendar Events</a></li>
      <li><a href="/api/budget/test-public">Budget API Test</a></li>
      <li><a href="/api/budget/health">Budget Health Check</a></li>
      <li><a href="/cgpa">CGPA Calculator</a></li>
      <li><a href="/api/auth/check">Check Auth Status</a></li>
      <li><a href="/api/check-auth">Check Auth Status (legacy)</a></li>
      <li><a href="/api/cafeteria/health">Cafeteria Health Check</a></li>
      <li><a href="/api/cafeteria/menu/today">Today's Menu</a></li>
      <li><a href="/api/cafeteria/food-items/active">Active Food Items</a></li>
      <li><a href="/public/uploads">View Uploads</a></li>
      <li><a href="/api/course-reviews">Course Reviews</a></li>
      <li><a href="/api/course-reviews/courses/list">Course List</a></li>
      <li><a href="/api/course-content/test">Course Content Test</a></li>
      <li><a href="/api/course-content/courses">All Courses</a></li>
      <li><a href="/api/course-content">Course Content</a></li>
      <li><form action="/api/test-review" method="POST" style="margin-top: 20px;">
        <h3>Test Review Endpoint</h3>
        <input type="text" name="foodItemId" placeholder="foodItemId" value="test123"><br>
        <input type="number" name="rating" placeholder="rating" value="5"><br>
        <input type="text" name="comment" placeholder="comment" value="Test comment"><br>
        <input type="text" name="studentName" placeholder="studentName" value="John"><br>
        <button type="submit">Test POST /api/test-review</button>
      </form></li>
    </ul>
  `);
});

// ====================
// HEALTH ENDPOINTS (FOR FRONTEND COMPATIBILITY)
// ====================
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

    res.status(404).json({
        success: false,
        error: 'Route not found',
        method: req.method,
        url: req.originalUrl,
        suggestion: 'Try using /api/prefix (e.g., /api/calendar/events)',
        availableEndpoints: {
            health: '/api/health',
            budgetHealth: '/api/budget/health',
            budgetTest: '/api/budget/test-public',
            cafeteriaHealth: '/api/cafeteria/health',
            calendarTest: '/api/calendar/test',
            calendarEvents: '/api/calendar/events',
            adminFoodItems: '/api/cafeteria/admin/food-items',
            todayMenu: '/api/cafeteria/menu/today',
            courseReviews: '/api/course-reviews',
            courseContentTest: '/api/course-content/test',
            courseContent: '/api/course-content',
            allCourses: '/api/course-content/courses'
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
        message: err.message
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

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        });
        console.log('✅ MongoDB Connected Successfully');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`=================================`);
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`=================================`);
            console.log(`🌐 Backend: http://localhost:${PORT}`);
            console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
            console.log(`📊 Health: http://localhost:${PORT}/api/health`);
            console.log(`💰 Budget Health: http://localhost:${PORT}/api/budget/health`);
            console.log(`💰 Budget Test: http://localhost:${PORT}/api/budget/test-public`);
            console.log(`📚 Course Reviews: http://localhost:${PORT}/api/course-reviews`);
            console.log(`📁 Course Content: http://localhost:${PORT}/api/course-content`);
            console.log(`🔐 Session Tests:`);
            console.log(`   Set Test: http://localhost:${PORT}/api/session-set-test`);
            console.log(`   Test Persistence: http://localhost:${PORT}/api/session-test`);
            console.log(`🗓️  Calendar Test: http://localhost:${PORT}/api/calendar/test`);
            console.log(`🗓️  Calendar Events: http://localhost:${PORT}/api/calendar/events`);
            console.log(`🔐 Auth Status: http://localhost:${PORT}/api/auth/check`);
            console.log(`🍽️  Cafeteria Health: http://localhost:${PORT}/api/cafeteria/health`);
            console.log(`📅 Today's Menu: http://localhost:${PORT}/api/cafeteria/menu/today`);
            console.log(`🧮 CGPA Calc: http://localhost:${PORT}/cgpa`);
            console.log(`=================================`);
            console.log(`\n🔀 Frontend redirects active:`);
            console.log(`   /cafeteria/* → /api/cafeteria/*`);
            console.log(`   /admin/* → /api/cafeteria/admin/*`);
            console.log(`=================================`);
            console.log(`\n📚 Course Review Features:`);
            console.log(`   ✅ Course rating & reviews`);
            console.log(`   ✅ Difficulty assessment`);
            console.log(`   ✅ Content quality ratings`);
            console.log(`   ✅ Instructor evaluations`);
            console.log(`   ✅ Anonymous submissions`);
            console.log(`   ✅ Admin moderation`);
            console.log(`\n📁 Course Content Features:`);
            console.log(`   ✅ Upload PDFs & documents`);
            console.log(`   ✅ Search & filter course content`);
            console.log(`   ✅ Download tracking`);
            console.log(`   ✅ Upvote/downvote system`);
            console.log(`   ✅ Comments & discussions`);
            console.log(`   ✅ Admin approval workflow`);
            console.log(`=================================`);
            console.log(`\n📦 Session Storage: Memory Store`);
            console.log(`🔑 Note: Sessions will be lost on server restart`);
            console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
};

// Start the application
connectDBAndStartServer();