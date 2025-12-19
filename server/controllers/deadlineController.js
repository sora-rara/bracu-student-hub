const Deadline = require("../models/Deadline");

// GET /api/deadlines  (optionally ?courseCode=CSE220)
exports.getAllDeadlines = async (req, res) => {
  try {
    const { courseCode } = req.query;
    const query = {};

    if (courseCode) {
      query.courseCode = courseCode;
    }

    const deadlines = await Deadline.find(query).sort({
      courseCode: 1,
      dueDate: 1,
    });

    res.json(deadlines);
  } catch (err) {
    console.error("Error fetching all deadlines:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/deadlines/:courseCode?category=exam|assignment
exports.getDeadlinesForCourse = async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { category } = req.query; // optional filter

    const query = { courseCode };

    if (category) {
      query.category = category; // "exam" or "assignment"
    }

    const deadlines = await Deadline.find(query).sort("dueDate");
    res.json(deadlines);
  } catch (err) {
    console.error("Error fetching deadlines:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/deadlines
// body: { courseCode, category, name, dueDate, syllabus }
exports.createDeadline = async (req, res) => {
  try {
    const { courseCode, category, name, dueDate, syllabus } = req.body;

    if (!courseCode || !category || !name || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const deadline = await Deadline.create({
      courseCode,
      category,
      name,
      syllabus,
      dueDate,
    });

    res.status(201).json(deadline);
  } catch (err) {
    console.error("Error creating deadline:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/deadlines/:id
exports.updateDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseCode, category, name, dueDate, syllabus } = req.body;

    const updated = await Deadline.findByIdAndUpdate(
      id,
      { courseCode, category, name, dueDate, syllabus },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Deadline not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating deadline:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/deadlines/:id
exports.deleteDeadline = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Deadline.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Deadline not found" });
    }

    res.json({ message: "Deadline deleted" });
  } catch (err) {
    console.error("Error deleting deadline:", err);
    res.status(500).json({ message: "Server error" });
  }
};
