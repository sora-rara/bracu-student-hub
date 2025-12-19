const mongoose = require('mongoose');

const courseGradeSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: String,
        required: true,
        enum: ['Spring', 'Summer', 'Fall']
    },
    year: {
        type: Number,
        required: true
    },
    courses: [{
        courseCode: {
            type: String,
            required: true
        },
        courseName: {
            type: String,
            required: false
        },
        creditHours: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        grade: {
            type: String,
            required: true,
            enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']
        },
        gradePoint: {
            type: Number,
            default: 0
        }
    }],
    semesterGPA: {
        type: Number,
        default: 0
    },
    totalCredits: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// FIXED: Pre-save hook to calculate grade points and semester GPA
// Using function syntax (not arrow function) to access 'this'
courseGradeSchema.pre('save', function () {
    const gradePoints = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    this.courses.forEach(course => {
        course.gradePoint = gradePoints[course.grade] || 0;
        totalPoints += course.gradePoint * course.creditHours;
        totalCredits += course.creditHours;
    });

    // Store numeric values (not strings)
    this.semesterGPA = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
    this.totalCredits = totalCredits;

    // No need to call next() - just return or do nothing
});

// Static method: accumulated CGPA (weighted by credits)
courseGradeSchema.statics.calculateAccumulatedCGPA = async function (studentId) {
    const semesters = await this.find({ studentId }).sort({ year: 1, semester: 1 });

    if (!semesters || semesters.length === 0) {
        return 0;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach(sem => {
        totalPoints += sem.semesterGPA * sem.totalCredits;
        totalCredits += sem.totalCredits;
    });

    return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
};

// Static method: sequential CGPA (average of semester GPAs step-by-step)
courseGradeSchema.statics.calculateSequentialCGPA = async function (studentId) {
    const semesters = await this.find({ studentId }).sort({ year: 1, semester: 1 });

    if (!semesters || semesters.length === 0) {
        return 0;
    }

    let cumulativeGPA = 0;

    semesters.forEach((sem, index) => {
        if (index === 0) {
            cumulativeGPA = sem.semesterGPA;
        } else {
            cumulativeGPA = ((cumulativeGPA * index) + sem.semesterGPA) / (index + 1);
        }
    });

    return Number(cumulativeGPA.toFixed(2));
};

module.exports = mongoose.model('CourseGrade', courseGradeSchema);