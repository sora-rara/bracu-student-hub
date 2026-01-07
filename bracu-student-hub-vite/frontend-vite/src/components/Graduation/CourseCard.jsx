// src/components/GraduationPlanner/CourseCard.jsx
import React, { useState, useEffect } from 'react';
import graduationService from '../../services/graduationService';

const CourseCard = ({ course, showActions = true, onToggleComplete, onUpdate }) => {
    const [prerequisites, setPrerequisites] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isLocallyCompleted, setIsLocallyCompleted] = useState(course.isCompleted || false);

    // Sync with parent's course data
    useEffect(() => {
        setIsLocallyCompleted(course.isCompleted || false);
    }, [course.isCompleted]);

    useEffect(() => {
        if (course.courseCode) fetchPrerequisites();
    }, [course.courseCode]);

    const fetchPrerequisites = async () => {
        try {
            setLoading(true);
            const response = await graduationService.checkPrerequisites(course.courseCode);
            if (response.success) setPrerequisites(response.data);
        } catch (err) {
            console.error('Error fetching prerequisites:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCompleteClick = async () => {
        const newCompletedState = !isLocallyCompleted;
        setIsLocallyCompleted(newCompletedState);

        // Notify parent component
        if (onToggleComplete) {
            onToggleComplete(course.courseCode, newCompletedState);
        }

        // Optionally update backend
        try {
            // If you have an API endpoint to mark courses as completed
            // await axios.post(`/api/courses/${course.courseCode}/complete`, {
            //     completed: newCompletedState
            // });

            // Refresh prerequisites if needed
            if (onUpdate) {
                setTimeout(onUpdate, 100);
            }
        } catch (err) {
            console.error('Error updating completion status:', err);
            // Revert on error
            setIsLocallyCompleted(!newCompletedState);
        }
    };

    const formatCourseCode = (code) => {
        if (!code) return '';
        if (code.match(/^[A-Z]{3}\d{3}$/)) return code.replace(/([A-Z]{3})(\d{3})/, '$1 $2');
        return code;
    };

    const getStatusBadge = () => {
        // Use local completion state
        const isCompleted = isLocallyCompleted;
        const canTake = Boolean(course.canTake) || isCompleted; // Completed courses are repeatable

        if (isCompleted) {
            return <span className="badge bg-primary-lightest">Completed</span>;
        }
        if (course.status === 'ongoing') return <span className="badge bg-primary">Ongoing</span>;
        if (!canTake) return <span className="badge bg-primary-dark">Blocked</span>;
        if (canTake) return <span className="badge bg-primary-light">Available</span>;
        return <span className="badge bg-primary">Not Started</span>;
    };

    const getCategoryBadge = () => {
        const categories = {
            'gen-ed': { label: 'Gen Ed', color: 'primary-light' },
            'school-core': { label: 'School Core', color: 'primary' },
            'program-core': { label: 'Program Core', color: 'primary-dark' },
            'program-elective': { label: 'Elective', color: 'primary-lightest' },
            'project-thesis': { label: 'Project', color: 'primary' }
        };

        const cat = categories[course.category] || { label: course.category, color: 'primary' };

        switch (cat.color) {
            case 'primary-light':
                return <span className="badge bg-primary-light">{cat.label}</span>;
            case 'primary-dark':
                return <span className="badge bg-primary-dark">{cat.label}</span>;
            case 'primary-lightest':
                return <span className="badge bg-primary-lightest">{cat.label}</span>;
            default:
                return <span className="badge bg-primary">{cat.label}</span>;
        }
    };

    const renderPrerequisites = () => {
        // Use local completion state
        if (isLocallyCompleted) {
            return <small className="text-muted">Course completed</small>;
        }

        if (loading) return <small className="text-muted">Loading prerequisites...</small>;
        if (!prerequisites) return null;

        const hasHard = prerequisites.hardPrerequisites?.length > 0;
        const hasSoft = prerequisites.softPrerequisites?.length > 0;

        if (!hasHard && !hasSoft) return <small className="text-muted">No prerequisites</small>;

        return (
            <div className="prerequisites-list">
                {hasHard && (
                    <div className="mb-2">
                        <small className="fw-bold">Hard Prerequisites:</small>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                            {prerequisites.hardPrerequisites.map((prereq, idx) => (
                                <span
                                    key={idx}
                                    className={`badge ${prerequisites.missingHard?.includes(prereq.courseCode) ? 'bg-primary-dark' : 'bg-primary-light'}`}
                                >
                                    {formatCourseCode(prereq.courseCode)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {hasSoft && (
                    <div>
                        <small className="fw-bold">Soft Prerequisites:</small>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                            {prerequisites.softPrerequisites.map((prereq, idx) => (
                                <span
                                    key={idx}
                                    className={`badge ${prerequisites.missingSoft?.includes(prereq.courseCode) ? 'bg-primary' : 'bg-primary-lightest'}`}
                                >
                                    {formatCourseCode(prereq.courseCode)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Get course status for CSS classes
    const isCompleted = isLocallyCompleted;
    const canTake = Boolean(course.canTake) || isCompleted;
    const isBlocked = !isCompleted && !canTake;

    return (
        <div className={`card course-card h-100 ${isBlocked ? 'blocked' : ''} ${isCompleted ? 'completed' : ''}`}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 className="card-title mb-1">{formatCourseCode(course.courseCode)}</h6>
                        <h5 className="card-subtitle mb-2">{course.courseName}</h5>
                    </div>
                    <div className="d-flex flex-column align-items-end">
                        <span className="badge bg-primary me-1 mb-1">{course.credits || 3} Credits</span>
                        {getStatusBadge()}
                    </div>
                </div>

                <div className="mb-3">
                    {getCategoryBadge()}
                    {course.stream && (
                        <span className="badge bg-primary-light ms-1">{course.stream}</span>
                    )}
                </div>

                {renderPrerequisites()}

                {/* Toggle Complete Button */}

                {showActions && isBlocked && prerequisites?.missingHard?.length > 0 && (
                    <div className="mt-2">
                        <small className="text-primary-dark">
                            <strong>Missing:</strong> {prerequisites.missingHard.map(code => formatCourseCode(code)).join(', ')}
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCard;