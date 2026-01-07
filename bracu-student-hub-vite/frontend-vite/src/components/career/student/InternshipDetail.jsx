// src/components/career/student/InternshipDetail.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const InternshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [similarInternships, setSimilarInternships] = useState([]);

  useEffect(() => {
    fetchInternship();
  }, [id]);

  const fetchInternship = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/career/internships/${id}`);
      
      if (response.data.success) {
        setInternship(response.data.data);
        if (response.data.similarInternships) {
          setSimilarInternships(response.data.similarInternships);
        }
        checkApplicationStatus();
        checkIfSaved();
      } else {
        setError('Internship not found');
      }
    } catch (err) {
      console.error('Error fetching internship:', err);
      setError('Failed to load internship details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get(`/api/applications/check/${id}`);
      if (response.data.success) {
        setHasApplied(response.data.hasApplied);
        setApplicationStatus(response.data.applicationStatus);
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const checkIfSaved = () => {
    try {
      const saved = localStorage.getItem(`saved_${id}`);
      setIsSaved(saved === 'true');
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSave = async () => {
    try {
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      
      if (newSavedState) {
        localStorage.setItem(`saved_${id}`, 'true');
        alert('Added to saved list');
      } else {
        localStorage.removeItem(`saved_${id}`);
        alert('Removed from saved list');
      }
    } catch (err) {
      console.error('Error saving internship:', err);
      alert('Failed to save internship');
    }
  };

  const handleApply = async () => {
    // Check if user is logged in
    try {
      const authCheck = await axios.get('/api/auth/check');
      if (!authCheck.data.loggedIn) {
        alert('Please login to apply for internships');
        navigate('/login');
        return;
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      alert('Please login to apply for internships');
      navigate('/login');
      return;
    }

    // If external link, give option
    if (internship?.applicationDetails?.applicationLink) {
      const useExternal = window.confirm(
        'This internship uses an external application system. Would you like to apply through their website?\n\n' +
        'Click OK to apply on their website, or Cancel to use our application portal.'
      );
      
      if (useExternal) {
        window.open(internship.applicationDetails.applicationLink, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    // Navigate to application portal
    navigate(`/career/internships/${id}/apply`);
  };

  const handleShare = (platform) => {
    if (!internship) return;
    
    const url = window.location.href;
    const title = encodeURIComponent(internship.title);
    const text = encodeURIComponent(`Check out this internship: ${internship.title}`);
    
    switch(platform) {
      case 'email':
        window.location.href = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          alert('Link copied to clipboard!');
        });
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
        break;
      default:
        break;
    }
  };

  // Helper functions
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    
    const { type, city, country } = location;
    
    if (type === 'remote') return 'Remote';
    if (type === 'hybrid') return 'Hybrid';
    if (city && country) return `${city}, ${country}`;
    if (city) return `${city}`;
    
    return 'On-site';
  };

  const isInternshipExpired = (internship) => {
    if (!internship?.applicationDetails?.deadline) return false;
    const deadline = new Date(internship.applicationDetails.deadline);
    const now = new Date();
    return deadline < now;
  };

  const isInternshipActive = (internship) => {
    if (!internship) return false;
    const status = internship.status?.toLowerCase();
    return status === 'active' || status === 'published' || status === 'open';
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Application Submitted';
      case 'reviewed': return 'Under Review';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading internship details...</p>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Internship Not Found</h3>
        <p>{error || 'The internship you are looking for does not exist or has been removed.'}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/career/internships')} className="btn-primary">
            Browse All Internships
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isExpired = isInternshipExpired(internship);
  const isActive = isInternshipActive(internship);

  return (
    <div className="internship-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate('/career/internships')} className="back-btn">
          ← Back to Internships
        </button>
        
        <div className="header-content">
          <div className="company-info">
            <div className="company-logo">
              {internship.organization?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="company-badge">
                {internship.isFeatured && <span className="featured-tag">⭐ Featured</span>}
                <span className={`status-badge ${internship.status?.toLowerCase()}`}>
                  {internship.status}
                </span>
              </div>
              <h1>{internship.title}</h1>
              <h2>{internship.organization?.name}</h2>
              {internship.organization?.website && (
                <a 
                  href={internship.organization.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="company-website"
                >
                  🌐 {internship.organization.website}
                </a>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className={`save-btn ${isSaved ? 'saved' : ''}`}
              onClick={handleSave}
            >
              {isSaved ? '♥ Saved' : '♡ Save for Later'}
            </button>
            {hasApplied ? (
              <button className="applied-btn" disabled>
                {getStatusText(applicationStatus)}
              </button>
            ) : (
              <button 
                className="apply-btn" 
                onClick={handleApply}
                disabled={!isActive || isExpired}
              >
                {!isActive ? 'Inactive' : 
                 isExpired ? 'Expired' : 
                 internship.applicationDetails?.applicationLink 
                  ? 'Apply Now (External)' 
                  : 'Apply Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="quick-info-grid">
        <div className="info-card">
          <span className="info-icon"></span>
          <div className="info-content">
            <span className="info-label">Location</span>
            <span className="info-value">{formatLocation(internship.location)}</span>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon"></span>
          <div className="info-content">
            <span className="info-label">Compensation</span>
            <span className="info-value">{formatCompensation(internship.compensation)}</span>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon"></span>
          <div className="info-content">
            <span className="info-label">Application Deadline</span>
            <span className="info-value">{formatDate(internship.applicationDetails?.deadline)}</span>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon"></span>
          <div className="info-content">
            <span className="info-label">Duration</span>
            <span className="info-value">
              {internship.duration?.hoursPerWeek?.min && internship.duration?.hoursPerWeek?.max
                ? `${internship.duration.hoursPerWeek.min}-${internship.duration.hoursPerWeek.max} hrs/week`
                : 'Flexible hours'}
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
              <h3> Applicable Position Overview</h3>
              <span className="section-badge">{internship.type || 'Internship'}</span>
            </div>
            <div className="section-content">
              <p>{internship.description}</p>
            </div>
          </section>

          {/* Learning Outcomes */}
          {internship.learningOutcomes?.length > 0 && (
            <section className="content-section">
              <h3> What You'll Learn</h3>
              <ul className="outcomes-list">
                {internship.learningOutcomes.map((outcome, index) => (
                  <li key={index}>
                    <span className="bullet">•</span>
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          {(internship.requirements?.skills?.length > 0 || internship.requirements?.educationLevel) && (
            <section className="content-section">
              <h3> Requirements & Qualifications</h3>
              <div className="requirements-grid">
                {internship.requirements.educationLevel && (
                  <div className="requirement-item">
                    <span className="requirement-label">Education Level:</span>
                    <span className="requirement-value">{internship.requirements.educationLevel}</span>
                  </div>
                )}
                {internship.requirements.minGPA > 0 && (
                  <div className="requirement-item">
                    <span className="requirement-label">Minimum GPA:</span>
                    <span className="requirement-value">{internship.requirements.minGPA}/4.0</span>
                  </div>
                )}
                {internship.requirements.yearInSchool?.length > 0 && (
                  <div className="requirement-item">
                    <span className="requirement-label">Year in School:</span>
                    <span className="requirement-value">{internship.requirements.yearInSchool.join(', ')}</span>
                  </div>
                )}
                {internship.majors?.length > 0 && (
                  <div className="requirement-item">
                    <span className="requirement-label">Targeted Majors:</span>
                    <span className="requirement-value">{internship.majors.join(', ')}</span>
                  </div>
                )}
              </div>
              
              {internship.requirements.skills?.length > 0 && (
                <div className="skills-section">
                  <h4>Required Skills</h4>
                  <div className="skills-list">
                    {internship.requirements.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Benefits */}
          {internship.compensation?.benefits?.length > 0 && (
            <section className="content-section">
              <h3> Benefits & Perks</h3>
              <ul className="benefits-list">
                {internship.compensation.benefits.map((benefit, index) => (
                  <li key={index}>
                    <span className="checkmark">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h3>📋 Application Details</h3>
              <span className="urgency-badge">
                {internship.applicationDetails?.deadline && 
                 new Date(internship.applicationDetails.deadline) < new Date() 
                 ? 'Closed' 
                 : 'Open'}
              </span>
            </div>
            <div className="sidebar-info">
              <div className="sidebar-item">
                <span className="sidebar-label">Deadline:</span>
                <span className="sidebar-value">{formatDate(internship.applicationDetails?.deadline)}</span>
              </div>
              {internship.applicationDetails?.contactEmail && (
                <div className="sidebar-item">
                  <span className="sidebar-label">Contact Email:</span>
                  <a 
                    href={`mailto:${internship.applicationDetails.contactEmail}`}
                    className="sidebar-value link"
                  >
                    {internship.applicationDetails.contactEmail}
                  </a>
                </div>
              )}
              {internship.applicationDetails?.documentsRequired?.length > 0 && (
                <div className="sidebar-item">
                  <span className="sidebar-label">Required Documents:</span>
                  <div className="documents-list">
                    {internship.applicationDetails.documentsRequired.map((doc, index) => (
                      <span key={index} className="document-tag">{doc}</span>
                    ))}
                  </div>
                </div>
              )}
              {internship.applicationDetails?.instructions && (
                <div className="sidebar-item">
                  <span className="sidebar-label">Application Instructions:</span>
                  <p className="sidebar-instructions">{internship.applicationDetails.instructions}</p>
                </div>
              )}
            </div>
            <button 
              className="sidebar-apply-btn" 
              onClick={handleApply}
              disabled={!isActive || isExpired || hasApplied}
            >
              {hasApplied ? getStatusText(applicationStatus) :
               !isActive ? 'Internship Inactive' :
               isExpired ? 'Application Closed' :
               internship.applicationDetails?.applicationLink 
                ? 'Apply Now (External)' 
                : 'Apply Now'}
            </button>
          </div>

          <div className="sidebar-card">
            <h3>Share This Opportunity</h3>
            <div className="share-buttons">
              <button 
                className="share-btn email" 
                onClick={() => handleShare('email')}
              >
                Email
              </button>
              <button 
                className="share-btn copy" 
                onClick={() => handleShare('copy')}
              >
                Copy Link
              </button>
              <button 
                className="share-btn whatsapp" 
                onClick={() => handleShare('whatsapp')}
              >
                WhatsApp
              </button>
            </div>
          </div>

          {/* Company Info */}
          {internship.organization && (
            <div className="sidebar-card">
              <h3> About {internship.organization.name}</h3>
              <div className="company-sidebar-info">
                {internship.organization.industry && (
                  <div className="company-detail">
                    <span className="company-label">Industry:</span>
                    <span className="company-value">{internship.organization.industry}</span>
                  </div>
                )}
                {internship.organization.size && (
                  <div className="company-detail">
                    <span className="company-label">Company Size:</span>
                    <span className="company-value">{internship.organization.size}</span>
                  </div>
                )}
                {internship.organization.website && (
                  <div className="company-detail">
                    <span className="company-label">Website:</span>
                    <a 
                      href={internship.organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="company-value link"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Opportunities */}
      {similarInternships.length > 0 && (
        <div className="similar-section">
          <div className="section-header">
            <h3>🔍 Similar Opportunities</h3>
            <p className="section-subtitle">Other internships you might be interested in</p>
          </div>
          <div className="similar-grid">
            {similarInternships.map(similar => (
              <Link 
                key={similar._id} 
                to={`/career/internships/${similar._id}`} 
                className="similar-card"
              >
                <div className="similar-header">
                  <div className="similar-logo">
                    {similar.organization?.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h4>{similar.title}</h4>
                    <p className="similar-company">{similar.organization?.name}</p>
                  </div>
                </div>
                <div className="similar-details">
                  <span className="similar-location">{formatLocation(similar.location)}</span>
                  <span className="similar-compensation">{formatCompensation(similar.compensation)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipDetail;