// src/components/career/student/JobDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/career/jobs/${id}`);
      
      if (response.data.success) {
        setJob(response.data.data);
        fetchSimilarJobs(response.data.data);
        checkApplicationStatus();
        checkIfSaved();
      } else {
        setError('Job not found');
      }
    } catch (err) {
      console.error('Error fetching job:', err);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarJobs = async (currentJob) => {
    try {
      const response = await axios.get(`/api/career/jobs`, {
        params: {
          jobType: currentJob.jobType,
          location: currentJob.location,
          limit: 4,
          exclude: currentJob._id
        }
      });
      
      if (response.data.success) {
        setSimilarJobs(response.data.data.slice(0, 4));
      }
    } catch (err) {
      console.error('Error fetching similar jobs:', err);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get(`/api/career/jobs/check/${id}`);
      if (response.data.success) {
        setHasApplied(response.data.hasApplied);
        setApplicationStatus(response.data.applicationStatus);
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const checkIfSaved = async () => {
    try {
      const localSaved = localStorage.getItem(`saved_job_${id}`);
      if (localSaved !== null) {
        setIsSaved(localSaved === 'true');
      }
      
      const response = await axios.get(`/api/career/jobs/${id}/is-saved`);
      if (response.data.success) {
        setIsSaved(response.data.isSaved);
        if (response.data.isSaved) {
          localStorage.setItem(`saved_job_${id}`, 'true');
        } else {
          localStorage.removeItem(`saved_job_${id}`);
        }
      }
    } catch (err) {
      console.error('Error checking saved status:', err);
      const localSaved = localStorage.getItem(`saved_job_${id}`);
      setIsSaved(localSaved === 'true');
    }
  };

  const handleSave = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      const newSavedState = !isSaved;
      
      if (newSavedState) {
        const response = await axios.post(`/api/career/jobs/${id}/save`);
        if (response.data.success) {
          setIsSaved(true);
          localStorage.setItem(`saved_job_${id}`, 'true');
          showNotification('Added to saved jobs', 'success');
        }
      } else {
        const response = await axios.delete(`/api/career/jobs/${id}/save`);
        if (response.data.success) {
          setIsSaved(false);
          localStorage.removeItem(`saved_job_${id}`);
          showNotification('Removed from saved jobs', 'info');
        }
      }
    } catch (err) {
      console.error('Error saving job:', err);
      showNotification('Failed to save job. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const handleApply = async () => {
    try {
      const authCheck = await axios.get('/api/auth/check');
      if (!authCheck.data.loggedIn) {
        showNotification('Please login to apply for jobs', 'error');
        navigate('/login', { state: { from: `/career/jobs/${id}` } });
        return;
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      showNotification('Please login to apply for jobs', 'error');
      navigate('/login', { state: { from: `/career/jobs/${id}` } });
      return;
    }

    navigate(`/career/jobs/${id}/apply`);
  };

  const handleShare = (platform) => {
    if (!job) return;
    
    const url = window.location.href;
    const title = encodeURIComponent(job.title);
    const text = encodeURIComponent(`Check out this job: ${job.title}`);
    
    switch(platform) {
      case 'email':
        window.location.href = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          showNotification('Link copied to clipboard!', 'success');
        });
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Open until filled';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffTime = date - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Deadline passed';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `${diffDays} days remaining`;
      
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const formatSalary = (job) => {
    if (!job.salary) return 'Negotiable';
    
    const { amount, period, currency } = job.salary;
    
    let formattedAmount = '';
    if (currency === 'USD') formattedAmount = `$${amount.toLocaleString()}`;
    else if (currency === 'BDT') formattedAmount = `৳${amount.toLocaleString()}`;
    else formattedAmount = `${currency} ${amount.toLocaleString()}`;
    
    if (period === 'hourly') return `${formattedAmount}/hour`;
    if (period === 'weekly') return `${formattedAmount}/week`;
    if (period === 'monthly') return `${formattedAmount}/month`;
    
    return formattedAmount;
  };

  const isJobExpired = (job) => {
    if (!job?.deadline) return false;
    try {
      const deadline = new Date(job.deadline);
      const now = new Date();
      return deadline < now;
    } catch (err) {
      return false;
    }
  };

  const isJobActive = (job) => {
    if (!job) return false;
    const status = job.status?.toLowerCase();
    return status === 'active' || status === 'published' || status === 'open';
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Application Submitted';
      case 'submitted': return 'Submitted';
      case 'under-review': return 'Under Review';
      case 'reviewed': return 'Reviewed';
      case 'shortlisted': return 'Shortlisted';
      case 'interview-scheduled': return 'Interview Scheduled';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return status || 'Unknown';
    }
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diffTime = deadlineDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (err) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Job Not Found</h3>
        <p>{error || 'The job you are looking for does not exist or has been removed.'}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/career/jobs')} className="btn-primary">
            Browse All Jobs
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isExpired = isJobExpired(job);
  const isActive = isJobActive(job);
  const daysRemaining = getDaysRemaining(job.deadline);

  return (
    <div className="job-detail-page">
      {/* Header */}
      <div className="detail-header">
        <div className="header-top">
          <button onClick={() => navigate('/career/jobs')} className="back-btn">
            ← Back to Jobs
          </button>
          <div className="header-meta">
            <span className="meta-item">
              <span className="meta-icon">👁</span> {job.views || 0} views
            </span>
            <span className="meta-item">
              <span className="meta-icon">📄</span> {job.applicationsCount || 0} applications
            </span>
          </div>
        </div>
        
        <div className="header-content">
          <div className="company-info">
            <div className="company-logo">
              {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="company-badge">
                {job.isFeatured && <span className="featured-tag">⭐ Featured</span>}
                <span className={`status-badge ${job.status?.toLowerCase()}`}>
                  {job.status}
                </span>
              </div>
              <h1>{job.title}</h1>
              <h2>{job.company?.name}</h2>
              {job.company?.website && (
                <a 
                  href={job.company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="company-website"
                >
                  🌐 {job.company.website}
                </a>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className={`save-btn ${isSaved ? 'saved' : ''} ${saving ? 'loading' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '...' : isSaved ? '♥ Saved' : '♡ Save for Later'}
            </button>
            {hasApplied ? (
              <div className="application-status">
                <span className="status-label">Your Application:</span>
                <span className={`status-value ${applicationStatus}`}>
                  {getStatusText(applicationStatus)}
                </span>
              </div>
            ) : (
              <button 
                className={`apply-btn ${!isActive || isExpired ? 'disabled' : ''}`} 
                onClick={handleApply}
                disabled={!isActive || isExpired}
              >
                {!isActive ? 'Inactive' : 
                 isExpired ? 'Expired' : 
                 'Apply Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deadline Alert */}
      {daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
        <div className="deadline-alert">
          <span className="alert-icon">⏰</span>
          <div className="alert-content">
            <strong>Hurry! Application closes in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}.</strong>
            <span>Deadline: {formatDate(job.deadline)}</span>
          </div>
        </div>
      )}

      {/* Quick Info Cards */}
      <div className="quick-info-grid">
        <div className="info-card">
          <span className="info-icon">💰</span>
          <div className="info-content">
            <span className="info-label">Salary</span>
            <span className="info-value">{formatSalary(job)}</span>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">📍</span>
          <div className="info-content">
            <span className="info-label">Location</span>
            <span className="info-value">{job.location || 'Remote'}</span>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">⏰</span>
          <div className="info-content">
            <span className="info-label">Schedule</span>
            <span className="info-value">{job.schedule || 'Flexible'}</span>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">📅</span>
          <div className="info-content">
            <span className="info-label">Application Deadline</span>
            <span className="info-value">{formatDate(job.deadline)}</span>
            {daysRemaining !== null && daysRemaining > 0 && (
              <span className="info-subtext">{daysRemaining} days remaining</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        <div className="main-content">
          {/* Description */}
          <section className="content-section">
            <div className="section-header">
              <h3>Job Overview</h3>
              <div className="section-badges">
                <span className="section-badge">{job.jobType || 'Part-time'}</span>
                {job.duration && (
                  <span className="section-badge duration">
                    {job.duration}
                  </span>
                )}
              </div>
            </div>
            <div className="section-content">
              <p className="description-text">{job.description}</p>
              {job.shortDescription && (
                <p className="short-description">{job.shortDescription}</p>
              )}
            </div>
          </section>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <section className="content-section">
              <h3>📋 Responsibilities</h3>
              <ul className="requirements-list">
                {job.responsibilities.map((responsibility, index) => (
                  <li key={index}>
                    <span className="checkmark">•</span>
                    {responsibility}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <section className="content-section">
              <h3>🎯 Requirements</h3>
              <ul className="requirements-list">
                {job.requirements.map((requirement, index) => (
                  <li key={index}>
                    <span className="checkmark">✓</span>
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <section className="content-section">
              <h3>🌟 Benefits</h3>
              <ul className="benefits-list">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>
                    <span className="checkmark">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* How to Apply */}
          <section className="content-section">
            <h3>📝 How to Apply</h3>
            <div className="application-instructions">
              <p>Click the "Apply Now" button to submit your application through our portal.</p>
              
              {job.applicationInstructions && (
                <div className="instructions-section">
                  <h4>Additional Instructions:</h4>
                  <p>{job.applicationInstructions}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h3>📋 Job Details</h3>
              <span className={`urgency-badge ${daysRemaining !== null && daysRemaining <= 7 ? 'urgent' : ''}`}>
                {job.deadline && new Date(job.deadline) < new Date() ? 'Closed' : 'Open'}
              </span>
            </div>
            <div className="sidebar-info">
              <div className="sidebar-item">
                <span className="sidebar-label">Job Type:</span>
                <span className="sidebar-value">{job.jobType || 'Part-time'}</span>
              </div>
              <div className="sidebar-item">
                <span className="sidebar-label">Location:</span>
                <span className="sidebar-value">{job.location || 'Remote'}</span>
              </div>
              <div className="sidebar-item">
                <span className="sidebar-label">Schedule:</span>
                <span className="sidebar-value">{job.schedule || 'Flexible'}</span>
              </div>
              <div className="sidebar-item">
                <span className="sidebar-label">Duration:</span>
                <span className="sidebar-value">{job.duration || 'Ongoing'}</span>
              </div>
              <div className="sidebar-item">
                <span className="sidebar-label">Deadline:</span>
                <span className="sidebar-value">{formatDate(job.deadline)}</span>
              </div>
              {job.contactEmail && (
                <div className="sidebar-item">
                  <span className="sidebar-label">Contact Email:</span>
                  <a 
                    href={`mailto:${job.contactEmail}`}
                    className="sidebar-value link"
                  >
                    {job.contactEmail}
                  </a>
                </div>
              )}
            </div>
            <button 
              className={`sidebar-apply-btn ${!isActive || isExpired || hasApplied ? 'disabled' : ''}`} 
              onClick={handleApply}
              disabled={!isActive || isExpired || hasApplied}
            >
              {hasApplied ? getStatusText(applicationStatus) :
               !isActive ? 'Job Inactive' :
               isExpired ? 'Application Closed' :
               'Apply Now'}
            </button>
          </div>

          <div className="sidebar-card">
            <h3>📤 Share This Job</h3>
            <div className="share-buttons">
              <button 
                className="share-btn email" 
                onClick={() => handleShare('email')}
                title="Share via Email"
              >
                <span className="share-icon">📧</span> Email
              </button>
              <button 
                className="share-btn copy" 
                onClick={() => handleShare('copy')}
                title="Copy Link"
              >
                <span className="share-icon">📋</span> Copy
              </button>
              <button 
                className="share-btn whatsapp" 
                onClick={() => handleShare('whatsapp')}
                title="Share on WhatsApp"
              >
                <span className="share-icon">💬</span> WhatsApp
              </button>
              <button 
                className="share-btn linkedin" 
                onClick={() => handleShare('linkedin')}
                title="Share on LinkedIn"
              >
                <span className="share-icon">💼</span> LinkedIn
              </button>
            </div>
          </div>

          {/* Company Info */}
          {job.company && (
            <div className="sidebar-card">
              <h3>🏢 About {job.company.name}</h3>
              <div className="company-sidebar-info">
                {job.company.industry && (
                  <div className="company-detail">
                    <span className="company-label">Industry:</span>
                    <span className="company-value">{job.company.industry}</span>
                  </div>
                )}
                {job.company.size && (
                  <div className="company-detail">
                    <span className="company-label">Size:</span>
                    <span className="company-value">
                      {job.company.size.charAt(0).toUpperCase() + job.company.size.slice(1)}
                    </span>
                  </div>
                )}
                {job.company.description && (
                  <div className="company-detail">
                    <span className="company-label">About:</span>
                    <p className="company-value">{job.company.description}</p>
                  </div>
                )}
                {job.company.website && (
                  <div className="company-detail">
                    <span className="company-label">Website:</span>
                    <a 
                      href={job.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="company-value link"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Opportunities */}
      {similarJobs.length > 0 && (
        <div className="similar-section">
          <div className="section-header">
            <h3>🔍 Similar Jobs</h3>
            <p className="section-subtitle">Other opportunities you might be interested in</p>
          </div>
          <div className="similar-grid">
            {similarJobs.map(similar => (
              <Link 
                key={similar._id} 
                to={`/career/jobs/${similar._id}`} 
                className="similar-card"
              >
                <div className="similar-header">
                  <div className="similar-logo">
                    {similar.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h4>{similar.title}</h4>
                    <p className="similar-company">{similar.company?.name}</p>
                  </div>
                </div>
                <div className="similar-details">
                  <span className="similar-salary">{formatSalary(similar)}</span>
                  <span className="similar-location">{similar.location || 'Remote'}</span>
                  <span className="similar-deadline">
                    {formatDate(similar.deadline)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="similar-action">
            <Link to="/career/jobs" className="view-all-btn">
              View All Jobs →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;