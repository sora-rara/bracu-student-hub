import React, { useEffect, useState } from 'react';
import axios from 'axios';

function GPAStats({ studentId }) {
  const [stats, setStats] = useState(null);
  const [method, setMethod] = useState('accumulated'); // accumulated or sequential
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [academicStats, setAcademicStats] = useState(null);
  const [useStoredCGPA, setUseStoredCGPA] = useState(true);
  const [retakeInfo, setRetakeInfo] = useState(null); // NEW: For retake information
  const [showRetakeHistory, setShowRetakeHistory] = useState(false); // NEW: For retake history modal

  const fetchStats = async () => {
    if (!studentId) {
      setError('No student ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Option 1: Fetch from new academic stats endpoint (preferred)
      if (useStoredCGPA) {
        try {
          const academicStatsRes = await axios.get(`/api/gpa/stats`, {
            params: { studentId },
            withCredentials: true
          });

          console.log('Academic Stats Response:', academicStatsRes);

          if (academicStatsRes.data && academicStatsRes.data.success) {
            const userData = academicStatsRes.data.data;
            const userStats = userData.academicStats;
            setAcademicStats(userStats);

            // Now fetch semesters for breakdown
            const semestersRes = await axios.get(`/api/gpa/semesters?studentId=${studentId}`, {
              withCredentials: true
            });

            let semesters = [];
            if (semestersRes.data && Array.isArray(semestersRes.data)) {
              semesters = semestersRes.data;
            } else if (semestersRes.data && semestersRes.data.data) {
              semesters = semestersRes.data.data;
            } else if (semestersRes.data.success) {
              semesters = semestersRes.data.data || [];
            }

            if (!semesters || !Array.isArray(semesters)) {
              throw new Error('Invalid semesters data structure');
            }

            const semesterDetails = semesters.map(sem => ({
              semester: sem.semester,
              year: sem.year,
              semesterGPA: sem.semesterGPA || 0,
              totalCredits: sem.totalCredits || 0,
              courses: sem.courses || []
            }));

            // NEW: Calculate retake information
            const retakeData = calculateRetakeInfo(semesters);
            setRetakeInfo(retakeData);

            setStats({
              cgpa: userStats.cumulativeCGPA || 0,
              totalCredits: userStats.totalCredits || 0, // Already unique credits from stored stats
              totalSemesters: userStats.totalSemesters || 0,
              currentSemesterGPA: userStats.currentSemesterGPA || 0,
              lastCalculated: userStats.lastCalculated,
              semesterDetails,
              source: 'stored',
              retakeInfo: retakeData // NEW: Add retake info to stats
            });
            return; // Successfully fetched from stored data
          }
        } catch (academicStatsErr) {
          console.log('Academic stats endpoint failed, falling back:', academicStatsErr.message);
          // Continue to fallback method
        }
      }

      // Option 2: Fallback to original method
      // Fetch all semesters for the student
      const semestersRes = await axios.get(`/api/gpa/semesters?studentId=${studentId}`, {
        withCredentials: true
      });

      // Check if response has data property
      let semesters = [];
      if (semestersRes.data && Array.isArray(semestersRes.data)) {
        semesters = semestersRes.data;
      } else if (semestersRes.data && semestersRes.data.data) {
        semesters = semestersRes.data.data;
      } else if (semestersRes.data.success) {
        semesters = semestersRes.data.data || [];
      }

      if (!semesters || !Array.isArray(semesters)) {
        throw new Error('Invalid semesters data');
      }

      // Fetch CGPA based on selected method
      const cgpaRes = await axios.get(`/api/gpa/calculate?studentId=${studentId}&method=${method}`, {
        withCredentials: true
      });

      // Check if response has data property
      const cgpaData = cgpaRes.data.data || cgpaRes.data;
      const cgpa = cgpaData?.cgpa || cgpaData || 0;

      // NEW: Calculate retake information
      const retakeData = calculateRetakeInfo(semesters);
      setRetakeInfo(retakeData);

      // Calculate unique credits (not counting retakes twice)
      const uniqueCredits = calculateUniqueCredits(semesters);

      const semesterDetails = semesters.map(sem => ({
        semester: sem.semester,
        year: sem.year,
        semesterGPA: sem.semesterGPA || 0,
        totalCredits: sem.totalCredits || 0,
        courses: sem.courses || []
      }));

      setStats({
        cgpa: typeof cgpa === 'number' ? cgpa : 0,
        totalCredits: method === 'accumulated' ? uniqueCredits : calculateTotalCredits(semesters), // Use unique credits for accumulated
        totalSemesters: semesters.length,
        currentSemesterGPA: 0,
        semesterDetails,
        source: 'calculated',
        retakeInfo: retakeData // NEW: Add retake info to stats
      });

    } catch (err) {
      console.error('Error fetching GPA stats:', err);
      setError(err.response?.data?.message || 'Failed to fetch GPA stats.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Calculate retake information from semesters
  const calculateRetakeInfo = (semesters) => {
    const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
    const courseMap = new Map();
    const retakeMap = new Map();

    // Process semesters in chronological order
    semesters.sort((a, b) => {
      const aKey = (a.year * 10) + semesterOrder[a.semester];
      const bKey = (b.year * 10) + semesterOrder[b.semester];
      return aKey - bKey;
    });

    // Find all retakes
    semesters.forEach((sem, semIndex) => {
      sem.courses.forEach(course => {
        const courseKey = course.courseCode.trim().toUpperCase();

        if (courseMap.has(courseKey)) {
          // This is a retake
          const previous = courseMap.get(courseKey);
          if (!retakeMap.has(courseKey)) {
            retakeMap.set(courseKey, {
              courseCode: course.courseCode,
              courseName: course.courseName || 'Unnamed Course',
              attempts: [previous]
            });
          }
          const retake = retakeMap.get(courseKey);
          retake.attempts.push({
            semester: sem.semester,
            year: sem.year,
            grade: course.grade,
            creditHours: course.creditHours,
            semesterIndex: semIndex,
            semesterId: sem._id
          });
          retake.latestAttempt = retake.attempts[retake.attempts.length - 1];
          retake.attemptCount = retake.attempts.length;
        }

        // Update the latest occurrence
        courseMap.set(courseKey, {
          semester: sem.semester,
          year: sem.year,
          grade: course.grade,
          creditHours: course.creditHours,
          semesterIndex: semIndex,
          semesterId: sem._id
        });
      });
    });

    const retakes = Array.from(retakeMap.values());

    return {
      retakes,
      totalRetakes: retakes.length,
      totalRetakeAttempts: retakes.reduce((sum, r) => sum + r.attemptCount, 0),
      uniqueCourseCount: courseMap.size,
      totalCourseAttempts: semesters.reduce((sum, sem) => sum + sem.courses.length, 0)
    };
  };

  // NEW: Calculate unique credits (not counting retakes)
  const calculateUniqueCredits = (semesters) => {
    const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
    const courseMap = new Map();

    // Process semesters in chronological order
    semesters.sort((a, b) => {
      const aKey = (a.year * 10) + semesterOrder[a.semester];
      const bKey = (b.year * 10) + semesterOrder[b.semester];
      return aKey - bKey;
    });

    // Keep only the latest occurrence of each course
    semesters.forEach(sem => {
      sem.courses.forEach(course => {
        const courseKey = course.courseCode.trim().toUpperCase();
        courseMap.set(courseKey, course.creditHours);
      });
    });

    // Sum unique credits
    return Array.from(courseMap.values()).reduce((sum, credits) => sum + credits, 0);
  };

  // Helper function to calculate total credits (all attempts)
  const calculateTotalCredits = (semesters) => {
    return semesters.reduce((sum, sem) => sum + (sem.totalCredits || 0), 0);
  };

  const handleForceRecalculate = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      // Force fresh calculation
      const cgpaRes = await axios.get(`/api/gpa/calculate?studentId=${studentId}&method=${method}&force=true`, {
        withCredentials: true
      });

      // Update stats
      const cgpaData = cgpaRes.data.data || cgpaRes.data;
      const cgpa = cgpaData?.cgpa || cgpaData || 0;

      if (stats) {
        setStats({
          ...stats,
          cgpa,
          source: 'recalculated'
        });
      }

      // Also update stored stats
      await axios.post('/api/gpa/stats/update', {}, {
        params: { studentId },
        withCredentials: true
      });

    } catch (err) {
      console.error('Error recalculating:', err);
      setError('Failed to recalculate CGPA');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch course history for a specific course
  const fetchCourseHistory = async (courseCode) => {
    try {
      const response = await axios.get(`/api/gpa/course-history?courseCode=${encodeURIComponent(courseCode)}`, {
        withCredentials: true
      });
      return response.data;
    } catch (err) {
      console.error('Error fetching course history:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchStats();
  }, [method, studentId, useStoredCGPA]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading GPA stats...</p>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger">
      <strong>Error:</strong> {error}
      <button
        className="btn btn-sm btn-link"
        onClick={fetchStats}
        style={{ marginLeft: '10px' }}
      >
        Retry
      </button>
    </div>
  );

  if (!stats) return (
    <div className="dashboard-grid">
      <div className="card">
        <h3>CGPA Overview</h3>
        <p className="text-muted">No GPA data available yet. Add your first semester!</p>
      </div>
    </div>
  );

  const getGPAStatus = (gpa) => {
    if (gpa >= 3.7) return { color: '#27ae60', text: 'Excellent' };
    if (gpa >= 3.3) return { color: '#2ecc71', text: 'Very Good' };
    if (gpa >= 3.0) return { color: '#f1c40f', text: 'Good' };
    if (gpa >= 2.7) return { color: '#e67e22', text: 'Satisfactory' };
    return { color: '#e74c3c', text: 'Needs Improvement' };
  };

  const status = getGPAStatus(stats.cgpa || 0);

  return (
    <div className="dashboard-grid">
      <div className="card gpa-card">
        <h3>CGPA Overview</h3>

        <div className="cgpa-source-info mb-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="useStoredCGPA"
              checked={useStoredCGPA}
              onChange={(e) => setUseStoredCGPA(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="useStoredCGPA">
              Use stored CGPA from database
            </label>
          </div>
          {stats.source && (
            <small className="text-muted d-block mt-1">
              Source: {stats.source === 'stored' ? 'Database' : 'Calculated'}
              {stats.lastCalculated && stats.source === 'stored' && (
                <> • Last updated: {new Date(stats.lastCalculated).toLocaleDateString()}</>
              )}
            </small>
          )}
        </div>

        <div className="form-group">
          <label>Calculation Method:</label>
          <select className="form-control" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="accumulated">Accumulated CGPA (Weighted by Credits)</option>
            <option value="sequential">Sequential CGPA (Average of Semesters)</option>
          </select>
          {method === 'accumulated' && (
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Latest grade used for retaken courses. Credits counted once.
            </small>
          )}
          {method === 'sequential' && (
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Average of semester GPAs. Retakes affect individual semester GPAs.
            </small>
          )}
        </div>

        <div className="gpa-result" style={{ color: status.color }}>
          {stats.cgpa ? stats.cgpa.toFixed(2) : '0.00'}
        </div>
        <p className="gpa-status" style={{ color: status.color }}>
          {stats.cgpa ? status.text : 'No Data'}
        </p>

        <div className="gpa-actions mb-3">
          <button
            className="btn btn-sm btn-outline"
            onClick={handleForceRecalculate}
            disabled={loading}
          >
            {loading ? 'Recalculating...' : '↻ Recalculate'}
          </button>
          <button
            className="btn btn-sm btn-outline ms-2"
            onClick={fetchStats}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="gpa-details">
          <p><strong>Total Credits:</strong> {stats.totalCredits || 0}</p>
          <p><strong>Total Semesters:</strong> {stats.totalSemesters || 0}</p>
          {stats.currentSemesterGPA > 0 && (
            <p><strong>Current Semester GPA:</strong> {stats.currentSemesterGPA.toFixed(2)}</p>
          )}
          {retakeInfo && retakeInfo.totalRetakes > 0 && (
            <p className="text-warning">
              <strong>Retaken Courses:</strong> {retakeInfo.totalRetakes}
              <small className="text-muted d-block">
                {retakeInfo.totalRetakeAttempts - retakeInfo.totalRetakes} additional attempt(s)
              </small>
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Semester Breakdown</h3>
          <span className="badge bg-primary">{stats.totalSemesters} semesters</span>
        </div>

        {stats.semesterDetails && stats.semesterDetails.length > 0 ? (
          <div className="semester-list">
            {stats.semesterDetails.map((sem, index) => (
              <div key={index} className="semester-item">
                <div className="semester-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="semester-name">
                      <strong>{sem.semester} {sem.year}</strong>
                    </span>
                    <span className="semester-gpa badge bg-info">
                      {sem.semesterGPA ? sem.semesterGPA.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="semester-details mt-2">
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted">
                        <i className="bi bi-book me-1"></i>
                        Credits: {sem.totalCredits || 0}
                      </small>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">
                        <i className="bi bi-list-check me-1"></i>
                        Courses: {sem.courses ? sem.courses.length : 0}
                        {sem.courses && sem.courses.some(c => !c.courseName) && (
                          <span className="text-muted small"> (some without names)</span>
                        )}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted">No semester data available</p>
            <button className="btn btn-sm btn-outline">
              <i className="bi bi-plus-circle me-1"></i>
              Add First Semester
            </button>
          </div>
        )}
      </div>

      {/* NEW: Retake Information Card */}
      <div className="card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Retake Information</h3>
          {retakeInfo && retakeInfo.totalRetakes > 0 && (
            <span className="badge bg-warning">{retakeInfo.totalRetakes} retaken course(s)</span>
          )}
        </div>

        <div className="retake-info">
          {retakeInfo && retakeInfo.totalRetakes > 0 ? (
            <>
              <p>
                <strong>Retake Policy:</strong> When a course is retaken, only the latest grade is used for CGPA calculation.
                Credit hours are counted only once.
              </p>

              <div className="retake-stats mb-3 p-3 bg-light rounded">
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Unique Courses:</strong> {retakeInfo.uniqueCourseCount}</p>
                    <p className="mb-1"><strong>Total Attempts:</strong> {retakeInfo.totalCourseAttempts}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Retaken Courses:</strong> {retakeInfo.totalRetakes}</p>
                    <p className="mb-1"><strong>Total Retake Attempts:</strong> {retakeInfo.totalRetakeAttempts}</p>
                  </div>
                </div>
              </div>

              <div className="retake-list">
                <h6>Retaken Courses:</h6>
                <div className="list-group">
                  {retakeInfo.retakes.slice(0, 3).map((retake, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{retake.courseCode}</strong>
                          {retake.courseName && `: ${retake.courseName}`}
                          <div className="small text-muted">
                            {retake.attemptCount} attempt(s) • Latest: {retake.latestAttempt.grade} in {retake.latestAttempt.semester} {retake.latestAttempt.year}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={async () => {
                            const history = await fetchCourseHistory(retake.courseCode);
                            if (history && history.success) {
                              alert(
                                `Course History for ${retake.courseCode}:\n\n` +
                                history.data.attempts.map((attempt, i) =>
                                  `${i + 1}. ${attempt.semester} ${attempt.year}: ${attempt.grade} (${attempt.creditHours} credits)`
                                ).join('\n')
                              );
                            }
                          }}
                        >
                          View History
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {retakeInfo.retakes.length > 3 && (
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      ...and {retakeInfo.retakes.length - 3} more retaken courses
                    </small>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <button
                  className="btn btn-sm btn-outline w-100"
                  onClick={() => setShowRetakeHistory(true)}
                >
                  <i className="bi bi-clock-history me-1"></i>
                  View Detailed Retake History
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-3">
              <i className="bi bi-check-circle text-success fs-1 mb-2"></i>
              <p className="text-muted">No retaken courses found.</p>
              <small className="text-muted">
                When you retake a course, only the latest grade will be used for CGPA calculation.
              </small>
            </div>
          )}
        </div>
      </div>

      {/* Retake History Modal */}
      {showRetakeHistory && retakeInfo && retakeInfo.totalRetakes > 0 && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detailed Retake History</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRetakeHistory(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Attempts</th>
                        <th>History</th>
                        <th>Latest Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retakeInfo.retakes.map((retake, index) => (
                        <tr key={index}>
                          <td><strong>{retake.courseCode}</strong></td>
                          <td>{retake.courseName || 'N/A'}</td>
                          <td>
                            <span className="badge bg-info">{retake.attemptCount}</span>
                          </td>
                          <td>
                            <div className="small">
                              {retake.attempts.map((attempt, i) => (
                                <div key={i}>
                                  {attempt.semester} {attempt.year}: {attempt.grade}
                                  {i === retake.attempts.length - 1 && (
                                    <span className="badge bg-success ms-1">Latest</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${retake.latestAttempt.grade === 'F' ? 'bg-danger' : 'bg-success'}`}>
                              {retake.latestAttempt.grade}
                            </span>
                            <div className="small text-muted">
                              {retake.latestAttempt.semester} {retake.latestAttempt.year}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Note:</strong> Only the latest grade is used for CGPA calculation.
                  Credit hours are counted only once per course.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRetakeHistory(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GPAStats;