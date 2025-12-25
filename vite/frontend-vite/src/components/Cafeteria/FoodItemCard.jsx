import React, { useState } from 'react';
import axios from '../../api/axios.jsx';

const FoodItemCard = ({ item }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [studentName, setStudentName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get image URL - FIXED
  const getImageUrl = (imageName) => {
    if (!imageName) {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }

    if (imageName.startsWith('http')) {
      return imageName;
    }

    // Check if it has /uploads/ prefix
    if (imageName.startsWith('/uploads/')) {
      return `http://localhost:5000${imageName}`;
    }

    // If it's just a filename, add /uploads/
    return `http://localhost:5000/uploads/${imageName}`;
  };

  // Get the image URL
  const imageUrl = getImageUrl(item?.image);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!rating) {
      alert('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post('/cafeteria/review', {
        foodItemId: item._id,
        rating,
        comment,
        studentName: anonymous ? '' : studentName,
        anonymous
      });

      if (response.data.success) {
        alert('✅ Review submitted successfully!');
        setShowReviewModal(false);
        setRating(0);
        setComment('');
        setStudentName('');
        setAnonymous(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="food-item-card">
        {/* Food image */}
        <div className="food-item-image-container">
          <img
            src={imageUrl}
            alt={item?.name || 'Food Item'}
            className="food-item-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />
        </div>

        <div className="food-item-header">
          <h3>{item?.name || 'Unnamed Item'}</h3>
          <span className="price">৳{item?.price?.toFixed(2) || '0.00'}</span>
        </div>

        <div className="food-item-details">
          <p className="description">
            {item?.shortDescription || item?.description || 'No description available'}
          </p>

          <div className="category-badge">
            {item?.category?.replace('_', ' ') || 'Uncategorized'}
          </div>

          <div className="rating-section">
            <div className="stars">
              {'★'.repeat(Math.floor(item?.averageRating || 0))}
              {'☆'.repeat(5 - Math.floor(item?.averageRating || 0))}
            </div>
            <span className="rating-text">
              ({item?.averageRating?.toFixed(1) || '0.0'} · {item?.totalReviews || 0} reviews)
            </span>
          </div>

          {item?.mealTime && (
            <div className="meal-time-badge">
              {item.mealTime}
            </div>
          )}

          {item?.dietaryTags?.length > 0 && (
            <div className="dietary-tags">
              {item.dietaryTags.slice(0, 3).map(tag => (
                <span key={tag} className="dietary-tag">
                  {tag.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="food-item-actions">
          <button
            className="btn-review"
            onClick={() => setShowReviewModal(true)}
          >
            Rate & Review
          </button>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowReviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review {item?.name}</h2>
              <button
                className="close-btn"
                onClick={() => !submitting && setShowReviewModal(false)}
                disabled={submitting}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Your Name (Optional)</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={anonymous || submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Rating *</label>
                  <div className="star-rating-input">
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
                    <span className="rating-value">{rating} stars</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Comment *</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows="4"
                    required
                    disabled={submitting}
                  />
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
                    onClick={() => setShowReviewModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={!rating || !comment.trim() || submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FoodItemCard;