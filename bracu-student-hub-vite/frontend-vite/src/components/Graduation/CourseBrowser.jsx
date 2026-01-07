import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import semesterPlannerService from '../../services/semesterPlannerService';
import axios from '../../api/axios';

const CourseBrowser = forwardRef(({ onAddCourse, selectedSemesterId, disabled }, ref) => {
    const [filter, setFilter] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        blocked: 0,
        completed: 0,
        planned: 0
    });

    // Categories - same as RemainingCourses
    const categories = useMemo(() => [
        'all',
        'gen-ed',
        'school-core',
        'program-core',
        'program-elective',
        'project-thesis'
    ], []);

    const filters = useMemo(() => [
        { value: 'all', label: 'All Courses' },
        { value: 'available', label: 'Available (Prerequisites Met)' },
        { value: 'blocked', label: 'Blocked (Missing Prerequisites)' },
        { value: 'completed', label: 'Completed' },
        { value: 'planned', label: 'Planned' }
    ], []);

    // ================================
    // HELPER FUNCTIONS
    // ================================

    const normalizeCourseCode = useCallback((course) => {
        if (!course) return '';
        const rawCode = course.courseCode || course.code || course.course_id ||
            course.id || course.displayCode || course.course || '';
        return rawCode.toString().trim().toUpperCase().replace(/\s+/g, '');
    }, []);

    const formatCourseCode = useCallback((code) => {
        if (!code) return '';
        const normalized = code.replace(/\s+/g, '');
        if (normalized.match(/^[A-Z]{2,4}\d{3}[A-Z]?$/)) {
            return normalized.replace(/([A-Z]{2,4})(\d{3}[A-Z]?)/, '$1 $2');
        }
        return code;
    }, []);

    const getCategoryName = useCallback((category) => {
        const names = {
            'gen-ed': 'General Education',
            'school-core': 'School Core',
            'program-core': 'Program Core',
            'program-elective': 'Program Elective',
            'project-thesis': 'Project/Thesis'
        };
        return names[category] || category;
    }, []);

    // ================================
    // DATA FETCHING
    // ================================

    const fetchAllCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // 1. Fetch planned course codes
            let plannedCourseCodes = new Set();
            try {
                const planResponse = await axios.get('/api/semester-planner', {
                    timeout: 5000 // Shorter timeout
                });
                const planData = planResponse.data.data;

                if (planData?.plannedSemesters) {
                    planData.plannedSemesters.forEach(semester => {
                        semester.plannedCourses?.forEach(course => {
                            const code = normalizeCourseCode(course);
                            if (code) plannedCourseCodes.add(code);
                        });
                    });
                }
            } catch (planError) {
                console.warn('⚠️ Could not fetch plan data:', planError.message);
                // Continue without plan data - this is okay
            }

            // 2. Fetch remaining and completed courses with error handling
            let remainingCourses = [];
            let completedCourses = [];

            try {
                const remainingResponse = await axios.get('/api/graduation/courses/remaining', {
                    timeout: 10000
                });
                if (remainingResponse.data?.success) {
                    remainingCourses = remainingResponse.data.data?.remainingCourses || [];
                }
            } catch (remainingError) {
                console.warn('⚠️ Could not fetch remaining courses:', remainingError.message);
                // Continue with empty array
            }

            try {
                const completedResponse = await axios.get('/api/graduation/courses/completed', {
                    timeout: 10000
                });
                if (completedResponse.data?.success) {
                    completedCourses = completedResponse.data.data?.completedCourses || [];
                }
            } catch (completedError) {
                console.warn('⚠️ Could not fetch completed courses:', completedError.message);
                // Continue with empty array
            }

            console.log('📊 Course counts:', {
                remaining: remainingCourses.length,
                completed: completedCourses.length,
                planned: plannedCourseCodes.size
            });

            // 3. Process and merge courses
            const courseMap = new Map();

            // Process remaining courses first
            remainingCourses.forEach(course => {
                const code = normalizeCourseCode(course);
                if (!code) return;

                const processedCourse = {
                    ...course,
                    courseCode: code,
                    displayCode: formatCourseCode(code),
                    isCompleted: false,
                    isPlanned: plannedCourseCodes.has(code),
                    canTake: course.canTake || false,
                    missingPrerequisites: course.missingPrerequisites ||
                        course.prerequisitesStatus?.missingHard ||
                        course.prereqMissing ||
                        [],
                    courseName: course.courseName || course.name || course.title || 'Unnamed Course',
                    credits: course.credits || course.credit || 3,
                    category: course.category || course.type || 'uncategorized',
                    stream: course.stream || 'General'
                };

                courseMap.set(code, processedCourse);
            });

            // Process completed courses (they override remaining courses)
            completedCourses.forEach(course => {
                const code = normalizeCourseCode(course);
                if (!code) return;

                const processedCourse = {
                    ...course,
                    courseCode: code,
                    displayCode: formatCourseCode(code),
                    isCompleted: true,
                    isPlanned: plannedCourseCodes.has(code),
                    canTake: true, // Completed courses can be repeated
                    missingPrerequisites: [],
                    courseName: course.courseName || course.name || course.title || 'Unnamed Course',
                    credits: course.credits || course.credit || 3,
                    category: course.category || course.type || 'uncategorized',
                    stream: course.stream || 'General'
                };

                courseMap.set(code, processedCourse);
            });

            const finalCourses = Array.from(courseMap.values());

            // 4. Calculate statistics
            const total = finalCourses.length;
            const completed = finalCourses.filter(c => c.isCompleted).length;
            const planned = finalCourses.filter(c => c.isPlanned).length;
            const available = finalCourses.filter(c =>
                !c.isPlanned && (c.canTake || c.isCompleted)
            ).length;
            const blocked = finalCourses.filter(c =>
                !c.isPlanned && !c.isCompleted && !c.canTake
            ).length;

            // 5. Update state
            setAllCourses(finalCourses);
            setStats({ total, available, blocked, completed, planned });

            console.log('✅ Courses loaded successfully:', {
                total,
                completed,
                planned,
                available,
                blocked
            });

            // Debug: Check for duplicates
            const codes = finalCourses.map(c => c.courseCode);
            const uniqueCodes = [...new Set(codes)];
            if (codes.length !== uniqueCodes.length) {
                const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
                console.warn('⚠️ Found duplicates after processing:', [...new Set(duplicates)]);
            }

        } catch (err) {
            console.error('❌ Error in fetchAllCourses:', err);
            setError('Failed to load courses. Please try again.');

            // If all APIs fail, show an empty state with helpful message
            if (allCourses.length === 0) {
                setError('Cannot connect to server. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [normalizeCourseCode, formatCourseCode]);

    // Fetch all courses on mount
    useEffect(() => {
        fetchAllCourses();
    }, []); // Empty dependency array - fetch once on mount

    // Expose refresh function to parent via ref
    useImperativeHandle(ref, () => ({
        refreshCourses: fetchAllCourses
    }));

    // ================================
    // COURSE FILTERING & GROUPING
    // ================================

    const filteredCourses = useMemo(() => {
        return allCourses.filter(course => {
            // Filter by search
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesCode = course.courseCode?.toLowerCase().includes(searchLower);
                const matchesName = course.courseName?.toLowerCase().includes(searchLower);
                if (!matchesCode && !matchesName) return false;
            }

            // Filter by category
            if (selectedCategory !== 'all' && course.category !== selectedCategory) return false;

            // Filter by status
            switch (filter) {
                case 'available':
                    return !course.isPlanned && (course.canTake || course.isCompleted);
                case 'blocked':
                    return !course.isPlanned && !course.isCompleted && !course.canTake;
                case 'completed':
                    return course.isCompleted;
                case 'planned':
                    return course.isPlanned;
                default:
                    return true;
            }
        });
    }, [allCourses, search, selectedCategory, filter]);

    const groupedCourses = useMemo(() => {
        const byCategory = {};

        filteredCourses.forEach(course => {
            const cat = course.category || 'uncategorized';
            if (!byCategory[cat]) byCategory[cat] = {};

            const stream = course.stream || 'General';
            if (!byCategory[cat][stream]) byCategory[cat][stream] = [];

            byCategory[cat][stream].push(course);
        });

        return byCategory;
    }, [filteredCourses]);

    // ================================
    // EVENT HANDLERS
    // ================================

    const handleDragStart = useCallback((e, course) => {
        if (!course.canTake && !course.isCompleted) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData('course', JSON.stringify({
            courseCode: course.courseCode,
            isCompleted: course.isCompleted
        }));
    }, []);

    const handleQuickAdd = useCallback(async (course) => {
        try {
            if (!selectedSemesterId) {
                alert('Please select a semester first!');
                return;
            }

            let isRepeat = false;

            // Handle completed courses
            if (course.isCompleted) {
                const confirmRepeat = window.confirm(
                    `You have already completed ${course.courseCode}. Do you want to add it as a repeat course?`
                );
                if (!confirmRepeat) return;
                isRepeat = true;
            } else if (!course.canTake) {
                // For non-completed courses, check prerequisites
                const missingPrereqs = course.missingPrerequisites || ['Unknown prerequisites'];
                alert(`Cannot add ${course.courseCode}: Missing prerequisites - ${missingPrereqs.join(', ')}`);
                return;
            }

            // Validate course placement
            const validation = await semesterPlannerService.validateCoursePlacement(
                course.courseCode,
                selectedSemesterId
            );

            if (validation.warnings?.length > 0) {
                const warningMessages = validation.warnings.map(w =>
                    typeof w === 'object' && w.message ? w.message : String(w)
                );

                const proceed = window.confirm(
                    `Warnings:\n${warningMessages.join('\n')}\n\nDo you want to proceed anyway?`
                );

                if (!proceed) return;
            }

            onAddCourse(course.courseCode, isRepeat);

            // Refresh courses after a short delay
            setTimeout(fetchAllCourses, 500);

        } catch (error) {
            console.error('Error adding course:', error);
            alert('Failed to add course. Please try again.');
        }
    }, [selectedSemesterId, onAddCourse, fetchAllCourses]);

    const refreshCourses = useCallback(() => {
        fetchAllCourses();
    }, [fetchAllCourses]);

    // ================================
    // RENDER FUNCTIONS
    // ================================

    const renderCourseCard = useCallback((course) => {
        const canTake = course.canTake || course.isCompleted;
        const isBlocked = !course.isPlanned && !course.isCompleted && !course.canTake;
        const isRepeatable = course.isCompleted && !course.isPlanned;

        return (
            <div
                key={course.courseCode}
                className={`card mb-3 ${course.isPlanned ? 'border-primary bg-light' : ''} ${course.isCompleted ? 'border-success bg-light' : ''} ${isBlocked ? 'border-warning' : canTake ? 'border-success' : 'border-secondary'}`}
                draggable={!course.isPlanned && !disabled && canTake}
                onDragStart={(e) => handleDragStart(e, course)}
            >
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title mb-0">
                            {course.displayCode}
                            {course.isCompleted && (
                                <span className="badge bg-secondary ms-2">Completed</span>
                            )}
                            {course.isPlanned && (
                                <span className="badge bg-primary ms-2">Planned</span>
                            )}
                        </h6>
                        <span className="badge bg-dark">{course.credits || 3} cr</span>
                    </div>
                    <p className="card-text small mb-2">{course.courseName}</p>

                    {/* Course status badges */}
                    <div className="mb-3">
                        {course.isPlanned ? (
                            <span className="badge bg-primary">Planned</span>
                        ) : course.isCompleted ? (
                            <>
                                {isRepeatable ? (
                                    <span className="badge bg-info">Repeatable</span>
                                ) : (
                                    <span className="badge bg-secondary">Completed</span>
                                )}
                            </>
                        ) : !canTake ? (
                            <span className="badge bg-warning">Prerequisites Required</span>
                        ) : (
                            <span className="badge bg-success">Ready to Take</span>
                        )}
                        <span className="badge bg-light text-dark ms-2">
                            {course.category}
                        </span>
                    </div>

                    {/* Missing prerequisites warning */}
                    {isBlocked && course.missingPrerequisites && course.missingPrerequisites.length > 0 && (
                        <div className="alert alert-warning p-2 mb-2">
                            <small>
                                <strong>Missing prerequisites:</strong><br />
                                {Array.isArray(course.missingPrerequisites)
                                    ? course.missingPrerequisites.join(', ')
                                    : 'Unknown prerequisites'
                                }
                            </small>
                        </div>
                    )}

                    {/* Action button */}
                    {!course.isPlanned && !disabled && canTake && (
                        <button
                            className={`btn btn-sm w-100 ${course.isCompleted ? 'btn-info' : 'btn-success'}`}
                            onClick={() => handleQuickAdd(course)}
                            disabled={disabled}
                        >
                            {course.isCompleted ? '↻ Add as Repeat' : '+ Add to Selected Semester'}
                        </button>
                    )}

                    {!course.isPlanned && isBlocked && (
                        <button
                            className="btn btn-sm btn-outline-warning w-100"
                            disabled
                            title={`Missing prerequisites: ${course.missingPrerequisites?.join(', ') || 'unknown'}`}
                        >
                            Prerequisites Required
                        </button>
                    )}
                </div>
            </div>
        );
    }, [disabled, handleDragStart, handleQuickAdd]);

    const renderCoursesGrid = useMemo(() => {
        if (loading && filteredCourses.length === 0) {
            return (
                <div className="loading-container text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading courses...</p>
                </div>
            );
        }

        if (error && filteredCourses.length === 0) {
            return (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <h4>Connection Error</h4>
                        <p className="text-danger">{error}</p>
                        <button className="btn btn-primary mt-2" onClick={refreshCourses}>
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        if (filteredCourses.length === 0) {
            return (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <h4>No Courses Found</h4>
                        <p className="text-muted">
                            {selectedCategory === 'all' && filter === 'all'
                                ? "No courses found for your program."
                                : "No courses match your current filters."}
                        </p>
                        <button className="btn btn-primary mt-2" onClick={() => {
                            setSelectedCategory('all');
                            setFilter('all');
                            setSearch('');
                        }}>
                            View All Courses
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="courses-sections">
                {Object.entries(groupedCourses).map(([category, streams]) => (
                    <div key={category} className="category-section mb-4">
                        <h4>{getCategoryName(category)}</h4>
                        {Object.entries(streams).map(([stream, courses]) => (
                            <div key={`${category}-${stream}`} className="stream-section mb-3">
                                {stream !== 'General' && <h5>{stream}</h5>}
                                <div className="courses-grid">
                                    {courses.map(renderCourseCard)}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }, [loading, error, filteredCourses, groupedCourses, selectedCategory, filter, getCategoryName, renderCourseCard, refreshCourses]);

    // ================================
    // MAIN RENDER
    // ================================

    return (
        <div className="course-browser">
            <div className="browser-header mb-3">
                <h5>Course Browser</h5>
                <div className="d-flex">
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-control"
                        disabled={loading}
                    />
                    <button
                        className="btn btn-outline-secondary ms-2"
                        onClick={refreshCourses}
                        disabled={loading}
                    >
                        🔄 Refresh
                    </button>
                </div>
                {loading && (
                    <div className="mt-2">
                        <small className="text-muted">Loading all courses...</small>
                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                )}
            </div>

            {error && !loading && (
                <div className="alert alert-danger alert-dismissible fade show mb-3">
                    {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError('')}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid mb-4">
                {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title">{value}</h5>
                            <p className="card-text small">
                                {key === 'available' ? 'Available Now*' :
                                    key === 'blocked' ? 'Needs Prerequisites' :
                                        key.charAt(0).toUpperCase() + key.slice(1)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="filters-grid mb-4">
                <div>
                    <label className="form-label">Filter by Category</label>
                    <div className="filter-buttons-grid">
                        {categories.map(category => (
                            <button
                                key={category}
                                type="button"
                                className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setSelectedCategory(category)}
                                disabled={loading}
                            >
                                {category === 'all' ? 'All' : getCategoryName(category)}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="form-label">Filter by Status</label>
                    <div className="filter-buttons-grid">
                        {filters.map(filterItem => (
                            <button
                                key={filterItem.value}
                                type="button"
                                className={`btn btn-sm ${filter === filterItem.value ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setFilter(filterItem.value)}
                                disabled={loading}
                            >
                                {filterItem.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            {renderCoursesGrid}
        </div>
    );
});

export default CourseBrowser;