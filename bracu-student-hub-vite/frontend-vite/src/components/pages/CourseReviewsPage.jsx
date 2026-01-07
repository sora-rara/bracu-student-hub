import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import authService from "../../services/auth.jsx";
import '../../App.css';

const CourseReviewsPage = () => {
  const { courseCode } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSubmitForm, setShowSubmitForm] = useState(false); // NEW: For main submit button

  const [newReview, setNewReview] = useState({
    courseCode: courseCode || '',
    courseTitle: '',
    rating: 5,
    difficulty: 3,
    contentRating: 5,
    instructorRating: 5,
    overallSatisfaction: 5,
    reviewText: '',
    anonymous: false,
    semester: 'Fall',
    year: new Date().getFullYear(),
    department: 'OTHERS',
    program: 'CSE'
  });

  const programs = [
    'CSE', 'EEE', 'ECO', 'ENG', 'MAT', 'PHY', 'CHE', 'BIO',
    'BUS', 'MBA', 'LAW', 'PHARM', 'ARCH', 'ENV', 'OTHERS'
  ];

  const semesters = ['Spring', 'Summer', 'Fall'];

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      if (courseCode) {
        await fetchCourseReviews(courseCode);
        await fetchCourseStats(courseCode);
        await checkUserReview(courseCode);
      } else {
        await fetchCourses();
      }
      setLoading(false);
    };

    initialize();
  }, [courseCode]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/course-reviews/courses/list');
      if (response.data.success) {
        setCourses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchCourseReviews = async (code) => {
    try {
      const response = await axios.get(`/api/course-reviews?courseCode=${code}`);
      if (response.data.success) {
        setReviews(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const fetchCourseStats = async (code) => {
    try {
      const response = await axios.get(`/api/course-reviews/stats/${code}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    }
  };

  const checkUserReview = async (code) => {
    const user = authService.getCurrentUser();
    if (!user) {
      setUserReview(null);
      return;
    }

    try {
      const response = await axios.get('/api/course-reviews/user/my-reviews');
      if (response.data.success) {
        const userReviews = response.data.data || [];
        const existingReview = userReviews.find(review =>
          review.courseCode === code.toUpperCase()
        );
        setUserReview(existingReview || null);
      } else {
        setUserReview(null);
      }
    } catch (error) {
      console.error('Error checking user review:', error);
      setUserReview(null);
    }
  };

  const handleCourseSelect = (course) => {
    navigate(`/course-reviews/${course.courseCode}`);
  };

  // NEW: Handle opening submit form from main button
  const handleOpenSubmitForm = () => {
    if (!authService.isAuthenticated()) {
      alert('Please login to submit a review');
      navigate('/login');
      return;
    }

    const user = authService.getCurrentUser();
    if (user.role === 'admin' || user.isAdmin) {
      alert('Admins cannot submit reviews. Please use a student account.');
      return;
    }

    setShowSubmitForm(true);
    setNewReview({
      courseCode: '',
      courseTitle: '',
      rating: 5,
      difficulty: 3,
      contentRating: 5,
      instructorRating: 5,
      overallSatisfaction: 5,
      reviewText: '',
      anonymous: false,
      semester: 'Fall',
      year: new Date().getFullYear(),
      department: 'OTHERS',
      program: 'CSE'
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const user = authService.getCurrentUser();
    if (!user) {
      alert('Please login to submit a review');
      navigate('/login');
      return;
    }

    // Prevent admins from submitting reviews
    if (user.role === 'admin' || user.isAdmin) {
      alert('Admins cannot submit reviews. Please use a student account.');
      return;
    }

    if (!newReview.courseCode.trim()) {
      alert('Course code is required');
      return;
    }

    if (!newReview.reviewText.trim() || newReview.reviewText.length < 10) {
      alert('Please write a review with at least 10 characters');
      return;
    }

    try {
      const reviewData = {
        ...newReview,
        courseCode: newReview.courseCode.toUpperCase(),
        studentName: user.name,
        studentEmail: user.email,
        studentId: user._id,
        program: newReview.program || 'CSE',
        department: newReview.department || 'OTHERS',
        isApproved: false // All reviews need admin approval
      };

      console.log('Submitting review:', reviewData);

      let response;
      if (userReview) {
        // Update existing review
        response = await axios.put(`/api/course-reviews/${userReview._id}`, reviewData);
      } else {
        // Submit new review
        response = await axios.post('/api/course-reviews', reviewData);
      }

      if (response.data.success) {
        alert(userReview
          ? 'Review updated successfully! It will be visible after admin approval.'
          : 'Review submitted successfully! It will be visible after admin approval.');
        setShowReviewForm(false);
        setShowSubmitForm(false);
        setNewReview({
          courseCode: courseCode || '',
          courseTitle: '',
          rating: 5,
          difficulty: 3,
          contentRating: 5,
          instructorRating: 5,
          overallSatisfaction: 5,
          reviewText: '',
          anonymous: false,
          semester: 'Fall',
          year: new Date().getFullYear(),
          department: 'OTHERS',
          program: 'CSE'
        });

        if (courseCode) {
          await fetchCourseReviews(courseCode);
          await checkUserReview(courseCode);
          await fetchCourseStats(courseCode);
        } else {
          await fetchCourses();
        }
      } else {
        alert(response.data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await axios.post(`/api/course-reviews/${reviewId}/helpful`);
      await fetchCourseReviews(courseCode);
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
        await fetchCourseReviews(courseCode);
        await fetchCourseStats(courseCode);
        alert('Review deleted successfully');
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
      }
    }
  };

  const handleReportReview = async (reviewId) => {
    const reason = prompt('Please enter reason for reporting this review:');
    if (!reason || reason.trim() === '') return;

    try {
      await axios.post(`/api/course-reviews/${reviewId}/report`, { reason });
      alert('Review reported successfully');
      await fetchCourseReviews(courseCode);
    } catch (error) {
      console.error('Error reporting review:', error);
      alert('Failed to report review');
    }
  };

  const StarRating = ({ rating, size = 'medium', onChange }) => {
    const starSize = size === 'small' ? '16px' : size === 'large' ? '28px' : '20px';
    const stars = [1, 2, 3, 4, 5];

    if (onChange) {
      return (
        <div className="star-rating-input">
          {stars.map(star => (
            <button
              key={star}
              type="button"
              className={`star-btn ${rating >= star ? 'active' : ''}`}
              onClick={() => onChange(star)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: starSize,
                color: rating >= star ? '#ffc107' : '#ddd',
                cursor: 'pointer',
                padding: '0',
                transition: 'color 0.2s'
              }}
            >
              ★
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="star-rating-display">
        {stars.map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            style={{
              fontSize: starSize,
              color: star <= rating ? '#ffc107' : '#ddd'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (review) => {
    if (!review.isApproved) {
      return <span className="badge badge-warning">⏳ Pending Approval</span>;
    }
    if (review.isReported) {
      return <span className="badge badge-danger">🚩 Reported</span>;
    }
    return <span className="badge badge-success">✅ Approved</span>;
  };

  // FIXED: Filter and sort for list view - fixed the search logic
  const filteredCourses = courses.filter(course => {
    const searchLower = searchTerm.toLowerCase();

    // Check if course code matches
    const codeMatches = course.courseCode &&
      course.courseCode.toLowerCase().includes(searchLower);

    // Check if course title matches (only if title exists)
    const titleMatches = course.courseTitle &&
      typeof course.courseTitle === 'string' &&
      course.courseTitle.toLowerCase().includes(searchLower);

    // Return true if either code OR title matches
    return codeMatches || titleMatches;
  }).sort((a, b) => {
    if (sortBy === 'courseCode') {
      return a.courseCode.localeCompare(b.courseCode);
    } else if (sortBy === 'avgRating') {
      return (b.avgRating || 0) - (a.avgRating || 0);
    } else if (sortBy === 'totalReviews') {
      return (b.totalReviews || 0) - (a.totalReviews || 0);
    }
    return 0;
  });

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'highest') {
      return b.rating - a.rating;
    } else if (sortBy === 'lowest') {
      return a.rating - b.rating;
    } else if (sortBy === 'mostHelpful') {
      return (b.helpfulCount || 0) - (a.helpfulCount || 0);
    }
    return 0;
  });

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
      {/* HEADER */}
      <div className="page-header">
        {courseCode ? (
          <>
            <button
              className="btn btn-outline btn-back"
              onClick={() => navigate('/course-reviews')}
            >
              ← Back to All Courses
            </button>
            <h1>📚 {courseCode} Reviews</h1>
            {stats && (
              <p className="course-subtitle">
                Average Rating: <strong>{stats.avgRating?.toFixed(1) || 'N/A'}/5</strong> •
                Total Reviews: <strong>{stats.totalReviews || 0}</strong> •
                Last Updated: {new Date(stats.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h1>📚 Course Reviews</h1>
                <p>Browse and read reviews for your courses. Submit your own reviews to help other students!</p>
              </div>
              {/* NEW: Main Submit Review Button */}
              <button
                className="btn btn-primary"
                onClick={handleOpenSubmitForm}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ✍️ Submit Review
              </button>
            </div>
          </>
        )}
      </div>

      {/* LIST VIEW - All Courses */}
      {!courseCode && (
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="courseCode">Sort by Course Code</option>
                <option value="avgRating">Sort by Rating (High to Low)</option>
                <option value="totalReviews">Sort by Review Count</option>
              </select>
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
                >
                  <div className="course-card-header">
                    <h3>{course.courseCode}</h3>
                    <StarRating rating={course.avgRating || 0} size="small" />
                  </div>
                  <p className="course-title">
                    {course.courseTitle || 'No title available'}
                  </p>
                  <div className="course-stats">
                    <span className="stat-item">
                      📝 {course.totalReviews || 0} reviews
                    </span>
                    <span className="stat-item">
                      📅 {course.lastReviewDate ?
                        new Date(course.lastReviewDate).toLocaleDateString() :
                        'No reviews yet'}
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

      {/* DETAIL VIEW - Specific Course */}
      {courseCode && (
        <>
          {/* Course Stats */}
          {stats && (
            <div className="course-stats-section">
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
          <div className="user-review-section">
            <h2>✍️ Your Review</h2>
            {userReview ? (
              <div className="review-card user-review">
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong>
                      {userReview.anonymous ? 'Anonymous' : userReview.studentName}
                    </strong>
                    <small>
                      {userReview.semester} {userReview.year} • {userReview.program}
                      {getStatusBadge(userReview)}
                    </small>
                  </div>
                  <div className="review-rating">
                    <StarRating rating={userReview.rating} />
                    <span>{userReview.rating}/5</span>
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
                          courseCode: userReview.courseCode,
                          courseTitle: userReview.courseTitle,
                          rating: userReview.rating,
                          difficulty: userReview.difficulty,
                          contentRating: userReview.contentRating,
                          instructorRating: userReview.instructorRating,
                          overallSatisfaction: userReview.overallSatisfaction,
                          reviewText: userReview.reviewText,
                          anonymous: userReview.anonymous,
                          semester: userReview.semester,
                          year: userReview.year,
                          department: userReview.department || 'OTHERS',
                          program: userReview.program || 'CSE'
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
            ) : (
              <div className="no-review-section">
                <h3>Share Your Experience</h3>
                <p>
                  {reviews.length === 0 ? 'Be the first to review this course!' : 'Share your thoughts about this course!'}
                </p>
                {authService.isAuthenticated() ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowReviewForm(true)}
                  >
                    ✍️ Submit Your Review
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/login')}
                  >
                    🔒 Login to Submit Review
                  </button>
                )}
              </div>
            )}
          </div>

          {/* All Reviews */}
          <div className="all-reviews-section">
            <div className="reviews-header">
              <h2>👥 All Reviews ({sortedReviews.length})</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="reviews-sort"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="mostHelpful">Most Helpful</option>
              </select>
            </div>

            {sortedReviews.length === 0 ? (
              <div className="empty-state">
                <p>No reviews yet. Be the first to review this course!</p>
              </div>
            ) : (
              <div className="reviews-list">
                {sortedReviews.map(review => {
                  const isCurrentUser = authService.isAuthenticated() &&
                    review.studentEmail === authService.getCurrentUser()?.email;

                  return (
                    <div key={review._id} className={`review-card ${isCurrentUser ? 'current-user' : ''}`}>
                      <div className="review-header">
                        <div className="reviewer-info">
                          <strong>
                            {review.anonymous ? 'Anonymous' : review.studentName}
                            {isCurrentUser && <span className="your-review"> (You)</span>}
                          </strong>
                          <small>
                            {review.semester} {review.year} • {review.program}
                            {getStatusBadge(review)}
                          </small>
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
                        </div>
                        <div className="review-actions">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleMarkHelpful(review._id)}
                          >
                            👍 Helpful ({review.helpfulCount || 0})
                          </button>
                          {authService.isAuthenticated() && !isCurrentUser && (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleReportReview(review._id)}
                            >
                              🚩 Report
                            </button>
                          )}
                          {(authService.isAdmin() || isCurrentUser) && (
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
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Review Form Modal (for specific course) */}
      {showReviewForm && (
        <div className="modal-backdrop" onClick={() => setShowReviewForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                  <label>Program</label>
                  <select
                    value={newReview.program}
                    onChange={(e) => setNewReview({ ...newReview, program: e.target.value })}
                  >
                    {programs.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Overall Rating *</label>
                  <div className="rating-input-group">
                    <StarRating
                      rating={newReview.rating}
                      onChange={(rating) => setNewReview({ ...newReview, rating })}
                    />
                    <span>{newReview.rating}/5</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Semester</label>
                    <select
                      value={newReview.semester}
                      onChange={(e) => setNewReview({ ...newReview, semester: e.target.value })}
                    >
                      {semesters.map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={newReview.year}
                      onChange={(e) => setNewReview({ ...newReview, year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Difficulty Level (1=Easy, 5=Hard)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newReview.difficulty}
                    onChange={(e) => setNewReview({ ...newReview, difficulty: parseInt(e.target.value) })}
                  />
                  <span className="range-value">{newReview.difficulty}/5</span>
                </div>

                <div className="form-group">
                  <label>Your Review *</label>
                  <textarea
                    value={newReview.reviewText}
                    onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
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
                      onChange={(e) => setNewReview({ ...newReview, anonymous: e.target.checked })}
                    />
                    <span>Post anonymously</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {userReview ? 'Update' : 'Submit'} Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Main Submit Form Modal (for all courses page) */}
      {showSubmitForm && (
        <div className="modal-backdrop" onClick={() => setShowSubmitForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✍️ Submit New Review</h2>
              <button
                className="modal-close"
                onClick={() => setShowSubmitForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Course Code *</label>
                  <input
                    type="text"
                    value={newReview.courseCode}
                    onChange={(e) => setNewReview({ ...newReview, courseCode: e.target.value })}
                    placeholder="e.g., CSE220"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Course Title (Optional)</label>
                  <input
                    type="text"
                    value={newReview.courseTitle}
                    onChange={(e) => setNewReview({ ...newReview, courseTitle: e.target.value })}
                    placeholder="e.g., Data Structures"
                  />
                </div>

                <div className="form-group">
                  <label>Program</label>
                  <select
                    value={newReview.program}
                    onChange={(e) => setNewReview({ ...newReview, program: e.target.value })}
                  >
                    {programs.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Overall Rating *</label>
                  <div className="rating-input-group">
                    <StarRating
                      rating={newReview.rating}
                      onChange={(rating) => setNewReview({ ...newReview, rating })}
                    />
                    <span>{newReview.rating}/5</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Semester</label>
                    <select
                      value={newReview.semester}
                      onChange={(e) => setNewReview({ ...newReview, semester: e.target.value })}
                    >
                      {semesters.map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={newReview.year}
                      onChange={(e) => setNewReview({ ...newReview, year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Difficulty Level (1=Easy, 5=Hard)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newReview.difficulty}
                    onChange={(e) => setNewReview({ ...newReview, difficulty: parseInt(e.target.value) })}
                  />
                  <span className="range-value">{newReview.difficulty}/5</span>
                </div>

                <div className="form-group">
                  <label>Content Quality (1=Poor, 5=Excellent)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newReview.contentRating}
                    onChange={(e) => setNewReview({ ...newReview, contentRating: parseInt(e.target.value) })}
                  />
                  <span className="range-value">{newReview.contentRating}/5</span>
                </div>

                <div className="form-group">
                  <label>Instructor Rating (1=Poor, 5=Excellent)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newReview.instructorRating}
                    onChange={(e) => setNewReview({ ...newReview, instructorRating: parseInt(e.target.value) })}
                  />
                  <span className="range-value">{newReview.instructorRating}/5</span>
                </div>

                <div className="form-group">
                  <label>Overall Satisfaction (1=Very Dissatisfied, 5=Very Satisfied)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newReview.overallSatisfaction}
                    onChange={(e) => setNewReview({ ...newReview, overallSatisfaction: parseInt(e.target.value) })}
                  />
                  <span className="range-value">{newReview.overallSatisfaction}/5</span>
                </div>

                <div className="form-group">
                  <label>Your Review *</label>
                  <textarea
                    value={newReview.reviewText}
                    onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
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
                      onChange={(e) => setNewReview({ ...newReview, anonymous: e.target.checked })}
                    />
                    <span>Post anonymously</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowSubmitForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Submit Review
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