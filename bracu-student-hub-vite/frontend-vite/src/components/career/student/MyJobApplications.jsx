// src/components/career/student/MyJobApplications.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const MyJobApplications = () => {
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
      
      const response = await axios.get('/api/career/jobs/my-applications/all');
      
      if (response.data.success) {
        setApplications(response.data.data || []);
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

  const handleViewJob = (jobId, e) => {
    e.preventDefault();
    
    if (!jobId) {
      alert('Cannot view job details - ID not found');
      return;
    }
    
    navigate(`/career/jobs/${jobId}`);
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      // This endpoint would need to be created in backend
      const response = await axios.post(`/api/career/jobs/withdraw/${applicationId}`);
      
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

  const formatSalary = (job) => {
    if (!job?.salary) return 'Negotiable';
    
    const { amount, currency, period } = job.salary;
    
    let formatted = '';
    if (currency === 'USD') formatted = `$${amount}`;
    else if (currency === 'BDT') formatted = `৳${amount}`;
    else formatted = `${currency} ${amount}`;
    
    if (period === 'hourly') return `${formatted}/hour`;
    if (period === 'weekly') return `${formatted}/week`;
    if (period === 'monthly') return `${formatted}/month`;
    
    return formatted;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'pending',
      submitted: 'submitted',
      reviewed: 'reviewed',
      shortlisted: 'shortlisted',
      'interview-scheduled': 'shortlisted',
      accepted: 'accepted',
      rejected: 'rejected',
      withdrawn: 'withdrawn'
    };
    return colors[status] || 'withdrawn';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      submitted: 'Submitted',
      reviewed: 'Under Review',
      shortlisted: 'Shortlisted',
      'interview-scheduled': 'Interview Scheduled',
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
          <h1>My Job Applications</h1>
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
          <h1>My Job Applications</h1>
          <button 
            onClick={() => navigate('/career/jobs')}
            className="btn btn-primary"
          >
            Browse More Jobs
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
          <p>You haven't applied to any jobs yet.</p>
          <div className="empty-actions">
            <button 
              onClick={() => navigate('/career/jobs')}
              className="btn btn-primary"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((app) => {
            const job = app.jobId || {};
            const jobId = job._id || app.jobId?._id;
            const statusClass = getStatusColor(app.status);
            const hasJobDetails = jobId && job.title;
            
            return (
              <div key={app._id} className="application-card">
                <div className="card-header">
                  <div className="company-info">
                    {(job.company?.name) && (
                      <div className="company-logo">
                        {job.company.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="header-content">
                      <h3 className="application-title">
                        {job.title || 'Job'}
                      </h3>
                      <p className="application-company">
                        {job.company?.name || 'Company'}
                      </p>
                    </div>
                  </div>
                  <div className="status-section">
                    <span className={`status-badge status-${statusClass}`}>
                      {getStatusText(app.status)}
                    </span>
                    <span className="application-date">
                      Applied: {formatDate(app.submittedAt || app.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="detail-row">
                    <span className="detail-label">Salary:</span>
                    <span className="detail-value">{formatSalary(job)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{job.location || 'Remote'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{job.jobType || 'Part-time'}</span>
                  </div>
                  
                  {app.applicationData?.coverLetter && (
                    <div className="detail-row full-width">
                      <span className="detail-label">Cover Letter Preview:</span>
                      <div className="cover-preview">
                        {app.applicationData.coverLetter.length > 150 
                          ? `${app.applicationData.coverLetter.substring(0, 150)}...` 
                          : app.applicationData.coverLetter}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {hasJobDetails ? (
                    <button
                      onClick={(e) => handleViewJob(jobId, e)}
                      className="btn btn-view"
                    >
                      View Job Details
                    </button>
                  ) : (
                    <button
                      className="btn btn-view"
                      disabled
                      title="Job details not available"
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

export default MyJobApplications;