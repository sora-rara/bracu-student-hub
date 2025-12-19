// controllers/graduationController.js
const mongoose = require('mongoose');
const StudentProgress = require('../models/StudentProgress');
const Program = require('../models/Program');
const User = require('../models/User');
const CourseGrade = require('../models/CourseGrade');

// ==================== HELPER: GET USER ====================
const getUserId = async (req) => {
    console.log('🔍 Getting userId from:', {
        sessionId: req.sessionID?.slice(0, 10) + '...',
        sessionUserId: req.session?.userId,
        sessionEmail: req.session?.email,
        userInReq: req.user?.id,
        queryUserId: req.query?.userId
    });

    if (req.session?.userId) return req.session.userId;
    if (req.user?.id) return req.user.id;
    if (req.query?.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) return req.query.userId;
    return null;
};

// ==================== HELPER: UNIQUE COMPLETED COURSES & CREDITS ====================
function getCompletedCoursesSummary(progress) {
    const uniqueCourses = [];
    const seenCourses = new Set();
    let totalAttempted = 0;

    progress.completedCourses.forEach(course => {
        totalAttempted += course.credits || 0;
        if (!seenCourses.has(course.courseCode) && course.status === 'completed') {
            seenCourses.add(course.courseCode);
            uniqueCourses.push(course);
        }
    });

    const totalCreditsCompleted = uniqueCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
    const completedCourseCodes = new Set(uniqueCourses.map(c => c.courseCode));

    return { uniqueCourses, totalCreditsCompleted, totalCreditsAttempted: totalAttempted, completedCourseCodes };
}

// ==================== GRADUATION PLAN ====================
exports.initializePlan = async (req, res) => {
    try {
        const { program, admissionYear } = req.body;
        const userId = await getUserId(req);

        if (!userId) return res.status(401).json({
            success: false,
            error: 'Authentication required. Please log in first.',
            code: 'AUTH_REQUIRED',
            solution: 'Login at /api/auth/login or set session at /api/session-set-test',
            testHint: 'For testing: Add ?userId=6931fad682171c1a7eac5cb6 to URL'
        });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        const programData = await Program.findOne({ programCode: program });
        if (!programData) return res.status(400).json({ success: false, error: 'Program not found.' });

        let progress = await StudentProgress.findOne({ studentId: userId });

        if (progress) {
            progress.program = program;
            progress.department = programData.department;
            progress.admissionYear = admissionYear;
            progress.expectedGraduationYear = parseInt(admissionYear) + 4;
        } else {
            progress = new StudentProgress({
                studentId: userId,
                program,
                department: programData.department,
                admissionYear,
                expectedGraduationYear: parseInt(admissionYear) + 4,
                totalCreditsRequired: programData.totalCreditsRequired || 136
            });
        }

        await syncWithCourseGrades(userId, progress);
        await progress.save();

        res.json({
            success: true,
            message: 'Graduation plan initialized successfully',
            data: {
                userId,
                program,
                programName: programData.programName,
                admissionYear,
                expectedGraduation: progress.expectedGraduationYear,
                user: { name: user.name, email: user.email, role: user.role }
            }
        });
    } catch (error) {
        console.error('Initialize plan error:', error);
        res.status(500).json({ success: false, error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
};

// Get programs
exports.getPrograms = async (req, res) => {
    try {
        const programs = await Program.find({ active: true })
            .select('programCode programName department totalCreditsRequired')
            .sort('programCode');
        res.json({ success: true, data: programs });
    } catch (error) {
        console.error('Get programs error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Check program status
// Check program status - Updated
exports.checkProgramStatus = async (req, res) => {
    try {
        const userId = await getUserId(req);

        if (!userId) {
            return res.status(200).json({
                success: true,
                data: {
                    hasProgram: false,
                    programName: '',
                    needsProgram: true
                }
            });
        }

        const progress = await StudentProgress.findOne({ studentId: userId });

        if (!progress || !progress.program) {
            return res.status(200).json({
                success: true,
                data: {
                    hasProgram: false,
                    programName: '',
                    needsProgram: true
                }
            });
        }

        // Get program name
        const program = await Program.findOne({ programCode: progress.program });
        const programName = program ? program.programName : progress.program;

        res.status(200).json({
            success: true,
            data: {
                hasProgram: true,
                programName: programName,
                needsProgram: false
            }
        });

    } catch (error) {
        console.error('Error checking program status:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            needsProgram: true
        });
    }
};

// ==================== PROGRESS ====================
exports.getProgress = async (req, res) => {
    try {
        const userId = await getUserId(req);
        if (!userId) return res.json({
            success: true,
            data: {
                needsAuthentication: true,
                message: 'Please log in to view graduation progress',
                metrics: {
                    totalCreditsCompleted: 0,
                    totalCreditsAttempted: 0,
                    totalCreditsRequired: 136,
                    progressPercentage: 0,
                    completedCourses: 0,
                    cumulativeGPA: 0,
                    currentSemesterGPA: 0,
                    standing: 'Freshman',
                    currentSemester: 1
                }
            }
        });

        const progress = await StudentProgress.findOne({ studentId: userId });
        if (!progress) return res.json({
            success: true,
            data: {
                needsInitialization: true,
                message: 'No graduation plan found. Please initialize first.',
                hasPlan: false,
                userId,
                endpoints: { initialize: 'POST /api/graduation/initialize', programs: 'GET /api/graduation/programs' }
            }
        });

        const program = await Program.findOne({ programCode: progress.program });
        if (!program) return res.json({ success: true, data: { needsSeeder: true, message: 'Program data not found. Run seeder.', hasPlan: true, programCode: progress.program, userId } });

        const user = await User.findById(userId);
        const userGPA = user?.academicStats?.cumulativeCGPA || 0;
        const currentSemesterGPA = user?.academicStats?.currentSemesterGPA || 0;

        if (typeof progress.calculateProgress === 'function') {
            progress.calculateProgress();
            await progress.save();
        }

        const { uniqueCourses: uniqueCompletedCourses, totalCreditsCompleted, totalCreditsAttempted, completedCourseCodes } = getCompletedCoursesSummary(progress);

        // Completed credits per category
        const completedByCategory = {};
        const categories = ['gen-ed', 'school-core', 'program-core', 'program-elective', 'project-thesis'];

        categories.forEach(cat => {
            const catCourses = progress.completedCourses.filter(c => c.category === cat && c.status === 'completed');
            const uniqueCat = new Map();
            catCourses.forEach(c => { if (!uniqueCat.has(c.courseCode)) uniqueCat.set(c.courseCode, c); });

            const catCredits = Array.from(uniqueCat.values()).reduce((sum, c) => sum + (c.credits || 0), 0);
            const programCat = program?.requirements?.find(r => r.category === cat);
            const requiredCredits = programCat?.creditsRequired || 0;

            completedByCategory[cat] = {
                completed: uniqueCat.size,
                completedCredits: catCredits,
                requiredCredits,
                percentage: requiredCredits > 0 ? Math.min(100, (catCredits / requiredCredits) * 100) : 0
            };
        });

        const totalRequired = progress.totalCreditsRequired || 136;
        const progressPercentage = totalRequired > 0 ? Math.min(100, Math.round((totalCreditsCompleted / totalRequired) * 100)) : 0;

        const progressByCategory = {
            genEd: completedByCategory['gen-ed'] || { completed: 0, required: 0, percentage: 0 },
            schoolCore: completedByCategory['school-core'] || { completed: 0, required: 0, percentage: 0 },
            programCore: completedByCategory['program-core'] || { completed: 0, required: 0, percentage: 0 },
            programElective: completedByCategory['program-elective'] || { completed: 0, required: 0, percentage: 0 },
            projectThesis: completedByCategory['project-thesis'] || { completed: 0, required: 0, percentage: 0 }
        };

        res.json({
            success: true,
            data: {
                studentId: userId,
                program: program?.programName || progress.program,
                admissionYear: progress.admissionYear,
                expectedGraduationYear: progress.expectedGraduationYear,
                totalCreditsCompleted,
                totalCreditsAttempted,
                totalCreditsRequired: totalRequired,
                progressPercentage,
                progressByCategory,
                completedCourses: uniqueCompletedCourses,
                cumulativeGPA: userGPA,
                currentSemesterGPA,
                hasPlan: true
            }
        });

    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==================== REMAINING COURSES ====================
// ==================== REMAINING COURSES (Updated) ====================
// ==================== REMAINING COURSES (Updated - Returns ALL courses with status) ====================
exports.getRemainingCourses = async (req, res) => {
    try {
        const userId = await getUserId(req);

        // Check if user is authenticated
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
                needsProgram: true
            });
        }

        // Check if user has progress record
        const progress = await StudentProgress.findOne({ studentId: userId });
        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'Student progress not found',
                needsProgram: true
            });
        }

        // Check if program is selected
        if (!progress.program) {
            return res.status(400).json({
                success: false,
                error: 'No program selected',
                needsProgram: true
            });
        }

        // Get program requirements
        const program = await Program.findOne({ programCode: progress.program });
        if (!program) {
            return res.status(404).json({
                success: false,
                error: 'Program not found'
            });
        }

        // Get completed course codes and credits
        const completedCoursesMap = new Map();
        progress.completedCourses
            .filter(c => c.status === 'completed')
            .forEach(course => {
                completedCoursesMap.set(course.courseCode, {
                    ...course.toObject(),
                    isCompleted: true
                });
            });

        const completedCourseCodes = Array.from(completedCoursesMap.keys());
        console.log('📊 Completed courses found:', completedCourseCodes);

        // Calculate total credits completed
        const totalCreditsCompleted = Array.from(completedCoursesMap.values())
            .reduce((sum, course) => sum + (course.credits || 0), 0);

        const remainingCredits = Math.max(program.totalCreditsRequired - totalCreditsCompleted, 0);
        console.log('📈 Credits - Completed:', totalCreditsCompleted, 'Required:', program.totalCreditsRequired, 'Remaining:', remainingCredits);

        // Build ALL courses array (both completed and remaining)
        let allCourses = [];

        // First, add all completed courses
        completedCoursesMap.forEach(completedCourse => {
            allCourses.push({
                courseCode: completedCourse.courseCode,
                courseName: completedCourse.courseName || `${completedCourse.courseCode} Course`,
                credits: completedCourse.credits || 3,
                category: completedCourse.category,
                categoryName: getCategoryDisplayName(completedCourse.category),
                stream: completedCourse.stream || 'General',
                isRequired: true,
                prerequisites: [],
                hardPrerequisites: [],
                softPrerequisites: [],
                canTake: false, // Can't take if already completed
                isCompleted: true,
                missingHard: [],
                missingSoft: [],
                grade: completedCourse.grade,
                gp: completedCourse.gp,
                semester: completedCourse.semester,
                year: completedCourse.year,
                completedAt: completedCourse.completedAt,
                status: 'completed'
            });
        });

        console.log(`📋 Added ${allCourses.length} completed courses to the list`);

        // Then, add remaining courses from program requirements
        let remainingCoursesAdded = 0;
        program.requirements.forEach(requirementCategory => {
            const categoryName = requirementCategory.categoryName || requirementCategory.category;

            requirementCategory.courses.forEach(course => {
                // Skip if already added as completed
                if (completedCourseCodes.includes(course.courseCode)) {
                    return;
                }

                // Determine course status
                let canTake = true;

                // Check prerequisites
                const missingHard = (course.hardPrerequisites || [])
                    .filter(prereq => !completedCourseCodes.includes(prereq.courseCode))
                    .map(prereq => prereq.courseCode);

                const missingSoft = (course.softPrerequisites || [])
                    .filter(prereq => !completedCourseCodes.includes(prereq.courseCode))
                    .map(prereq => prereq.courseCode);

                // Course is blocked if missing hard prerequisites
                if (missingHard.length > 0) {
                    canTake = false;
                }

                // Prepare remaining course object
                const courseObj = {
                    courseCode: course.courseCode,
                    courseName: course.courseName || `${course.courseCode} Course`,
                    credits: course.credits || 3,
                    category: requirementCategory.category,
                    categoryName: categoryName,
                    stream: course.stream || 'General',
                    isRequired: course.isRequired !== false,
                    prerequisites: [
                        ...(course.hardPrerequisites || []),
                        ...(course.softPrerequisites || [])
                    ],
                    hardPrerequisites: course.hardPrerequisites || [],
                    softPrerequisites: course.softPrerequisites || [],
                    canTake: canTake,
                    isCompleted: false,
                    missingHard: missingHard,
                    missingSoft: missingSoft,
                    status: canTake ? 'available' : 'blocked'
                };

                allCourses.push(courseObj);
                remainingCoursesAdded++;
            });
        });

        console.log(`📋 Added ${remainingCoursesAdded} remaining courses to the list`);
        console.log(`📊 Total courses in response: ${allCourses.length}`);

        // Calculate statistics
        const totalCourses = allCourses.length;
        const completedCoursesCount = allCourses.filter(c => c.isCompleted).length;
        const availableCourses = allCourses.filter(c => c.canTake && !c.isCompleted).length;
        const blockedCourses = allCourses.filter(c => !c.canTake && !c.isCompleted).length;

        console.log('📊 Course Statistics:', {
            total: totalCourses,
            completed: completedCoursesCount,
            available: availableCourses,
            blocked: blockedCourses,
            creditsRemaining: remainingCredits
        });

        res.json({
            success: true,
            data: {
                remainingCourses: allCourses, // Now includes both completed and remaining
                remainingCredits: remainingCredits,
                totalCreditsRequired: program.totalCreditsRequired,
                totalCreditsCompleted: totalCreditsCompleted,
                stats: {
                    total: totalCourses,
                    completed: completedCoursesCount,
                    available: availableCourses,
                    blocked: blockedCourses
                }
            }
        });

    } catch (error) {
        console.error('❌ Get remaining courses error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Helper function to get display name for category
function getCategoryDisplayName(category) {
    const names = {
        'gen-ed': 'General Education',
        'school-core': 'School Core',
        'program-core': 'Program Core',
        'program-elective': 'Program Elective',
        'project-thesis': 'Project/Thesis'
    };
    return names[category] || category;
}

// ==================== GET COMPLETED COURSES ====================
exports.getCompletedCourses = async (req, res) => {
    try {
        const userId = await getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
                needsProgram: true
            });
        }

        const progress = await StudentProgress.findOne({ studentId: userId });

        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'Student progress not found',
                needsProgram: true
            });
        }

        // Check if program is selected
        if (!progress.program) {
            return res.status(400).json({
                success: false,
                error: 'No program selected',
                needsProgram: true
            });
        }

        // Get only completed courses
        const completedCourses = progress.completedCourses
            .filter(course => course.status === 'completed')
            .map(course => ({
                courseCode: course.courseCode,
                courseName: course.courseName,
                credits: course.credits,
                grade: course.grade,
                gp: course.gp,
                semester: course.semester,
                year: course.year,
                category: course.category,
                stream: course.stream,
                completedAt: course.completedAt,
                status: course.status
            }));

        res.status(200).json({
            success: true,
            data: {
                completedCourses: completedCourses,
                totalCompleted: completedCourses.length,
                totalCreditsCompleted: completedCourses.reduce((sum, course) => sum + (course.credits || 0), 0)
            }
        });

    } catch (error) {
        console.error('Error fetching completed courses:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// ==================== SYNC GRADES ====================
exports.syncGrades = async (req, res) => {
    try {
        const userId = await getUserId(req);
        if (!userId) return res.json({ success: false, needsAuthentication: true, message: 'Authentication required' });

        const progress = await StudentProgress.findOne({ studentId: userId });
        if (!progress) return res.json({ success: false, needsProgram: true, message: 'Please select program first' });

        await syncWithCourseGrades(userId, progress);

        const { totalCreditsCompleted, totalCreditsAttempted } = getCompletedCoursesSummary(progress);
        progress.totalCreditsCompleted = totalCreditsCompleted;
        progress.totalCreditsAttempted = totalCreditsAttempted;

        await progress.save();
        res.json({ success: true, message: 'Grades synced successfully', data: { totalCreditsCompleted, totalCreditsAttempted } });

    } catch (error) {
        console.error('Sync grades error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==================== ADD COMPLETED COURSE ====================
exports.addCompletedCourse = async (req, res) => {
    try {
        const userId = await getUserId(req);
        const courseData = req.body;
        if (!userId) return res.status(400).json({ success: false, error: 'Authentication required' });

        const progress = await StudentProgress.findOne({ studentId: userId });
        if (!progress) return res.status(404).json({ success: false, error: 'No graduation plan found' });

        const existingIndex = progress.completedCourses.findIndex(c => c.courseCode === courseData.courseCode);
        if (existingIndex >= 0) {
            progress.completedCourses[existingIndex] = { ...progress.completedCourses[existingIndex], ...courseData, status: 'completed', completedAt: new Date() };
        } else {
            progress.completedCourses.push({ ...courseData, status: 'completed', completedAt: new Date() });
        }

        const { totalCreditsCompleted, totalCreditsAttempted } = getCompletedCoursesSummary(progress);
        progress.totalCreditsCompleted = totalCreditsCompleted;
        progress.totalCreditsAttempted = totalCreditsAttempted;

        await progress.save();
        res.json({ success: true, message: 'Course added successfully', data: { course: courseData.courseCode, totalCreditsCompleted, totalCreditsAttempted } });

    } catch (error) {
        console.error('Add course error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==================== TIMELINE ====================
exports.getTimeline = async (req, res) => {
    try {
        const userId = await getUserId(req);
        if (!userId) return res.json({ success: true, data: { timeline: [], message: 'Authentication required', needsAuthentication: true } });

        const progress = await StudentProgress.findOne({ studentId: userId });
        if (!progress) return res.json({ success: true, data: { timeline: [], message: 'No graduation plan found', needsInitialization: true } });

        const admissionYear = parseInt(progress.admissionYear);
        const timeline = [];
        for (let year = admissionYear; year <= admissionYear + 3; year++) {
            timeline.push({ year, semesters: [{ name: `Spring ${year}`, courses: [] }, { name: `Summer ${year}`, courses: [] }, { name: `Fall ${year}`, courses: [] }] });
        }

        res.json({ success: true, data: timeline });

    } catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==================== CHECK PREREQUISITES ====================
exports.checkCoursePrerequisites = async (req, res) => {
    try {
        const userId = await getUserId(req);
        const { courseCode } = req.params;
        if (!userId) return res.json({ success: true, data: { met: false, missing: ['Authentication required'], message: 'Authentication required' } });

        const progress = await StudentProgress.findOne({ studentId: userId });
        if (!progress) return res.json({ success: true, data: { met: false, missing: ['No graduation plan found'], message: 'Initialize plan first' } });

        let result;
        if (typeof progress.checkPrerequisites === 'function') result = await progress.checkPrerequisites(courseCode);
        else {
            const completedCourseCodes = progress.completedCourses.filter(c => c.status === 'completed').map(c => c.courseCode);
            const program = await Program.findOne({ programCode: progress.program });
            let hardPrerequisites = [];
            if (program) {
                const courseData = program.requirements.flatMap(cat => cat.courses).find(c => c.courseCode === courseCode);
                hardPrerequisites = courseData?.hardPrerequisites || [];
            }
            const missingHard = hardPrerequisites.filter(pr => !completedCourseCodes.includes(pr.courseCode)).map(pr => pr.courseCode);
            result = { met: missingHard.length === 0, missing: missingHard, hardPrerequisites, softPrerequisites: [], missingHard, missingSoft: [], canTake: missingHard.length === 0 };
        }

        res.json({ success: true, data: result });

    } catch (error) {
        console.error('Check prerequisites error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==================== SYNC WITH COURSE GRADES ====================
async function syncWithCourseGrades(userId, progress) {
    const courseGrades = await CourseGrade.find({ studentId: userId });
    progress.completedCourses = [];

    for (const semester of courseGrades) {
        for (const course of semester.courses) {
            const category = determineCategory(course.courseCode, progress.program);
            const courseName = course.courseName || `${course.courseCode} Course`;

            progress.completedCourses.push({
                courseCode: course.courseCode,
                courseName,
                credits: course.creditHours || 3,
                grade: course.grade,
                gp: course.gradePoint,
                semester: semester.semester,
                year: semester.year,
                category,
                status: 'completed',
                completedAt: semester.createdAt || new Date()
            });
        }
    }
}

function determineCategory(courseCode, program) {
    const normalizedCode = courseCode.replace(/\s+/g, '');
    const genEdCourses = ['ENG091', 'ENG101', 'ENG102', 'ENG103', 'MAT092', 'MAT110', 'PHY111', 'STA201', 'CHE101', 'BIO101', 'ENV103', 'HUM103', 'BNG103', 'EMB101', 'DEV101'];
    const schoolCore = ['MAT120', 'MAT215', 'MAT216', 'PHY112'];
    const cseCore = ['CSE110', 'CSE111', 'CSE220', 'CSE221', 'CSE230', 'CSE250', 'CSE251', 'CSE260', 'CSE320', 'CSE321', 'CSE330', 'CSE331', 'CSE340', 'CSE341', 'CSE350', 'CSE360', 'CSE370', 'CSE400', 'CSE420', 'CSE421', 'CSE422', 'CSE423', 'CSE460', 'CSE461', 'CSE470', 'CSE471'];
    const csCore = ['CSE110', 'CSE111', 'CSE220', 'CSE221', 'CSE230', 'CSE260', 'CSE321', 'CSE330', 'CSE331', 'CSE340', 'CSE370', 'CSE420', 'CSE421', 'CSE422', 'CSE423', 'CSE470'];
    const projectThesis = ['CSE400'];

    if (genEdCourses.includes(normalizedCode)) return 'gen-ed';
    if (schoolCore.includes(normalizedCode)) return 'school-core';
    if (projectThesis.includes(normalizedCode)) return program === 'CS' ? 'project-thesis' : 'program-core';
    if (program === 'CSE' && cseCore.includes(normalizedCode)) return 'program-core';
    if (program === 'CS' && csCore.includes(normalizedCode)) return 'program-core';
    if (normalizedCode.startsWith('CSE') && normalizedCode.includes('___')) return 'program-elective';
    return normalizedCode.startsWith('CSE') ? 'program-elective' : 'gen-ed';
}

async function getProgramName(programCode) {
    const program = await Program.findOne({ programCode });
    return program?.programName || programCode;
}
