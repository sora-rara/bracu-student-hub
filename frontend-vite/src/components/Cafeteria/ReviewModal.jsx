import React, { useState, useEffect } from 'react';
import axios from '../../api/axios.jsx';
import authService from '../../services/auth.jsx';

const ReviewModal = ({ isOpen, onClose, foodItem, onSubmitReview, onUpdateReview, existingReview }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [studentName, setStudentName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
      setStudentName(existingReview.studentName || existingReview.userName || '');
      setAnonymous(existingReview.anonymous || false);
    } else {
      setRating(0);
      setComment('');
      setStudentName('');
      setAnonymous(false);
    }
    setHoverRating(0);
    setError('');
  }, [existingReview, isOpen]);

  // Get image URL properly
  const getFoodItemImage = (imageName) => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    if (!imageName || typeof imageName !== 'string') {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }

    if (imageName.startsWith('http')) {
      return imageName;
    }

    if (imageName.startsWith('/uploads/')) {
      return `${BASE_URL.replace('/api', '')}${imageName}`;
    }

    return `${BASE_URL.replace('/api', '')}/uploads/${imageName}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (comment.length < 5) {
      setError('Comment should be at least 5 characters long');
      return;
    }

    setSubmitting(true);

    try {
      const reviewData = {
        foodItemId: foodItem._id,
        rating,
        comment: comment.trim(),
        studentName: anonymous ? '' : studentName.trim(),
        anonymous
      };

      if (existingReview) {
        // Update existing review
        await onUpdateReview(existingReview._id, reviewData);
      } else {
        // Submit new review
        await onSubmitReview(reviewData);
      }

      onClose();
    } catch (error) {
      console.error('Error in review modal:', error);
      setError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!submitting) {
      onClose();
    }
  };

  if (!isOpen || !foodItem) return null;

  const foodImageUrl = getFoodItemImage(foodItem.image);

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="food-item-info">
            <img
              src={foodImageUrl}
              alt={foodItem.name}
              className="review-food-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
              }}
            />
            <div className="food-item-details">
              <h2>{foodItem.name}</h2>
              <p className="food-price">Price: ৳{foodItem.price?.toFixed(2) || '0.00'}</p>
              <p className="food-category">{foodItem.category?.replace('_', ' ') || 'Uncategorized'}</p>
            </div>
          </div>
          <button
            className="close-btn"
            onClick={handleCancel}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '15px', padding: '10px' }}>
              {error}
            </div>
          )}

          <div className="rating-input">
            <label>Your Rating *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={submitting}
                >
                  ★
                </button>
              ))}
              <span className="rating-display">
                {rating > 0 ? `${rating} out of 5 stars` : 'Select rating'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Comment *</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError('');
              }}
              placeholder="Share your experience with this food item..."
              rows="4"
              maxLength="500"
              required
              disabled={submitting}
              className={error && !comment.trim() ? 'invalid' : ''}
            />
            <div className="char-count">
              {comment.length}/500 characters
              {comment.length < 5 && comment.length > 0 && (
                <span style={{ color: '#e74c3c', marginLeft: '10px' }}>
                  (Minimum 5 characters required)
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="studentName">Your Name {!anonymous ? '(Optional)' : ''}</label>
            <input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your name"
              disabled={anonymous || submitting}
            />
            {anonymous && (
              <small className="form-text">Your name will be hidden</small>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                disabled={submitting}
              />
              <span>Submit anonymously</span>
            </label>
            <small className="checkbox-hint">
              Your name will not be shown with the review
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={rating === 0 || !comment.trim() || comment.length < 5 || submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner spinner-sm" style={{ marginRight: '8px' }}></span>
                  {existingReview ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                existingReview ? 'Update Review' : 'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;