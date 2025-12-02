const express = require("express");
const router = express.Router();
const {
  getAllDeadlines,
  getDeadlinesForCourse,
  createDeadline,
  updateDeadline,
  deleteDeadline,
} = require("../controllers/deadlineController");

// GET all deadlines (optionally filter by ?courseCode=CSE220)
router.get("/", getAllDeadlines);

// GET deadlines for a single course
router.get("/:courseCode", getDeadlinesForCourse);

// CREATE new deadline
router.post("/", createDeadline);

// UPDATE a deadline by id
router.put("/:id", updateDeadline);

// DELETE a deadline by id
router.delete("/:id", deleteDeadline);

module.exports = router;
