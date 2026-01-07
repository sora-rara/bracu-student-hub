const express = require('express');
const router = express.Router();
const SemesterPlan = require('../models/SemesterPlan');
const StudentProgress = require('../models/StudentProgress');
const Program = require('../models/Program');
const courseCatalogService = require('../services/courseCatalogService');

// Get current semester plan
// ✅ ONLY ONE GET / ROUTE - Remove the duplicate!
router.get('/', async (req, res) => {
    try {
        console.log('🎓 GET /api/semester-planner - User ID:', req.session?.userId || req.user?.id);

        const userId = req.session.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get active plan (or create default)
        let plan = await SemesterPlan.getActivePlan(userId);

        if (!plan) {
            // Get student's program info
            const progress = await StudentProgress.findOne({ studentId: userId });

            if (!progress || !progress.program) {
                return res.status(400).json({
                    success: false,
                    message: 'Please set up your graduation program first',
                    redirectTo: '/graduation'
                });
            }

            plan = new SemesterPlan({
                studentId: userId,
                program: progress.program,
                admissionYear: progress.admissionYear,
                planName: 'My Graduation Plan',
                isActive: true,
                plannedSemesters: []
            });

            await plan.save();
        }

        // ✅ Resolve course details from catalog
        for (const semester of plan.plannedSemesters) {
            const resolvedCourses = await courseCatalogService.resolvePlannedCourses(
                semester.plannedCourses
            );

            semester._resolvedCourses = resolvedCourses;
            semester._totalCredits = resolvedCourses.reduce(
                (sum, course) => sum + (course.resolvedDetails?.credits || 3),
                0
            );
        }

        // ✅ Compute warnings dynamically
        const warnings = await plan.computeWarnings();
        plan._computedWarnings = warnings;

        // ✅ Calculate timeline if needed
        if (!plan.graduationTimeline ||
            Date.now() - plan.lastCalculatedAt > 24 * 60 * 60 * 1000) {
            await plan.calculateTimeline();
            await plan.save();
        }

        res.json({
            success: true,
            data: plan,
            warnings: warnings,
            metadata: {
                creditsResolved: true,
                warningsComputed: true,
                timelineCalculated: true
            }
        });
    } catch (error) {
        console.error('❌ Error fetching semester plan:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Enhanced POST endpoint for adding courses
router.post('/:semesterId/courses', async (req, res) => {
    try {
        const { semesterId } = req.params;
        const { courseCode, isRepeat } = req.body; // ✅ Only accept courseCode, not full course object
        const userId = req.session.userId || req.user?.id;

        // Validate course exists in catalog
        const courseDetails = await courseCatalogService.getCourseDetails(courseCode);

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Course ${courseCode} not found in program catalog`
            });
        }

        const plan = await SemesterPlan.getActivePlan(userId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Active plan not found'
            });
        }

        // Find semester
        const semester = plan.plannedSemesters.id(semesterId);

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        // Check if already planned
        const alreadyExists = semester.plannedCourses.some(
            c => c.courseCode === courseCode
        );

        if (alreadyExists) {
            return res.status(400).json({
                success: false,
                message: 'Course already planned in this semester'
            });
        }

        // ✅ For repeat courses, check if completed first
        if (isRepeat) {
            const progress = await StudentProgress.findOne({ studentId: userId });
            const isCompleted = progress?.completedCourses?.some(
                c => c.courseCode === courseCode && c.status === 'completed'
            );

            if (!isCompleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot mark as repeat: course not yet completed'
                });
            }
        }

        // Add minimal course data
        semester.plannedCourses.push({
            courseCode,
            isRepeat: !!isRepeat,
            addedAt: new Date()
        });

        plan.lastCalculatedAt = new Date();
        await plan.save();

        // Return with resolved details
        const addedCourse = semester.plannedCourses[semester.plannedCourses.length - 1];
        const resolved = await courseCatalogService.resolvePlannedCourses([addedCourse]);

        res.json({
            success: true,
            message: 'Course added successfully',
            data: {
                ...addedCourse.toObject(),
                resolvedDetails: resolved[0]?.resolvedDetails
            }
        });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// New endpoint: Create plan version
router.post('/new-version', async (req, res) => {
    try {
        const userId = req.session.userId || req.user?.id;
        const { planName, description } = req.body;

        const newPlan = await SemesterPlan.createNewVersion(userId, {
            planName: planName || 'Updated Plan',
            metadata: {
                ...req.body.metadata,
                createdFrom: 'manual'
            }
        });

        if (!newPlan) {
            return res.status(400).json({
                success: false,
                message: 'No active plan found to version'
            });
        }

        res.json({
            success: true,
            message: 'New plan version created',
            data: newPlan
        });
    } catch (error) {
        console.error('Error creating new version:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Save/update semester plan
router.post('/', async (req, res) => {
    try {
        const userId = req.session.userId || req.user?.id;
        const { plannedSemesters } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        let plan = await SemesterPlan.findOne({ studentId: userId });

        if (!plan) {
            plan = new SemesterPlan({ studentId: userId });
        }

        // Validate and save
        plan.plannedSemesters = plannedSemesters;
        plan.lastUpdated = new Date();

        // Calculate timeline projection
        await plan.calculateTimeline();

        await plan.save();

        res.json({
            success: true,
            message: 'Plan saved successfully',
            data: plan
        });
    } catch (error) {
        console.error('Error saving semester plan:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add course to semester
router.post('/:semesterId/courses', async (req, res) => {
    try {
        const { semesterId } = req.params;
        const { course } = req.body;
        const userId = req.session.userId || req.user?.id;

        const plan = await SemesterPlan.findOne({ studentId: userId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Find semester and add course
        const semester = plan.plannedSemesters.id(semesterId);

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        // Check if course already planned in this semester
        const alreadyExists = semester.plannedCourses.some(
            c => c.courseCode === course.courseCode
        );

        if (alreadyExists) {
            return res.status(400).json({
                success: false,
                message: 'Course already planned in this semester'
            });
        }

        // Add course
        semester.plannedCourses.push({
            ...course,
            addedAt: new Date()
        });

        await plan.save();

        res.json({
            success: true,
            message: 'Course added successfully',
            data: semester
        });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove course from semester
router.delete('/:semesterId/courses/:courseCode', async (req, res) => {
    try {
        const { semesterId, courseCode } = req.params;
        const userId = req.session.userId || req.user?.id;

        const plan = await SemesterPlan.findOne({ studentId: userId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        const semester = plan.plannedSemesters.id(semesterId);

        if (!semester) {
            return res.status(404).json({
                success: false,
                message: 'Semester not found'
            });
        }

        // Remove course
        semester.plannedCourses = semester.plannedCourses.filter(
            course => course.courseCode !== courseCode
        );

        await plan.save();

        res.json({
            success: true,
            message: 'Course removed successfully'
        });
    } catch (error) {
        console.error('Error removing course:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper: Enrich plan with prerequisite info
async function enrichPlanWithPrerequisites(plan) {
    const progress = await StudentProgress.findOne({ studentId: plan.studentId });
    const completedCourses = progress?.completedCourses || [];
    const completedCourseCodes = completedCourses
        .filter(c => c.status === 'completed')
        .map(c => c.courseCode);

    // Add prerequisite warnings to each planned course
    const program = await Program.findOne({ programCode: plan.program });

    if (program) {
        plan.plannedSemesters.forEach(semester => {
            semester.plannedCourses.forEach(course => {
                const prereqs = program.getPrerequisitesForCourse(course.courseCode);

                // Check which prerequisites are met
                const missingHard = prereqs.hardPrerequisites.filter(
                    prereq => !completedCourseCodes.includes(prereq.courseCode)
                );

                const missingSoft = prereqs.softPrerequisites.filter(
                    prereq => !completedCourseCodes.includes(prereq.courseCode)
                );

                course.prerequisiteStatus = {
                    met: missingHard.length === 0,
                    missingHard: missingHard.map(p => p.courseCode),
                    missingSoft: missingSoft.map(p => p.courseCode)
                };
            });
        });
    }

    return plan;
}

module.exports = router;