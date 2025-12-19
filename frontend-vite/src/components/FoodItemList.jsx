import React, { useEffect, useState } from "react";
import axios from '../api/axios.jsx';

const FoodItemsList = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Fetching food items...");

    axios.get("/admin/food-items")
      .then((response) => {
        console.log("✅ Food items response:", response.data);

        if (response.data.success) {
          // Handle different response structures
          const items = response.data.data?.foodItems ||
            response.data.data?.allItems ||
            response.data.data ||
            response.data.foodItems ||
            response.data.allItems ||
            [];

          console.log(`✅ Found ${items.length} food items`);
          setFoodItems(items);
        } else {
          setError(response.data.message || "Failed to fetch food items");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching food items:", err);

        let errorMessage = 'Error fetching food items. ';

        if (err.response?.status === 404) {
          errorMessage += 'Endpoint not found. Please check if backend is running on http://localhost:5000';
        } else if (err.message === 'Network Error') {
          errorMessage += 'Cannot connect to backend server. Make sure it is running.';
        } else {
          errorMessage += err.message;
        }

        setError(errorMessage);
        setLoading(false);
      });
  }, []);

  // Get image URL
  const getImageUrl = (imageName) => {
    if (!imageName) {
      return 'https://via.placeholder.com/100x100?text=No+Image';
    }

    if (imageName.startsWith('http')) {
      return imageName;
    }

    if (imageName.startsWith('/uploads/')) {
      return `http://localhost:5000${imageName}`;
    }

    return `http://localhost:5000/uploads/${imageName}`;
  };

  if (loading) {
    return (
      <div className="food-items-list">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading food items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="food-items-list">
        <div className="error-container">
          <h3>❌ Error Loading Food Items</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
            <a href="http://localhost:5000/cafeteria/health" target="_blank" rel="noopener noreferrer">
              Check Backend Health
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="food-items-list">
      <div className="header">
        <h2>Available Food Items ({foodItems.length})</h2>
        <button onClick={() => window.location.reload()} className="refresh-btn">
          Refresh
        </button>
      </div>

      {foodItems.length === 0 ? (
        <div className="empty-state">
          <p>No food items available in the database.</p>
          <p>Add food items through the Admin Panel.</p>
        </div>
      ) : (
        <div className="food-items-grid">
          {foodItems.map((item) => (
            <div key={item._id || item.id} className="food-item-card">
              <div className="item-image">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                  }}
                />
              </div>

              <div className="item-info">
                <h3 className="item-name">{item.name}</h3>

                <div className="item-price-category">
                  <span className="price">৳{item.price?.toFixed(2) || '0.00'}</span>
                  <span className="category">{item.category?.replace('_', ' ') || 'Uncategorized'}</span>
                </div>

                {item.mealTime && (
                  <div className="meal-time">
                    <span className="label">Meal:</span>
                    <span className="value">{item.mealTime}</span>
                  </div>
                )}

                {item.dietaryTags?.length > 0 && (
                  <div className="dietary-tags">
                    {item.dietaryTags.slice(0, 3).map(tag => (
                      <span key={tag} className="dietary-tag">
                        {tag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}

                <div className="item-status">
                  <span className={`status status-${item.status || 'active'}`}>
                    {item.status || 'active'}
                  </span>
                  {item.featured && (
                    <span className="featured-badge">⭐ Featured</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodItemsList;