const mongoose = require('mongoose');

const plannedCourseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        index: true
    },
    isRepeat: {
        type: Boolean,
        default: false
    },
    originalGrade: {
        type: String
    },
    notes: {
        type: String,
        maxlength: 200
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const plannedSemesterSchema = new mongoose.Schema({
    semesterName: {
        type: String,
        required: true
    },
    semesterNumber: {
        type: Number,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    season: {
        type: String,
        enum: ['Spring', 'Summer', 'Fall'],
        required: true
    },
    creditLimit: {
        type: Number,
        default: 12,
        min: 3,
        max: 21
    },
    plannedCourses: [plannedCourseSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total credits (will be populated by backend)
plannedSemesterSchema.virtual('totalCredits').get(function () {
    return this._totalCredits || 0;
});

// Virtual for warnings (computed, not stored)
plannedSemesterSchema.virtual('warnings').get(function () {
    return this._warnings || [];
});

const semesterPlanSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    planName: {
        type: String,
        default: 'Main Plan',
        maxlength: 50
    },
    program: {
        type: String,
        required: true
    },
    admissionYear: {
        type: Number
    },
    plannedSemesters: [plannedSemesterSchema],

    // Graduation timeline (computed, advisory only)
    graduationTimeline: {
        estimatedGraduationSemester: String,
        estimatedGraduationYear: Number,
        totalRemainingSemesters: Number,
        bottleneckCourses: [String],
        calculationMethod: {
            type: String,
            enum: ['optimistic', 'conservative', 'custom'],
            default: 'optimistic'
        }
    },

    // Version control for historical plans
    version: {
        type: Number,
        default: 1
    },
    previousVersionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SemesterPlan'
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    isDraft: {
        type: Boolean,
        default: false
    },
    lastCalculatedAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        coursesResolvedAt: Date,
        prerequisitesValidatedAt: Date,
        creditsValidatedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index for active plan lookup
semesterPlanSchema.index({ studentId: 1, isActive: 1 });

// Helper function: Get course catalog from Program model
async function getCourseCatalog() {
    try {
        const Program = mongoose.model('Program');
        const programs = await Program.find({ active: true });

        // Build a flat catalog of all courses
        const catalog = {};

        programs.forEach(program => {
            program.requirements?.forEach(requirement => {
                requirement.courses?.forEach(course => {
                    if (course.courseCode) {
                        catalog[course.courseCode] = {
                            courseCode: course.courseCode,
                            courseName: course.courseName || `${course.courseCode} Course`,
                            credits: course.credits || 3,
                            category: course.category || requirement.category,
                            hardPrerequisites: course.hardPrerequisites || [],
                            softPrerequisites: course.softPrerequisites || [],
                            isRequired: course.isRequired !== false,
                            program: program.programCode
                        };
                    }
                });
            });
        });

        return catalog;
    } catch (error) {
        console.error('Error fetching course catalog:', error);
        return {};
    }
}

// Helper function: Check prerequisites for a course
async function checkPrerequisitesForCourse(courseCode, studentId, semesterNumber) {
    try {
        const Program = mongoose.model('Program');
        const StudentProgress = mongoose.model('StudentProgress');

        // Get student's completed courses
        const progress = await StudentProgress.findOne({ studentId });
        const completedCourses = progress?.completedCourses?.filter(c => c.status === 'completed') || [];
        const completedCourseCodes = new Set(completedCourses.map(c => c.courseCode));

        // Get all planned courses in earlier semesters
        const earlierPlannedCourses = new Set();
        const plan = await mongoose.model('SemesterPlan').findOne({ studentId, isActive: true });

        if (plan) {
            plan.plannedSemesters.forEach(semester => {
                if (semester.semesterNumber < semesterNumber) {
                    semester.plannedCourses.forEach(course => {
                        earlierPlannedCourses.add(course.courseCode);
                    });
                }
            });
        }

        // Find course in program to get prerequisites
        const program = await Program.findOne({ programCode: progress?.program || 'CSE' });
        let hardPrerequisites = [];
        let softPrerequisites = [];

        if (program) {
            for (const requirement of program.requirements || []) {
                const course = requirement.courses?.find(c => c.courseCode === courseCode);
                if (course) {
                    hardPrerequisites = course.hardPrerequisites || [];
                    softPrerequisites = course.softPrerequisites || [];
                    break;
                }
            }
        }

        // Check which prerequisites are met
        const missingHard = hardPrerequisites
            .filter(prereq =>
                !completedCourseCodes.has(prereq.courseCode) &&
                !earlierPlannedCourses.has(prereq.courseCode)
            )
            .map(prereq => prereq.courseCode);

        const missingSoft = softPrerequisites
            .filter(prereq =>
                !completedCourseCodes.has(prereq.courseCode) &&
                !earlierPlannedCourses.has(prereq.courseCode)
            )
            .map(prereq => prereq.courseCode);

        return {
            met: missingHard.length === 0,
            missingHard,
            missingSoft,
            hardPrerequisites,
            softPrerequisites,
            canTake: missingHard.length === 0
        };
    } catch (error) {
        console.error('Error checking prerequisites:', error);
        return {
            met: false,
            missingHard: [],
            missingSoft: [],
            hardPrerequisites: [],
            softPrerequisites: [],
            canTake: false
        };
    }
}

// Helper function: Identify bottleneck courses
async function identifyBottleneckCourses(plan) {
    try {
        const StudentProgress = mongoose.model('StudentProgress');
        const Program = mongoose.model('Program');

        const progress = await StudentProgress.findOne({ studentId: plan.studentId });
        const program = await Program.findOne({ programCode: plan.program });

        if (!progress || !program) {
            return [];
        }

        // Build comprehensive course database
        const courseDatabase = new Map();
        program.requirements.forEach(requirement => {
            requirement.courses.forEach(course => {
                courseDatabase.set(course.courseCode, {
                    courseCode: course.courseCode,
                    credits: course.credits || 3,
                    isRequired: course.isRequired !== false,
                    category: requirement.category || 'General',
                    hardPrerequisites: course.hardPrerequisites || [],
                    softPrerequisites: course.softPrerequisites || []
                });
            });
        });

        // Get completed courses
        const completedCourses = progress.completedCourses
            .filter(c => c.status === 'completed')
            .map(c => c.courseCode);
        const completedSet = new Set(completedCourses);

        // Get planned courses
        const plannedCourses = new Set();
        plan.plannedSemesters.forEach(semester => {
            semester.plannedCourses.forEach(course => {
                plannedCourses.add(course.courseCode);
            });
        });

        // Get remaining courses (not completed only)
        const remainingCourses = Array.from(courseDatabase.values()).filter(course =>
            !completedSet.has(course.courseCode)
        );

        if (remainingCourses.length === 0) {
            return [];
        }

        // Calculate bottleneck scores
        const bottleneckScores = new Map();
        const bottleneckReasons = new Map();

        remainingCourses.forEach(course => {
            const { score, reasons } = calculateBottleneckScore(
                course,
                completedSet,
                plannedCourses,
                courseDatabase
            );

            if (score > 0) {
                const cappedScore = Math.min(score, 40);
                bottleneckScores.set(course.courseCode, cappedScore);
                bottleneckReasons.set(course.courseCode, reasons);
            }
        });

        // Sort by score and return top 5 - BUT ONLY COURSE CODES
        const sortedBottlenecks = Array.from(bottleneckScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // ✅ FIX: Return just course codes, not objects
        return sortedBottlenecks.map(([courseCode]) => courseCode);
    } catch (error) {
        console.error('Error identifying bottleneck courses:', error);
        return [];
    }
}

// Helper: Calculate score for a single course with reasons
function calculateBottleneckScore(course, completedSet, plannedCourses, courseDatabase) {
    let score = 0;
    const reasons = [];

    // 1. Check direct prerequisites
    const unmetHardPrereqs = course.hardPrerequisites.filter(prereq =>
        !completedSet.has(prereq.courseCode) && !plannedCourses.has(prereq.courseCode)
    );

    const unmetSoftPrereqs = course.softPrerequisites.filter(prereq =>
        !completedSet.has(prereq.courseCode) && !plannedCourses.has(prereq.courseCode)
    );

    // 2. Base score on prerequisites
    if (unmetHardPrereqs.length > 0) {
        score += 15;
        score += unmetHardPrereqs.length * 3;
        reasons.push(`Missing ${unmetHardPrereqs.length} hard prerequisite(s)`);
    }

    if (unmetSoftPrereqs.length > 0) {
        score += 5;
        score += unmetSoftPrereqs.length;
        reasons.push(`Missing ${unmetSoftPrereqs.length} recommended prerequisite(s)`);
    }

    // 3. Course characteristics
    if (course.isRequired) {
        score += 8;
        reasons.push('Required course');
    }

    // 4. Credit-based weight
    const creditWeight = Math.min(course.credits, 4);
    score += creditWeight;
    if (creditWeight > 3) {
        reasons.push('High-credit course');
    }

    // 5. Course pattern weights
    const coursePatternWeights = {
        'MAT 2': 4,
        'CSE 2': 3,
        'CSE 3': 3,
        'PHY 1': 2,
        'CHE 1': 2,
        'ENG 3': 1
    };

    for (const [pattern, weight] of Object.entries(coursePatternWeights)) {
        if (course.courseCode.includes(pattern)) {
            score += weight;
            reasons.push(`Critical ${pattern} sequence course`);
            break;
        }
    }

    // 6. Check if this course is a prerequisite for many others
    const blocksCount = countHardPrerequisiteBlockedCourses(
        course.courseCode,
        courseDatabase,
        completedSet,
        plannedCourses
    );

    if (blocksCount > 0) {
        const blockPoints = Math.min(blocksCount * 2, 10);
        score += blockPoints;
        reasons.push(`Prerequisite for ${blocksCount} other course(s)`);
    }

    // 7. Category-based importance
    const categoryWeights = {
        'Program Core': 3,
        'Major Core': 2,
        'University Core': 1
    };

    if (categoryWeights[course.category]) {
        score += categoryWeights[course.category];
        reasons.push(`${course.category} requirement`);
    }

    return { score, reasons };
}

// Helper: Count only hard prerequisite blocking
function countHardPrerequisiteBlockedCourses(courseCode, courseDatabase, completedSet, plannedCourses) {
    let count = 0;

    for (const [otherCourseCode, otherCourse] of courseDatabase.entries()) {
        // Skip if already completed or planned
        if (completedSet.has(otherCourseCode) || plannedCourses.has(otherCourseCode)) {
            continue;
        }

        const isHardPrereq = otherCourse.hardPrerequisites.some(prereq =>
            prereq.courseCode === courseCode
        );

        if (isHardPrereq) {
            count++;
        }
    }

    return count;
}

// Helper: Calculate score for a single course with reasons
function calculateBottleneckScore(course, completedSet, plannedCourses, courseDatabase) {
    let score = 0;
    const reasons = [];

    // 1. Check direct prerequisites
    const unmetHardPrereqs = course.hardPrerequisites.filter(prereq =>
        !completedSet.has(prereq.courseCode) && !plannedCourses.has(prereq.courseCode)
    );

    const unmetSoftPrereqs = course.softPrerequisites.filter(prereq =>
        !completedSet.has(prereq.courseCode) && !plannedCourses.has(prereq.courseCode)
    );

    // 2. Base score on prerequisites
    if (unmetHardPrereqs.length > 0) {
        // High penalty for missing hard prerequisites
        score += 15;
        score += unmetHardPrereqs.length * 3;
        reasons.push(`Missing ${unmetHardPrereqs.length} hard prerequisite(s)`);
    }

    if (unmetSoftPrereqs.length > 0) {
        // Moderate penalty for missing soft prerequisites
        score += 5;
        score += unmetSoftPrereqs.length;
        reasons.push(`Missing ${unmetSoftPrereqs.length} recommended prerequisite(s)`);
    }

    // 3. Course characteristics
    if (course.isRequired) {
        score += 8; // Required courses are more critical
        reasons.push('Required course');
    }

    // 4. Credit-based weight (more credits = more important)
    const creditWeight = Math.min(course.credits, 4);
    score += creditWeight;
    if (creditWeight > 3) {
        reasons.push('High-credit course');
    }

    // ✅ FIX 4: Use configurable institution-specific patterns with clear documentation
    const coursePatternWeights = {
        // Heuristic weights (BRAC University CSE program specific)
        'MAT 2': 4, // Advanced mathematics courses
        'CSE 2': 3, // Core computer science courses
        'CSE 3': 3, // Advanced computer science courses
        'PHY 1': 2, // Physics courses
        'CHE 1': 2, // Chemistry courses
        'ENG 3': 1  // Advanced English courses
    };

    let patternMatched = false;
    for (const [pattern, weight] of Object.entries(coursePatternWeights)) {
        if (course.courseCode.includes(pattern)) {
            score += weight;
            reasons.push(`Critical ${pattern} sequence course`);
            patternMatched = true;
            break; // Only match first pattern
        }
    }

    // 6. Check if this course is a prerequisite for many others
    // ✅ FIX 5: Only count hard prerequisites for blocking effect
    const blocksCount = countHardPrerequisiteBlockedCourses(
        course.courseCode,
        courseDatabase,
        completedSet,
        plannedCourses
    );

    if (blocksCount > 0) {
        const blockPoints = Math.min(blocksCount * 2, 10);
        score += blockPoints;
        reasons.push(`Prerequisite for ${blocksCount} other course(s)`);
    }

    // 7. Category-based importance
    const categoryWeights = {
        'Program Core': 3,
        'Major Core': 2,
        'University Core': 1
    };

    if (categoryWeights[course.category]) {
        score += categoryWeights[course.category];
        reasons.push(`${course.category} requirement`);
    }

    return { score, reasons };
}

// ✅ FIX 6: Count only hard prerequisite blocking
function countHardPrerequisiteBlockedCourses(courseCode, courseDatabase, completedSet, plannedCourses) {
    let count = 0;

    for (const [otherCourseCode, otherCourse] of courseDatabase.entries()) {
        // Skip if already completed or planned
        if (completedSet.has(otherCourseCode) || plannedCourses.has(otherCourseCode)) {
            continue;
        }

        // ✅ Only count HARD prerequisites for blocking effect
        const isHardPrereq = otherCourse.hardPrerequisites.some(prereq =>
            prereq.courseCode === courseCode
        );

        if (isHardPrereq) {
            count++;
        }
    }

    return count;
}

// Optional: Enhanced version for UI display
function formatBottleneckWarning(bottleneck) {
    const { courseCode, score, reasons } = bottleneck;
    const mainReason = reasons.length > 0 ? reasons[0] : 'Course may delay progress';
    return `${courseCode} - ${mainReason} (Priority: ${score}/40)`;
}

// Helper function: Get semester name from offset
// Helper function: Get semester name from offset
function getSemesterName(semesterOffset, includeCurrent = true) {
    const seasons = ['Spring', 'Summer', 'Fall'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Determine current season (0: Spring, 1: Summer, 2: Fall)
    let currentSeason = 2; // Default to Fall
    if (currentMonth >= 1 && currentMonth <= 4) currentSeason = 0; // Spring: Jan-Apr
    else if (currentMonth >= 5 && currentMonth <= 8) currentSeason = 1; // Summer: May-Aug

    // If includeCurrent is false and we're in the middle of a semester, start from next
    const startOffset = includeCurrent ? 0 : 1;

    // Calculate future semester
    const totalOffset = currentSeason + startOffset + semesterOffset;
    const year = currentYear + Math.floor(totalOffset / 3);
    const season = seasons[totalOffset % 3];

    return `${season} ${year}`;
}

// Instance method to compute warnings dynamically
semesterPlanSchema.methods.computeWarnings = async function () {
    const warnings = [];

    try {
        const catalog = await getCourseCatalog();

        for (const semester of this.plannedSemesters) {
            // Calculate total credits for this semester
            let semesterCredits = 0;
            const semesterCourses = [];

            for (const course of semester.plannedCourses) {
                const courseDetails = catalog[course.courseCode];
                if (courseDetails) {
                    semesterCredits += courseDetails.credits || 3;
                    semesterCourses.push(courseDetails);
                }
            }

            // 1. Credit overload warning
            semester._totalCredits = semesterCredits;

            if (semesterCredits > semester.creditLimit + 3) {
                warnings.push({
                    type: 'heavy_overload',
                    semesterId: semester._id,
                    semesterName: semester.semesterName,
                    message: `Heavy overload in ${semester.semesterName}: ${semesterCredits} credits (limit: ${semester.creditLimit})`
                });
            } else if (semesterCredits > semester.creditLimit) {
                warnings.push({
                    type: 'light_overload',
                    semesterId: semester._id,
                    semesterName: semester.semesterName,
                    message: `Slight overload in ${semester.semesterName}: ${semesterCredits} credits (limit: ${semester.creditLimit})`
                });
            }

            // 2. Prerequisite warnings (dynamic check)
            for (const course of semester.plannedCourses) {
                const prereqStatus = await checkPrerequisitesForCourse(
                    course.courseCode,
                    this.studentId,
                    semester.semesterNumber
                );

                if (prereqStatus.missingHard.length > 0) {
                    warnings.push({
                        type: 'missing_hard_prereq',
                        semesterId: semester._id,
                        semesterName: semester.semesterName,
                        courseCode: course.courseCode,
                        message: `${course.courseCode} missing hard prerequisites: ${prereqStatus.missingHard.join(', ')}`
                    });
                }

                // Add soft prerequisite warnings too
                if (prereqStatus.missingSoft.length > 0) {
                    warnings.push({
                        type: 'missing_soft_prereq',
                        semesterId: semester._id,
                        semesterName: semester.semesterName,
                        courseCode: course.courseCode,
                        message: `${course.courseCode} missing recommended prerequisites: ${prereqStatus.missingSoft.join(', ')}`
                    });
                }

                // 3. Repeat course warning
                if (course.isRepeat) {
                    warnings.push({
                        type: 'repeat_course',
                        semesterId: semester._id,
                        semesterName: semester.semesterName,
                        courseCode: course.courseCode,
                        message: `${course.courseCode} is planned as a repeat course`
                    });
                }
            }

            // Store computed credits as virtual property
            semester._totalCredits = semesterCredits;
            semester._warnings = warnings.filter(w => w.semesterId?.toString() === semester._id.toString());
        }

        // Store warnings as virtual property (not in DB)
        this._computedWarnings = warnings;
        return warnings;
    } catch (error) {
        console.error('Error computing warnings:', error);
        return [];
    }
};

// Instance method to calculate graduation timeline
// Instance method to calculate graduation timeline
semesterPlanSchema.methods.calculateTimeline = async function () {
    try {
        const studentProgress = await mongoose.model('StudentProgress')
            .findOne({ studentId: this.studentId });

        const program = await mongoose.model('Program')
            .findOne({ programCode: this.program });

        if (!studentProgress || !program) {
            this.graduationTimeline = {
                estimatedGraduationSemester: 'Unknown',
                estimatedGraduationYear: null,
                totalRemainingSemesters: 0,
                bottleneckCourses: [],
                calculationMethod: 'unknown',
                lastCalculatedAt: new Date()
            };
            return this.graduationTimeline;
        }

        // Get course catalog for credit calculations
        const catalog = await getCourseCatalog();

        // 1. Calculate NON-REPEAT credits in planned semesters
        let totalNonRepeatPlannedCredits = 0;
        let totalPlannedCreditsForLoad = 0; // Includes repeats for workload calculation

        this.plannedSemesters.forEach(semester => {
            semester.plannedCourses.forEach(course => {
                const courseDetails = catalog[course.courseCode];
                const credits = courseDetails?.credits || 3;

                // For workload calculation (all courses)
                totalPlannedCreditsForLoad += credits;

                // For degree requirement satisfaction (exclude repeats)
                if (!course.isRepeat) {
                    totalNonRepeatPlannedCredits += credits;
                }
            });
        });

        // 2. Calculate total completed credits
        const completedCredits = studentProgress.totalCreditsCompleted || 0;

        // 3. Calculate credits still needed after planned courses
        // Note: Repeats do NOT reduce required credits
        const creditsStillNeeded = Math.max(0,
            program.totalCreditsRequired -
            completedCredits -
            totalNonRepeatPlannedCredits
        );

        // 4. Calculate average credit load based on ACTUAL planned credits
        const totalPlannedSemesters = this.plannedSemesters.length;
        let averagePlannedCreditsPerSemester = 12; // Default fallback

        if (totalPlannedSemesters > 0) {
            // Use ACTUAL planned credits, not credit limits
            averagePlannedCreditsPerSemester =
                totalPlannedCreditsForLoad / totalPlannedSemesters;

            // ⚠️ FIXED: Guard against division by zero or unrealistic low averages
            if (averagePlannedCreditsPerSemester < 3) {
                averagePlannedCreditsPerSemester = 12;
            }
        }

        // 5. Calculate additional semesters needed for remaining credits
        const additionalSemestersNeeded = Math.ceil(
            creditsStillNeeded / averagePlannedCreditsPerSemester
        );

        // 6. Calculate TOTAL remaining semesters (planned + additional)
        const totalRemainingSemesters = totalPlannedSemesters + additionalSemestersNeeded;

        // 7. **CRITICAL FIX: Anchor graduation to last planned semester**
        let graduationYear, graduationSemester;
        let lastPlannedSemester = null;

        if (totalPlannedSemesters > 0) {
            // Find the last planned semester chronologically
            lastPlannedSemester = this.plannedSemesters.reduce((latest, current) => {
                // Compare by year and season order
                const seasonOrder = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
                const currentScore = (current.year * 10) + seasonOrder[current.season];
                const latestScore = (latest.year * 10) + seasonOrder[latest.season];
                return currentScore > latestScore ? current : latest;
            }, this.plannedSemesters[0]);

            // ⚠️ FIXED: Clarify graduation timing
            // Graduation occurs IN the semester when final requirements are met
            // If all requirements are met in planned semesters, graduate in last planned semester
            // If additional semesters are needed, graduate after those additional semesters
            if (additionalSemestersNeeded === 0) {
                // All requirements will be met within planned semesters
                graduationYear = lastPlannedSemester.year;
                graduationSemester = lastPlannedSemester.season;
            } else {
                // Need additional semesters beyond planned ones
                const lastSeasonIndex = { 'Spring': 0, 'Summer': 1, 'Fall': 2 }[lastPlannedSemester.season];
                const totalFromLast = additionalSemestersNeeded; // No +1, count from last planned semester

                const totalSeasonsFromLast = lastSeasonIndex + totalFromLast;
                const yearsToAdd = Math.floor(totalSeasonsFromLast / 3);
                const seasonIndex = totalSeasonsFromLast % 3;

                graduationYear = lastPlannedSemester.year + yearsToAdd;
                const seasons = ['Spring', 'Summer', 'Fall'];
                graduationSemester = seasons[seasonIndex];
            }
        } else {
            // No planned semesters - calculate from current date
            lastPlannedSemester = null;
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();

            // Determine current season
            let currentSeason = 2; // Default to Fall
            if (currentMonth >= 1 && currentMonth <= 4) currentSeason = 0; // Spring: Jan-Apr
            else if (currentMonth >= 5 && currentMonth <= 8) currentSeason = 1; // Summer: May-Aug

            // Calculate future semester
            const totalSeasonsFromNow = currentSeason + totalRemainingSemesters;
            const yearsToAdd = Math.floor(totalSeasonsFromNow / 3);
            const seasonIndex = totalSeasonsFromNow % 3;

            graduationYear = currentYear + yearsToAdd;
            const seasons = ['Spring', 'Summer', 'Fall'];
            graduationSemester = seasons[seasonIndex];
        }

        // 8. Get bottleneck courses (advisory only - doesn't affect timeline)
        const bottleneckCourses = await identifyBottleneckCourses(this);

        // 9. Build the timeline
        this.graduationTimeline = {
            estimatedGraduationSemester: graduationSemester,
            estimatedGraduationYear: graduationYear,
            totalRemainingSemesters: totalRemainingSemesters,
            bottleneckCourses: bottleneckCourses,
            calculationMethod: 'optimistic',
            assumptions: [
                'Continuous semester availability (Spring, Summer, Fall)',
                'Average credit load based on current planning patterns',
                'No prerequisites prevent planned course completion',
                'Repeat courses count toward workload but not degree requirements',
                'Graduation occurs in the semester when final requirements are met',
                'Planning assumes successful course completion'
            ],
            lastCalculatedAt: new Date(),

            // Enhanced metadata for transparency
            metadata: {
                // Degree progress
                programTotalCredits: program.totalCreditsRequired,
                creditsCompleted: completedCredits,
                creditsPlannedNonRepeat: totalNonRepeatPlannedCredits,
                creditsPlannedTotal: totalPlannedCreditsForLoad,
                creditsStillNeeded: creditsStillNeeded,

                // Time calculations
                plannedSemesters: totalPlannedSemesters,
                additionalSemestersNeeded: additionalSemestersNeeded,
                averagePlannedLoad: Number(averagePlannedCreditsPerSemester.toFixed(1)),

                // Anchor information
                graduationAnchor: totalPlannedSemesters > 0 ?
                    'Last planned semester' : 'Current date',
                lastPlannedSemester: lastPlannedSemester ?
                    `${lastPlannedSemester.season} ${lastPlannedSemester.year}` : 'None',

                // Timing clarification
                graduationOccursInSemester: additionalSemestersNeeded === 0 ?
                    'Last planned semester' : `${additionalSemestersNeeded} semester(s) after last planned`
            }
        };

        this.lastCalculatedAt = new Date();
        return this.graduationTimeline;
    } catch (error) {
        console.error('Error calculating timeline:', error);

        // Return a default timeline on error with transparency
        this.graduationTimeline = {
            estimatedGraduationSemester: 'Unknown',
            estimatedGraduationYear: null,
            totalRemainingSemesters: 0,
            bottleneckCourses: [],
            calculationMethod: 'error',
            error: error.message.substring(0, 100), // Truncate for safety
            assumptions: [
                'Could not calculate due to error'
            ],
            lastCalculatedAt: new Date()
        };

        return this.graduationTimeline;
    }
};

// Static method to get active plan
semesterPlanSchema.statics.getActivePlan = async function (studentId) {
    return this.findOne({
        studentId,
        isActive: true
    }).sort({ version: -1 });
};

// Static method to create new version
semesterPlanSchema.statics.createNewVersion = async function (studentId, updates) {
    const currentPlan = await this.getActivePlan(studentId);

    if (currentPlan) {
        // Archive current plan
        currentPlan.isActive = false;
        await currentPlan.save();

        // Create new version
        const newPlan = new this({
            ...currentPlan.toObject(),
            ...updates,
            _id: new mongoose.Types.ObjectId(),
            version: currentPlan.version + 1,
            previousVersionId: currentPlan._id,
            isActive: true,
            isDraft: false
        });

        delete newPlan.graduationTimeline; // Force recalculation
        delete newPlan.lastCalculatedAt;
        delete newPlan._computedWarnings; // Clear computed warnings

        await newPlan.save();
        return newPlan;
    }

    return null;
};

// Instance method to populate course details
semesterPlanSchema.methods.populateCourseDetails = async function () {
    const catalog = await getCourseCatalog();

    this.plannedSemesters.forEach(semester => {
        semester.plannedCourses.forEach(course => {
            const details = catalog[course.courseCode];
            if (details) {
                course._details = details;
            }
        });
    });

    return this;
};

module.exports = mongoose.model('SemesterPlan', semesterPlanSchema);