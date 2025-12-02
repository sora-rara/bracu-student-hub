const express = require("express");
const { signup, login, getCurrentUser } = require("../controllers/authController");
const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected route (requires session)
router.get("/me", getCurrentUser);

module.exports = router;