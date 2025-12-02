import React, { useState, useEffect } from 'react';
import authService from '../../../services/auth';
import apiService from '../../../services/api';

function Profile() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await apiService.calculateCGPA();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="card">
        <h2>Profile</h2>
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="card profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            <span className="profile-role">{user.role}</span>
          </div>
        </div>

        {stats && (
          <div className="profile-stats">
            <h3>Academic Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.cgpa.toFixed(2)}</div>
                <div className="stat-label">CGPA</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalSemesters}</div>
                <div className="stat-label">Semesters</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalCredits}</div>
                <div className="stat-label">Credits</div>
              </div>
            </div>
          </div>
        )}

        <div className="profile-actions">
          <button className="btn btn-primary">Edit Profile</button>
          <button className="btn btn-outline">Change Password</button>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;