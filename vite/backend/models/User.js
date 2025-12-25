
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

// Method to update academic stats
userSchema.methods.updateAcademicStats = async function () {
    const CourseGrade = mongoose.model('CourseGrade');

    // Get all semesters for this user
    const semesters = await CourseGrade.find({ studentId: this._id })
        .sort({ year: 1, semester: 1 });

    if (semesters.length === 0) {
        // Reset stats if no semesters
        this.academicStats = {
            cumulativeCGPA: 0.0,
            totalCredits: 0,
            totalSemesters: 0,
            currentSemesterGPA: 0.0,
            lastCalculated: new Date()
        };
        return this.save();
    }

    // Calculate accumulated CGPA (weighted by credits)
    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach(sem => {
        totalPoints += (sem.semesterGPA || 0) * (sem.totalCredits || 0);
        totalCredits += sem.totalCredits || 0;
    });

    const cumulativeCGPA = totalCredits > 0 ?
        Number((totalPoints / totalCredits).toFixed(2)) : 0;

    // Get current semester (most recent)
    const sortedSemesters = [...semesters].sort((a, b) => {
        const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
        if (a.year !== b.year) return b.year - a.year;
        return semesterOrder[b.semester] - semesterOrder[a.semester];
    });

    const currentSemesterGPA = sortedSemesters[0]?.semesterGPA || 0;

    // Update academic stats
    this.academicStats = {
        cumulativeCGPA,
        totalCredits,
        totalSemesters: semesters.length,
        currentSemesterGPA,
        lastCalculated: new Date()
    };

    return this.save();
};

// Static method to update all users' academic stats (for admin)
userSchema.statics.updateAllAcademicStats = async function () {
    const users = await this.find({ role: 'student' });

    for (const user of users) {
        await user.updateAcademicStats();
    }

    return { updated: users.length };
};

// Static method to get admin dashboard stats
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
