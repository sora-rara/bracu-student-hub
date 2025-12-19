import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth';

const CourseAdminPanel = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    content: { total: 0, pending: 0, approved: 0, rejected: 0 },
    reviews: { total: 0, pending: 0, approved: 0, rejected: 0 }
  });

  useEffect(() => {
    if (authService.isAdmin()) {
      fetchAllContent();
      fetchAllReviews();
    } else {
      alert('Admin access required');
      navigate('/dashboard');
    }
  }, []);

  const fetchAllContent = async () => {
    try {
      const response = await axios.get('/api/course-content/admin/all');
      if (response.data.success) {
        setContent(response.data.data);
        updateContentStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      alert('Failed to fetch content');
    }
  };

  const fetchAllReviews = async () => {
    try {
      const response = await axios.get('/api/course-reviews/admin/all');
      if (response.data.success) {
        setReviews(response.data.data);
        updateReviewStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const updateContentStats = (contentData) => {
    const stats = {
      total: contentData.length,
      pending: contentData.filter(item => item.status === 'pending').length,
      approved: contentData.filter(item => item.status === 'approved').length,
      rejected: contentData.filter(item => item.status === 'rejected').length
    };
    setStats(prev => ({ ...prev, content: stats }));
  };

  const updateReviewStats = (reviewData) => {
    const stats = {
      total: reviewData.length,
      pending: reviewData.filter(item => item.status === 'pending').length,
      approved: reviewData.filter(item => item.status === 'approved').length,
      rejected: reviewData.filter(item => item.status === 'rejected').length
    };
    setStats(prev => ({ ...prev, reviews: stats }));
  };

  const handleApproveContent = async (id) => {
    try {
      const response = await axios.put(`/api/course-content/admin/approve/${id}`);
      if (response.data.success) {
        alert('Content approved successfully!');
        fetchAllContent();
      }
    } catch (error) {
      console.error('Error approving content:', error);
      alert('Failed to approve content');
    }
  };

  const handleRejectContent = async (id) => {
    const reason = prompt('Enter rejection reason for the student:');
    if (!reason) return;
    if (reason.trim().length < 5) {
      alert('Please provide a meaningful reason (at least 5 characters)');
      return;
    }

    try {
      const response = await axios.put(`/api/course-content/admin/reject/${id}`, { reason });
      if (response.data.success) {
        alert('Content rejected. Student will see the reason in their "My Uploads" page.');
        fetchAllContent();
      }
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('Failed to reject content');
    }
  };

  const handleApproveReview = async (id) => {
    try {
      const response = await axios.put(`/api/course-reviews/admin/approve/${id}`);
      if (response.data.success) {
        alert('Review approved successfully!');
        fetchAllReviews();
      }
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    }
  };

  const handleRejectReview = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    if (reason.trim().length < 5) {
      alert('Please provide a meaningful reason (at least 5 characters)');
      return;
    }

    try {
      const response = await axios.delete(`/api/course-reviews/admin/reject/${id}`, { 
        data: { reason } 
      });
      if (response.data.success) {
        alert('Review rejected successfully!');
        fetchAllReviews();
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Failed to reject review');
    }
  };

  const handleDeleteContent = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this content?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/course-content/admin/${id}`);
      if (response.data.success) {
        alert('Content deleted successfully!');
        fetchAllContent();
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/course-reviews/admin/${id}`);
      if (response.data.success) {
        alert('Review deleted successfully!');
        fetchAllReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const filteredContent = content.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredReviews = reviews.filter(review => {
    if (filter !== 'all' && review.status !== filter) return false;
    if (searchTerm && !review.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !review.reviewText.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      approved: { bg: '#10b981', color: '#ffffff', label: '✅ Approved' },
      pending: { bg: '#f59e0b', color: '#ffffff', label: '⏳ Pending' },
      rejected: { bg: '#ef4444', color: '#ffffff', label: '❌ Rejected' }
    };
    
    const statusInfo = statusColors[status] || { bg: '#6b7280', color: '#ffffff', label: status };
    
    return (
      <span style={{
        backgroundColor: statusInfo.bg,
        color: statusInfo.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '500',
        marginLeft: '0.5rem'
      }}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📚 Course Admin Panel</h1>
        <p>Manage course content and reviews - Total Pending: {stats.content.pending} content, {stats.reviews.pending} reviews</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <h3>{stats.content.total}</h3>
            <p>Total Content</p>
            <small>Pending: {stats.content.pending}</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.reviews.total}</h3>
            <p>Total Reviews</p>
            <small>Pending: {stats.reviews.pending}</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.content.approved}</h3>
            <p>Approved Content</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.content.rejected}</h3>
            <p>Rejected Content</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--gray-light)',
        paddingBottom: '1rem'
      }}>
        <button
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
          style={{
            padding: '0.5rem 1.5rem',
            background: activeTab === 'content' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'content' ? 'white' : 'var(--dark-color)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          📁 Content ({stats.content.pending} pending)
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '0.5rem 1.5rem',
            background: activeTab === 'reviews' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'reviews' ? 'white' : 'var(--dark-color)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          ⭐ Reviews ({stats.reviews.pending} pending)
        </button>
      </div>

      {/* Filters and Search */}
      <div className="filter-row" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="filter-group">
          <label>Filter by Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by title, course code, or uploader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="admin-table">
          <h2>Course Content Management ({filteredContent.length} items)</h2>
          {filteredContent.length === 0 ? (
            <div className="empty-state">
              <p>No content found matching your criteria</p>
            </div>
          ) : (
            <div className="content-list">
              {filteredContent.map(item => (
                <div key={item._id} className="content-card admin">
                  <div className="content-header">
                    <div className="file-info">
                      <span className="file-icon">
                        {item.fileType?.includes('pdf') ? '📕' : 
                         item.fileType?.includes('word') ? '📄' : 
                         item.fileType?.includes('image') ? '🖼️' : '📎'}
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        <p className="file-meta">
                          <strong>{item.courseCode}</strong> • 
                          Uploaded by: {item.uploadedBy} ({item.uploadedByRole}) • 
                          {formatFileSize(item.fileSize)} • 
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  {item.description && (
                    <p className="content-description">{item.description}</p>
                  )}

                  <div className="content-footer">
                    <div className="content-stats">
                      <span className="stat">👁️ {item.viewCount || 0} views</span>
                      <span className="stat">📥 {item.downloadCount || 0} downloads</span>
                      <span className="stat">📧 {item.uploadedByEmail}</span>
                    </div>
                    
                    <div className="admin-actions">
                      {item.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproveContent(item._id)}
                          >
                            ✅ Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRejectContent(item._id)}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/course-content/${item.courseCode}`)}
                      >
                        👀 View in Course
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteContent(item._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  
                  {item.status === 'rejected' && item.rejectionReason && (
                    <div className="rejection-reason">
                      <strong>Rejection Reason:</strong> {item.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="admin-table">
          <h2>Course Reviews Management ({filteredReviews.length} items)</h2>
          {filteredReviews.length === 0 ? (
            <div className="empty-state">
              <p>No reviews found matching your criteria</p>
            </div>
          ) : (
            <div className="reviews-list">
              {filteredReviews.map(review => (
                <div key={review._id} className="review-card admin">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <strong>{review.anonymous ? 'Anonymous' : review.studentName}</strong>
                      <small>
                        {review.courseCode} • {review.semester} {review.year}
                      </small>
                      <small>Email: {review.studentEmail}</small>
                    </div>
                    <div className="review-rating">
                      <div className="star-rating">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`star ${star <= review.rating ? 'filled' : ''}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      {getStatusBadge(review.status)}
                    </div>
                  </div>
                  
                  <p className="review-text">{review.reviewText}</p>

                  <div className="review-meta">
                    <div className="review-stats">
                      <span>Difficulty: {review.difficulty}/5</span>
                      <span>Content: {review.contentRating}/5</span>
                      <span>Instructor: {review.instructorRating}/5</span>
                      <span>Satisfaction: {review.overallSatisfaction}/5</span>
                      <span>Helpful: {review.helpfulCount || 0} 👍</span>
                    </div>
                    
                    <div className="admin-actions">
                      {review.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproveReview(review._id)}
                          >
                            ✅ Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRejectReview(review._id)}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/course-reviews/${review.courseCode}`)}
                      >
                        👀 View in Course
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteReview(review._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  
                  {review.status === 'rejected' && review.rejectionReason && (
                    <div className="rejection-reason">
                      <strong>Rejection Reason:</strong> {review.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseAdminPanel;