// models/StudentProgress.js
const mongoose = require('mongoose');

const completedCourseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        trim: true
    },
    courseName: {
        type: String,
        default: function () {
            // Default name based on course code
            return `${this.courseCode} Course`;
        }
    },
    credits: {
        type: Number,
        required: true,
        min: 0,
        max: 6
    },
    grade: {
        type: String,
        uppercase: true,
        trim: true
    },
    gp: {
        type: Number,
        default: 0,
        min: 0,
        max: 4
    },
    semester: {
        type: String,
        trim: true
    },
    year: {
        type: Number
    },
    category: {
        type: String,
        enum: ['gen-ed', 'school-core', 'program-core', 'program-elective', 'project-thesis'],
        required: true
    },
    stream: {
        type: String,
        trim: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['completed', 'ongoing', 'planned', 'remaining'],
        default: 'completed'
    }
});

const plannedCourseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        trim: true
    },
    courseName: {
        type: String
    },
    credits: {
        type: Number,
        default: 3
    },
    plannedSemester: {
        type: Number,
        min: 1,
        max: 12
    },
    plannedYear: {
        type: Number
    },
    category: {
        type: String,
        enum: ['gen-ed', 'school-core', 'program-core', 'program-elective', 'project-thesis']
    },
    prerequisites: [{
        courseCode: String,
        type: {
            type: String,
            enum: ['hard-prerequisite', 'soft-prerequisite']
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'waived']
        },
        waived: Boolean
    }]
});

const studentProgressSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    program: {
        type: String,
        enum: ['CSE', 'CS'],
        required: true
    },
    department: {
        type: String,
        enum: ['CSE'],
        required: true
    },
    admissionYear: {
        type: Number,
        required: true
    },
    currentSemester: {
        type: Number,
        default: 1,
        min: 1,
        max: 12
    },
    expectedGraduationYear: {
        type: Number
    },

    // Course progress
    completedCourses: [completedCourseSchema],
    plannedCourses: [plannedCourseSchema],

    // Progress tracking
    totalCreditsCompleted: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCreditsRequired: {
        type: Number,
        default: 136,
        min: 0
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // By category progress
    progressByCategory: {
        genEd: {
            completed: { type: Number, default: 0 },
            required: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 }
        },
        schoolCore: {
            completed: { type: Number, default: 0 },
            required: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 }
        },
        programCore: {
            completed: { type: Number, default: 0 },
            required: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 }
        },
        programElective: {
            completed: { type: Number, default: 0 },
            required: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 }
        },
        projectThesis: {
            completed: { type: Number, default: 0 },
            required: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 }
        }
    },

    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to calculate progress
studentProgressSchema.methods.calculateProgress = function () {
    // Calculate total credits completed
    this.totalCreditsCompleted = this.completedCourses
        .filter(course => course.status === 'completed')
        .reduce((total, course) => total + (course.credits || 0), 0);

    // Calculate progress percentage
    if (this.totalCreditsRequired > 0) {
        this.progressPercentage = Math.min(100,
            (this.totalCreditsCompleted / this.totalCreditsRequired) * 100
        );
    } else {
        this.progressPercentage = 0;
    }

    // Update last updated timestamp
    this.lastUpdated = new Date();

    return {
        totalCreditsCompleted: this.totalCreditsCompleted,
        progressPercentage: this.progressPercentage
    };
};

// Method to check if prerequisites are met for a course
studentProgressSchema.methods.checkPrerequisites = async function (courseCode) {
    try {
        const Program = mongoose.model('Program');
        const program = await Program.findOne({ programCode: this.program });

        if (!program) {
            return {
                met: false,
                missing: [],
                hardPrerequisites: [],
                softPrerequisites: []
            };
        }

        // Get completed course codes
        const completedCourseCodes = this.completedCourses
            .filter(c => c.status === 'completed')
            .map(c => c.courseCode);

        // Find the course in program requirements
        let targetCourse = null;
        let coursePrerequisites = { hardPrerequisites: [], softPrerequisites: [] };

        // Search for course in program requirements
        for (const category of program.requirements || []) {
            const course = category.courses?.find(c => c.courseCode === courseCode);
            if (course) {
                targetCourse = course;
                coursePrerequisites.hardPrerequisites = course.hardPrerequisites || [];
                coursePrerequisites.softPrerequisites = course.softPrerequisites || [];
                break;
            }
        }

        // Check hard prerequisites
        const missingHard = coursePrerequisites.hardPrerequisites
            .filter(prereq => !completedCourseCodes.includes(prereq.courseCode))
            .map(prereq => prereq.courseCode);

        // Check soft prerequisites
        const missingSoft = coursePrerequisites.softPrerequisites
            .filter(prereq => !completedCourseCodes.includes(prereq.courseCode))
            .map(prereq => prereq.courseCode);

        const allMissing = [...missingHard, ...missingSoft];
        const met = missingHard.length === 0;

        return {
            met: met,
            missing: allMissing,
            hardPrerequisites: coursePrerequisites.hardPrerequisites,
            softPrerequisites: coursePrerequisites.softPrerequisites,
            missingHard: missingHard,
            missingSoft: missingSoft,
            canTake: met,
            completedPrerequisites: coursePrerequisites.hardPrerequisites
                .filter(prereq => completedCourseCodes.includes(prereq.courseCode))
                .map(prereq => prereq.courseCode)
        };
    } catch (error) {
        console.error('Error checking prerequisites:', error);
        throw error;
    }
};

// Method to calculate GPA from completed courses
studentProgressSchema.methods.calculateGPA = function () {
    const completedCourses = this.completedCourses.filter(c =>
        c.status === 'completed' && c.grade && c.gp !== undefined && c.credits
    );

    if (completedCourses.length === 0) return 0;

    const totalPoints = completedCourses.reduce((sum, course) =>
        sum + (course.gp * course.credits), 0);
    const totalCredits = completedCourses.reduce((sum, course) =>
        sum + course.credits, 0);

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
};

// Method to get remaining courses
studentProgressSchema.methods.getRemainingCourses = async function () {
    const Program = mongoose.model('Program');
    const program = await Program.findOne({ programCode: this.program });

    if (!program) {
        return [];
    }

    const completedCourseCodes = this.completedCourses
        .filter(c => c.status === 'completed')
        .map(c => c.courseCode);

    const remainingCourses = [];

    program.requirements.forEach(category => {
        category.courses.forEach(course => {
            if (!completedCourseCodes.includes(course.courseCode)) {
                remainingCourses.push({
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    credits: course.credits,
                    category: course.category,
                    isRequired: course.isRequired,
                    prerequisites: (course.hardPrerequisites || []).concat(course.softPrerequisites || []),
                    categoryName: category.categoryName
                });
            }
        });
    });

    return remainingCourses;
};

// Corrected pre-save middleware
studentProgressSchema.pre('save', async function () {
    // Always calculate progress before saving
    if (typeof this.calculateProgress === 'function') {
        this.calculateProgress();
    }
    this.lastUpdated = new Date();
});

// Static method to find or create progress
studentProgressSchema.statics.findOrCreate = async function (studentId, programData = {}) {
    let progress = await this.findOne({ studentId });

    if (!progress) {
        progress = new this({
            studentId,
            program: programData.program || 'CSE',
            department: programData.department || 'CSE',
            admissionYear: programData.admissionYear || new Date().getFullYear(),
            expectedGraduationYear: (programData.admissionYear || new Date().getFullYear()) + 4,
            totalCreditsRequired: programData.totalCreditsRequired || 136
        });
        await progress.save();
    }

    return progress;
};

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);

module.exports = StudentProgress;