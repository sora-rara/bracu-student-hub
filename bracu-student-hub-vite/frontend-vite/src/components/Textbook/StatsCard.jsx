import React from 'react';

const StatsCard = ({ stats }) => {
  const overallStats = stats?.overall || {
    totalListings: 0,
    averagePrice: 0,
    minPrice: 0,
    maxPrice: 0
  };

  const popularCourses = stats?.popularCourses || [];

  return (
    <div className="stats-card">
      <div className="stats-header">
        <span className="stats-icon">📊</span>
        <h3>TextBook Stats</h3>
      </div>
      
      {/* Overall Stats */}
      <div className="filter-group">
        <label className="filter-label">Total Listings</label>
        <div className="stat-item">
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${Math.min(100, (overallStats.totalListings || 0) / 10)}%` }}
            ></div>
          </div>
          <div className="stat-label">
            <span>{overallStats.totalListings || 0} listings</span>
            <span>{Math.min(100, (overallStats.totalListings || 0) / 10)}%</span>
          </div>
        </div>
      </div>
      
      {/* Price Range Display */}
      <div className="filter-group">
        <label className="filter-label">Price Range</label>
        <div className="price-range-display">
          <div className="price-min">
            <span className="price-label">Lowest</span>
            <div className="price-amount">৳{(overallStats.minPrice || 0).toFixed(2)}</div>
          </div>
          <div className="price-max">
            <span className="price-label">Highest</span>
            <div className="price-amount">৳{(overallStats.maxPrice || 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-label">
          <span>Average Price</span>
          <span>৳{(overallStats.averagePrice || 0).toFixed(2)}</span>
        </div>
      </div>
      
      {/* Popular Courses - Removed duplicate icon */}
      {popularCourses.length > 0 && (
        <div className="filter-group">
          <div className="filter-label">
            Popular Courses
          </div>
          <div className="popular-courses-section">
            {popularCourses.slice(0, 5).map((course, index) => (
              <div key={course._id || index} className="popular-course-item">
                <span className="course-code">{course._id || 'N/A'}</span>
                <span className="course-listings">{course.count} listings</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;