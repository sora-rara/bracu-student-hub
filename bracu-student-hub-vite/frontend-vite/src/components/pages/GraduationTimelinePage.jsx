import React, { useState, useEffect } from 'react';
import graduationService from '../services/graduationService.jsx';

const GraduationTimelinePage = () => {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTimeline();
    }, []);

    const fetchTimeline = async () => {
        try {
            setLoading(true);
            const response = await graduationService.getTimeline();

            if (response.success) {
                setTimeline(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.message || 'Error loading timeline');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading graduation timeline...</p>
            </div>
        );
    }

    return (
        <div className="graduation-timeline-page">
            <h2>Graduation Timeline</h2>

            {error && (
                <div className="alert alert-danger">
                    {error}
                    <button className="btn btn-sm btn-link" onClick={() => setError('')}>
                        Dismiss
                    </button>
                </div>
            )}

            {timeline.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <h4>No timeline data yet</h4>
                        <p className="text-muted">
                            Start adding completed courses to see your graduation timeline.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="timeline-container">
                    {timeline.map((semester, index) => (
                        <div key={index} className="timeline-item">
                            <div className="timeline-header">
                                <h4>{semester.semesterName} {semester.year}</h4>
                                <span className="badge bg-primary">
                                    {semester.totalCredits} Credits
                                </span>
                            </div>

                            <div className="timeline-content">
                                {/* Completed Courses */}
                                {semester.completed.length > 0 && (
                                    <div className="completed-courses mb-3">
                                        <h6>Completed:</h6>
                                        <div className="course-list">
                                            {semester.completed.map((course, idx) => (
                                                <div key={idx} className="course-item completed">
                                                    <span className="course-code">{course.courseCode}</span>
                                                    <span className="course-name">{course.courseName}</span>
                                                    <span className="course-credits">{course.credits}cr</span>
                                                    {course.grade && (
                                                        <span className="course-grade badge bg-success">
                                                            {course.grade}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Planned Courses */}
                                {semester.planned.length > 0 && (
                                    <div className="planned-courses">
                                        <h6>Planned:</h6>
                                        <div className="course-list">
                                            {semester.planned.map((course, idx) => (
                                                <div key={idx} className="course-item planned">
                                                    <span className="course-code">{course.courseCode}</span>
                                                    <span className="course-name">{course.courseName}</span>
                                                    <span className="course-credits">{course.credits}cr</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GraduationTimelinePage;