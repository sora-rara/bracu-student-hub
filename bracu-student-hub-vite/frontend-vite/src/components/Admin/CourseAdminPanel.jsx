import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth';

const CourseAdminPanel = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [stats, setStats] = useState({
    content: { total: 0, pending: 0, approved: 0, rejected: 0 },
    reviews: { total: 0, pending: 0, reported: 0, approved: 0 }
  });

  const programs = [
    'all', 'CSE', 'EEE', 'ECO', 'ENG', 'MAT', 'PHY', 'CHE', 'BIO', 
    'BUS', 'MBA', 'LAW', 'PHARM', 'ARCH', 'ENV', 'OTHERS'
  ];

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
        setContent(response.data.data || []);
        updateContentStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const fetchAllReviews = async () => {
    try {
      const response = await axios.get('/api/course-reviews/admin/all');
      if (response.data.success) {
        setReviews(response.data.data || []);
        updateReviewStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
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
      pending: reviewData.filter(item => !item.isApproved).length,
      reported: reviewData.filter(item => item.isReported).length,
      approved: reviewData.filter(item => item.isApproved && !item.isReported).length
    };
    setStats(prev => ({ ...prev, reviews: stats }));
  };

  const handleApproveReview = async (reviewId) => {
    if (!window.confirm('Approve this review? It will be visible to all students.')) {
      return;
    }

    try {
      const response = await axios.put(`/api/course-reviews/admin/approve/${reviewId}`);
      if (response.data.success) {
        alert('Review approved successfully!');
        fetchAllReviews();
      }
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    }
  };

  const handleRejectReview = async (reviewId) => {
    const reason = prompt('Enter rejection reason for the student:');
    if (!reason || reason.trim().length < 5) {
      alert('Please provide a meaningful reason (at least 5 characters)');
      return;
    }

    try {
      const response = await axios.put(`/api/course-reviews/admin/reject/${reviewId}`, { reason });
      if (response.data.success) {
        alert('Review rejected successfully!');
        fetchAllReviews();
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Failed to reject review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) {
      return;
    }

    try {
      // FIXED: Updated endpoint from /api/course-reviews/admin/reject/${reviewId} 
      // to /api/course-reviews/admin/${reviewId}
      const response = await axios.delete(`/api/course-reviews/admin/${reviewId}`);
      if (response.data.success) {
        alert('Review deleted successfully!');
        fetchAllReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
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
    if (!reason || reason.trim().length < 5) {
      alert('Please provide a meaningful reason (at least 5 characters)');
      return;
    }

    try {
      const response = await axios.put(`/api/course-content/admin/reject/${id}`, { reason });
      if (response.data.success) {
        alert('Content rejected. Student will see the reason.');
        fetchAllContent();
      }
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('Failed to reject content');
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

  const getReviewStatus = (review) => {
    if (!review.isApproved) return 'pending';
    if (review.isReported) return 'reported';
    return 'approved';
  };

  const filteredReviews = reviews.filter(review => {
    // Apply status filter
    const status = getReviewStatus(review);
    if (filter !== 'all' && status !== filter) return false;
    
    // Apply program filter
    if (selectedProgram !== 'all' && review.program !== selectedProgram) return false;
    
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const courseCodeMatch = review.courseCode?.toLowerCase().includes(searchLower);
      const reviewTextMatch = review.reviewText?.toLowerCase().includes(searchLower);
      const studentNameMatch = review.studentName?.toLowerCase().includes(searchLower);
      
      if (!courseCodeMatch && !reviewTextMatch && !studentNameMatch) {
        return false;
      }
    }
    return true;
  });

  const filteredContent = content.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.courseCode.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const StarRating = ({ rating }) => {
    return (
      <div className="star-rating-display">
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star} 
            className={`star ${star <= rating ? 'filled' : ''}`}
            style={{ color: star <= rating ? '#ffc107' : '#ddd' }}
          >
            ★
          </span>
        ))}
      </div>
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
        <p>Manage course content and reviews - Pending: {stats.reviews.pending} reviews, {stats.content.pending} content</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.reviews.total}</h3>
            <p>Total Reviews</p>
            <small>Pending: {stats.reviews.pending}</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <h3>{stats.content.total}</h3>
            <p>Total Content</p>
            <small>Pending: {stats.content.pending}</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.reviews.approved}</h3>
            <p>Approved Reviews</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚩</div>
          <div className="stat-content">
            <h3>{stats.reviews.reported}</h3>
            <p>Reported Reviews</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Reviews ({stats.reviews.pending} pending)
        </button>
        <button
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📁 Content ({stats.content.pending} pending)
        </button>
      </div>

      {/* Filters and Search */}
      <div className="filter-row">
        <div className="filter-group">
          <label>Filter by Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="reported">Reported</option>
            {/* Add 'rejected' option if you want to show rejected reviews */}
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        {activeTab === 'reviews' && (
          <div className="filter-group">
            <label>Filter by Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
            >
              {programs.map(program => (
                <option key={program} value={program}>
                  {program === 'all' ? 'All Programs' : program}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="filter-group search-group">
          <label>Search</label>
          <input
            type="text"
            placeholder={activeTab === 'reviews' 
              ? "Search by course code, review text, or student..." 
              : "Search by title or course code..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

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
              {filteredReviews.map(review => {
                const status = getReviewStatus(review);
                // Check if review is rejected (has rejectionReason but not isApproved)
                const isRejected = review.rejectionReason && !review.isApproved;
                
                return (
                  <div key={review._id} className="review-card admin">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <strong>
                          {review.anonymous ? 'Anonymous' : review.studentName}
                          <span className="badge badge-program">{review.program}</span>
                        </strong>
                        <small>
                          {review.courseCode} - {review.semester} {review.year}
                          <span className="badge badge-status">
                            {isRejected ? '❌ Rejected' : 
                             status === 'pending' ? '⏳ Pending' : 
                             status === 'reported' ? '🚩 Reported' : '✅ Approved'}
                          </span>
                        </small>
                        <small>Email: {review.studentEmail}</small>
                      </div>
                      <div className="review-rating">
                        <StarRating rating={review.rating} />
                        <span>{review.rating}/5</span>
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
                        {review.isReported && <span>Reports: {review.reportCount || 0} 🚩</span>}
                      </div>
                      
                      <div className="admin-actions">
                        {!isRejected && status === 'pending' && (
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
                        
                        {!isRejected && status === 'reported' && (
                          <>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleApproveReview(review._id)}
                              title="Approve and remove report flag"
                            >
                              ✅ Approve & Clear Report
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRejectReview(review._id)}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        
                        {isRejected && (
                          <>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleApproveReview(review._id)}
                            >
                              ✅ Approve Anyway
                            </button>
                            <button 
                              className="btn btn-warning btn-sm"
                              onClick={() => handleRejectReview(review._id)}
                              title="Update rejection reason"
                            >
                              📝 Update Reason
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
                    
                    {review.rejectionReason && (
                      <div className="rejection-reason">
                        <strong>Rejection Reason:</strong> {review.rejectionReason}
                        {review.rejectedAt && (
                          <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#666' }}>
                            (Rejected on: {new Date(review.rejectedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    )}
                    
                    {review.isReported && review.reportReason && (
                      <div className="report-reason">
                        <strong>Report Reason:</strong> {review.reportReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                          Uploaded by: {item.uploadedBy} • 
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`badge badge-status badge-${item.status}`}>
                      {item.status === 'approved' ? '✅ Approved' : 
                       item.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                    </span>
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
    </div>
  );
};

export default CourseAdminPanel;