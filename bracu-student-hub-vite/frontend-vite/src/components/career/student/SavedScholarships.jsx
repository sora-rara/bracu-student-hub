// src/components/career/student/SavedScholarships.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../../api/axios';

const SavedScholarships = () => {
  const [savedScholarships, setSavedScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState('');

  useEffect(() => {
    fetchSavedScholarships();
  }, []);

  const fetchSavedScholarships = async () => {
    try {
      setLoading(true);
      setError('');
      
      // This will work because you added the /saved route
      const response = await axios.get('/api/career/scholarships/saved');
      
      if (response.data.success) {
        setSavedScholarships(response.data.data);
      } else {
        setError('Failed to load saved scholarships');
      }
    } catch (err) {
      console.error('Error fetching saved scholarships:', err);
      setError('Failed to load saved scholarships. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromSaved = async (scholarshipId, scholarshipTitle) => {
    if (!window.confirm(`Remove "${scholarshipTitle}" from saved scholarships?`)) {
      return;
    }

    try {
      setRemoving(scholarshipId);
      await axios.delete(`/api/career/scholarships/${scholarshipId}/save`);
      
      // Remove from local state
      setSavedScholarships(prev => prev.filter(item => 
        item.scholarshipId._id !== scholarshipId
      ));
      
      // Remove from localStorage
      localStorage.removeItem(`saved_scholarship_${scholarshipId}`);
      
      alert('Removed from saved scholarships');
    } catch (err) {
      console.error('Error removing from saved:', err);
      alert('Failed to remove from saved scholarships');
    } finally {
      setRemoving('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Rolling deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (scholarship) => {
    if (!scholarship.awardAmount) return 'Amount not specified';
    
    const currency = scholarship.currency || 'USD';
    const amount = scholarship.awardAmount;
    
    if (currency === 'USD') return `$${amount}`;
    if (currency === 'EUR') return `€${amount}`;
    if (currency === 'BDT') return `৳${amount}`;
    
    return `${currency} ${amount}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading saved scholarships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Saved Scholarships</h3>
          <p>{error}</p>
          <button onClick={fetchSavedScholarships} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>⭐ Saved Scholarships</h1>
        <p className="page-subtitle">
          {savedScholarships.length === 0 
            ? 'You haven\'t saved any scholarships yet' 
            : `You have ${savedScholarships.length} saved scholarship${savedScholarships.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {savedScholarships.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h3>No Saved Scholarships</h3>
          <p>Save scholarships you're interested in to view them here later.</p>
          <Link to="/career/scholarships" className="btn-primary">
            Browse Scholarships
          </Link>
        </div>
      ) : (
        <div className="saved-scholarships-list">
          {savedScholarships.map((item) => (
            <div key={item._id} className="saved-scholarship-card">
              <div className="saved-scholarship-header">
                <div className="saved-scholarship-logo">
                  {item.scholarshipId?.organization?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="saved-scholarship-info">
                  <h3>
                    <Link to={`/career/scholarships/${item.scholarshipId._id}`}>
                      {item.scholarshipId.title}
                    </Link>
                  </h3>
                  <p className="saved-organization">{item.scholarshipId.organization?.name}</p>
                  <p className="saved-saved-date">
                    Saved on {new Date(item.savedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => removeFromSaved(item.scholarshipId._id, item.scholarshipId.title)}
                  disabled={removing === item.scholarshipId._id}
                  className="btn-remove"
                  title="Remove from saved"
                >
                  {removing === item.scholarshipId._id ? '...' : '×'}
                </button>
              </div>
              
              <div className="saved-scholarship-details">
                <div className="detail-item">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">{formatAmount(item.scholarshipId)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Level:</span>
                  <span className="detail-value">{item.scholarshipId.level || 'All Levels'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">
                    {item.scholarshipId.category?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Deadline:</span>
                  <span className="detail-value">
                    {formatDate(item.scholarshipId.applicationDetails?.deadline)}
                  </span>
                </div>
              </div>
              
              <div className="saved-scholarship-actions">
                <Link 
                  to={`/career/scholarships/${item.scholarshipId._id}`} 
                  className="btn-secondary"
                >
                  View Details
                </Link>
                <Link 
                  to={`/career/scholarships/${item.scholarshipId._id}/apply`} 
                  className="btn-primary"
                >
                  Apply Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedScholarships;