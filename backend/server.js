require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');

const app = express();

// ====================
// MIDDLEWARE
// ====================
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Session middleware
app.use(session({
    secret: 'student-hub-secret-key-2024', // Change this for production
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    }
}));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================
// SIMPLE AUTH MIDDLEWARE
// ====================
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        req.userId = req.session.userId;
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Please login to access this resource'
        });
    }
};

// ====================
// DEBUG MIDDLEWARE (optional)
// ====================
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Session:', req.session);
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

// ====================
// ROUTES
// ====================
// Auth routes (no protection needed)
app.use('/api/auth', authRoutes);

// GPA routes (protected with requireAuth)
app.use('/api/gpa', requireAuth, gpaRoutes);

// ====================
// SESSION AUTH ROUTES
// ====================
// Check login status
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            loggedIn: true,
            userId: req.session.userId
        });
    } else {
        res.json({
            success: true,
            loggedIn: false
        });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to logout'
            });
        }
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
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
    <ul>
      <li><a href="/api/test">Test API</a></li>
      <li><a href="/api/health">Health Check</a></li>
      <li><a href="/cgpa">CGPA Calculator</a></li>
      <li><a href="/api/check-auth">Check Auth Status</a></li>
    </ul>
  `);
});

// ====================
// 404 HANDLER
// ====================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        method: req.method,
        url: req.originalUrl
    });
});

// ====================
// ERROR HANDLER
// ====================
app.use((err, req, res, next) => {
    console.error('Server error:', err);
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
            console.log(`🔐 Auth Status: http://localhost:${PORT}/api/check-auth`);
            console.log(`🧮 CGPA Calc: http://localhost:${PORT}/cgpa`);
            console.log(`=================================`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        console.error('Error details:', err);
        process.exit(1);
    }
};

// Start the application
connectDBAndStartServer();