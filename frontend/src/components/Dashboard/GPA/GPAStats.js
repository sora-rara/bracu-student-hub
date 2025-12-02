
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function GPAStats({ studentId }) {
  const [stats, setStats] = useState(null);
  const [method, setMethod] = useState('accumulated'); // accumulated or sequential
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      // Fetch all semesters for the student
      const semestersRes = await axios.get(`/api/gpa/semesters?studentId=${studentId}`);
      const semesters = semestersRes.data;

      // Fetch CGPA based on selected method
      const cgpaRes = await axios.get(`/api/gpa/calculate?studentId=${studentId}&method=${method}`);
      const cgpa = cgpaRes.data.cgpa;

      setStats({
        cgpa,
        totalCredits: semesters.reduce((sum, sem) => sum + (sem.totalCredits || 0), 0),
        totalSemesters: semesters.length,
        semesterDetails: semesters
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch GPA stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [method, studentId]);

  if (loading) return <p>Loading GPA stats...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!stats) return null;

  const getGPAStatus = (gpa) => {
    if (gpa >= 3.7) return { color: '#27ae60', text: 'Excellent' };
    if (gpa >= 3.3) return { color: '#2ecc71', text: 'Very Good' };
    if (gpa >= 3.0) return { color: '#f1c40f', text: 'Good' };
    if (gpa >= 2.7) return { color: '#e67e22', text: 'Satisfactory' };
    return { color: '#e74c3c', text: 'Needs Improvement' };
  };

  const status = getGPAStatus(stats.cgpa);

  return (
    <div className="dashboard-grid">
      <div className="card gpa-card">
        <h3>CGPA Overview</h3>
        <div className="form-group">
          <label>Calculation Method:</label>
          <select className="form-control" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="accumulated">Accumulated CGPA</option>
            <option value="sequential">Sequential CGPA</option>
          </select>
        </div>

        <div className="gpa-result" style={{ color: status.color }}>
          {stats.cgpa.toFixed(2)}
        </div>
        <p className="gpa-status" style={{ color: status.color }}>{status.text}</p>
        <div className="gpa-details">
          <p><strong>Total Credits:</strong> {stats.totalCredits}</p>
          <p><strong>Total Semesters:</strong> {stats.totalSemesters}</p>
        </div>
      </div>

      <div className="card">
        <h3>Semester Breakdown</h3>
        {stats.semesterDetails && stats.semesterDetails.length > 0 ? (
          <div className="semester-list">
            {stats.semesterDetails.map((sem, index) => (
              <div key={index} className="semester-item">
                <div className="semester-header">
                  <span className="semester-name">{sem.semester} {sem.year}</span>
                  <span className="semester-gpa">{sem.semesterGPA ? sem.semesterGPA.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="semester-credits">Credits: {sem.totalCredits || 0}</div>
                <div className="semester-courses">
                  Courses: {sem.courses ? sem.courses.length : 0}
                  {sem.courses && sem.courses.some(c => !c.courseName) && (
                    <span className="text-muted small"> (some without names)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No semester data available</p>
        )}
      </div>
    </div>
  );
}

export default GPAStats;
