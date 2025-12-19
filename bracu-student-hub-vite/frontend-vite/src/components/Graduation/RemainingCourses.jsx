// src/components/GraduationPlanner/RemainingCourses.jsx
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import CourseCard from './CourseCard';
import ProgramSelectionModal from './ProgramSelectionModal';

const RemainingCourses = () => {
    const [allCourses, setAllCourses] = useState([]); // Changed from remainingCourses to allCourses
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filterBy, setFilterBy] = useState('all');
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [hasProgram, setHasProgram] = useState(false);
    const [programName, setProgramName] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        blocked: 0,
        completed: 0,
        creditsRemaining: 0
    });

    const categories = [
        'all',
        'gen-ed',
        'school-core',
        'program-core',
        'program-elective',
        'project-thesis'
    ];

    const filters = [
        { value: 'all', label: 'All Courses' },
        { value: 'available', label: 'Available (Prerequisites Met)' },
        { value: 'blocked', label: 'Blocked (Missing Prerequisites)' },
        { value: 'completed', label: 'Completed' }
    ];

    useEffect(() => {
        checkProgramStatus();
    }, []);

    const checkProgramStatus = async () => {
        try {
            const response = await axios.get('/api/graduation/check-status');
            console.log('🔍 Program status response:', response.data);

            if (response.data.success) {
                setHasProgram(response.data.data.hasProgram);
                setProgramName(response.data.data.programName || '');
                if (!response.data.data.hasProgram) {
                    setShowProgramModal(true);
                } else {
                    fetchAllCourses(); // Changed from fetchRemainingCourses
                }
            }
        } catch (err) {
            console.error('Error checking program status:', err);
        }
    };

    const fetchAllCourses = async () => {
        try {
            setLoading(true);
            console.log('📡 Fetching all courses...');
            const response = await axios.get('/api/graduation/courses/remaining');

            console.log('✅ API Response:', response.data);

            if (response.data.success) {
                const courses = response.data.data.remainingCourses.map(course => ({
                    ...course,
                    displayCode: formatCourseCode(course.courseCode),
                    // Ensure isCompleted is properly set from backend
                    isCompleted: course.isCompleted || false,
                    // For completed courses, canTake should be false
                    canTake: course.isCompleted ? false : course.canTake
                }));

                setAllCourses(courses);
                console.log('📋 Courses loaded:', courses.length);
                console.log('✅ Completed courses:', courses.filter(c => c.isCompleted).length);

                // Use stats from backend if available
                if (response.data.data.stats) {
                    setStats({
                        total: response.data.data.stats.total || 0,
                        available: response.data.data.stats.available || 0,
                        blocked: response.data.data.stats.blocked || 0,
                        completed: response.data.data.stats.completed || 0,
                        creditsRemaining: response.data.data.remainingCredits || 0
                    });
                } else {
                    // Fallback calculation
                    const total = courses.length;
                    const completed = courses.filter(c => c.isCompleted).length;
                    const available = courses.filter(c => c.canTake && !c.isCompleted).length;
                    const blocked = courses.filter(c => !c.canTake && !c.isCompleted).length;
                    const creditsRemaining = response.data.data.remainingCredits || 0;

                    setStats({ total, available, blocked, completed, creditsRemaining });
                }
            } else {
                if (response.data.needsProgram) setShowProgramModal(true);
                setError(response.data.message || 'Failed to load courses');
            }
        } catch (err) {
            console.error('❌ Error loading courses:', err);
            if (err.response?.status === 404 && err.response?.data?.needsProgram) {
                setShowProgramModal(true);
            }
            setError(err.response?.data?.error || 'Error loading courses');
        } finally {
            setLoading(false);
        }
    };

    const formatCourseCode = (code) => {
        if (!code) return '';
        if (code.match(/^[A-Z]{3}\d{3}$/)) {
            return code.replace(/([A-Z]{3})(\d{3})/, '$1 $2');
        }
        return code;
    };

    const handleProgramSelected = () => {
        setHasProgram(true);
        setShowProgramModal(false);
        fetchAllCourses(); // Changed from fetchRemainingCourses
    };

    const getCategoryName = (category) => {
        const names = {
            'gen-ed': 'General Education',
            'school-core': 'School Core',
            'program-core': 'Program Core',
            'program-elective': 'Program Elective',
            'project-thesis': 'Project/Thesis'
        };
        return names[category] || category;
    };

    // Filter courses based on selected filters
    const filteredCourses = allCourses.filter(course => {
        // Filter by category
        if (selectedCategory !== 'all' && course.category !== selectedCategory) return false;

        // Filter by availability/completion
        if (filterBy === 'available' && (!course.canTake || course.isCompleted)) return false;
        if (filterBy === 'blocked' && (course.canTake || course.isCompleted)) return false;
        if (filterBy === 'completed' && !course.isCompleted) return false;

        return true;
    });

    // Group courses by category → stream
    const groupedCourses = () => {
        const byCategory = {};

        filteredCourses.forEach(course => {
            const cat = course.category || 'uncategorized';
            if (!byCategory[cat]) byCategory[cat] = {};

            const stream = course.stream || 'General';
            if (!byCategory[cat][stream]) byCategory[cat][stream] = [];

            byCategory[cat][stream].push(course);
        });

        return byCategory;
    };

    if (loading) {
        return (
            <div className="loading-container text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading courses...</p>
            </div>
        );
    }

    return (
        <div className="remaining-courses">
            <ProgramSelectionModal
                isOpen={showProgramModal}
                onClose={() => setShowProgramModal(false)}
                onProgramSelected={handleProgramSelected}
            />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>All Courses</h2>
                    {hasProgram && programName && (
                        <p className="text-muted mb-0">
                            Program: <strong>{programName}</strong>
                            <button
                                className="btn btn-sm btn-outline-secondary ms-3"
                                onClick={() => setShowProgramModal(true)}
                            >
                                Change Program
                            </button>
                        </p>
                    )}
                </div>
                {!hasProgram && !showProgramModal && (
                    <button className="btn btn-primary" onClick={() => setShowProgramModal(true)}>
                        Select Your Program
                    </button>
                )}
            </div>

            {error && !showProgramModal && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {hasProgram && (
                <>
                    {/* Legend */}
                    <div className="legend-card-wrapper mb-4">
                        <div className="legend-card">
                            <h6>Legend:</h6>
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex align-items-center">
                                    <span className="badge bg-primary-light me-2">Available</span>
                                    <small>Prerequisites met, ready to take</small>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className="badge bg-primary-dark me-2">Blocked</span>
                                    <small>Missing hard prerequisites</small>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className="badge bg-primary me-2">Warning</span>
                                    <small>Missing soft prerequisites</small>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className="badge bg-primary-lightest me-2">Completed</span>
                                    <small>Course already completed</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid mb-4">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="card-title">{stats.total}</h3>
                                <p className="card-text">Total Courses</p>
                            </div>
                        </div>
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="card-title">{stats.completed}</h3>
                                <p className="card-text">Completed</p>
                            </div>
                        </div>
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="card-title">{stats.available}</h3>
                                <p className="card-text">Available Now</p>
                            </div>
                        </div>
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="card-title">{stats.blocked}</h3>
                                <p className="card-text">Needs Prerequisites</p>
                            </div>
                        </div>
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="card-title">{stats.creditsRemaining}</h3>
                                <p className="card-text">Credits Remaining</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters-grid mb-4">
                        <div>
                            <label>Filter by Category</label>
                            <div className="filter-buttons-grid">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        type="button"
                                        className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category === 'all' ? 'All' : getCategoryName(category)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label>Filter by Status</label>
                            <div className="filter-buttons-grid">
                                {filters.map(filter => (
                                    <button
                                        key={filter.value}
                                        type="button"
                                        className={`btn ${filterBy === filter.value ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setFilterBy(filter.value)}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Debug info - Remove in production */}
                    <div className="alert alert-info mb-4">
                        <small>
                            <strong>Debug Info:</strong> Showing {filteredCourses.length} of {allCourses.length} total courses.
                            Completed: {stats.completed}, Available: {stats.available}, Blocked: {stats.blocked}
                        </small>
                    </div>

                    {/* Courses grouped by category and stream */}
                    {filteredCourses.length === 0 ? (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <h4>No Matches found</h4>
                                <p className="text-muted">
                                    {selectedCategory === 'all' && filterBy === 'all'
                                        ? "No courses found for your program."
                                        : "No courses match your current filters."}
                                </p>
                                <button className="btn btn-primary mt-2" onClick={() => {
                                    setSelectedCategory('all');
                                    setFilterBy('all');
                                }}>
                                    View All Courses
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="courses-sections">
                            {Object.entries(groupedCourses()).map(([category, streams]) => (
                                <div key={category} className="category-section mb-4">
                                    <h4>{getCategoryName(category)}</h4>
                                    {Object.entries(streams).map(([stream, courses]) => (
                                        <div key={stream} className="stream-section mb-3">
                                            <h5>{stream}</h5>
                                            <div className="courses-grid">
                                                {courses.map((course, index) => (
                                                    <CourseCard
                                                        key={index}
                                                        course={course}
                                                        onUpdate={fetchAllCourses}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RemainingCourses;