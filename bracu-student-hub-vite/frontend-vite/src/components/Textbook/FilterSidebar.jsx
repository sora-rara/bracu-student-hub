import React from 'react';

const FilterSidebar = ({ filters, onFilterChange, onClearFilters }) => {
  const conditionOptions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
  const transactionOptions = ['Sell', 'Exchange', 'Both'];

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3>
          <span className="icon"></span>
          
        </h3>
        <button className="btn-clear-filters" onClick={onClearFilters}>
          Clear All
        </button>
      </div>

      {/* Course Filter - Changed from dropdown to text input */}
      <div className="filter-group">
        <label className="filter-label">
          <span className="icon">📚</span>
          Course Code
        </label>
        <input
          type="text"
          className="filter-input"
          value={filters.courseCode}
          onChange={(e) => onFilterChange({ ...filters, courseCode: e.target.value })}
          placeholder="Enter course code (e.g., CSE220)"
        />
      </div>

      {/* Transaction Type Filter */}
      <div className="filter-group">
        <label className="filter-label">
          <span className="icon">💱</span>
          Transaction Type
        </label>
        <div className="filter-options">
          {transactionOptions.map(type => (
            <label key={type} className="filter-option">
              <input
                type="radio"
                name="transactionType"
                value={type}
                checked={filters.transactionType === type}
                onChange={(e) => onFilterChange({ ...filters, transactionType: e.target.value })}
              />
              <span>{type}</span>
            </label>
          ))}
          <label className="filter-option">
            <input
              type="radio"
              name="transactionType"
              value=""
              checked={!filters.transactionType}
              onChange={(e) => onFilterChange({ ...filters, transactionType: '' })}
            />
            <span>All Types</span>
          </label>
        </div>
      </div>

      {/* Condition Filter */}
      <div className="filter-group">
        <label className="filter-label">
          <span className="icon">⭐</span>
          Condition
        </label>
        <div className="filter-options">
          {conditionOptions.map(condition => (
            <label key={condition} className="filter-option">
              <input
                type="checkbox"
                checked={filters.condition === condition}
                onChange={(e) => {
                  onFilterChange({
                    ...filters,
                    condition: e.target.checked ? condition : ''
                  });
                }}
              />
              <span>{condition}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <label className="filter-label">
          <span className="icon">💰</span>
          Price Range (৳)
        </label>
        <div className="price-range-group">
          <input
            type="number"
            className="price-input"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
            min="0"
          />
          <input
            type="number"
            className="price-input"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
            min="0"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="filter-group">
        <label className="filter-label">
          <span className="icon">⚡</span>
          Quick Filters
        </label>
        <div className="filter-options">
          <button
            className="filter-option"
            style={{ justifyContent: 'flex-start', background: 'none', border: 'none', width: '100%' }}
            onClick={() => onFilterChange({ ...filters, minPrice: '0', maxPrice: '500' })}
          >
            <span>💸</span>
            <span>Under ৳500</span>
          </button>
          <button
            className="filter-option"
            style={{ justifyContent: 'flex-start', background: 'none', border: 'none', width: '100%' }}
            onClick={() => onFilterChange({ ...filters, condition: 'New' })}
          >
            <span>🆕</span>
            <span>New Condition Only</span>
          </button>
          <button
            className="filter-option"
            style={{ justifyContent: 'flex-start', background: 'none', border: 'none', width: '100%' }}
            onClick={() => onFilterChange({ ...filters, transactionType: 'Exchange' })}
          >
            <span>🔄</span>
            <span>Exchange Only</span>
          </button>
        </div>
      </div>

      <button className="btn-apply-filters" onClick={() => onFilterChange(filters)}>
        Apply Filters
      </button>
    </div>
  );
};

export default FilterSidebar;