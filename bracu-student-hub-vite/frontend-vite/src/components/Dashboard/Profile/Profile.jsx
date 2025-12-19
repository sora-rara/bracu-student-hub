import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/auth.jsx';
import apiService from '../../../services/api.jsx';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [academicStats, setAcademicStats] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [success, setSuccess] = useState('');
  const [editingSemester, setEditingSemester] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // First, check if user is authenticated
      const authResult = await apiService.checkAuth();
      console.log('Auth check result:', authResult);

      if (!authResult || !authResult.loggedIn) {
        setError('Please log in to access your profile.');
        setLoading(false);
        return;
      }

      // Get current user from localStorage
      const currentUser = authService.getCurrentUser();
      console.log('Current user from localStorage:', currentUser);

      if (!currentUser) {
        setError('User session expired. Please log in again.');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Fetch data
      await fetchAcademicStats(currentUser._id);
      await fetchSemesters(currentUser._id);

    } catch (err) {
      console.error('Error in checkAuthAndFetchData:', err);
      setError(`Failed to load profile data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicStats = async (userId) => {
    try {
      console.log('Fetching academic stats for user:', userId);

      // Get academic stats using apiService
      const response = await apiService.getAcademicStats();
      console.log('Academic Stats API Response:', response);

      if (response && response.success) {
        setAcademicStats(response.data);
      } else {
        // Fallback: Calculate stats manually
        await fetchStatsManually(userId);
      }
    } catch (apiError) {
      console.error('Academic stats API failed:', apiError);
      await fetchStatsManually(userId);
    }
  };

  const fetchStatsManually = async (userId) => {
    try {
      // Get semesters
      const semestersRes = await apiService.getAllSemesters();
      const semestersData = semestersRes?.data || [];

      // Calculate stats
      const totalCredits = semestersData.reduce((sum, sem) => sum + (sem.totalCredits || 0), 0);
      const totalSemesters = semestersData.length;

      // Get current semester GPA
      let currentSemesterGPA = 0;
      if (semestersData.length > 0) {
        const sorted = [...semestersData].sort((a, b) => {
          const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
          if (a.year !== b.year) return b.year - a.year;
          return semesterOrder[b.semester] - semesterOrder[a.semester];
        });
        currentSemesterGPA = sorted[0]?.semesterGPA || 0;
      }

      // Get CGPA
      let cgpa = 0;
      try {
        const cgpaRes = await apiService.calculateCGPA();
        cgpa = cgpaRes?.data?.cgpa || 0;
      } catch (cgpaErr) {
        console.error('Failed to get CGPA:', cgpaErr);
        // Calculate CGPA manually
        let totalPoints = 0;
        semestersData.forEach(sem => {
          totalPoints += (sem.semesterGPA || 0) * (sem.totalCredits || 0);
        });
        cgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
      }

      setAcademicStats({
        academicStats: {
          cumulativeCGPA: cgpa,
          totalCredits,
          totalSemesters,
          currentSemesterGPA,
          lastCalculated: new Date()
        }
      });

    } catch (error) {
      console.error('Error fetching stats manually:', error);
      setAcademicStats({
        academicStats: {
          cumulativeCGPA: 0,
          totalCredits: 0,
          totalSemesters: 0,
          currentSemesterGPA: 0,
          lastCalculated: new Date()
        }
      });
    }
  };

  const fetchSemesters = async (userId) => {
    try {
      const semestersRes = await apiService.getAllSemesters();

      let semestersData = [];

      if (semestersRes && semestersRes.success) {
        semestersData = semestersRes.data || [];
      }

      // Filter semesters for current user
      const userSemesters = semestersData.filter(sem =>
        sem.studentId === userId || sem.studentId?._id === userId
      );

      console.log('User semesters found:', userSemesters.length);
      setSemesters(userSemesters);

    } catch (serviceError) {
      console.error('apiService error:', serviceError);
    }
  };

  const handleDeleteSemester = async (id) => {
    if (window.confirm('Are you sure you want to delete this semester? This action cannot be undone.')) {
      try {
        setLoading(true);

        const result = await apiService.deleteSemester(id);
        console.log('Delete result:', result);

        if (result && result.success) {
          setSuccess('Semester deleted successfully!');

          // Refresh data
          if (user && user._id) {
            await fetchAcademicStats(user._id);
            await fetchSemesters(user._id);
          }

          setTimeout(() => {
            setSuccess('');
          }, 3000);
        } else {
          setError(result?.message || 'Failed to delete semester');
        }
      } catch (err) {
        console.error('Delete error details:', err);
        setError(err.message || 'Failed to delete semester');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditSemester = (semester) => {
    setEditingSemester(semester._id);
    setEditFormData({
      semester: semester.semester,
      year: semester.year,
      courses: semester.courses.map(course => ({
        courseCode: course.courseCode,
        courseName: course.courseName || '',
        creditHours: course.creditHours,
        grade: course.grade
      }))
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCourseEdit = (index, field, value) => {
    const newCourses = [...editFormData.courses];
    newCourses[index][field] = value;
    setEditFormData(prev => ({
      ...prev,
      courses: newCourses
    }));
  };

  const handleAddCourse = () => {
    setEditFormData(prev => ({
      ...prev,
      courses: [
        ...prev.courses,
        { courseCode: '', courseName: '', creditHours: 3, grade: 'A' }
      ]
    }));
  };

  const handleRemoveCourse = (index) => {
    if (editFormData.courses.length > 1) {
      const newCourses = editFormData.courses.filter((_, i) => i !== index);
      setEditFormData(prev => ({
        ...prev,
        courses: newCourses
      }));
    }
  };

  const handleUpdateSemester = async () => {
    if (!editingSemester || !editFormData) return;

    // Validate form data
    const invalidCourse = editFormData.courses.find(course => {
      const trimmedCode = course.courseCode ? course.courseCode.trim() : '';
      return !trimmedCode || !course.grade || !course.creditHours;
    });

    if (invalidCourse) {
      setError('Each course must have a valid course code, credit hours, and grade.');
      return;
    }

    try {
      setEditLoading(true);

      // For now, we'll delete and recreate since we don't have an update endpoint
      // First delete the old semester
      await apiService.deleteSemester(editingSemester);

      // Then create a new one with updated data
      const result = await apiService.addSemesterGrades(editFormData);

      if (result && result.success) {
        setSuccess('Semester updated successfully!');

        // Refresh data
        if (user && user._id) {
          await fetchAcademicStats(user._id);
          await fetchSemesters(user._id);
        }

        // Reset editing state
        setEditingSemester(null);
        setEditFormData(null);

        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(result?.message || 'Failed to update semester');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update semester');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSemester(null);
    setEditFormData(null);
    setError('');
  };

  const getGPAStatus = (gpa) => {
    if (gpa >= 3.7) return { color: '#27ae60', text: 'Excellent', badgeClass: 'badge-success' };
    if (gpa >= 3.3) return { color: '#2ecc71', text: 'Very Good', badgeClass: 'badge-success' };
    if (gpa >= 3.0) return { color: '#f1c40f', text: 'Good', badgeClass: 'badge-warning' };
    if (gpa >= 2.7) return { color: '#e67e22', text: 'Satisfactory', badgeClass: 'badge-warning' };
    return { color: '#e74c3c', text: 'Needs Improvement', badgeClass: 'badge-danger' };
  };

  const getSemesterIcon = (semester) => {
    switch (semester) {
      case 'Fall': return '🍂';
      case 'Spring': return '🌷';
      case 'Summer': return '☀️';
      default: return '📚';
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  const handleRefresh = () => {
    checkAuthAndFetchData();
  };

  const handleForceUpdateStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.forceUpdateAcademicStats();

      if (response && response.success) {
        setAcademicStats({ academicStats: response.data });
        setSuccess('Academic stats updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Force update error:', error);
      setError('Failed to update stats: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  const gradeOptions = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
  const semesterOptions = ['Spring', 'Summer', 'Fall'];

  if (!user && error.includes('log in')) {
    return (
      <div className="card">
        <h2>Profile</h2>
        <div className="alert alert-warning">
          <strong>Authentication Required:</strong> {error}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleLoginRedirect}
        >
          Go to Login
        </button>
      </div>
    );
  }

  const stats = academicStats?.academicStats || {
    cumulativeCGPA: 0,
    totalCredits: 0,
    totalSemesters: 0,
    currentSemesterGPA: 0,
    lastCalculated: null
  };

  const cumulativeStatus = getGPAStatus(stats.cumulativeCGPA);
  const currentSemesterStatus = getGPAStatus(stats.currentSemesterGPA);

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="profile-info">
              {user ? (
                <>
                  <h2>{user.name}</h2>
                  <p className="profile-email">{user.email}</p>
                  <span className="profile-role">{user.role}</span>
                  {stats.lastCalculated && (
                    <p className="profile-last-updated">
                      <small>
                        Last updated: {new Date(stats.lastCalculated).toLocaleDateString()} at{' '}
                        {new Date(stats.lastCalculated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </p>
                  )}
                </>
              ) : (
                <p>Loading user information...</p>
              )}
            </div>
          </div>

          {error && !error.includes('log in') && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
              <button
                className="btn btn-sm btn-link"
                onClick={handleRefresh}
                style={{ marginLeft: '10px' }}
              >
                Try Again
              </button>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          {loading ? (
            <div className="loading-indicator">
              <div className="spinner-small"></div>
              <p>Loading profile data...</p>
            </div>
          ) : (
            <div className="profile-stats">
              <div className="stats-header">
                <h3>Academic Statistics</h3>
                <div className="stats-actions">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={handleRefresh}
                    title="Refresh data"
                    disabled={loading}
                  >
                    ↻ Refresh
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={handleForceUpdateStats}
                    title="Force recalculate stats"
                    disabled={loading}
                  >
                    🔄 Recalculate
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                {/* Total Credits Completed */}
                <div className="stat-item">
                  <div className="stat-value">{stats.totalCredits}</div>
                  <div className="stat-label">Total Credits</div>
                  <div className="stat-description">
                    <small>Completed credit hours</small>
                  </div>
                </div>

                {/* Cumulative CGPA */}
                <div className="stat-item">
                  <div className="stat-value" style={{ color: cumulativeStatus.color }}>
                    {stats.cumulativeCGPA.toFixed(2)}
                  </div>
                  <div className="stat-label">Cumulative CGPA</div>
                  <div className="stat-description">
                    <small style={{ color: cumulativeStatus.color }}>
                      {cumulativeStatus.text}
                    </small>
                  </div>
                </div>

                {/* Current Semester GPA */}
                <div className="stat-item">
                  <div className="stat-value" style={{ color: currentSemesterStatus.color }}>
                    {stats.currentSemesterGPA.toFixed(2)}
                  </div>
                  <div className="stat-label">Current Semester GPA</div>
                  <div className="stat-description">
                    <small style={{ color: currentSemesterStatus.color }}>
                      {stats.totalSemesters > 0 ? currentSemesterStatus.text : 'No semester data'}
                    </small>
                  </div>
                </div>

                {/* Total Semesters */}
                <div className="stat-item">
                  <div className="stat-value">{stats.totalSemesters}</div>
                  <div className="stat-label">Total Semesters</div>
                  <div className="stat-description">
                    <small>Academic terms completed</small>
                  </div>
                </div>
              </div>

              <div className="additional-stats">
                <div className="additional-stat">
                  <span className="additional-label">Average Credits/Semester:</span>
                  <span className="additional-value">
                    {stats.totalSemesters > 0 ? (stats.totalCredits / stats.totalSemesters).toFixed(1) : '0.0'}
                  </span>
                </div>
                <div className="additional-stat">
                  <span className="additional-label">Academic Standing:</span>
                  <span className="additional-value" style={{ color: cumulativeStatus.color }}>
                    {cumulativeStatus.text}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="profile-actions">
            <button className="btn btn-primary" onClick={handleRefresh} disabled={loading}>
              Refresh Data
            </button>
            <button className="btn btn-outline" disabled={loading}>Edit Profile</button>
            <button onClick={handleLogout} className="btn btn-danger" disabled={loading}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Semester List Section */}
      <div className="semester-list-section">
        <div className="card">
          <div className="semester-list-header">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="mb-1">Your Semesters</h3>
                <p className="text-muted mb-0">
                  {semesters.length} semester{semesters.length !== 1 ? 's' : ''} • {stats.totalCredits} total credits
                </p>
              </div>
              <a href="/gpa-calculator" className="btn btn-primary btn-sm">
                + Add Semester
              </a>
            </div>
          </div>

          {semesters.length === 0 ? (
            <div className="empty-state text-center py-5">
              <div className="empty-state-icon mb-3">
                <span style={{ fontSize: '48px' }}>📚</span>
              </div>
              <h4>No Semesters Yet</h4>
              <p className="text-muted mb-4">Add your first semester to start tracking your academic progress!</p>
              <a href="/gpa-calculator" className="btn btn-primary">
                + Add First Semester
              </a>
            </div>
          ) : (
            <div className="semester-cards-container">
              {semesters.map((semester) => {
                const gpaStatus = getGPAStatus(semester.semesterGPA || 0);

                // If this semester is being edited, show edit form
                if (editingSemester === semester._id && editFormData) {
                  return (
                    <div key={semester._id} className="semester-card editing">
                      <div className="semester-card-header">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="mb-0">Edit Semester</h5>
                          </div>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={handleCancelEdit}
                            disabled={editLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div className="semester-card-body">
                        {/* Edit Form */}
                        <div className="edit-form">
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <label className="form-label">Semester</label>
                              <select
                                className="form-control"
                                value={editFormData.semester}
                                onChange={(e) => handleEditFormChange('semester', e.target.value)}
                              >
                                {semesterOptions.map(sem => (
                                  <option key={sem} value={sem}>{sem}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Year</label>
                              <input
                                type="number"
                                className="form-control"
                                value={editFormData.year}
                                onChange={(e) => handleEditFormChange('year', e.target.value)}
                                min="2000"
                                max="2100"
                              />
                            </div>
                          </div>

                          <div className="courses-edit-section">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6>Courses</h6>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={handleAddCourse}
                              >
                                + Add Course
                              </button>
                            </div>

                            {editFormData.courses.map((course, index) => (
                              <div key={index} className="course-edit-row mb-2 p-2 border rounded">
                                <div className="row g-2">
                                  <div className="col-md-3">
                                    <input
                                      type="text"
                                      placeholder="Course Code *"
                                      value={course.courseCode}
                                      onChange={(e) => handleCourseEdit(index, 'courseCode', e.target.value)}
                                      className="form-control form-control-sm"
                                    />
                                  </div>
                                  <div className="col-md-3">
                                    <input
                                      type="text"
                                      placeholder="Course Name"
                                      value={course.courseName}
                                      onChange={(e) => handleCourseEdit(index, 'courseName', e.target.value)}
                                      className="form-control form-control-sm"
                                    />
                                  </div>
                                  <div className="col-md-2">
                                    <select
                                      value={course.creditHours}
                                      onChange={(e) => handleCourseEdit(index, 'creditHours', parseInt(e.target.value))}
                                      className="form-control form-control-sm"
                                    >
                                      {[1, 2, 3, 4, 5].map(hours => (
                                        <option key={hours} value={hours}>{hours} Credits</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="col-md-2">
                                    <select
                                      value={course.grade}
                                      onChange={(e) => handleCourseEdit(index, 'grade', e.target.value)}
                                      className="form-control form-control-sm"
                                    >
                                      {gradeOptions.map(grade => (
                                        <option key={grade} value={grade}>{grade}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="col-md-2">
                                    {editFormData.courses.length > 1 && (
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm w-100"
                                        onClick={() => handleRemoveCourse(index)}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="semester-card-footer">
                        <div className="action-buttons-mobile">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={handleUpdateSemester}
                            disabled={editLoading}
                          >
                            {editLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={handleCancelEdit}
                            disabled={editLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Normal semester card view
                return (
                  <div key={semester._id} className="semester-card">
                    <div className="semester-card-header">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <span className="semester-icon me-2">
                            {getSemesterIcon(semester.semester)}
                          </span>
                          <div>
                            <h5 className="mb-0">{semester.semester} {semester.year}</h5>
                            <span className={`badge ${gpaStatus.badgeClass}`}>
                              {gpaStatus.text}
                            </span>
                          </div>
                        </div>
                        <div className="gpa-display-mobile" style={{ color: gpaStatus.color }}>
                          <strong>{semester.semesterGPA ? semester.semesterGPA.toFixed(2) : 'N/A'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="semester-card-body">
                      <div className="row">
                        <div className="col-6">
                          <div className="semester-metric">
                            <div className="metric-label">Credits</div>
                            <div className="metric-value">
                              <span className="badge bg-info">{semester.totalCredits || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="semester-metric">
                            <div className="metric-label">Courses</div>
                            <div className="metric-value">
                              <span className="badge bg-secondary">{semester.courses ? semester.courses.length : 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {semester.courses && semester.courses.length > 0 && (
                        <div className="course-preview mt-3">
                          <div className="course-preview-label">Courses:</div>
                          <div className="course-tags">
                            {semester.courses.slice(0, 3).map((course, idx) => (
                              <span key={idx} className="course-tag">
                                {course.courseCode}
                              </span>
                            ))}
                            {semester.courses.length > 3 && (
                              <span className="course-tag more">+{semester.courses.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="semester-card-footer">
                      <div className="action-buttons-mobile">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEditSemester(semester)}
                          title="Edit Semester"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteSemester(semester._id)}
                          title="Delete Semester"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;