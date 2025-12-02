const CourseGrade = require('../models/CourseGrade');

// -------------------------------
// Add Semester Grades
// -------------------------------
exports.addSemesterGrades = async (req, res) => {
    try {
        const studentId = req.session.userId; // session-based auth
        const { semester, year, courses } = req.body;

        // Must be logged in
        if (!studentId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        // Basic validation
        if (!semester || !year || !courses || !Array.isArray(courses) || courses.length === 0) {
            return res.status(400).json({ message: "Semester, year, and at least one course are required." });
        }

        // Only courseCode is mandatory — courseName NOT required
        const invalidCourse = courses.find(c =>
            !c.courseCode || c.courseCode.trim() === "" ||
            !c.grade || !c.creditHours
        );

        if (invalidCourse) {
            return res.status(400).json({ message: "Each course must include courseCode, grade, and creditHours." });
        }

        // Create semester document
        const newSemester = new CourseGrade({
            studentId,
            semester,
            year,
            courses
        });

        await newSemester.save();

        return res.status(201).json({
            message: "Semester saved successfully.",
            semester: newSemester
        });

    } catch (err) {
        console.error("Error in addSemesterGrades:", err);
        return res.status(500).json({ message: "Server error while adding semester." });
    }
};

// -------------------------------
// Get All Semesters (Logged-in user only)
// -------------------------------
exports.getAllSemesters = async (req, res) => {
    try {
        const studentId = req.session.userId;

        if (!studentId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const semesters = await CourseGrade.find({ studentId })
            .sort({ year: 1, semester: 1 });

        return res.json(semesters);

    } catch (err) {
        console.error("Error in getAllSemesters:", err);
        return res.status(500).json({ message: "Server error while fetching semesters." });
    }
};

// -------------------------------
// Get Single Semester
// -------------------------------
exports.getSemester = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { id } = req.params;

        if (!studentId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const semester = await CourseGrade.findOne({ _id: id, studentId });

        if (!semester) {
            return res.status(404).json({ message: "Semester not found." });
        }

        return res.json(semester);

    } catch (err) {
        console.error("Error in getSemester:", err);
        return res.status(500).json({ message: "Server error while fetching semester." });
    }
};

// -------------------------------
// Delete Semester
// -------------------------------
exports.deleteSemester = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { id } = req.params;

        if (!studentId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const deleted = await CourseGrade.findOneAndDelete({ _id: id, studentId });

        if (!deleted) {
            return res.status(404).json({ message: "Semester not found." });
        }

        return res.json({ message: "Semester deleted successfully." });

    } catch (err) {
        console.error("Error in deleteSemester:", err);
        return res.status(500).json({ message: "Server error while deleting semester." });
    }
};

// -------------------------------
// Calculate CGPA
// -------------------------------
exports.calculateCGPA = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { method } = req.query; // optional: accumulated (default) or sequential

        if (!studentId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        let cgpa;

        if (method === "sequential") {
            cgpa = await CourseGrade.calculateSequentialCGPA(studentId);
        } else {
            cgpa = await CourseGrade.calculateAccumulatedCGPA(studentId);
        }

        return res.json({ cgpa });

    } catch (err) {
        console.error("Error in calculateCGPA:", err);
        return res.status(500).json({ message: "Server error while calculating CGPA." });
    }
};
