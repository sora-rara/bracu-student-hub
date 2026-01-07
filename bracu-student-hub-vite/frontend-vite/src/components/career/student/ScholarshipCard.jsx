// src/components/career/student/ScholarshipCard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import "../../../App.css";

const isScholarshipExpired = (scholarship) => {
  if (!scholarship.applicationDetails?.deadline) return false;
  const deadline = new Date(scholarship.applicationDetails.deadline);
  const now = new Date();
  return deadline < now;
};

const isScholarshipActive = (scholarship) => {
  const status = scholarship.status?.toLowerCase();
  return status === 'active' || status === 'published' || status === 'open';
};

const formatCategory = (category) => {
  if (!category) return 'General';
  return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatLocation = (scholarship) => {
  if (!scholarship.location) return 'Location not specified';
  
  const { eligibility, coverage } = scholarship;
  
  if (eligibility === 'international') return 'International';
  if (eligibility === 'domestic') return 'Domestic';
  if (eligibility === 'regional') return 'Regional';
  
  return 'Global';
};

const formatAmount = (scholarship) => {
  if (!scholarship.funding) return 'Amount not specified';
  
  const { amount, currency, type, renewable } = scholarship.funding;
  
  let formattedAmount = '';
  
  if (currency === 'USD') formattedAmount = `$${amount}`;
  else if (currency === 'EUR') formattedAmount = `€${amount}`;
  else if (currency === 'BDT') formattedAmount = `৳${amount}`;
  else formattedAmount = `${currency} ${amount}`;
  
  if (type === 'full-tuition') return `Full Tuition (${formattedAmount})`;
  if (type === 'partial') return `Partial (${formattedAmount})`;
  if (type === 'stipend') return `Stipend: ${formattedAmount}`;
  if (type === 'research-grant') return `Research Grant: ${formattedAmount}`;
  
  return formattedAmount;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Rolling deadline';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Deadline passed';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days remaining`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const ScholarshipCard = ({ scholarship, featured = false }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    checkIfSaved();
    checkApplicationStatus();
  }, [scholarship._id]);

  const checkIfSaved = async () => {
    try {
      const saved = localStorage.getItem(`saved_scholarship_${scholarship._id}`);
      setIsSaved(saved === 'true');
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get(`/api/career/scholarships/check/${scholarship._id}`);
      if (response.data.success) {
        setHasApplied(response.data.hasApplied);
        setApplicationStatus(response.data.applicationStatus);
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
      // Call API to unsave
      await axios.delete(`/api/career/scholarships/${scholarship._id}/save`);
      localStorage.removeItem(`saved_scholarship_${scholarship._id}`);
      setIsSaved(false);
    } else {
      // Call API to save
      await axios.post(`/api/career/scholarships/${scholarship._id}/save`);
      localStorage.setItem(`saved_scholarship_${scholarship._id}`, 'true');
      setIsSaved(true);
    }
  } catch (err) {
    console.error('Error saving scholarship:', err);
    alert('Failed to save scholarship. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
  const handleApplyClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check login
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

    // If external link, ask user
    if (scholarship.applicationDetails?.applicationLink) {
      const useExternal = window.confirm(
        'This scholarship uses an external application system.\n\n' +
        'Click OK to apply on their website, or Cancel to use our application portal.'
      );
      
      if (useExternal) {
        window.open(scholarship.applicationDetails.applicationLink, '_blank');
        return;
      }
    }

    // Navigate to our application portal
    navigate(`/career/scholarships/${scholarship._id}/apply`);
  };

  const isExpired = isScholarshipExpired(scholarship);
  const isActive = isScholarshipActive(scholarship);
  const isExternalApplication = !!scholarship.applicationDetails?.applicationLink;

  if (!isActive && !featured) {
    return null; // Don't render inactive scholarships in student view
  }

  return (
    <div className={`scholarship-card ${featured ? 'featured' : ''} ${isExpired ? 'expired' : ''}`}>
      {featured && <div className="featured-badge">Featured</div>}
      {isExpired && <div className="expired-badge">Expired</div>}
      {!isActive && <div className="inactive-badge">Inactive</div>}
      
      <div className="card-header">
        <div className="company-logo">
          <div className="logo-placeholder">
            {scholarship.organization?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
        </div>
        <div className="header-info">
          <h3 className="scholarship-title">{scholarship.title}</h3>
          <p className="company-name">{scholarship.organization?.name || 'Organization'}</p>
          <div className="card-tags">
            <span className="type-tag">{scholarship.type || 'Scholarship'}</span>
            <span className="category-tag">{formatCategory(scholarship.category)}</span>
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
          {scholarship.shortDescription || 
           (scholarship.description ? scholarship.description.substring(0, 120) + '...' : 'No description available')}
        </p>
      </div>

      <div className="card-details">
        <div className="detail-item" title="Eligibility">
          <span className="detail-icon"></span>
          <span className="detail-text">{formatLocation(scholarship)}</span>
        </div>
        <div className="detail-item" title="Amount">
          <span className="detail-icon"> </span>
          <span className="detail-text">{formatAmount(scholarship)}</span>
        </div>
        <div className="detail-item" title="Application Deadline">
          <span className="detail-icon">📅 </span>
          <span className={`detail-text ${isExpired ? 'expired-text' : ''}`}>
            {formatDate(scholarship.applicationDetails?.deadline)}
          </span>
        </div>
        <div className="detail-item" title="Level">
          <span className="detail-icon"> </span>
          <span className="detail-text">{scholarship.level || 'All Levels'}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="footer-left">
          {hasApplied ? (
            <span className={`application-status ${applicationStatus}`}>
              {applicationStatus === 'pending' ? 'Applied' : 
               applicationStatus === 'reviewed' ? 'Reviewed' :
               applicationStatus === 'accepted' ? 'Accepted' :
               applicationStatus === 'rejected' ? 'Rejected' : 'Withdrawn'}
            </span>
          ) : (
            <span className={`status-badge ${scholarship.status?.toLowerCase()}`}>
              {scholarship.status || 'Active'}
            </span>
          )}
          {scholarship.isFeatured && <span className="featured-indicator">⭐</span>}
        </div>
        <div className="footer-right">
          <Link 
            to={`/career/scholarships/${scholarship._id}`} 
            className="btn-details"
            onClick={(e) => e.stopPropagation()}
          >
            View Details
          </Link>
          <button 
            className={`btn-apply ${isExpired || !isActive || hasApplied ? 'disabled' : ''}`}
            onClick={handleApplyClick}
            disabled={isExpired || !isActive || hasApplied}
            title={
              hasApplied ? 'Already Applied' :
              isExpired ? 'Application deadline has passed' : 
              !isActive ? 'Scholarship is not active' : 
              'Apply Now'
            }
          >
            {hasApplied ? 'Applied ✓' : 
             isExpired ? 'Expired' : 
             !isActive ? 'Inactive' : 
             'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipCard;