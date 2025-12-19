
const express = require("express");
const {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    createUser,
    getSystemStats
} = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

// All routes require admin access
router.use(requireAdmin);

// Dashboard routes
router.get("/dashboard", getDashboardStats);
router.get("/stats", getSystemStats);

// User management routes
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// System routes
router.get("/system/health", (req, res) => {
    res.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        user: {
            id: req.user._id,
            name: req.user.name,
            role: req.user.role
        }
    });
});

module.exports = router;
