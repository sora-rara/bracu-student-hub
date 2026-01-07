import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import graduationService from '../../services/graduationService';
import authService from '../../services/auth';

const ProgressDashboard = () => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            const response = await graduationService.getProgress();

            if (response.success) {
                setProgress(response.data);
            } else {
                setError(response.message || 'Failed to load progress');
            }
        } catch (err) {
            setError(err.message || 'Error loading graduation progress');
        } finally {
            setLoading(false);
        }
    };

    const initializePlan = async () => {
        try {
            const user = authService.getCurrentUser();
            const currentYear = new Date().getFullYear();

            const response = await graduationService.initializePlan('CSE', currentYear);

            if (response.success) {
                alert('Graduation plan initialized successfully!');
                fetchProgress();
            }
        } catch (err) {
            setError('Failed to initialize plan: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading graduation progress...</p>
            </div>
        );
    }

    if (!progress) {
        return (
            <div className="card p-4 text-center">
                <h3>Graduation Planner</h3>
                <p className="text-muted mb-4">
                    You haven't set up your graduation plan yet.
                </p>
                <button
                    className="btn btn-primary"
                    onClick={initializePlan}
                >
                    Initialize Graduation Plan
                </button>
            </div>
        );
    }

    const categories = [
        { key: 'genEd', label: 'General Education', color: '#3498db' },
        { key: 'schoolCore', label: 'School Core', color: '#2ecc71' },
        { key: 'programCore', label: 'Program Core', color: '#9b59b6' },
        { key: 'programElective', label: 'Program Elective', color: '#f39c12' },
        { key: 'projectThesis', label: 'Project/Thesis', color: '#e74c3c' }
    ];

    return (
        <div className="graduation-dashboard">
            <div className="dashboard-header">
                <h2>Graduation Progress</h2>
                <div className="header-actions">

                    <Link to="/graduation/remaining" className="btn btn-outline-secondary">
                        Remaining Courses
                    </Link>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                    <button className="btn btn-sm btn-link" onClick={() => setError('')}>
                        Dismiss
                    </button>
                </div>
            )}

            {/* Overall Progress */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-4 text-center">
                            <div style={{ width: 150, height: 150, margin: '0 auto' }}>
                                <CircularProgressbar
                                    value={progress.progressPercentage}
                                    text={`${Math.round(progress.progressPercentage)}%`}
                                    styles={buildStyles({
                                        textSize: '24px',
                                        pathColor: `rgba(62, 152, 199, ${progress.progressPercentage / 100})`,
                                        textColor: '#2c3e50',
                                        trailColor: '#d6d6d6'
                                    })}
                                />
                            </div>
                        </div>
                        <div className="col-md-8">
                            <h4>Overall Progress</h4>
                            <div className="progress-summary">
                                <div className="summary-item">
                                    <span className="label">Credits Completed:</span>
                                    <span className="value">
                                        {progress.totalCreditsCompleted} / {progress.totalCreditsRequired}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Program:</span>
                                    <span className="value">
                                        {typeof progress.program === "string"
                                            ? progress.program
                                            : progress.program?.name || progress.program?.code || "N/A"}
                                    </span>

                                </div>
                                <div className="summary-item">
                                    <span className="label">Admission Year:</span>
                                    <span className="value">{progress.admissionYear}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Expected Graduation:</span>
                                    <span className="value">{progress.expectedGraduationYear}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Progress */}
            <div className="card">
                <div className="card-body">
                    <h4 className="mb-4">Progress by Category</h4>
                    <div className="category-progress-grid">
                        {categories.map(({ key, label, color }) => {
                            const category = progress.progressByCategory[key];
                            return (
                                <div key={key} className="category-card">
                                    <h6>{label}</h6>
                                    <div className="progress-bar-container">
                                        <div className="progress">
                                            <div
                                                className="progress-bar"
                                                role="progressbar"
                                                style={{
                                                    width: `${category.percentage}%`,
                                                    backgroundColor: color
                                                }}
                                            >
                                                {Math.round(category.percentage)}%
                                            </div>
                                        </div>
                                        <div className="progress-details">
                                            <span>{category.completed} / {category.required} credits</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Courses */}
            {progress.completedCourses && progress.completedCourses.length > 0 && (
                <div className="card mt-4">
                    <div className="card-body">
                        <h4>Recently Completed Courses</h4>
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Course Code</th>
                                        <th>Course Name</th>
                                        <th>Credits</th>
                                        <th>Grade</th>
                                        <th>Semester</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {progress.completedCourses.slice(0, 5).map((course, index) => (
                                        <tr key={index}>
                                            <td>{course.courseCode}</td>
                                            <td>{course.courseName}</td>
                                            <td>{course.credits}</td>
                                            <td>{course.grade || 'N/A'}</td>
                                            <td>{course.semester} {course.year}</td>
                                            <td>
                                                <span className={`badge ${course.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {progress.completedCourses.length > 5 && (
                            <div className="text-center mt-3">
                                <Link to="/graduation/courses" className="btn btn-sm btn-outline">
                                    View All Courses ({progress.completedCourses.length})
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressDashboard;