// routes/budgetRoutes.js
const express = require('express');
const router = express.Router();

// Debug: Log what we're importing
console.log('🔄 Loading budgetRoutes.js...');

// Try to import controllers with error handling
let budgetController;
try {
    budgetController = require('../controllers/budgetController');
    console.log('✅ budgetController loaded successfully');
} catch (err) {
    console.error('❌ Failed to load budgetController:', err.message);
    // Create a dummy controller as fallback
    budgetController = {
        getTransactions: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        getTransaction: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        createTransaction: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        updateTransaction: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        deleteTransaction: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        getBudgetSummary: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        getMonthlyBreakdown: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        getCategoryBreakdown: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        getSpendingInsights: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        }),
        setBudgetGoals: (req, res) => res.json({ 
            success: false, 
            message: 'Controller not loaded properly' 
        })
    };
}

// Try to import middleware with error handling
let requireAuth, checkBudgetOwnership;
try {
    const middleware = require('../middleware/adminMiddleware');
    requireAuth = middleware.requireAuth;
    checkBudgetOwnership = middleware.checkBudgetOwnership;
    console.log('✅ Middleware loaded successfully');
    console.log('   requireAuth type:', typeof requireAuth);
    console.log('   checkBudgetOwnership type:', typeof checkBudgetOwnership);
} catch (err) {
    console.error('❌ Failed to load middleware:', err.message);
    // Create dummy middleware as fallback
    requireAuth = (req, res, next) => {
        console.log('⚠️ Using dummy requireAuth middleware');
        // Check if user is logged in via session
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in first.'
            });
        }
        req.user = { _id: req.session.userId };
        next();
    };
    
    checkBudgetOwnership = (req, res, next) => {
        console.log('⚠️ Using dummy checkBudgetOwnership middleware');
        next();
    };
}

// Try to import model with error handling
let BudgetGoals;
try {
    BudgetGoals = require('../models/BudgetGoals');
    console.log('✅ BudgetGoals model loaded successfully');
} catch (err) {
    console.error('❌ Failed to load BudgetGoals model:', err.message);
    // Create dummy model as fallback
    BudgetGoals = {
        findOne: () => Promise.resolve(null),
        findOneAndUpdate: () => Promise.resolve({})
    };
}

// ========== PUBLIC ROUTES (NO AUTH) ==========
// Health check (public)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'budget-manager',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            test: '/api/budget/test',
            transactions: '/api/budget/transactions (protected)',
            summary: '/api/budget/summary (protected)',
            goals: '/api/budget/goals (protected)'
        },
        imports: {
            controller: !!budgetController,
            middleware: !!requireAuth,
            model: !!BudgetGoals
        }
    });
});

// Test route (public)
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Budget API test route is working!',
        timestamp: new Date().toISOString(),
        sessionInfo: {
            hasSession: !!req.session,
            userId: req.session?.userId,
            sessionId: req.sessionID ? req.sessionID.slice(0, 10) + '...' : null
        }
    });
});

// Simple test for authentication (public)
router.get('/test-auth', (req, res) => {
    const isAuthenticated = !!(req.session && req.session.userId);
    res.json({
        success: true,
        authenticated: isAuthenticated,
        userId: req.session?.userId,
        message: isAuthenticated 
            ? 'You are logged in!' 
            : 'You are not logged in. Use /api/auth/login first.'
    });
});

// ========== PROTECTED ROUTES (REQUIRE AUTH) ==========
// Transaction routes
if (typeof requireAuth === 'function' && typeof budgetController.getTransactions === 'function') {
    router.get('/transactions', requireAuth, budgetController.getTransactions);
} else {
    router.get('/transactions', requireAuth, (req, res) => {
        res.json({
            success: false,
            message: 'Transactions endpoint not properly configured',
            debug: {
                requireAuth: typeof requireAuth,
                getTransactions: typeof budgetController.getTransactions
            }
        });
    });
}

if (typeof requireAuth === 'function' && typeof budgetController.getTransaction === 'function') {
    router.get('/transactions/:id', requireAuth, budgetController.getTransaction);
} else {
    router.get('/transactions/:id', requireAuth, (req, res) => {
        res.json({
            success: false,
            message: 'Transaction detail endpoint not properly configured',
            transactionId: req.params.id
        });
    });
}

if (typeof requireAuth === 'function' && typeof budgetController.createTransaction === 'function') {
    router.post('/transactions', requireAuth, budgetController.createTransaction);
} else {
    router.post('/transactions', requireAuth, (req, res) => {
        res.json({
            success: false,
            message: 'Create transaction endpoint not properly configured',
            body: req.body
        });
    });
}

// Summary and analytics routes
if (typeof requireAuth === 'function' && typeof budgetController.getBudgetSummary === 'function') {
    router.get('/summary', requireAuth, budgetController.getBudgetSummary);
} else {
    router.get('/summary', requireAuth, (req, res) => {
        res.json({
            success: false,
            message: 'Budget summary endpoint not properly configured'
        });
    });
}

if (typeof requireAuth === 'function' && typeof budgetController.getMonthlyBreakdown === 'function') {
    router.get('/monthly-breakdown', requireAuth, budgetController.getMonthlyBreakdown);
} else {
    router.get('/monthly-breakdown', requireAuth, (req, res) => {
        res.json({
            success: false,
            message: 'Monthly breakdown endpoint not properly configured'
        });
    });
}

if (typeof requireAuth === 'function' && typeof budgetController.getCategoryBreakdown === 'function') {
    router.get('/category-breakdown', requireAuth, budgetController.getCategoryBreakdown);
} else {
    router.get('/category-breakdown', requireAuth, (req, res) => {
        res.json({
            success: false,
            message: 'Category breakdown endpoint not properly configured'
        });
    });
}

if (typeof requireAuth === 'function' && typeof budgetController.getSpendingInsights === 'function') {
    router.get('/insights', requireAuth, budgetController.getSpendingInsights);
} else {
    router.get('/insights', requireAuth, (req, res) => {
        res.json({
            success: false,
            message: 'Spending insights endpoint not properly configured'
        });
    });
}

// ========== BUDGET GOALS ROUTES ==========
// GET budget goals
router.get('/goals', requireAuth, async (req, res) => {
    try {
        console.log('📊 Getting budget goals for user:', req.user?._id || req.session?.userId);
        
        // Try to use model if available
        let goals;
        if (BudgetGoals && BudgetGoals.findOne) {
            goals = await BudgetGoals.findOne({ studentId: req.user?._id || req.session?.userId });
        }
        
        if (!goals) {
            return res.json({
                success: true,
                data: {
                    monthlyBudget: 1000,
                    savingsGoal: 5000,
                    expenseLimits: {
                        food: 300,
                        transportation: 200,
                        entertainment: 150,
                        utilities: 100,
                        other: 250
                    },
                    notifications: {
                        spendingAlerts: true,
                        goalProgress: true,
                        monthlySummary: true
                    }
                },
                message: 'Using default budget goals'
            });
        }
        
        res.json({
            success: true,
            data: goals
        });
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch budget goals',
            error: error.message
        });
    }
});

// POST/SET budget goals
if (typeof requireAuth === 'function' && typeof budgetController.setBudgetGoals === 'function') {
    router.post('/goals', requireAuth, budgetController.setBudgetGoals);
} else {
    router.post('/goals', requireAuth, (req, res) => {
        res.json({
            success: true,
            message: 'Budget goals updated (demo mode)',
            data: req.body
        });
    });
}

// ✅ ADD THIS SIMPLE TEST DATE ROUTE INSTEAD
router.get('/test-date', requireAuth, (req, res) => {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        res.json({
            success: true,
            message: 'Date test endpoint',
            data: {
                serverTime: new Date().toISOString(),
                formattedDate: formattedDate,
                components: {
                    year: year,
                    month: month,
                    day: day
                },
                user: req.user || req.session?.userId
            }
        });
    } catch (error) {
        console.error('Error in test-date endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Test failed',
            error: error.message
        });
    }
});

// Simple demo transaction for testing
router.post('/demo-transaction', requireAuth, (req, res) => {
    const { amount = 50, description = "Demo transaction", category = "food" } = req.body;
    
    res.json({
        success: true,
        message: 'Demo transaction created',
        transaction: {
            id: Date.now().toString(),
            amount,
            description,
            category,
            date: new Date().toISOString(),
            userId: req.user?._id || req.session?.userId
        }
    });
});

// Get demo transactions
router.get('/demo-transactions', requireAuth, (req, res) => {
    const demoTransactions = [
        { id: 1, amount: -25.50, description: "Lunch", category: "food", date: "2024-01-15" },
        { id: 2, amount: -10.00, description: "Bus fare", category: "transportation", date: "2024-01-14" },
        { id: 3, amount: 1000.00, description: "Part-time job", category: "income", date: "2024-01-10" },
        { id: 4, amount: -50.00, description: "Textbooks", category: "education", date: "2024-01-05" },
        { id: 5, amount: -15.75, description: "Coffee", category: "food", date: "2024-01-03" }
    ];
    
    res.json({
        success: true,
        count: demoTransactions.length,
        transactions: demoTransactions,
        summary: {
            totalIncome: 1000,
            totalExpenses: -101.25,
            balance: 898.75
        }
    });
});

console.log('✅ budgetRoutes.js loaded successfully');
console.log('📋 Available routes:');
console.log('   GET  /api/budget/health (public)');
console.log('   GET  /api/budget/test (public)');
console.log('   GET  /api/budget/test-auth (public)');
console.log('   GET  /api/budget/transactions (protected)');
console.log('   GET  /api/budget/summary (protected)');
console.log('   GET  /api/budget/goals (protected)');
console.log('   GET  /api/budget/test-date (protected)');
console.log('   GET  /api/budget/demo-transactions (protected)');

module.exports = router;