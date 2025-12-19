import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import authService from '../services/auth';

const CourseReviewsPage = () => {
  const { courseCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [view, setView] = useState(courseCode ? 'detail' : 'list'); // 'list' or 'detail'
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('avgRating');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [newReview, setNewReview] = useState({
    rating: 5,
    difficulty: 3,
    contentRating: 5,
    instructorRating: 5,
    overallSatisfaction: 5,
    reviewText: '',
    anonymous: false,
    semester: 'Fall',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    if (courseCode) {
      setView('detail');
      fetchCourseReviews(courseCode);
      fetchCourseStats(courseCode);
      checkUserReview(courseCode);
    } else {
      setView('list');
      fetchCourses();
    }
  }, [courseCode]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/course-reviews/courses/list');
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseReviews = async (code) => {
    try {
      const response = await axios.get(`/api/course-reviews?courseCode=${code}`);
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStats = async (code) => {
    try {
      const response = await axios.get(`/api/course-reviews/stats/${code}`);
      if (response.data.success) {
        setStats(response.data.data.stats);
        // Also get course info
        const courseRes = await axios.get(`/api/course-content/courses/${code}`);
        if (courseRes.data.success) {
          setCurrentCourse(courseRes.data.data.course);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkUserReview = async (code) => {
    const user = authService.getCurrentUser();
    if (user) {
      try {
        const response = await axios.get('/api/course-reviews/user/my-reviews');
        const userReview = response.data.data.find(review => 
          review.courseCode === code
        );
        setUserReview(userReview);
      } catch (error) {
        console.error('Error checking user review:', error);
      }
    }
  };

  const handleCourseSelect = (course) => {
    navigate(`/course-reviews/${course.courseCode}`);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const user = authService.getCurrentUser();
    if (!user) {
      alert('Please login to submit a review');
      navigate('/login');
      return;
    }

    try {
      const reviewData = {
        ...newReview,
        courseCode: courseCode.toUpperCase(),
        courseTitle: currentCourse?.courseName || `Course ${courseCode}`
      };

      const response = await axios.post('/api/course-reviews', reviewData);
      if (response.data.success) {
        alert('Review submitted successfully!');
        setShowReviewForm(false);
        fetchCourseReviews(courseCode);
        checkUserReview(courseCode);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await axios.post(`/api/course-reviews/${reviewId}/helpful`);
      fetchCourseReviews(courseCode);
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await axios.delete(`/api/course-reviews/${reviewId}`);
        if (userReview?._id === reviewId) {
          setUserReview(null);
        }
        fetchCourseReviews(courseCode);
        alert('Review deleted successfully');
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
      }
    }
  };

  // Filter and sort courses for list view
  const filteredCourses = courses.filter(course => 
    course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'courseCode') {
      return sortOrder === 'asc' 
        ? a.courseCode.localeCompare(b.courseCode)
        : b.courseCode.localeCompare(a.courseCode);
    } else if (sortBy === 'avgRating') {
      return sortOrder === 'asc'
        ? a.avgRating - b.avgRating
        : b.avgRating - a.avgRating;
    } else if (sortBy === 'totalReviews') {
      return sortOrder === 'asc'
        ? a.totalReviews - b.totalReviews
        : b.totalReviews - a.totalReviews;
    }
    return 0;
  });

  const StarRating = ({ rating, size = 'medium' }) => {
    const starSize = size === 'small' ? '16px' : '20px';
    return (
      <div className="star-rating" style={{ display: 'inline-flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star} 
            className={`star ${star <= rating ? 'filled' : ''}`}
            style={{ fontSize: starSize, color: star <= rating ? '#ffc107' : '#ddd' }}
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
        <p>Loading course reviews...</p>
      </div>
    );
  }

  return (
    <div className="course-reviews-page">
      {/* HEADER - Shows different content based on view */}
      <div className="page-header">
        {view === 'detail' ? (
          <>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/course-reviews')}
              style={{ marginBottom: '15px' }}
            >
              ← Back to All Courses
            </button>
            <h1>📚 {courseCode} Reviews</h1>
            {currentCourse && (
              <p className="course-title">{currentCourse.courseName}</p>
            )}
          </>
        ) : (
          <>
            <h1>📚 Course Reviews</h1>
            <p>Browse and read reviews for your courses</p>
          </>
        )}
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <>
          {/* Search and Filter */}
          <div className="search-filter-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search courses by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
            
            <div className="sort-controls">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="avgRating">Sort by Rating</option>
                <option value="courseCode">Sort by Course Code</option>
                <option value="totalReviews">Sort by Review Count</option>
              </select>
              <button 
                className="sort-order-btn"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <p>No courses found. Try a different search term.</p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map(course => (
                <div 
                  key={course.courseCode} 
                  className="course-card"
                  onClick={() => handleCourseSelect(course)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="course-card-header">
                    <h3>{course.courseCode}</h3>
                    <StarRating rating={course.avgRating} size="small" />
                  </div>
                  <p className="course-title">{course.courseTitle}</p>
                  <div className="course-stats">
                    <span className="stat-item">
                      <span className="stat-icon">📝</span>
                      <span className="stat-text">{course.totalReviews} reviews</span>
                    </span>
                    <span className="stat-item">
                      <span className="stat-icon">📅</span>
                      <span className="stat-text">
                        Last review: {new Date(course.lastReviewDate).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                  <div className="view-reviews-btn">
                    View Reviews →
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* DETAIL VIEW */}
      {view === 'detail' && (
        <>
          {/* Course Stats */}
          {stats && (
            <div className="course-stats">
              <h2>📊 Course Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <h3>{stats.avgRating?.toFixed(1) || 'N/A'}</h3>
                    <p>Average Rating</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <h3>{stats.totalReviews || 0}</h3>
                    <p>Total Reviews</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <h3>{stats.avgContent?.toFixed(1) || 'N/A'}</h3>
                    <p>Content Quality</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👨‍🏫</div>
                  <div className="stat-content">
                    <h3>{stats.avgInstructor?.toFixed(1) || 'N/A'}</h3>
                    <p>Instructor Rating</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Review Section */}
          {userReview ? (
            <div className="user-review-section">
              <h2>✍️ Your Review</h2>
              <div className="review-card user">
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong>{userReview.anonymous ? 'Anonymous' : userReview.studentName}</strong>
                    <small>
                      {userReview.semester} {userReview.year}
                    </small>
                  </div>
                  <div className="review-rating">
                    <StarRating rating={userReview.rating} />
                    <span className="rating-text">{userReview.rating}/5</span>
                  </div>
                </div>
                <p className="review-text">{userReview.reviewText}</p>
                <div className="review-meta">
                  <div className="review-stats">
                    <span>Difficulty: {userReview.difficulty}/5</span>
                    <span>Content: {userReview.contentRating}/5</span>
                    <span>Instructor: {userReview.instructorRating}/5</span>
                    <span>Satisfaction: {userReview.overallSatisfaction}/5</span>
                  </div>
                  <div className="review-actions">
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setNewReview({
                          rating: userReview.rating,
                          difficulty: userReview.difficulty,
                          contentRating: userReview.contentRating,
                          instructorRating: userReview.instructorRating,
                          overallSatisfaction: userReview.overallSatisfaction,
                          reviewText: userReview.reviewText,
                          anonymous: userReview.anonymous,
                          semester: userReview.semester,
                          year: userReview.year
                        });
                        setShowReviewForm(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteReview(userReview._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-review-section">
              <h2>✍️ Share Your Experience</h2>
              <p>Be the first to review this course!</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowReviewForm(true)}
              >
                ✍️ Submit Your Review
              </button>
            </div>
          )}

          {/* All Reviews */}
          <div className="all-reviews-section">
            <h2>👥 All Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <div className="empty-state">
                <p>No reviews yet. Be the first to review this course!</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <strong>{review.anonymous ? 'Anonymous' : review.studentName}</strong>
                        <small>
                          {review.semester} {review.year}
                        </small>
                      </div>
                      <div className="review-rating">
                        <StarRating rating={review.rating} />
                        <span className="rating-text">{review.rating}/5</span>
                      </div>
                    </div>
                    <p className="review-text">{review.reviewText}</p>
                    <div className="review-meta">
                      <div className="review-stats">
                        <span>Difficulty: {review.difficulty}/5</span>
                        <span>Content: {review.contentRating}/5</span>
                        <span>Instructor: {review.instructorRating}/5</span>
                        <span>Satisfaction: {review.overallSatisfaction}/5</span>
                      </div>
                      <div className="review-actions">
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => handleMarkHelpful(review._id)}
                        >
                          👍 Helpful ({review.helpfulCount || 0})
                        </button>
                        {authService.isAdmin() && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteReview(review._id)}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{userReview ? 'Edit' : 'Submit'} Review for {courseCode}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowReviewForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Overall Rating *</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        className={`star-btn ${newReview.rating >= rating ? 'active' : ''}`}
                        onClick={() => setNewReview({...newReview, rating})}
                      >
                        ★
                      </button>
                    ))}
                    <span className="rating-text">{newReview.rating}/5</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Difficulty Level (1=Easy, 5=Hard)</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={newReview.difficulty}
                      onChange={(e) => setNewReview({...newReview, difficulty: parseInt(e.target.value)})}
                    />
                    <span>{newReview.difficulty}/5</span>
                  </div>
                  <div className="form-group">
                    <label>Content Quality</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={newReview.contentRating}
                      onChange={(e) => setNewReview({...newReview, contentRating: parseInt(e.target.value)})}
                    />
                    <span>{newReview.contentRating}/5</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Instructor Rating</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={newReview.instructorRating}
                      onChange={(e) => setNewReview({...newReview, instructorRating: parseInt(e.target.value)})}
                    />
                    <span>{newReview.instructorRating}/5</span>
                  </div>
                  <div className="form-group">
                    <label>Overall Satisfaction</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={newReview.overallSatisfaction}
                      onChange={(e) => setNewReview({...newReview, overallSatisfaction: parseInt(e.target.value)})}
                    />
                    <span>{newReview.overallSatisfaction}/5</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Semester</label>
                    <select
                      value={newReview.semester}
                      onChange={(e) => setNewReview({...newReview, semester: e.target.value})}
                    >
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={newReview.year}
                      onChange={(e) => setNewReview({...newReview, year: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Your Review *</label>
                  <textarea
                    value={newReview.reviewText}
                    onChange={(e) => setNewReview({...newReview, reviewText: e.target.value})}
                    placeholder="Share your experience with this course..."
                    minLength="10"
                    maxLength="1000"
                    rows="4"
                    required
                  />
                  <small className="char-count">
                    {newReview.reviewText.length}/1000 characters
                  </small>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newReview.anonymous}
                      onChange={(e) => setNewReview({...newReview, anonymous: e.target.checked})}
                    />
                    <span>Post anonymously</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {userReview ? 'Update' : 'Submit'} Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseReviewsPage;