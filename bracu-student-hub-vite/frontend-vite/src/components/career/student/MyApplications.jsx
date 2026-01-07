// src/components/career/student/MyApplications.jsx - REMOVED VIEW RESUME BUTTON
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/api/applications/my-applications');
      
      if (response.data.success) {
        const applicationsData = response.data.data || [];
        setApplications(applicationsData);
      } else {
        setError(response.data.error || 'Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      
      if (err.response?.status === 401) {
        setError('Please login to view your applications');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError('Failed to load applications. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewInternship = (internshipId, e) => {
    e.preventDefault();
    
    if (!internshipId) {
      alert('Cannot view internship details - ID not found');
      return;
    }
    
    // Navigate to internship page
    navigate(`/career/internships/${internshipId}`);
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      const response = await axios.post(`/api/applications/withdraw/${applicationId}`);
      
      if (response.data.success) {
        alert('Application withdrawn successfully');
        fetchApplications();
      }
    } catch (err) {
      console.error('Error withdrawing application:', err);
      alert('Failed to withdraw application');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'pending',
      reviewed: 'reviewed',
      accepted: 'accepted',
      rejected: 'rejected',
      withdrawn: 'withdrawn'
    };
    return colors[status] || 'withdrawn';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending Review',
      reviewed: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="my-applications-page">
        <div className="page-header">
          <h1>My Applications</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-applications-page">
      <div className="page-header">
        <div className="header-content">
          <h1>My Applications</h1>
          <button 
            onClick={() => navigate('/career/internships')}
            className="btn btn-primary"
          >
            Browse More Internships
          </button>
        </div>
        {applications.length > 0 && (
          <p className="page-subtitle">
            You have {applications.length} application{applications.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <strong>Error:</strong> {error}
            <div className="alert-actions">
              <button onClick={fetchApplications} className="btn btn-sm">
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No Applications Yet</h3>
          <p>You haven't applied to any internships yet.</p>
          <div className="empty-actions">
            <button 
              onClick={() => navigate('/career/internships')}
              className="btn btn-primary"
            >
              Browse Internships
            </button>
          </div>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((app) => {
            const internship = app.internshipId || {};
            const internshipId = internship._id || app.internshipId?._id;
            const statusClass = getStatusColor(app.status);
            const hasInternshipDetails = internshipId && internship.title;
            
            return (
              <div key={app._id} className="application-card">
                <div className="card-header">
                  <div className="company-info">
                    {(internship.company || internship.organization?.name) && (
                      <div className="company-logo">
                        {(internship.company || internship.organization?.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="header-content">
                      <h3 className="application-title">
                        {internship.title || 'Internship Position'}
                      </h3>
                      <p className="application-company">
                        {internship.company || 
                         internship.organization?.name || 
                         'Company'}
                      </p>
                    </div>
                  </div>
                  <div className="status-section">
                    <span className={`status-badge status-${statusClass}`}>
                      {getStatusText(app.status)}
                    </span>
                    <span className="application-date">
                      Applied: {formatDate(app.appliedAt)}
                    </span>
                  </div>
                </div>

                <div className="card-body">
                  {internship.location && (
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">
                        {internship.location.type === 'remote' ? 'Remote' : 
                         internship.location.city || 
                         internship.location.type || 
                         'Not specified'}
                      </span>
                    </div>
                  )}
                  
                  {internship.type && (
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{internship.type}</span>
                    </div>
                  )}
                  
                  {app.coverLetterText && (
                    <div className="detail-row full-width">
                      <span className="detail-label">Cover Letter:</span>
                      <div className="cover-letter-preview">
                        {app.coverLetterText.length > 150 
                          ? `${app.coverLetterText.substring(0, 150)}...` 
                          : app.coverLetterText}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {hasInternshipDetails ? (
                    <button
                      onClick={(e) => handleViewInternship(internshipId, e)}
                      className="btn btn-view"
                    >
                      View Internship Details
                    </button>
                  ) : (
                    <button
                      className="btn btn-view"
                      disabled
                      title="Internship details not available"
                    >
                      Details Unavailable
                    </button>
                  )}
                  
                  {app.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(app._id)}
                      className="btn btn-withdraw"
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyApplications;