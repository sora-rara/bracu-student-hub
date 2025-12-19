// controllers/gpaController.js
const CourseGrade = require('../models/CourseGrade');
const User = require('../models/User');

// Helper function to update user's academic stats
const updateUserAcademicStats = async (studentId) => {
    try {
        const user = await User.findById(studentId);
        if (user) {
            await user.updateAcademicStats();
            return user;
        }
    } catch (err) {
        console.error('Error updating user academic stats:', err);
        throw err;
    }
};

// Helper function to get grade point
function getGradePoint(grade) {
    const gradePoints = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0
    };
    return gradePoints[grade] || 0;
}

// -------------------------------
// Add Semester Grades (UPDATED WITH SEMESTER UNIQUENESS)
// -------------------------------
exports.addSemesterGrades = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { semester, year, courses } = req.body;

        // Must be logged in
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated. Please log in."
            });
        }

        // Basic validation
        if (!semester || !year || !courses || !Array.isArray(courses) || courses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Semester, year, and at least one course are required."
            });
        }

        // Validate course fields
        const invalidCourse = courses.find(c =>
            !c.courseCode || c.courseCode.trim() === "" ||
            !c.grade || !c.creditHours
        );

        if (invalidCourse) {
            return res.status(400).json({
                success: false,
                message: "Each course must include courseCode, grade, and creditHours."
            });
        }

        // NEW: Check if semester already exists for this student
        const existingSemester = await CourseGrade.findOne({
            studentId,
            semester,
            year
        });

        if (existingSemester) {
            return res.status(400).json({
                success: false,
                message: `You already have a ${semester} ${year} semester. Please edit or delete the existing one first.`
            });
        }

        // NEW: Check for retakes (optional warning, doesn't prevent saving)
        const retakes = await CourseGrade.checkForRetakes(studentId, courses, semester, year);
        const hasRetakes = retakes.length > 0;

        // Create semester document
        const newSemester = new CourseGrade({
            studentId,
            semester,
            year,
            courses: courses.map(course => ({
                ...course,
                courseCode: course.courseCode.trim(),
                courseName: (course.courseName || '').trim(),
                gradePoint: getGradePoint(course.grade)
            }))
        });

        // This will trigger the pre-save hook to calculate GPA
        await newSemester.save();

        // Update user's academic statistics
        const updatedUser = await updateUserAcademicStats(studentId);

        const response = {
            success: true,
            message: "Semester saved successfully to your profile.",
            data: {
                semester: newSemester,
                academicStats: updatedUser?.academicStats || null,
                studentId: studentId
            }
        };

        // Add retake warning if any (but still successful)
        if (hasRetakes) {
            response.warning = {
                message: `${retakes.length} course(s) are being retaken. Latest grades will be used for CGPA calculation.`,
                retakes: retakes,
                retakeCount: retakes.length
            };
        }

        return res.status(201).json(response);

    } catch (err) {
        console.error("Error in addSemesterGrades:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while saving semester: " + err.message
        });
    }
};

// -------------------------------
// Delete Semester - UNCHANGED
// -------------------------------
exports.deleteSemester = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { id } = req.params;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        const deleted = await CourseGrade.findOneAndDelete({ _id: id, studentId });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Semester not found."
            });
        }

        // Update user's academic statistics
        await updateUserAcademicStats(studentId);

        // Get updated user info
        const updatedUser = await User.findById(studentId).select('academicStats');

        return res.json({
            success: true,
            message: "Semester deleted successfully.",
            data: {
                academicStats: updatedUser?.academicStats || null
            }
        });

    } catch (err) {
        console.error("Error in deleteSemester:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting semester."
        });
    }
};

// -------------------------------
// Get All Semesters - UNCHANGED
// -------------------------------
exports.getAllSemesters = async (req, res) => {
    try {
        const studentId = req.session.userId;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        const semesters = await CourseGrade.find({ studentId })
            .sort({ year: 1, semester: 1 });

        return res.json({
            success: true,
            data: semesters,
            count: semesters.length
        });

    } catch (err) {
        console.error("Error in getAllSemesters:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching semesters."
        });
    }
};

// -------------------------------
// Get Single Semester - UNCHANGED
// -------------------------------
exports.getSemester = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { id } = req.params;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        const semester = await CourseGrade.findOne({ _id: id, studentId });

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: "Semester not found."
            });
        }

        return res.json({
            success: true,
            data: semester
        });

    } catch (err) {
        console.error("Error in getSemester:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching semester."
        });
    }
};

// -------------------------------
// Calculate CGPA - UPDATED TO USE NEW LOGIC
// -------------------------------
exports.calculateCGPA = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { method } = req.query; // optional: accumulated (default) or sequential

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        // First, get user's stored CGPA
        const user = await User.findById(studentId).select('academicStats');

        let cgpa;
        let message = 'Using stored CGPA from user profile';
        let calculationMethod = method || 'accumulated';

        // If forced calculation is requested or no stored data
        if (req.query.force === 'true' || !user?.academicStats?.cumulativeCGPA) {
            message = 'Calculated fresh from semester data';

            if (method === "sequential") {
                // Sequential calculation remains unchanged (average of semester GPAs)
                cgpa = await CourseGrade.calculateSequentialCGPA(studentId);
            } else {
                // Accumulated calculation now uses retake logic
                cgpa = await CourseGrade.calculateAccumulatedCGPA(studentId);
            }

            // Update user's stats if different
            if (user && Math.abs(user.academicStats.cumulativeCGPA - cgpa) > 0.01) {
                await updateUserAcademicStats(studentId);
            }
        } else {
            // Use stored CGPA (which already uses retake logic)
            cgpa = user.academicStats.cumulativeCGPA;
        }

        return res.json({
            success: true,
            data: {
                cgpa,
                method: calculationMethod,
                source: message,
                lastCalculated: user?.academicStats?.lastCalculated,
                totalCredits: user?.academicStats?.totalCredits,
                totalSemesters: user?.academicStats?.totalSemesters
            },
            message: "CGPA calculated successfully"
        });

    } catch (err) {
        console.error("Error in calculateCGPA:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while calculating CGPA."
        });
    }
};

// -------------------------------
// Get User Academic Stats - UNCHANGED
// -------------------------------
exports.getAcademicStats = async (req, res) => {
    try {
        const studentId = req.session.userId;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        const user = await User.findById(studentId).select('academicStats name email role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Optionally update stats if they're stale (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (!user.academicStats.lastCalculated ||
            new Date(user.academicStats.lastCalculated) < oneHourAgo) {
            await updateUserAcademicStats(studentId);
            // Refetch updated user
            const updatedUser = await User.findById(studentId).select('academicStats name email role');
            return res.json({
                success: true,
                data: updatedUser,
                message: "Academic stats (freshly calculated)"
            });
        }

        return res.json({
            success: true,
            data: user,
            message: "Academic stats (from cache)"
        });

    } catch (err) {
        console.error("Error in getAcademicStats:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching academic stats."
        });
    }
};

// -------------------------------
// Force Update Academic Stats - UNCHANGED
// -------------------------------
exports.forceUpdateAcademicStats = async (req, res) => {
    try {
        const studentId = req.session.userId;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        await updateUserAcademicStats(studentId);

        const updatedUser = await User.findById(studentId).select('academicStats');

        return res.json({
            success: true,
            data: updatedUser?.academicStats || null,
            message: "Academic stats updated successfully"
        });

    } catch (err) {
        console.error("Error in forceUpdateAcademicStats:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while updating academic stats."
        });
    }
};

// -------------------------------
// Calculate GPA Preview (NEW) - UNCHANGED
// -------------------------------
exports.calculateGPAPreview = async (req, res) => {
    try {
        const { courses, semester, year } = req.body;

        // Validation
        if (!courses || !Array.isArray(courses) || courses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Courses array is required"
            });
        }

        // Calculate semester GPA
        let totalPoints = 0;
        let totalCredits = 0;

        courses.forEach(course => {
            const points = getGradePoint(course.grade);
            totalPoints += points * course.creditHours;
            totalCredits += course.creditHours;
        });

        const semesterGPA = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;

        return res.json({
            success: true,
            data: {
                semesterGPA,
                totalCredits,
                semester,
                year,
                coursesCount: courses.length
            },
            message: "GPA calculated successfully"
        });

    } catch (err) {
        console.error("Error in calculateGPAPreview:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while calculating GPA preview."
        });
    }
};

// -------------------------------
// Check for Retakes (NEW)
// -------------------------------
exports.checkRetakes = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { courses, semester, year } = req.body;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        if (!courses || !Array.isArray(courses)) {
            return res.status(400).json({
                success: false,
                message: "Courses array is required"
            });
        }

        // Use the model's static method
        const retakes = await CourseGrade.checkForRetakes(studentId, courses, semester, year);

        return res.json({
            success: true,
            data: {
                retakes,
                retakeCount: retakes.length,
                hasRetakes: retakes.length > 0
            },
            message: retakes.length > 0 ?
                `Found ${retakes.length} retake(s)` :
                "No retakes found"
        });

    } catch (err) {
        console.error("Error in checkRetakes:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while checking retakes."
        });
    }
};

// -------------------------------
// Get Course History (NEW)
// -------------------------------
exports.getCourseHistory = async (req, res) => {
    try {
        const studentId = req.session.userId;
        const { courseCode } = req.query;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        if (!courseCode) {
            return res.status(400).json({
                success: false,
                message: "Course code is required"
            });
        }

        const history = await CourseGrade.getCourseHistory(studentId, courseCode);

        return res.json({
            success: true,
            data: {
                courseCode,
                attempts: history,
                attemptCount: history.length,
                latestAttempt: history.length > 0 ? history[history.length - 1] : null
            },
            message: `Found ${history.length} attempt(s) for ${courseCode}`
        });
    } catch (err) {
        console.error("Error in getCourseHistory:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching course history."
        });
    }
}