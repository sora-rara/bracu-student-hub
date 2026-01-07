// src/components/career/student/MyScholarshipApplications.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const MyScholarshipApplications = () => {
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
      
      const response = await axios.get('/api/career/scholarships/my-applications/all');
      
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

  const handleViewScholarship = (scholarshipId, e) => {
    e.preventDefault();
    
    if (!scholarshipId) {
      alert('Cannot view scholarship details - ID not found');
      return;
    }
    
    // Navigate to scholarship page
    navigate(`/career/scholarships/${scholarshipId}`);
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      const response = await axios.post(`/api/career/scholarships/withdraw/${applicationId}`);
      
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

  const formatAmount = (scholarship) => {
    if (!scholarship?.funding?.amount) return 'Amount not specified';
    
    const { amount, currency, type } = scholarship.funding;
    
    let formattedAmount = '';
    
    if (currency === 'USD') formattedAmount = `$${amount.toLocaleString()}`;
    else if (currency === 'EUR') formattedAmount = `€${amount.toLocaleString()}`;
    else if (currency === 'BDT') formattedAmount = `৳${amount.toLocaleString()}`;
    else formattedAmount = `${currency} ${amount.toLocaleString()}`;
    
    if (type === 'full-tuition') return `Full Tuition`;
    if (type === 'partial') return `Partial: ${formattedAmount}`;
    
    return formattedAmount;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'pending',
      reviewed: 'reviewed',
      shortlisted: 'shortlisted',
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
      shortlisted: 'Shortlisted',
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
          <h1>My Scholarship Applications</h1>
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
          <h1>My Scholarship Applications</h1>
          <button 
            onClick={() => navigate('/career/scholarships')}
            className="btn btn-primary"
          >
            Browse More Scholarships
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
          <p>You haven't applied to any scholarships yet.</p>
          <div className="empty-actions">
            <button 
              onClick={() => navigate('/career/scholarships')}
              className="btn btn-primary"
            >
              Browse Scholarships
            </button>
          </div>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((app) => {
            const scholarship = app.scholarshipId || {};
            const scholarshipId = scholarship._id || app.scholarshipId?._id;
            const statusClass = getStatusColor(app.status);
            const hasScholarshipDetails = scholarshipId && scholarship.title;
            
            return (
              <div key={app._id} className="application-card">
                <div className="card-header">
                  <div className="organization-info">
                    {(scholarship.organization?.name) && (
                      <div className="organization-logo">
                        {scholarship.organization.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="header-content">
                      <h3 className="application-title">
                        {scholarship.title || 'Scholarship'}
                      </h3>
                      <p className="application-organization">
                        {scholarship.organization?.name || 'Organization'}
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
                  <div className="detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">{formatAmount(scholarship)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Level:</span>
                    <span className="detail-value">{scholarship.level || 'All Levels'}</span>
                  </div>
                  
                  {scholarship.category && (
                    <div className="detail-row">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{scholarship.category}</span>
                    </div>
                  )}
                  
                  {app.essayText && (
                    <div className="detail-row full-width">
                      <span className="detail-label">Essay Preview:</span>
                      <div className="essay-preview">
                        {app.essayText.length > 150 
                          ? `${app.essayText.substring(0, 150)}...` 
                          : app.essayText}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {hasScholarshipDetails ? (
                    <button
                      onClick={(e) => handleViewScholarship(scholarshipId, e)}
                      className="btn btn-view"
                    >
                      View Scholarship Details
                    </button>
                  ) : (
                    <button
                      className="btn btn-view"
                      disabled
                      title="Scholarship details not available"
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

export default MyScholarshipApplications;