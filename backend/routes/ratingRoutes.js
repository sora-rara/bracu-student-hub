const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Temporary in-memory ratings store
let ratingsDatabase = [];

/* ---------------- TEST ROUTE ---------------- */

router.get("/test", (req, res) => {
  console.log("✅ /api/ratings/test endpoint hit!");
  res.json({
    success: true,
    message: "Rating API is working!",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "GET /api/ratings/test",
      "GET /api/ratings/faculty-list",
      "POST /api/ratings/submit",
      "GET /api/ratings/faculty/:facultyId",
      "POST /api/ratings/create-faculty",
      "DELETE /api/ratings/faculty/:id"
    ]
  });
});

/* ---------------- FACULTY LIST ---------------- */

router.get("/faculty-list", async (req, res) => {
  try {
    console.log("✅ /api/ratings/faculty-list endpoint hit!");
    
    const { search } = req.query;
    
    let query = { role: "faculty" };
    
    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        ...query,
        $or: [
          { name: searchRegex },
          { initials: searchRegex },
          { 'adminProfile.department': searchRegex },
          { email: searchRegex }
        ]
      };
      console.log(`Searching for: "${search}"`);
    }
    
    const faculty = await User.find(query).select("name email role adminProfile initials");
    
    console.log(`Found ${faculty.length} faculty members`);
    
    const facultyWithDepartment = faculty.map(f => ({
      _id: f._id,
      name: f.name,
      email: f.email,
      initials: f.initials || '', // Return empty string if no initials
      role: f.role,
      department: f.adminProfile?.department || "Not specified"
    }));
    
    res.json(facultyWithDepartment);
  } catch (error) {
    console.error("❌ Error fetching faculty list:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: "Failed to fetch faculty list"
    });
  }
});

/* ---------------- SUBMIT RATING ---------------- */

router.post("/submit", async (req, res) => {
  try {
    console.log("✅ /api/ratings/submit endpoint hit!");
    console.log("Request body:", req.body);

    const { facultyId, teachingQuality, engagement, helpfulness, comments } = req.body;
    const studentId = req.session.userId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    if (!facultyId || !teachingQuality || !engagement || !helpfulness) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    if (
      teachingQuality < 1 || teachingQuality > 5 ||
      engagement < 1 || engagement > 5 ||
      helpfulness < 1 || helpfulness > 5
    ) {
      return res.status(400).json({
        success: false,
        error: "Ratings must be between 1 and 5"
      });
    }

    const student = await User.findById(studentId);
    const faculty = await User.findById(facultyId);

    if (!student || !faculty || faculty.role !== "faculty") {
      return res.status(400).json({
        success: false,
        error: "Invalid student or faculty"
      });
    }

    const existingIndex = ratingsDatabase.findIndex(
      r => r.facultyId === facultyId && r.studentId === studentId
    );

    if (existingIndex !== -1) {
      ratingsDatabase[existingIndex] = {
        ...ratingsDatabase[existingIndex],
        teachingQuality,
        engagement,
        helpfulness,
        comments: comments || "",
        updatedAt: new Date()
      };

      return res.json({
        success: true,
        message: "Rating updated",
        action: "updated",
        rating: ratingsDatabase[existingIndex]
      });
    }

    const newRating = {
      _id: `rating_${Date.now()}`,
      facultyId,
      studentId,
      studentName: student.name,
      teachingQuality,
      engagement,
      helpfulness,
      comments: comments || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    ratingsDatabase.push(newRating);

    res.status(201).json({
      success: true,
      message: "Rating submitted",
      action: "created",
      rating: newRating
    });

  } catch (error) {
    console.error("❌ Error submitting rating:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ---------------- GET FACULTY RATINGS ---------------- */

router.get("/faculty/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;

    const faculty = await User.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, error: "Faculty not found" });
    }

    const facultyRatings = ratingsDatabase.filter(r => r.facultyId === facultyId);

    let avgTeaching = 0, avgEngagement = 0, avgHelpfulness = 0;

    if (facultyRatings.length) {
      avgTeaching = facultyRatings.reduce((s, r) => s + r.teachingQuality, 0) / facultyRatings.length;
      avgEngagement = facultyRatings.reduce((s, r) => s + r.engagement, 0) / facultyRatings.length;
      avgHelpfulness = facultyRatings.reduce((s, r) => s + r.helpfulness, 0) / facultyRatings.length;
    }

    res.json({
      success: true,
      facultyId,
      facultyName: faculty.name,
      ratings: facultyRatings,
      averages: {
        teachingQuality: avgTeaching.toFixed(1),
        engagement: avgEngagement.toFixed(1),
        helpfulness: avgHelpfulness.toFixed(1),
        overall: ((avgTeaching + avgEngagement + avgHelpfulness) / 3).toFixed(1)
      },
      totalRatings: facultyRatings.length
    });

  } catch (error) {
    console.error("❌ Error fetching faculty ratings:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ---------------- CREATE FACULTY (MANUAL INITIALS) ---------------- */

router.post("/create-faculty", async (req, res) => {
  try {
    console.log("✅ /api/ratings/create-faculty endpoint hit!");
    console.log("Request body:", req.body);
    
    const { name, email, department, initials } = req.body;
    
    // Validate required fields
    if (!name || !email || !department || !initials) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: name, email, department, initials"
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid email format"
      });
    }
    
    // Validate initials format (2-4 uppercase letters)
    const initialsRegex = /^[A-Z]{2,4}$/;
    if (!initialsRegex.test(initials.trim())) {
      return res.status(400).json({ 
        success: false,
        error: "Initials must be 2-4 uppercase letters (e.g., SADF, JS, RJD)"
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: `User with email ${email} already exists`
      });
    }
    
    // Check if initials are unique for faculty
    const existingWithInitials = await User.findOne({ 
      role: 'faculty', 
      initials: initials.trim().toUpperCase() 
    });
    
    if (existingWithInitials) {
      return res.status(400).json({ 
        success: false,
        error: `Faculty with initials "${initials}" already exists`
      });
    }
    
    // Create faculty user with manual initials
    const facultyUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: "no-password-required", // Default password for faculty
      role: "faculty",
      initials: initials.trim().toUpperCase(), // Manual initials only
      adminProfile: {
        department: department.trim(),
        isActive: true
      }
    });
    
    // Save the faculty user
    await facultyUser.save();
    
    // Remove password from response
    const userResponse = facultyUser.toObject();
    delete userResponse.password;
    
    console.log("✅ Faculty member created:", userResponse.name);
    
    res.status(201).json({
      success: true,
      message: `Faculty member "${name}" created successfully`,
      faculty: {
        _id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        initials: userResponse.initials,
        role: userResponse.role,
        department: userResponse.adminProfile?.department || department
      }
    });
    
  } catch (error) {
    console.error("❌ Error creating faculty:", error);
    
    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: "Validation failed",
        details: errors
      });
    }
    
    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: "Failed to create faculty member. Please try again."
    });
  }
});

/* ---------------- DELETE FACULTY ---------------- */

router.delete("/faculty/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Faculty not found" });
    }

    ratingsDatabase = ratingsDatabase.filter(r => r.facultyId !== id);

    res.json({ success: true, message: "Faculty deleted" });

  } catch (error) {
    console.error("❌ Error deleting faculty:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;