import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';

const TextbookCard = ({ textbook, onFavoriteToggle, onDelete }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(textbook.favorites?.length || 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const getImageUrl = (image) => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `${BASE_URL}/uploads/textbooks/${image}`;
  };

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await axios.post(`/api/textbooks/${textbook._id}/toggle-favorite`);
      if (response.data.success) {
        setIsFavorited(!isFavorited);
        setFavoriteCount(response.data.data.favoriteCount);
        if (onFavoriteToggle) onFavoriteToggle(textbook._id, !isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/textbooks/${textbook._id}`);
      if (onDelete) onDelete(textbook._id);
    } catch (error) {
      console.error('Error deleting textbook:', error);
      alert('Failed to delete listing');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="textbook-card">
      <Link to={`/textbooks/${textbook._id}`} className="textbook-card-link">
        {/* Image Section */}
        <div className="card-image-container">
          {textbook.images?.[0] ? (
            <img
              src={getImageUrl(textbook.images[0])}
              alt={textbook.title}
              className="card-image"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
              }}
            />
          ) : (
            <div className="image-fallback">
              <div className="fallback-icon">📚</div>
              <div className="fallback-text">No Image</div>
            </div>
          )}
          
          {/* Status Badge */}
          <span className={`status-badge status-${textbook.status?.toLowerCase() || 'available'}`}>
            {textbook.status || 'Available'}
          </span>
          
          {/* Favorite Button */}
          <button 
            className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavoriteToggle}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? '❤️' : '🤍'}
          </button>
          
          {/* Price Tag */}
          <span className="price-tag">৳{textbook.price?.toFixed(2) || '0.00'}</span>
        </div>

        {/* Content Section */}
        <div className="card-content">
          <h3 className="card-title">{textbook.title}</h3>
          <p className="card-author">by {textbook.author}</p>
          
          {textbook.courseCode && (
            <span className="course-code-badge">{textbook.courseCode}</span>
          )}
          
          <div className="card-badges">
            <span className="condition-badge">{textbook.condition || 'Good'}</span>
            <span className="transaction-badge">{textbook.transactionType || 'Sell'}</span>
          </div>
          
          <p className="edition-text">
            {textbook.edition || 'Latest'} Edition
            {textbook.isbn && ` • ISBN: ${textbook.isbn}`}
          </p>
          
          <div className="seller-info">
            <div className="seller-avatar">
              {textbook.sellerName?.charAt(0) || 'U'}
            </div>
            <div className="seller-details">
              <p className="seller-name">{textbook.sellerName || 'Unknown Seller'}</p>
              <p className="seller-date">
                {textbook.createdAt ? new Date(textbook.createdAt).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
          
          <div className="card-stats">
            <div className="stat-item-small">
              <span className="stat-icon">👁️</span>
              <span>{textbook.viewCount || 0}</span>
            </div>
            <div className="stat-item-small">
              <span className="stat-icon">❤️</span>
              <span>{favoriteCount}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Delete Button (only for owner) */}
      {textbook.isOwner && (
        <div className="delete-section">
          <button
            className="btn-delete"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Listing'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TextbookCard;