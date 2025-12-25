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

const connectProxyRoutes = require('./routes/connectProxyRoutes');
const freeLabRoutes = require('./routes/freeLabRoutes');
const routinePickRoutes = require('./routes/routinePickRoutes');

// ====== IMPORT CAFETERIA ROUTES ======
const cafeteriaRoutes = require('./routes/cafeteriaRoutes');

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

// Mount routes under /api/deadlines
app.use('/api/deadlines', deadlineRoutes);

app.use('/api/connect', connectProxyRoutes);
app.use('/api/labs', freeLabRoutes);
app.use('/api/routine', routinePickRoutes);


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
console.log('\nFrontend redirects active:');
console.log('  /cafeteria/* → /api/cafeteria/*');
console.log('  /admin/* → /api/cafeteria/admin/*');
console.log('  GET  /api/connect/raw');
console.log('  GET  /api/connect/health');


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
      <li><a href="/cgpa">CGPA Calculator</a></li>
      <li><a href="/api/auth/check">Check Auth Status</a></li>
      <li><a href="/api/check-auth">Check Auth Status (legacy)</a></li>
      <li><a href="/api/cafeteria/health">Cafeteria Health Check</a></li>
      <li><a href="/api/cafeteria/menu/today">Today's Menu</a></li>
      <li><a href="/api/cafeteria/featured">Featured Items</a></li>
      <li><a href="/api/cafeteria/food-items/active">Active Food Items</a></li>
      <li><a href="/api/cafeteria/reviews/all">All Reviews</a></li>
      <li><a href="/public/uploads">View Uploads</a></li>
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
            todayMenu: '/api/cafeteria/menu/today'
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
            console.log(`🧮 CGPA Calc: http://localhost:${PORT}/cgpa`);
            console.log(`=================================`);
            console.log(`\n🔀 Frontend redirects active:`);
            console.log(`   /cafeteria/* → /api/cafeteria/*`);
            console.log(`   /admin/* → /api/cafeteria/admin/*`);
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