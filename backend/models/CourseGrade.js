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

// Static method: accumulated CGPA (weighted by credits) - UPDATED FOR RETAKE LOGIC
courseGradeSchema.statics.calculateAccumulatedCGPA = async function (studentId) {
    const semesters = await this.find({ studentId }).sort({ year: 1, semester: 1 });

    if (!semesters || semesters.length === 0) {
        return 0;
    }

    // Define semester order for sorting
    const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };

    // Map to track latest attempt of each course
    const latestCourses = new Map(); // key: courseCode, value: {course, semesterData}

    // Process semesters in chronological order
    semesters.forEach(sem => {
        sem.courses.forEach(course => {
            const courseKey = course.courseCode.trim().toUpperCase(); // Normalize course code

            // Check if we already have this course from a previous semester
            const existing = latestCourses.get(courseKey);

            if (!existing) {
                // First time seeing this course
                latestCourses.set(courseKey, {
                    course: course,
                    semester: sem.semester,
                    year: sem.year,
                    semesterId: sem._id
                });
            } else {
                // Course already exists - check if current semester is more recent
                const existingSemesterKey = (existing.year * 10) + semesterOrder[existing.semester];
                const currentSemesterKey = (sem.year * 10) + semesterOrder[sem.semester];

                if (currentSemesterKey > existingSemesterKey) {
                    // Current semester is more recent - replace
                    latestCourses.set(courseKey, {
                        course: course,
                        semester: sem.semester,
                        year: sem.year,
                        semesterId: sem._id
                    });
                }
                // If current semester is older or same, keep existing
            }
        });
    });

    // Calculate GPA using only latest attempts
    let totalPoints = 0;
    let totalCredits = 0;

    latestCourses.forEach((value, courseCode) => {
        const course = value.course;
        const gradePoint = course.gradePoint || getGradePoint(course.grade);
        totalPoints += gradePoint * course.creditHours;
        totalCredits += course.creditHours;
    });

    return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
};

// Static method: sequential CGPA (average of semester GPAs step-by-step) - UNCHANGED
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

// NEW: Get all unique courses (latest attempts only)
courseGradeSchema.statics.getUniqueCourses = async function (studentId) {
    const semesters = await this.find({ studentId }).sort({ year: 1, semester: 1 });

    const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
    const uniqueCourses = new Map();

    semesters.forEach((sem, index) => {
        sem.courses.forEach(course => {
            const courseKey = course.courseCode.trim().toUpperCase();

            const existing = uniqueCourses.get(courseKey);
            if (!existing) {
                uniqueCourses.set(courseKey, {
                    ...course.toObject(),
                    semester: sem.semester,
                    year: sem.year,
                    semesterId: sem._id
                });
            } else {
                const existingSemesterKey = (existing.year * 10) + semesterOrder[existing.semester];
                const currentSemesterKey = (sem.year * 10) + semesterOrder[sem.semester];

                if (currentSemesterKey > existingSemesterKey) {
                    uniqueCourses.set(courseKey, {
                        ...course.toObject(),
                        semester: sem.semester,
                        year: sem.year,
                        semesterId: sem._id
                    });
                }
            }
        });
    });

    return Array.from(uniqueCourses.values());
};

// NEW: Get course history (all attempts)
courseGradeSchema.statics.getCourseHistory = async function (studentId, courseCode) {
    const semesters = await this.find({
        studentId,
        'courses.courseCode': courseCode
    }).sort({ year: 1, semester: 1 });

    const attempts = [];
    semesters.forEach(sem => {
        const course = sem.courses.find(c => c.courseCode === courseCode);
        if (course) {
            attempts.push({
                ...course.toObject(),
                semester: sem.semester,
                year: sem.year,
                semesterId: sem._id,
                semesterGPA: sem.semesterGPA
            });
        }
    });

    return attempts;
};

// NEW: Check for retakes before adding semester
courseGradeSchema.statics.checkForRetakes = async function (studentId, courses, semester, year) {
    const existingSemesters = await this.find({ studentId });
    const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
    const currentSemesterKey = (year * 10) + semesterOrder[semester];

    const retakes = [];
    const existingCourses = new Map();

    // Collect all existing courses
    existingSemesters.forEach(sem => {
        const semKey = (sem.year * 10) + semesterOrder[sem.semester];
        sem.courses.forEach(course => {
            const courseKey = course.courseCode.trim().toUpperCase();
            existingCourses.set(courseKey, {
                courseCode: course.courseCode,
                previousGrade: course.grade,
                previousSemester: sem.semester,
                previousYear: sem.year,
                semesterKey: semKey
            });
        });
    });

    // Check for retakes
    courses.forEach(newCourse => {
        const courseKey = newCourse.courseCode.trim().toUpperCase();
        if (existingCourses.has(courseKey)) {
            const existing = existingCourses.get(courseKey);

            // Only warn if the existing course is from a DIFFERENT semester
            // (same semester would be handled by semester uniqueness validation)
            retakes.push({
                courseCode: newCourse.courseCode,
                newGrade: newCourse.grade,
                previousGrade: existing.previousGrade,
                previousSemester: existing.previousSemester,
                previousYear: existing.previousYear,
                willReplace: currentSemesterKey > existing.semesterKey
            });
        }
    });

    return retakes;
};

module.exports = mongoose.model('CourseGrade', courseGradeSchema);