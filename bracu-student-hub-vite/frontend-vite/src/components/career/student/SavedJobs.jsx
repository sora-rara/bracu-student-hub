// src/components/career/student/SavedJobs.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState('');

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/api/career/jobs/saved/all');
      
      if (response.data.success) {
        setSavedJobs(response.data.data);
      } else {
        setError('Failed to load saved jobs');
      }
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
      setError('Failed to load saved jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromSaved = async (jobId, jobTitle) => {
    if (!window.confirm(`Remove "${jobTitle}" from saved jobs?`)) {
      return;
    }

    try {
      setRemoving(jobId);
      await axios.delete(`/api/career/jobs/${jobId}/save`);
      
      // Remove from local state
      setSavedJobs(prev => prev.filter(item => 
        item.jobId._id !== jobId
      ));
      
      // Remove from localStorage
      localStorage.removeItem(`saved_job_${jobId}`);
      
      alert('Removed from saved jobs');
    } catch (err) {
      console.error('Error removing from saved:', err);
      alert('Failed to remove from saved jobs');
    } finally {
      setRemoving('');
    }
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSalary = (job) => {
    if (!job.salary) return 'Negotiable';
    
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

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading saved jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Saved Jobs</h3>
          <p>{error}</p>
          <button onClick={fetchSavedJobs} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>⭐ Saved Jobs</h1>
        <p className="page-subtitle">
          {savedJobs.length === 0 
            ? 'You haven\'t saved any jobs yet' 
            : `You have ${savedJobs.length} saved job${savedJobs.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h3>No Saved Jobs</h3>
          <p>Save jobs you're interested in to view them here later.</p>
          <Link to="/career/jobs" className="btn-primary">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="saved-jobs-list">
          {savedJobs.map((item) => (
            <div key={item._id} className="saved-job-card">
              <div className="saved-job-header">
                <div className="saved-job-logo">
                  {item.jobId?.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className="saved-job-info">
                  <h3>
                    <Link to={`/career/jobs/${item.jobId._id}`}>
                      {item.jobId.title}
                    </Link>
                  </h3>
                  <p className="saved-company">{item.jobId.company?.name}</p>
                  <p className="saved-saved-date">
                    Saved on {new Date(item.savedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => removeFromSaved(item.jobId._id, item.jobId.title)}
                  disabled={removing === item.jobId._id}
                  className="btn-remove"
                  title="Remove from saved"
                >
                  {removing === item.jobId._id ? '...' : '×'}
                </button>
              </div>
              
              <div className="saved-job-details">
                <div className="detail-item">
                  <span className="detail-label">Salary:</span>
                  <span className="detail-value">{formatSalary(item.jobId)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{item.jobId.location || 'Remote'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{item.jobId.jobType || 'Part-time'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Deadline:</span>
                  <span className="detail-value">
                    {formatDate(item.jobId.deadline)}
                  </span>
                </div>
              </div>
              
              <div className="saved-job-actions">
                <Link 
                  to={`/career/jobs/${item.jobId._id}`} 
                  className="btn-secondary"
                >
                  View Details
                </Link>
                <Link 
                  to={`/career/jobs/${item.jobId._id}/apply`} 
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

export default SavedJobs;