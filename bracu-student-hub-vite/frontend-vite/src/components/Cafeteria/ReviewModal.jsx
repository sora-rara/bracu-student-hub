import React, { useState } from 'react';
import axios from '../../api/axios.jsx';

const ReviewModal = ({ isOpen, onClose, foodItem }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [studentName, setStudentName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // FIXED: Get image URL properly
  const getFoodItemImage = (imageName) => {
    if (!imageName) {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }

    if (imageName.startsWith('http')) {
      return imageName;
    }

    if (imageName.startsWith('/uploads/')) {
      return `http://localhost:5000${imageName}`;
    }

    return `http://localhost:5000/uploads/${imageName}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      alert('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post('/cafeteria/review', {
        foodItemId: foodItem._id,
        rating,
        comment,
        studentName: anonymous ? '' : studentName,
        anonymous
      });

      if (response.data.success) {
        alert('✅ Review submitted successfully!');
        onClose();
        // Reset form
        setRating(0);
        setComment('');
        setStudentName('');
        setAnonymous(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !foodItem) return null;

  const foodImageUrl = getFoodItemImage(foodItem.image);

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
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
              <p className="food-category">{foodItem.category?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            className="close-btn"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rating-input">
            <label>Your Rating *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  disabled={submitting}
                >
                  ★
                </button>
              ))}
              <span className="rating-display">{rating} out of 5 stars</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="studentName">Your Name (Optional)</label>
            <input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your name"
              disabled={anonymous || submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="comment">Comment *</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this food item..."
              rows="4"
              maxLength="500"
              required
              disabled={submitting}
            />
            <div className="char-count">{comment.length}/500 characters</div>
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
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={rating === 0 || !comment.trim() || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;