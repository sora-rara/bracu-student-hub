import React, { useState } from 'react';
import PlannedCourseItem from './PlannedCourseItem';

const SemesterContainer = ({ semester, onUpdate, onDelete, onSelect, isSelected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [creditLimit, setCreditLimit] = useState(semester.creditLimit || 12);

    // Calculate total credits from planned courses
    const totalCredits = semester.plannedCourses?.reduce((sum, course) =>
        sum + (course.plannedCredits || course.credits || 3), 0
    ) || 0;

    const getLoadStatus = () => {
        if (totalCredits > creditLimit + 3) return 'overload-heavy';
        if (totalCredits > creditLimit) return 'overload-light';
        return 'normal';
    };

    const getSeasonBadge = (season) => {
        const colors = {
            'Spring': 'success',
            'Summer': 'warning',
            'Fall': 'primary'
        };
        return (
            <span className={`badge bg-${colors[season] || 'secondary'} ms-2`}>
                {season}
            </span>
        );
    };

    const handleCourseRemove = (courseCode) => {
        const updatedCourses = semester.plannedCourses.filter(
            course => course.courseCode !== courseCode
        );
        onUpdate(semester._id || semester.id, { plannedCourses: updatedCourses });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const courseData = JSON.parse(e.dataTransfer.getData('course'));

        // Check if already planned
        const alreadyPlanned = semester.plannedCourses?.some(
            course => course.courseCode === courseData.courseCode
        );

        if (alreadyPlanned) {
            alert('Course already planned in this semester!');
            return;
        }

        // For completed courses, ask about repeat
        if (courseData.isCompleted) {
            const confirmRepeat = window.confirm(
                `⚠️ ${courseData.courseCode} is already completed. ` +
                `Are you planning to repeat it to improve your grade?`
            );

            if (!confirmRepeat) return;

            courseData.isRepeat = true;
            courseData.originalGrade = courseData.grade;
        }

        const newCourse = {
            courseCode: courseData.courseCode,
            isRepeat: courseData.isRepeat || false,
            originalGrade: courseData.originalGrade,
            plannedCredits: courseData.credits || 3,
            addedAt: new Date().toISOString()
        };

        onUpdate(semester._id || semester.id, {
            plannedCourses: [...(semester.plannedCourses || []), newCourse]
        });
    };

    const handleSaveCreditLimit = () => {
        onUpdate(semester._id || semester.id, { creditLimit });
        setIsEditing(false);
    };

    return (
        <div
            className={`semester-container ${semester.season?.toLowerCase()} ${getLoadStatus()} ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <div className="semester-header">
                <div>
                    <h4>
                        {semester.semesterName || `${semester.season} ${semester.year}`}
                        {getSeasonBadge(semester.season)}
                        {isSelected && <span className="badge bg-info ms-2">Selected</span>}
                    </h4>
                    <div className="credit-info">
                        <span className={`credit-total ${getLoadStatus()}`}>
                            {totalCredits} / {creditLimit} credits
                        </span>

                        {isEditing ? (
                            <div className="credit-limit-edit mt-2">
                                <div className="d-flex align-items-center gap-2">
                                    <input
                                        type="range"
                                        value={creditLimit}
                                        onChange={(e) => setCreditLimit(parseInt(e.target.value) || 12)}
                                        min="3"
                                        max="21"
                                        className="form-range"
                                        style={{ flex: 1 }}
                                    />
                                    <span className="badge bg-info">{creditLimit}</span>
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={handleSaveCreditLimit}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => {
                                            setCreditLimit(semester.creditLimit || 12);
                                            setIsEditing(false);
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <small className="text-muted d-block mt-1">Drag to adjust credit limit</small>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="semester-actions">
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(!isEditing);
                        }}
                    >
                        {isEditing ? 'Cancel' : 'Edit Limit'}
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(semester._id || semester.id);
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="courses-list">
                {semester.plannedCourses?.map((course, index) => (
                    <PlannedCourseItem
                        key={`${course.courseCode}-${index}`}
                        course={course}
                        onRemove={(e) => {
                            e.stopPropagation();
                            handleCourseRemove(course.courseCode);
                        }}
                    />
                ))}

                {(semester.plannedCourses?.length === 0 || !semester.plannedCourses) && (
                    <div className="empty-state" onClick={(e) => e.stopPropagation()}>
                        <p className="text-muted mb-2">📚 No courses planned yet</p>
                        <small className="text-muted">
                            Drag courses here or select courses from the browser
                        </small>
                    </div>
                )}
            </div>

            {/* Warning messages */}
            {getLoadStatus() !== 'normal' && (
                <div className="warning-message">
                    ⚠️ {getLoadStatus() === 'overload-heavy'
                        ? `Heavy overload! ${totalCredits - creditLimit} credits over limit.`
                        : `Slight overload. ${totalCredits - creditLimit} credits over limit.`}
                </div>
            )}

            {/* Semester info footer */}
            <div className="semester-footer">
                <small className="text-muted">
                    {semester.plannedCourses?.length || 0} courses •
                    {semester.season === 'Spring' ? ' Jan-Apr' :
                        semester.season === 'Summer' ? ' May-Aug' :
                            ' Sep-Dec'}
                </small>
            </div>
        </div>
    );
};

export default SemesterContainer;