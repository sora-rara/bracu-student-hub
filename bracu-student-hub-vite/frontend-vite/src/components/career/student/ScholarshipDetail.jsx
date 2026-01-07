// src/components/career/student/ScholarshipDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const ScholarshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [similarScholarships, setSimilarScholarships] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchScholarship();
  }, [id]);

  const fetchScholarship = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/career/scholarships/${id}`);
      
      if (response.data.success) {
        setScholarship(response.data.data);
        // Fetch similar scholarships if not included
        fetchSimilarScholarships(response.data.data);
        checkApplicationStatus();
        checkIfSaved();
      } else {
        setError('Scholarship not found');
      }
    } catch (err) {
      console.error('Error fetching scholarship:', err);
      setError('Failed to load scholarship details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarScholarships = async (currentScholarship) => {
    try {
      // Fetch similar scholarships based on category, level, etc.
      const response = await axios.get(`/api/career/scholarships`, {
        params: {
          category: currentScholarship.category,
          level: currentScholarship.level,
          limit: 4,
          exclude: currentScholarship._id
        }
      });
      
      if (response.data.success) {
        setSimilarScholarships(response.data.data.slice(0, 4));
      }
    } catch (err) {
      console.error('Error fetching similar scholarships:', err);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get(`/api/career/scholarships/check/${id}`);
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
      // First check localStorage for quick response
      const localSaved = localStorage.getItem(`saved_scholarship_${id}`);
      if (localSaved !== null) {
        setIsSaved(localSaved === 'true');
      }
      
      // Then check with server for accurate state
      const response = await axios.get(`/api/career/scholarships/${id}/is-saved`);
      if (response.data.success) {
        setIsSaved(response.data.isSaved);
        // Update localStorage to match server state
        if (response.data.isSaved) {
          localStorage.setItem(`saved_scholarship_${id}`, 'true');
        } else {
          localStorage.removeItem(`saved_scholarship_${id}`);
        }
      }
    } catch (err) {
      console.error('Error checking saved status:', err);
      // If server check fails, use localStorage value
      const localSaved = localStorage.getItem(`saved_scholarship_${id}`);
      setIsSaved(localSaved === 'true');
    }
  };

  const handleSave = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      const newSavedState = !isSaved;
      
      if (newSavedState) {
        // Call API to save
        const response = await axios.post(`/api/career/scholarships/${id}/save`);
        if (response.data.success) {
          setIsSaved(true);
          localStorage.setItem(`saved_scholarship_${id}`, 'true');
          // Show success message
          showNotification('Added to saved scholarships', 'success');
        }
      } else {
        // Call API to unsave
        const response = await axios.delete(`/api/career/scholarships/${id}/save`);
        if (response.data.success) {
          setIsSaved(false);
          localStorage.removeItem(`saved_scholarship_${id}`);
          // Show success message
          showNotification('Removed from saved scholarships', 'info');
        }
      }
    } catch (err) {
      console.error('Error saving scholarship:', err);
      if (err.response?.data?.error === 'Scholarship already saved') {
        setIsSaved(true);
        localStorage.setItem(`saved_scholarship_${id}`, 'true');
      } else if (err.response?.data?.error === 'Saved scholarship not found') {
        setIsSaved(false);
        localStorage.removeItem(`saved_scholarship_${id}`);
      } else {
        showNotification('Failed to save scholarship. Please try again.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    // Create a notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
      </div>
    `;
    
    // Add styles
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
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
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
    // Check if user is logged in
    try {
      const authCheck = await axios.get('/api/auth/check');
      if (!authCheck.data.loggedIn) {
        showNotification('Please login to apply for scholarships', 'error');
        navigate('/login', { state: { from: `/career/scholarships/${id}` } });
        return;
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      showNotification('Please login to apply for scholarships', 'error');
      navigate('/login', { state: { from: `/career/scholarships/${id}` } });
      return;
    }

    // If external link, give option
    if (scholarship?.applicationDetails?.applicationLink) {
      const useExternal = window.confirm(
        'This scholarship uses an external application system. Would you like to apply through their website?\n\n' +
        'Click OK to apply on their website, or Cancel to use our application portal.'
      );
      
      if (useExternal) {
        window.open(scholarship.applicationDetails.applicationLink, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    // Navigate to application portal
    navigate(`/career/scholarships/${id}/apply`);
  };

  const handleShare = (platform) => {
    if (!scholarship) return;
    
    const url = window.location.href;
    const title = encodeURIComponent(scholarship.title);
    const text = encodeURIComponent(`Check out this scholarship: ${scholarship.title}`);
    
    switch(platform) {
      case 'email':
        window.location.href = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          showNotification('Link copied to clipboard!', 'success');
        }).catch(err => {
          console.error('Failed to copy:', err);
          showNotification('Failed to copy link', 'error');
        });
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        break;
      default:
        break;
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Rolling deadline';
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
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const formatAmount = (scholarship) => {
    if (!scholarship) return 'Amount not specified';
    
    const amount = scholarship.awardAmount;
    const currency = scholarship.currency || 'USD';
    const type = scholarship.type;
    
    if (!amount) return 'Amount not specified';
    
    let formattedAmount = '';
    
    if (currency === 'USD') formattedAmount = `$${amount.toLocaleString()}`;
    else if (currency === 'EUR') formattedAmount = `€${amount.toLocaleString()}`;
    else if (currency === 'BDT') formattedAmount = `৳${amount.toLocaleString()}`;
    else formattedAmount = `${currency} ${amount.toLocaleString()}`;
    
    if (type === 'full-tuition') return `Full Tuition Scholarship`;
    if (type === 'partial-tuition') return `Partial Tuition: ${formattedAmount}`;
    if (type === 'room-board') return `Room & Board: ${formattedAmount}`;
    if (type === 'book-stipend') return `Book Stipend: ${formattedAmount}`;
    if (type === 'travel-grant') return `Travel Grant: ${formattedAmount}`;
    if (type === 'research-grant') return `Research Grant: ${formattedAmount}`;
    if (type === 'fellowship') return `Fellowship: ${formattedAmount}`;
    
    return formattedAmount;
  };

  const formatCoverage = (scholarship) => {
    if (scholarship.additionalBenefits && scholarship.additionalBenefits.length > 0) {
      return scholarship.additionalBenefits.join(', ');
    }
    
    const type = scholarship.type;
    if (type === 'full-tuition') return 'Full tuition coverage';
    if (type === 'room-board') return 'Room and board';
    if (type === 'book-stipend') return 'Book stipend';
    
    return 'Tuition coverage';
  };

  const isScholarshipExpired = (scholarship) => {
    if (!scholarship?.applicationDetails?.deadline) return false;
    try {
      const deadline = new Date(scholarship.applicationDetails.deadline);
      const now = new Date();
      return deadline < now;
    } catch (err) {
      return false;
    }
  };

  const isScholarshipActive = (scholarship) => {
    if (!scholarship) return false;
    const status = scholarship.status?.toLowerCase();
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
      case 'interview-completed': return 'Interview Completed';
      case 'awarded': return 'Awarded';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'withdrawn': return 'Withdrawn';
      default: return status || 'Unknown';
    }
  };

  const formatCategory = (category) => {
    if (!category) return 'General';
    return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEducationLevel = (scholarship) => {
    if (scholarship.eligibility?.educationLevel && scholarship.eligibility.educationLevel.length > 0) {
      const levels = scholarship.eligibility.educationLevel.map(level => {
        switch(level) {
          case 'high-school': return 'High School';
          case 'undergraduate': return 'Undergraduate';
          case 'graduate': return 'Graduate';
          case 'phd': return 'PhD';
          case 'postdoc': return 'Postdoctoral';
          default: return level;
        }
      });
      return levels.join(', ');
    }
    return scholarship.level || 'All Levels';
  };

  const getEligibilityNationality = (scholarship) => {
    if (scholarship.eligibility?.nationality && scholarship.eligibility.nationality.length > 0) {
      if (scholarship.eligibility.nationality.includes('any')) return 'International';
      return scholarship.eligibility.nationality.map(n => 
        n === 'domestic' ? 'Domestic' : n === 'international' ? 'International' : n
      ).join(', ');
    }
    return 'International';
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
        <p>Loading scholarship details...</p>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Scholarship Not Found</h3>
        <p>{error || 'The scholarship you are looking for does not exist or has been removed.'}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/career/scholarships')} className="btn-primary">
            Browse All Scholarships
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isExpired = isScholarshipExpired(scholarship);
  const isActive = isScholarshipActive(scholarship);
  const daysRemaining = getDaysRemaining(scholarship.applicationDetails?.deadline);

  return (
    <div className="scholarship-detail-page">
      {/* Header */}
      <div className="detail-header">
        <div className="header-top">
          <button onClick={() => navigate('/career/scholarships')} className="back-btn">
            ← Back to Scholarships
          </button>
          <div className="header-meta">
            <span className="meta-item">
              <span className="meta-icon">👁</span> {scholarship.views || 0} views
            </span>
            <span className="meta-item">
              <span className="meta-icon">📄</span> {scholarship.applicationsCount || 0} applications
            </span>
          </div>
        </div>
        
        <div className="header-content">
          <div className="organization-info">
            <div className="organization-logo">
              {scholarship.organization?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <div className="organization-badge">
                {scholarship.isFeatured && <span className="featured-tag">⭐ Featured</span>}
                <span className={`status-badge ${scholarship.status?.toLowerCase()}`}>
                  {scholarship.status}
                </span>
              </div>
              <h1>{scholarship.title}</h1>
              <h2>{scholarship.organization?.name}</h2>
              {scholarship.organization?.website && (
                <a 
                  href={scholarship.organization.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="organization-website"
                >
                  🌐 {scholarship.organization.website}
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
                 scholarship.applicationDetails?.applicationLink 
                  ? 'Apply Now (External)' 
                  : 'Apply Now'}
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
            <span>Deadline: {formatDate(scholarship.applicationDetails.deadline)}</span>
          </div>
        </div>
      )}

      {/* Quick Info Cards */}
      <div className="quick-info-grid">
        <div className="info-card">
          <span className="info-icon">💰</span>
          <div className="info-content">
            <span className="info-label">Scholarship Amount</span>
            <span className="info-value">{formatAmount(scholarship)}</span>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">🎓</span>
          <div className="info-content">
            <span className="info-label">Education Level</span>
            <span className="info-value">{getEducationLevel(scholarship)}</span>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">📅</span>
          <div className="info-content">
            <span className="info-label">Application Deadline</span>
            <span className="info-value">{formatDate(scholarship.applicationDetails?.deadline)}</span>
            {daysRemaining !== null && daysRemaining > 0 && (
              <span className="info-subtext">{daysRemaining} days remaining</span>
            )}
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">🌍</span>
          <div className="info-content">
            <span className="info-label">Eligibility</span>
            <span className="info-value">
              {getEligibilityNationality(scholarship)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        <div className="main-content">
          {/* Description */}
          <section className="content-section">
            <div className="section-header">
              <h3>Scholarship Overview</h3>
              <div className="section-badges">
                <span className="section-badge">{formatCategory(scholarship.category)}</span>
                {scholarship.type && (
                  <span className="section-badge type">
                    {scholarship.type.replace('-', ' ').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="section-content">
              <p className="description-text">{scholarship.description}</p>
              {scholarship.shortDescription && (
                <p className="short-description">{scholarship.shortDescription}</p>
              )}
            </div>
          </section>

          {/* Funding Details */}
          <section className="content-section">
            <h3>💰 Funding Details</h3>
            <div className="funding-grid">
              <div className="funding-item">
                <span className="funding-label">Type:</span>
                <span className="funding-value">
                  {scholarship.type?.replace('-', ' ').toUpperCase() || 'Scholarship'}
                </span>
              </div>
              <div className="funding-item">
                <span className="funding-label">Amount:</span>
                <span className="funding-value">{formatAmount(scholarship)}</span>
              </div>
              <div className="funding-item">
                <span className="funding-label">Currency:</span>
                <span className="funding-value">{scholarship.currency || 'USD'}</span>
              </div>
              <div className="funding-item">
                <span className="funding-label">Renewable:</span>
                <span className="funding-value">
                  {scholarship.isRenewable ? 'Yes' : 'No'}
                  {scholarship.isRenewable && scholarship.renewalConditions && 
                   ` (${scholarship.renewalConditions})`}
                </span>
              </div>
              <div className="funding-item">
                <span className="funding-label">Number of Awards:</span>
                <span className="funding-value">
                  {scholarship.numberOfAwards || 1}
                </span>
              </div>
              <div className="funding-item">
                <span className="funding-label">Payment Type:</span>
                <span className="funding-value">
                  {scholarship.paymentType || 'One-time payment'}
                </span>
              </div>
            </div>
          </section>

          {/* Eligibility Requirements */}
          <section className="content-section">
            <h3>🎯 Eligibility Requirements</h3>
            <div className="requirements-grid">
              {scholarship.eligibility?.educationLevel && scholarship.eligibility.educationLevel.length > 0 && (
                <div className="requirement-item">
                  <span className="requirement-label">Education Level:</span>
                  <span className="requirement-value">{getEducationLevel(scholarship)}</span>
                </div>
              )}
              {scholarship.eligibility?.minGPA && (
                <div className="requirement-item">
                  <span className="requirement-label">Minimum GPA:</span>
                  <span className="requirement-value">{scholarship.eligibility.minGPA}/4.0</span>
                </div>
              )}
              {scholarship.eligibility?.nationality && scholarship.eligibility.nationality.length > 0 && (
                <div className="requirement-item">
                  <span className="requirement-label">Nationality:</span>
                  <span className="requirement-value">{getEligibilityNationality(scholarship)}</span>
                </div>
              )}
              {scholarship.eligibility?.fieldOfStudy?.length > 0 && (
                <div className="requirement-item">
                  <span className="requirement-label">Field of Study:</span>
                  <span className="requirement-value">{scholarship.eligibility.fieldOfStudy.join(', ')}</span>
                </div>
              )}
              {scholarship.eligibility?.residencyStatus?.length > 0 && (
                <div className="requirement-item">
                  <span className="requirement-label">Residency Status:</span>
                  <span className="requirement-value">
                    {scholarship.eligibility.residencyStatus.map(status => 
                      status === 'citizen' ? 'Citizen' :
                      status === 'permanent-resident' ? 'Permanent Resident' :
                      status === 'international' ? 'International' : status
                    ).join(', ')}
                  </span>
                </div>
              )}
              {(scholarship.eligibility?.ageRange?.min || scholarship.eligibility?.ageRange?.max) && (
                <div className="requirement-item">
                  <span className="requirement-label">Age Range:</span>
                  <span className="requirement-value">
                    {scholarship.eligibility.ageRange.min ? `${scholarship.eligibility.ageRange.min}` : ''}
                    {scholarship.eligibility.ageRange.min && scholarship.eligibility.ageRange.max ? ' - ' : ''}
                    {scholarship.eligibility.ageRange.max ? `${scholarship.eligibility.ageRange.max}` : ''}
                    {scholarship.eligibility.ageRange.min || scholarship.eligibility.ageRange.max ? ' years' : ''}
                  </span>
                </div>
              )}
              {scholarship.eligibility?.requiredDocuments?.length > 0 && (
                <div className="requirement-item">
                  <span className="requirement-label">Required Documents:</span>
                  <span className="requirement-value">
                    {scholarship.eligibility.requiredDocuments.join(', ')}
                  </span>
                </div>
              )}
            </div>
            
            {scholarship.selectionCriteria?.length > 0 && (
              <div className="requirements-list">
                <h4>Selection Criteria</h4>
                <ul>
                  {scholarship.selectionCriteria.map((criteria, index) => (
                    <li key={index}>{criteria}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Benefits */}
          {scholarship.additionalBenefits?.length > 0 && (
            <section className="content-section">
              <h3>🌟 Additional Benefits</h3>
              <ul className="benefits-list">
                {scholarship.additionalBenefits.map((benefit, index) => (
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
              {scholarship.applicationDetails?.instructions ? (
                <div dangerouslySetInnerHTML={{ __html: scholarship.applicationDetails.instructions }} />
              ) : (
                <p>Follow the application process as described in the scholarship details.</p>
              )}
              
              {scholarship.applicationDetails?.documentsRequired?.length > 0 && (
                <div className="documents-section">
                  <h4>Required Documents:</h4>
                  <div className="documents-tags">
                    {scholarship.applicationDetails.documentsRequired.map((doc, index) => (
                      <span key={index} className="document-tag">{doc}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {scholarship.applicationDetails?.applicationLink && (
                <div className="external-link-section">
                  <a 
                    href={scholarship.applicationDetails.applicationLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    🌐 Apply on External Website
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h3>📋 Application Details</h3>
              <span className={`urgency-badge ${daysRemaining !== null && daysRemaining <= 7 ? 'urgent' : ''}`}>
                {scholarship.applicationDetails?.deadline && 
                 new Date(scholarship.applicationDetails.deadline) < new Date() 
                 ? 'Closed' 
                 : 'Open'}
              </span>
            </div>
            <div className="sidebar-info">
              <div className="sidebar-item">
                <span className="sidebar-label">Deadline:</span>
                <span className="sidebar-value">{formatDate(scholarship.applicationDetails?.deadline)}</span>
              </div>
              {scholarship.applicationDetails?.contactEmail && (
                <div className="sidebar-item">
                  <span className="sidebar-label">Contact Email:</span>
                  <a 
                    href={`mailto:${scholarship.applicationDetails.contactEmail}`}
                    className="sidebar-value link"
                  >
                    {scholarship.applicationDetails.contactEmail}
                  </a>
                </div>
              )}
              {scholarship.applicationDetails?.contactPhone && (
                <div className="sidebar-item">
                  <span className="sidebar-label">Contact Phone:</span>
                  <a 
                    href={`tel:${scholarship.applicationDetails.contactPhone}`}
                    className="sidebar-value link"
                  >
                    {scholarship.applicationDetails.contactPhone}
                  </a>
                </div>
              )}
              {scholarship.applicationDetails?.documentsRequired?.length > 0 && (
                <div className="sidebar-item">
                  <span className="sidebar-label">Required Documents:</span>
                  <div className="documents-list">
                    {scholarship.applicationDetails.documentsRequired.map((doc, index) => (
                      <span key={index} className="document-tag">{doc}</span>
                    ))}
                  </div>
                </div>
              )}
              {scholarship.applicationDetails?.instructions && (
                <div className="sidebar-item">
                  <span className="sidebar-label">Instructions:</span>
                  <p className="sidebar-instructions">{scholarship.applicationDetails.instructions}</p>
                </div>
              )}
            </div>
            <button 
              className={`sidebar-apply-btn ${!isActive || isExpired || hasApplied ? 'disabled' : ''}`} 
              onClick={handleApply}
              disabled={!isActive || isExpired || hasApplied}
            >
              {hasApplied ? getStatusText(applicationStatus) :
               !isActive ? 'Scholarship Inactive' :
               isExpired ? 'Application Closed' :
               scholarship.applicationDetails?.applicationLink 
                ? 'Apply Now (External)' 
                : 'Apply Now'}
            </button>
          </div>

          <div className="sidebar-card">
            <h3>📤 Share This Opportunity</h3>
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
              <button 
                className="share-btn facebook" 
                onClick={() => handleShare('facebook')}
                title="Share on Facebook"
              >
                <span className="share-icon">📘</span> Facebook
              </button>
              <button 
                className="share-btn twitter" 
                onClick={() => handleShare('twitter')}
                title="Share on Twitter"
              >
                <span className="share-icon">🐦</span> Twitter
              </button>
            </div>
          </div>

          {/* Organization Info */}
          {scholarship.organization && (
            <div className="sidebar-card">
              <h3>🏢 About {scholarship.organization.name}</h3>
              <div className="organization-sidebar-info">
                {scholarship.organization.industry && (
                  <div className="organization-detail">
                    <span className="organization-label">Industry:</span>
                    <span className="organization-value">{scholarship.organization.industry}</span>
                  </div>
                )}
                {scholarship.organization.size && (
                  <div className="organization-detail">
                    <span className="organization-label">Size:</span>
                    <span className="organization-value">
                      {scholarship.organization.size.charAt(0).toUpperCase() + scholarship.organization.size.slice(1)}
                    </span>
                  </div>
                )}
                {scholarship.organization.location && (
                  <div className="organization-detail">
                    <span className="organization-label">Location:</span>
                    <span className="organization-value">{scholarship.organization.location}</span>
                  </div>
                )}
                {scholarship.organization.description && (
                  <div className="organization-detail">
                    <span className="organization-label">About:</span>
                    <p className="organization-value">{scholarship.organization.description}</p>
                  </div>
                )}
                {scholarship.organization.website && (
                  <div className="organization-detail">
                    <span className="organization-label">Website:</span>
                    <a 
                      href={scholarship.organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="organization-value link"
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
      {similarScholarships.length > 0 && (
        <div className="similar-section">
          <div className="section-header">
            <h3>🔍 Similar Scholarships</h3>
            <p className="section-subtitle">Other scholarships you might be interested in</p>
          </div>
          <div className="similar-grid">
            {similarScholarships.map(similar => (
              <Link 
                key={similar._id} 
                to={`/career/scholarships/${similar._id}`} 
                className="similar-card"
              >
                <div className="similar-header">
                  <div className="similar-logo">
                    {similar.organization?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h4>{similar.title}</h4>
                    <p className="similar-organization">{similar.organization?.name}</p>
                  </div>
                </div>
                <div className="similar-details">
                  <span className="similar-amount">{formatAmount(similar)}</span>
                  <span className="similar-level">{getEducationLevel(similar)}</span>
                  <span className="similar-deadline">
                    {formatDate(similar.applicationDetails?.deadline)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="similar-action">
            <Link to="/career/scholarships" className="view-all-btn">
              View All Scholarships →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipDetail;