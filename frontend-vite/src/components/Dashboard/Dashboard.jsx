import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api.jsx';
import authService from '../../services/auth.jsx';
import GPAStats from './GPA/GPAStats.jsx';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      console.log('Checking authentication...');
      const authResult = await apiService.checkAuth();
      console.log('Auth result:', authResult);

      if (!authResult || !authResult.loggedIn) {
        setError('Please log in to access your dashboard.');
        setLoading(false);
        return;
      }

      const user = authService.getCurrentUser();
      console.log('Current user:', user);
      setCurrentUser(user);

      // **Redirect admins to /admin**
      if (user && (user.role === 'admin' || user.isAdmin)) {
        navigate('/admin');
        return;
      }

      await fetchData();
      setAuthChecked(true);
    } catch (err) {
      console.error('Auth check error details:', err);
      setError(err.message || 'Authentication check failed. Please log in again.');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const [semestersRes, cgpaRes] = await Promise.all([
        apiService.getAllSemesters(),
        apiService.calculateCGPA(),
      ]);

      if (semestersRes && semestersRes.success) {
        setSemesters(semestersRes.data || []);
      } else {
        setSemesters([]);
      }

      if (cgpaRes && cgpaRes.success) {
        setStats(cgpaRes.data);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error('Fetch error details:', err);
      setError(err.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSemester = async (id) => {
    if (window.confirm('Are you sure you want to delete this semester?')) {
      try {
        setLoading(true);
        const result = await apiService.deleteSemester(id);

        if (result && result.success) {
          setSuccess(result.message || 'Semester deleted successfully!');
          await fetchData();

          setTimeout(() => setSuccess(''), 3000);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your dashboard data...</p>
      </div>
    );
  }

  if (error && !authChecked) {
    return (
      <div className="auth-error">
        <h3>Authentication Required</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.href = '/login'}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Academic Dashboard</h1>
        {currentUser && (
          <div className="user-welcome">Welcome, {currentUser.name}</div>
        )}
        
        <div className="dashboard-actions">
          <Link to="/gpa-calculator" className="btn btn-primary">
            + Add New Semester
          </Link>
          <Link to="/budget" className="btn btn-outline">
            💰 Go to Budget
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <button className="btn btn-sm btn-link" onClick={() => setError('')} style={{ marginLeft: '10px' }}>
            Dismiss
          </button>
        </div>
      )}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="academic-dashboard">
        {currentUser && currentUser._id && (
          <GPAStats studentId={currentUser._id} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;