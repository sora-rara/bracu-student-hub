import React from 'react';

const PlannedCourseItem = ({ course, onRemove }) => {
    return (
        <div className={`planned-course-item ${course.isRepeat ? 'repeat-course' : ''}`}>
            <div className="course-info">
                <div className="course-header">
                    <span className="course-code">
                        {course.courseCode}
                        {course.isRepeat && <span className="repeat-badge">🔁</span>}
                    </span>
                    <span className="course-credits">{course.plannedCredits} cr</span>
                </div>
                <div className="course-name">{course.courseName}</div>
                {course.isRepeat && (
                    <div className="repeat-info">
                        <small>Repeat from {course.originalGrade || 'previous attempt'}</small>
                    </div>
                )}
            </div>
            <button
                className="btn btn-sm btn-link remove-btn"
                onClick={onRemove}
                title="Remove from semester"
            >
                ×
            </button>
        </div>
    );
};

export default PlannedCourseItem; // ✅ THIS IS CRITICAL