import axios from '../api/axios';

const semesterPlannerService = {
    // Get active plan with resolved courses
    getPlan: async () => {
        try {
            const response = await axios.get('/api/semester-planner');

            // Post-process: attach resolved credits to courses
            if (response.data.success && response.data.data) {
                const plan = response.data.data;

                plan.plannedSemesters.forEach(semester => {
                    // Use resolved credits from backend
                    semester.totalCredits = semester._totalCredits || 0;

                    semester.plannedCourses.forEach(course => {
                        // Find resolved details
                        const resolved = semester._resolvedCourses?.find(
                            rc => rc.courseCode === course.courseCode
                        );

                        if (resolved?.resolvedDetails) {
                            course.resolvedDetails = resolved.resolvedDetails;
                            course.credits = resolved.resolvedDetails.credits;
                        } else {
                            course.credits = 3; // Default fallback
                        }
                    });
                });
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Add course by code only (not full object)
    addCourseToSemester: async (semesterId, courseCode, isRepeat = false) => {
        try {
            const response = await axios.post(
                `/api/semester-planner/${semesterId}/courses`,
                { courseCode, isRepeat }
            );
            return response.data;
        } catch (error) {
            // Handle repeat confirmation in UI, not here
            throw error.response?.data || error;
        }
    },

    // Save complete plan
    savePlan: async (plannedSemesters) => {
        try {
            const response = await axios.post('/api/semester-planner', {
                plannedSemesters
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete semester
    deleteSemester: async (semesterId) => {
        try {
            const response = await axios.delete(`/api/semester-planner/semesters/${semesterId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create confirmation modal for repeats (UI responsibility)
    confirmRepeatCourse: (courseCode) => {
        return new Promise((resolve) => {
            const userConfirmed = window.confirm(
                `⚠️ ${courseCode} is already completed.\n\n` +
                `Planning it again means you intend to repeat it to improve your grade.\n\n` +
                `Do you want to continue?`
            );
            resolve(userConfirmed);
        });
    },

    // Validate course placement with credit load checking
    // Validate course placement with credit load checking
    validateCoursePlacement: async (courseCode, semesterId) => {
        try {
            const warnings = [];

            // Get prerequisite info (using existing endpoint)
            try {
                const prereqResponse = await axios.get(`/api/graduation/courses/${courseCode}/prerequisites`);

                if (prereqResponse.data.success) {
                    const prereqs = prereqResponse.data.data;

                    // Hard prerequisites
                    if (prereqs.missingHard && prereqs.missingHard.length > 0) {
                        warnings.push({
                            type: 'missing_hard_prereq',
                            message: `Missing hard prerequisites: ${prereqs.missingHard.join(', ')}`,
                            severity: 'high'
                        });
                    }

                    // Soft prerequisites
                    if (prereqs.missingSoft && prereqs.missingSoft.length > 0) {
                        warnings.push({
                            type: 'missing_soft_prereq',
                            message: `Missing recommended prerequisites: ${prereqs.missingSoft.join(', ')}`,
                            severity: 'medium'
                        });
                    }
                }
            } catch (prereqError) {
                console.warn(`Could not fetch prerequisites for ${courseCode}:`, prereqError.message);
                // Don't fail validation if prerequisites can't be checked
            }

            // Check if course is already completed
            try {
                const progressResponse = await axios.get('/api/graduation/progress');
                if (progressResponse.data.success && progressResponse.data.data) {
                    const isCompleted = progressResponse.data.data.completedCourses?.some(
                        course => course.courseCode === courseCode && course.status === 'completed'
                    );

                    if (isCompleted) {
                        warnings.push({
                            type: 'repeat_course',
                            message: 'Course already completed - marking as repeat',
                            severity: 'medium'
                        });
                    }
                }
            } catch (progressError) {
                console.warn('Could not fetch progress:', progressError.message);
            }

            // Check credit load for the semester
            if (semesterId && semesterId !== 'next-semester') {
                try {
                    const planResponse = await axios.get('/api/semester-planner');
                    if (planResponse.data.success && planResponse.data.data) {
                        const semester = planResponse.data.data.plannedSemesters?.find(s =>
                            s._id === semesterId || s.id === semesterId
                        );

                        if (semester) {
                            // Calculate current credits using resolved credits if available
                            let currentCredits = semester._totalCredits || 0;

                            // Fallback: count planned courses * 3 credits
                            if (currentCredits === 0 && semester.plannedCourses) {
                                currentCredits = semester.plannedCourses.length * 3;
                            }

                            // Use default 3 credits for new course
                            const courseCredits = 3; // Default fallback

                            if (currentCredits + courseCredits > semester.creditLimit + 3) {
                                warnings.push({
                                    type: 'heavy_overload',
                                    message: `Adding this course would create heavy overload (${currentCredits + courseCredits} credits, limit: ${semester.creditLimit})`,
                                    severity: 'high'
                                });
                            } else if (currentCredits + courseCredits > semester.creditLimit) {
                                warnings.push({
                                    type: 'light_overload',
                                    message: `Adding this course would create slight overload (${currentCredits + courseCredits} credits, limit: ${semester.creditLimit})`,
                                    severity: 'medium'
                                });
                            }
                        }
                    }
                } catch (planError) {
                    console.warn('Could not fetch plan for credit validation:', planError.message);
                }
            }

            return {
                warnings,
                canAdd: warnings.filter(w => w.severity === 'high').length === 0
            };
        } catch (error) {
            console.error('Validation error:', error);
            return { warnings: [], canAdd: true }; // Allow if validation fails
        }
    },

    // Get course details
    // Get course details (fallback version since details endpoint doesn't exist)
    getCourseDetails: async (courseCode) => {
        try {
            // Try to get course info from remaining courses first
            const remainingResponse = await axios.get('/api/graduation/courses/remaining');

            if (remainingResponse.data.success && remainingResponse.data.data?.remainingCourses) {
                const course = remainingResponse.data.data.remainingCourses.find(
                    c => c.courseCode === courseCode
                );

                if (course) {
                    return {
                        courseCode: course.courseCode,
                        credits: course.credits || 3,
                        courseName: course.courseName || `${courseCode} Course`,
                        category: course.category || 'program-core'
                    };
                }
            }

            // Fallback: Use prerequisites endpoint
            const prereqResponse = await axios.get(`/api/graduation/courses/${courseCode}/prerequisites`);

            if (prereqResponse.data.success) {
                const prereqData = prereqResponse.data.data;
                return {
                    courseCode,
                    credits: prereqData.credits || 3,
                    courseName: prereqData.courseName || `${courseCode} Course`,
                    category: prereqData.category || 'program-core',
                    isCompleted: prereqData.isCompleted || false
                };
            }

            // Ultimate fallback
            return {
                courseCode,
                credits: 3,
                courseName: `${courseCode} Course`,
                category: 'program-core'
            };
        } catch (error) {
            console.warn(`Course details not found for ${courseCode}:`, error.message);
            return {
                courseCode,
                credits: 3,
                courseName: `${courseCode} Course`,
                category: 'program-core'
            };
        }
    },

    // Get semester by ID
    getSemesterById: async (semesterId) => {
        try {
            const response = await axios.get('/api/semester-planner');
            if (response.data.success && response.data.data) {
                return response.data.data.plannedSemesters?.find(s =>
                    s._id === semesterId || s.id === semesterId
                );
            }
            return null;
        } catch (error) {
            console.error('Error fetching semester:', error);
            return null;
        }
    },

    // Check if course can be added to semester
    canAddCourseToSemester: async (courseCode, semesterId) => {
        try {
            const [courseDetails, semester] = await Promise.all([
                semesterPlannerService.getCourseDetails(courseCode),
                semesterPlannerService.getSemesterById(semesterId)
            ]);

            if (!semester) return { canAdd: false, reason: 'Semester not found' };

            // Check if already in semester
            const alreadyPlanned = semester.plannedCourses?.some(
                course => course.courseCode === courseCode
            );

            if (alreadyPlanned) {
                return { canAdd: false, reason: 'Course already planned in this semester' };
            }

            // Check credit limit
            const currentCredits = semester.plannedCourses?.reduce((sum, course) =>
                sum + (course.credits || 3), 0
            ) || 0;

            const courseCredits = courseDetails?.credits || 3;

            if (currentCredits + courseCredits > semester.creditLimit) {
                return {
                    canAdd: false,
                    reason: `Would exceed credit limit (${currentCredits + courseCredits} > ${semester.creditLimit})`
                };
            }

            return { canAdd: true };
        } catch (error) {
            console.error('Error checking course addition:', error);
            return { canAdd: false, reason: 'Error checking requirements' };
        }
    },

    // Get warnings for semester
    getSemesterWarnings: async (semesterId) => {
        try {
            const semester = await semesterPlannerService.getSemesterById(semesterId);
            if (!semester) return [];

            const warnings = [];
            const currentCredits = semester.plannedCourses?.reduce((sum, course) =>
                sum + (course.credits || 3), 0
            ) || 0;

            // Credit overload warning
            if (currentCredits > semester.creditLimit + 3) {
                warnings.push({
                    type: 'heavy_overload',
                    message: `Heavy credit overload: ${currentCredits} credits (limit: ${semester.creditLimit})`,
                    severity: 'high'
                });
            } else if (currentCredits > semester.creditLimit) {
                warnings.push({
                    type: 'light_overload',
                    message: `Slight credit overload: ${currentCredits} credits (limit: ${semester.creditLimit})`,
                    severity: 'medium'
                });
            }

            return warnings;
        } catch (error) {
            console.error('Error getting semester warnings:', error);
            return [];
        }
    },

    // Remove course from semester
    removeCourseFromSemester: async (semesterId, courseCode) => {
        try {
            const response = await axios.delete(
                `/api/semester-planner/${semesterId}/courses/${courseCode}`
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update semester
    updateSemester: async (semesterId, updates) => {
        try {
            const response = await axios.put(
                `/api/semester-planner/semesters/${semesterId}`,
                updates
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create new semester
    createSemester: async (semesterData) => {
        try {
            const response = await axios.post(
                '/api/semester-planner/semesters',
                semesterData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get all semesters for current user
    getAllSemesters: async () => {
        try {
            const response = await axios.get('/api/semester-planner');
            if (response.data.success) {
                return response.data.data?.plannedSemesters || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching semesters:', error);
            return [];
        }
    },

    // Sort semesters chronologically
    sortSemestersChronologically: (semesters) => {
        const seasonOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };

        return [...semesters].sort((a, b) => {
            const aKey = (a.year * 10) + (seasonOrder[a.season] || 0);
            const bKey = (b.year * 10) + (seasonOrder[b.season] || 0);
            return aKey - bKey; // Ascending order (earliest first)
        });
    }
};

export default semesterPlannerService;