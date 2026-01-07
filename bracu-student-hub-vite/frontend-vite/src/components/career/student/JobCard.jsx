// src/components/career/student/JobCard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import "../../../App.css";

const JobCard = ({ job, featured = false }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    checkIfSaved();
    checkApplicationStatus();
  }, [job._id]);

  const checkIfSaved = async () => {
    try {
      const saved = localStorage.getItem(`saved_job_${job._id}`);
      setIsSaved(saved === 'true');
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get(`/api/career/jobs/check/${job._id}`);
      if (response.data.success) {
        setHasApplied(response.data.hasApplied);
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      if (isSaved) {
        await axios.delete(`/api/career/jobs/${job._id}/save`);
        localStorage.removeItem(`saved_job_${job._id}`);
        setIsSaved(false);
      } else {
        await axios.post(`/api/career/jobs/${job._id}/save`);
        localStorage.setItem(`saved_job_${job._id}`, 'true');
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving job:', err);
      alert('Failed to save job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const authCheck = await axios.get('/api/auth/check');
      if (!authCheck.data.loggedIn) {
        alert('Please login to apply');
        navigate('/login');
        return;
      }
    } catch (err) {
      alert('Please login to apply');
      navigate('/login');
      return;
    }

    navigate(`/career/jobs/${job._id}/apply`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Open until filled';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days left`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (job) => {
    if (!job.salary) return 'Negotiable';
    
    const { amount, period, currency } = job.salary;
    
    let formatted = '';
    if (currency === 'USD') formatted = `$${amount}`;
    else if (currency === 'BDT') formatted = `৳${amount}`;
    else formatted = `${currency} ${amount}`;
    
    if (period === 'hourly') return `${formatted}/hour`;
    if (period === 'weekly') return `${formatted}/week`;
    if (period === 'monthly') return `${formatted}/month`;
    
    return formatted;
  };

  const isJobActive = (job) => {
    const status = job.status?.toLowerCase();
    return status === 'active' || status === 'open' || status === 'published';
  };

  const isExpired = (job) => {
    if (!job.deadline) return false;
    const deadline = new Date(job.deadline);
    const now = new Date();
    return deadline < now;
  };

  const active = isJobActive(job);
  const expired = isExpired(job);

  if (!active && !featured) return null;

  return (
    <div className={`job-card ${featured ? 'featured' : ''} ${expired ? 'expired' : ''}`}>
      {featured && <div className="featured-badge">Featured</div>}
      {expired && <div className="expired-badge">Expired</div>}
      
      <div className="card-header">
        <div className="company-logo">
          <div className="logo-placeholder">
            {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
        </div>
        <div className="header-info">
          <h3 className="job-title">{job.title}</h3>
          <p className="company-name">{job.company?.name || 'Company'}</p>
          <div className="card-tags">
            <span className="type-tag">{job.jobType || 'Part-time'}</span>
            <span className="location-tag">{job.location || 'Remote'}</span>
          </div>
        </div>
        <button 
          className={`save-btn ${isSaved ? 'saved' : ''} ${isLoading ? 'loading' : ''}`}
          onClick={handleSave}
          disabled={isLoading}
          title={isSaved ? 'Remove from saved' : 'Save for later'}
        >
          {isLoading ? '...' : (isSaved ? '♥' : '♡')}
        </button>
      </div>

      <div className="card-body">
        <p className="short-description">
          {job.shortDescription || 
           (job.description ? job.description.substring(0, 120) + '...' : 'No description available')}
        </p>
      </div>

      <div className="card-details">
        <div className="detail-item" title="Salary">
          <span className="detail-icon">💰</span>
          <span className="detail-text">{formatSalary(job)}</span>
        </div>
        <div className="detail-item" title="Schedule">
          <span className="detail-icon">⏰</span>
          <span className="detail-text">{job.schedule || 'Flexible'}</span>
        </div>
        <div className="detail-item" title="Deadline">
          <span className="detail-icon">📅</span>
          <span className={`detail-text ${expired ? 'expired-text' : ''}`}>
            {formatDate(job.deadline)}
          </span>
        </div>
        <div className="detail-item" title="Duration">
          <span className="detail-icon">📆</span>
          <span className="detail-text">{job.duration || 'Ongoing'}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="footer-left">
          {hasApplied ? (
            <span className="application-status applied">
              Applied ✓
            </span>
          ) : (
            <span className={`status-badge ${job.status?.toLowerCase()}`}>
              {job.status || 'Active'}
            </span>
          )}
          {job.isFeatured && <span className="featured-indicator">⭐</span>}
        </div>
        <div className="footer-right">
          <Link 
            to={`/career/jobs/${job._id}`} 
            className="btn-details"
            onClick={(e) => e.stopPropagation()}
          >
            View Details
          </Link>
          <button 
            className={`btn-apply ${expired || !active || hasApplied ? 'disabled' : ''}`}
            onClick={handleApplyClick}
            disabled={expired || !active || hasApplied}
            title={
              hasApplied ? 'Already Applied' :
              expired ? 'Application deadline has passed' : 
              !active ? 'Job is not active' : 
              'Apply Now'
            }
          >
            {hasApplied ? 'Applied ✓' : 
             expired ? 'Expired' : 
             !active ? 'Inactive' : 
             'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;