import React, { useState } from 'react';
import axios from 'axios'; // Make sure this imports your configured axios instance

const ReviewForm = ({ foodItems = [], onSubmit }) => {
    const [review, setReview] = useState({
        foodItemId: '',
        rating: 5,
        comment: '',
        studentName: '',
        anonymous: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!review.foodItemId) {
            alert('Please select a food item');
            return;
        }

        if (!review.comment.trim()) {
            alert('Please enter your review');
            return;
        }

        setIsSubmitting(true);

        try {
            // IMPORTANT: Use '/cafeteria/review' since baseURL is 'http://localhost:5000/api'
            // This becomes: http://localhost:5000/api/cafeteria/review
            const response = await axios.post('/cafeteria/review', review);

            console.log('✅ Review submitted successfully:', response.data);

            if (onSubmit) {
                onSubmit(review);
            }

            // Reset form
            setReview({
                foodItemId: '',
                rating: 5,
                comment: '',
                studentName: '',
                anonymous: false
            });

            alert('Review submitted successfully!');

        } catch (error) {
            console.error('❌ Error submitting review:', error);

            if (error.response) {
                if (error.response.status === 404) {
                    alert('Error: Review endpoint not found. Please check the server configuration.');
                    console.log('Full error:', error.response.data);
                } else if (error.response.status === 401) {
                    alert('Please log in to submit a review.');
                } else if (error.response.status === 400) {
                    alert('Invalid review data. Please check your inputs.');
                } else {
                    alert(`Failed to submit review. Server error: ${error.response.status}`);
                }
            } else if (error.request) {
                alert('No response from server. Please check your connection.');
            } else {
                alert(`Error: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="review-form-container">
            <form className="review-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Select Food Item *</label>
                    <select
                        value={review.foodItemId}
                        onChange={(e) => setReview({ ...review, foodItemId: e.target.value })}
                        required
                        disabled={isSubmitting}
                    >
                        <option value="">Choose a food item...</option>
                        {foodItems.map(item => (
                            <option key={item._id} value={item._id}>
                                {item.name} - ৳{item.price?.toFixed(2)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Your Rating *</label>
                    <div className="star-rating-input">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`star-btn ${star <= review.rating ? 'active' : ''}`}
                                onClick={() => !isSubmitting && setReview({ ...review, rating: star })}
                                disabled={isSubmitting}
                            >
                                ★
                            </button>
                        ))}
                        <span className="rating-value">{review.rating} stars</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Your Name (Optional)</label>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={review.studentName}
                        onChange={(e) => setReview({ ...review, studentName: e.target.value })}
                        disabled={review.anonymous || isSubmitting}
                    />
                </div>

                <div className="form-group">
                    <label>Your Review *</label>
                    <textarea
                        placeholder="Share your experience..."
                        value={review.comment}
                        onChange={(e) => setReview({ ...review, comment: e.target.value })}
                        rows="4"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={review.anonymous}
                            onChange={(e) => setReview({ ...review, anonymous: e.target.checked })}
                            disabled={isSubmitting}
                        />
                        <span>Submit anonymously</span>
                    </label>
                </div>

                <button
                    type="submit"
                    className="btn-submit-review"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>

                {/* Debug info */}
                <div style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    color: '#666',
                    display: 'none' /* Set to 'block' to debug */
                }}>
                    <p>Endpoint: POST /cafeteria/review</p>
                    <p>Full URL: http://localhost:5000/api/cafeteria/review</p>
                    <p>Data: {JSON.stringify(review)}</p>
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;