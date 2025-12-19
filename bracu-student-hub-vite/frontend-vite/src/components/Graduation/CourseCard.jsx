// src/components/GraduationPlanner/CourseCard.jsx
import React, { useState, useEffect } from 'react';
import graduationService from '../../services/graduationService';

const CourseCard = ({ course, showActions = true, onUpdate }) => {
    const [prerequisites, setPrerequisites] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const formatCourseCode = (code) => {
        if (!code) return '';
        if (code.match(/^[A-Z]{3}\d{3}$/)) return code.replace(/([A-Z]{3})(\d{3})/, '$1 $2');
        return code;
    };

    const getStatusBadge = () => {
        // Priority: isCompleted from database > canTake status
        if (course.isCompleted) {
            return <span className="badge bg-primary-lightest">Completed</span>;
        }
        if (course.status === 'ongoing') return <span className="badge bg-primary">Ongoing</span>;
        if (course.canTake === false) return <span className="badge bg-primary-dark">Blocked</span>;
        if (course.canTake === true) return <span className="badge bg-primary-light">Available</span>;
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
        // Don't show prerequisites for completed courses
        if (course.isCompleted) {
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

    return (
        <div className={`card course-card h-100 ${course.canTake === false ? 'blocked' : ''} ${course.isCompleted ? 'completed' : ''}`}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 className="card-title mb-1">{formatCourseCode(course.courseCode)}</h6>
                        <h5 className="card-subtitle mb-2">{course.courseName}</h5>
                    </div>
                    <div className="d-flex flex-column align-items-end">
                        <span className="badge bg-primary me-1 mb-1">{course.credits} Credits</span>
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

                {showActions && !course.isCompleted && course.canTake === false && prerequisites?.missingHard?.length > 0 && (
                    <div className="mt-3">
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