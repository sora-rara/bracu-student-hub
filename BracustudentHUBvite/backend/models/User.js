const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["student", "admin", "faculty"],
      default: "student"
    },

    // ✅ MANUAL initials ONLY (no auto-generation)
    initials: {
      type: String,
      uppercase: true,
      trim: true,
      maxlength: 10,
      default: null
    },

    // Admin profile
    adminProfile: {
      department: { type: String, default: "" },
      phone: { type: String, default: "" },
      isActive: { type: Boolean, default: true },
      lastLogin: { type: Date },
      permissions: {
        canManageUsers: { type: Boolean, default: false },
        canManageContent: { type: Boolean, default: false },
        canManageSystem: { type: Boolean, default: false }
      }
    },

    // Academic statistics
    academicStats: {
      cumulativeCGPA: {
        type: Number,
        default: 0.0,
        min: 0.0,
        max: 4.0
      },
      totalCredits: { type: Number, default: 0 },
      totalSemesters: { type: Number, default: 0 },
      currentSemesterGPA: {
        type: Number,
        default: 0.0,
        min: 0.0,
        max: 4.0
      },
      lastCalculated: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

/* =======================
   Virtuals
======================= */

userSchema.virtual("formattedCGPA").get(function () {
  return this.academicStats.cumulativeCGPA.toFixed(2);
});

userSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

/* =======================
   Methods
======================= */

userSchema.methods.updateAcademicStats = async function () {
  const CourseGrade = mongoose.model("CourseGrade");

  const semesters = await CourseGrade.find({ studentId: this._id })
    .sort({ year: 1, semester: 1 });

  if (semesters.length === 0) {
    this.academicStats = {
      cumulativeCGPA: 0.0,
      totalCredits: 0,
      totalSemesters: 0,
      currentSemesterGPA: 0.0,
      lastCalculated: new Date()
    };
    return this.save();
  }

  let totalPoints = 0;
  let totalCredits = 0;

  semesters.forEach(s => {
    totalPoints += (s.semesterGPA || 0) * (s.totalCredits || 0);
    totalCredits += s.totalCredits || 0;
  });

  const cumulativeCGPA =
    totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;

  const semesterOrder = { Spring: 1, Summer: 2, Fall: 3 };
  const currentSemesterGPA =
    [...semesters].sort((a, b) =>
      a.year !== b.year
        ? b.year - a.year
        : semesterOrder[b.semester] - semesterOrder[a.semester]
    )[0]?.semesterGPA || 0;

  this.academicStats = {
    cumulativeCGPA,
    totalCredits,
    totalSemesters: semesters.length,
    currentSemesterGPA,
    lastCalculated: new Date()
  };

  return this.save();
};

/* =======================
   Statics
======================= */

userSchema.statics.updateAllAcademicStats = async function () {
  const users = await this.find({ role: "student" });
  for (const user of users) {
    await user.updateAcademicStats();
  }
  return { updated: users.length };
};

userSchema.statics.getDashboardStats = async function () {
  const totalUsers = await this.countDocuments();
  const totalStudents = await this.countDocuments({ role: "student" });
  const totalAdmins = await this.countDocuments({ role: "admin" });

  const recentUsers = await this.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name email role createdAt");

  return {
    totalUsers,
    totalStudents,
    totalAdmins,
    recentUsers
  };
};

module.exports = mongoose.model("User", userSchema);
