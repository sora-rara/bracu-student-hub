// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["student", "admin", "faculty"],
        default: "student"
    },

    // Additional admin fields
    adminProfile: {
        department: { type: String, default: '' },
        phone: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
        permissions: {
            canManageUsers: { type: Boolean, default: false },
            canManageContent: { type: Boolean, default: false },
            canManageSystem: { type: Boolean, default: false }
        }
    },

    // Academic Statistics
    academicStats: {
        cumulativeCGPA: {
            type: Number,
            default: 0.0,
            min: 0.0,
            max: 4.0
        },
        totalCredits: {
            type: Number,
            default: 0
        },
        totalSemesters: {
            type: Number,
            default: 0
        },
        currentSemesterGPA: {
            type: Number,
            default: 0.0,
            min: 0.0,
            max: 4.0
        },
        lastCalculated: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Virtual for formatted CGPA
userSchema.virtual('formattedCGPA').get(function () {
    return this.academicStats.cumulativeCGPA.toFixed(2);
});

// Virtual for checking if user is admin
userSchema.virtual('isAdmin').get(function () {
    return this.role === 'admin';
});

// Helper function for grade points
function getGradePoint(grade) {
    const gradePoints = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0
    };
    return gradePoints[grade] || 0;
}

// Method to update academic stats - UPDATED FOR RETAKE LOGIC
userSchema.methods.updateAcademicStats = async function () {
    const CourseGrade = mongoose.model('CourseGrade');

    // Get unique courses with latest attempts
    const uniqueCourses = await CourseGrade.getUniqueCourses(this._id);

    // Calculate CGPA from unique courses
    let totalPoints = 0;
    let totalUniqueCredits = 0;

    uniqueCourses.forEach(course => {
        const gradePoint = course.gradePoint || getGradePoint(course.grade);
        totalPoints += gradePoint * course.creditHours;
        totalUniqueCredits += course.creditHours;
    });

    const cumulativeCGPA = totalUniqueCredits > 0 ?
        Number((totalPoints / totalUniqueCredits).toFixed(2)) : 0;

    // Get all semesters for counting
    const semesters = await CourseGrade.find({ studentId: this._id });

    // Get current semester GPA (most recent)
    const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
    const sortedSemesters = [...semesters].sort((a, b) => {
        const aKey = (a.year * 10) + semesterOrder[a.semester];
        const bKey = (b.year * 10) + semesterOrder[b.semester];
        return bKey - aKey; // Descending (most recent first)
    });

    const currentSemesterGPA = sortedSemesters[0]?.semesterGPA || 0;

    // Update academic stats
    this.academicStats = {
        cumulativeCGPA,
        totalCredits: totalUniqueCredits, // Unique credits only
        totalSemesters: semesters.length,
        currentSemesterGPA,
        lastCalculated: new Date()
    };

    return this.save();
};

// Static method to update all users' academic stats (for admin) - UNCHANGED
userSchema.statics.updateAllAcademicStats = async function () {
    const users = await this.find({ role: 'student' });

    for (const user of users) {
        await user.updateAcademicStats();
    }

    return { updated: users.length };
};

// Static method to get admin dashboard stats - UNCHANGED
userSchema.statics.getDashboardStats = async function () {
    const totalUsers = await this.countDocuments();
    const totalStudents = await this.countDocuments({ role: 'student' });
    const totalAdmins = await this.countDocuments({ role: 'admin' });
    const recentUsers = await this.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt');

    return {
        totalUsers,
        totalStudents,
        totalAdmins,
        recentUsers
    };
};

module.exports = mongoose.model("User", userSchema);