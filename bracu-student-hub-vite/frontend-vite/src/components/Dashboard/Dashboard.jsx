import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api.jsx';
import authService from '../../services/auth.jsx';
import GPAStats from './GPA/GPAStats.jsx';
import axios from '../../api/axios'; // ✅ REQUIRED

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Graduation planner states
  const [graduationStats, setGraduationStats] = useState(null);
  const [graduationLoading, setGraduationLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchData();
    fetchGraduationStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const authResult = await apiService.checkAuth();

      if (!authResult || !authResult.loggedIn) {
        setError('Please log in to access your dashboard.');
        setLoading(false);
        return;
      }

      const user = authService.getCurrentUser();
      setCurrentUser(user);

      // Redirect admins
      if (user && (user.role === 'admin' || user.isAdmin)) {
        navigate('/admin');
        return;
      }

      await fetchData();
      setAuthChecked(true);
    } catch (err) {
      setError(err.message || 'Authentication check failed.');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [semestersRes, cgpaRes] = await Promise.all([
        apiService.getAllSemesters(),
        apiService.calculateCGPA()
      ]);

      setSemesters(semestersRes?.success ? semestersRes.data : []);
      setStats(cgpaRes?.success ? cgpaRes.data : null);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGraduationStats = async () => {
    try {
      const response = await axios.get('/api/graduation/progress');
      if (response.data.success) {
        setGraduationStats(response.data.data);
      }
    } catch {
      // Graduation plan may not exist — this is OK
    } finally {
      setGraduationLoading(false);
    }
  };

  const handleDeleteSemester = async (id) => {
    if (!window.confirm('Are you sure you want to delete this semester?')) return;

    try {
      setLoading(true);
      const result = await apiService.deleteSemester(id);

      if (result?.success) {
        setSuccess('Semester deleted successfully!');
        await fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result?.message || 'Failed to delete semester');
      }
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  /* ===================== UI ===================== */

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your academic data...</p>
      </div>
    );
  }

  if (error && !authChecked) {
    return (
      <div className="auth-error">
        <h3>Authentication Required</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Academic Dashboard</h1>
        {currentUser && <div className="user-welcome">Welcome, {currentUser.name}</div>}

        <div className="dashboard-actions">
          <Link to="/gpa-calculator" className="btn btn-primary">
            + Add New Semester
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <button className="btn btn-sm btn-link" onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      )}

      {success && <div className="alert alert-success">{success}</div>}

      {/* GPA Stats */}
      {currentUser?._id && <GPAStats studentId={currentUser._id} />}

      {/* ================= Graduation Widget ================= */}

      {graduationStats && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Graduation Progress</h5>

            <div className="d-flex align-items-center mb-3">
              <div className="flex-grow-1">
                <div className="progress" style={{ height: '10px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${graduationStats.metrics.progressPercentage}%`
                    }}
                  />
                </div>
              </div>
              <div className="ms-3">
                <strong>{Math.round(graduationStats.metrics.progressPercentage)}%</strong>
              </div>
            </div>

            <div className="row">
              <div className="col-6">
                <small className="text-muted">Credits</small>
                <div>
                  {graduationStats.metrics.totalCreditsCompleted}/
                  {graduationStats.metrics.totalCreditsRequired}
                </div>
              </div>
              <div className="col-6">
                <small className="text-muted">GPA</small>
                <div>{graduationStats.metrics.cumulativeGPA}</div>
              </div>
            </div>

            <Link to="/graduation" className="btn btn-outline-primary btn-sm mt-3 w-100">
              View Graduation Plan
            </Link>
          </div>
        </div>
      )}

      {!graduationStats && !graduationLoading && (
        <div className="card mb-4 text-center">
          <div className="card-body">
            <h5 className="card-title">Graduation Planner</h5>
            <p className="text-muted">Set up your graduation plan</p>
            <Link to="/graduation" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
