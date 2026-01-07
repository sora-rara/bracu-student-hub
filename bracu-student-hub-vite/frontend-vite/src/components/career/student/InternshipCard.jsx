// src/components/career/student/InternshipCard.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import "../../../App.css";

// Helper functions that were missing
const isInternshipExpired = (internship) => {
  if (!internship.applicationDetails?.deadline) return false;
  const deadline = new Date(internship.applicationDetails.deadline);
  const now = new Date();
  return deadline < now;
};

const isInternshipActive = (internship) => {
  const status = internship.status?.toLowerCase();
  return status === 'active' || status === 'published' || status === 'open';
};

const formatCategory = (category) => {
  if (!category) return 'General';
  return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatLocation = (location) => {
  if (!location) return 'Location not specified';
  
  const { type, city, country } = location;
  
  if (type === 'remote') return 'Remote';
  if (type === 'hybrid') return 'Hybrid';
  if (city && country) return `${city}, ${country}`;
  if (city) return `${city}`;
  
  return 'On-site';
};

const formatCompensation = (compensation) => {
  if (!compensation) return 'Unpaid';
  
  const { type, amount, currency, frequency } = compensation;
  
  if (type === 'paid' && amount) {
    const freq = frequency ? `/${frequency}` : '/hour';
    return `$${amount}${freq}`;
  }
  if (type === 'stipend' && amount) {
    return `Stipend: $${amount}`;
  }
  
  const compensationMap = {
    'unpaid': 'Unpaid',
    'academic-credit': 'Academic Credit',
    'housing-provided': 'Housing Provided',
    'transportation': 'Transportation Provided',
    'meal-allowance': 'Meal Allowance'
  };
  
  return compensationMap[type] || 'Unpaid';
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

const InternshipCard = ({ internship, featured = false }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    checkIfSaved();
    checkApplicationStatus();
  }, [internship._id]);

  const checkIfSaved = async () => {
    try {
      const saved = localStorage.getItem(`saved_${internship._id}`);
      setIsSaved(saved === 'true');
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get(`/api/applications/check/${internship._id}`);
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
        localStorage.removeItem(`saved_${internship._id}`);
        setIsSaved(false);
      } else {
        localStorage.setItem(`saved_${internship._id}`, 'true');
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving internship:', err);
      alert('Failed to save internship. Please try again.');
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
    if (internship.applicationDetails?.applicationLink) {
      const useExternal = window.confirm(
        'This internship uses an external application system.\n\n' +
        'Click OK to apply on their website, or Cancel to use our application portal.'
      );
      
      if (useExternal) {
        window.open(internship.applicationDetails.applicationLink, '_blank');
        return;
      }
    }

    // Navigate to our application portal
    navigate(`/career/internships/${internship._id}/apply`);
  };

  const isExpired = isInternshipExpired(internship);
  const isActive = isInternshipActive(internship);
  const isExternalApplication = !!internship.applicationDetails?.applicationLink;

  if (!isActive && !featured) {
    return null; // Don't render inactive internships in student view
  }

  return (
    <div className={`internship-card ${featured ? 'featured' : ''} ${isExpired ? 'expired' : ''}`}>
      {featured && <div className="featured-badge">Featured</div>}
      {isExpired && <div className="expired-badge">Expired</div>}
      {!isActive && <div className="inactive-badge">Inactive</div>}
      
      <div className="card-header">
        <div className="company-logo">
          <div className="logo-placeholder">
            {internship.organization?.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
        </div>
        <div className="header-info">
          <h3 className="internship-title">{internship.title}</h3>
          <p className="company-name">{internship.organization?.name || 'Company'}</p>
          <div className="card-tags">
            <span className="type-tag">{internship.type || 'Internship'}</span>
            <span className="category-tag">{formatCategory(internship.category)}</span>
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
          {internship.shortDescription || 
           (internship.description ? internship.description.substring(0, 120) + '...' : 'No description available')}
        </p>
      </div>

      <div className="card-details">
        <div className="detail-item" title="Location">
          <span className="detail-icon">Medium: </span>
          <span className="detail-text">{formatLocation(internship.location)}</span>
        </div>
        <div className="detail-item" title="Compensation">
          <span className="detail-icon">Type: </span>
          <span className="detail-text">{formatCompensation(internship.compensation)}</span>
        </div>
        <div className="detail-item" title="Application Deadline">
          <span className="detail-icon">📅 Deadline: </span>
          <span className={`detail-text ${isExpired ? 'expired-text' : ''}`}>
            {formatDate(internship.applicationDetails?.deadline)}
          </span>
        </div>
        <div className="detail-item" title="Views">
          <span className="detail-icon">Viewed by: </span>
          <span className="detail-text">{internship.views || 0}</span>
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
            <span className={`status-badge ${internship.status?.toLowerCase()}`}>
              {internship.status || 'Active'}
            </span>
          )}
          {internship.isFeatured && <span className="featured-indicator">⭐</span>}
        </div>
        <div className="footer-right">
          <Link 
            to={`/career/internships/${internship._id}`} 
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
              !isActive ? 'Internship is not active' : 
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

export default InternshipCard;