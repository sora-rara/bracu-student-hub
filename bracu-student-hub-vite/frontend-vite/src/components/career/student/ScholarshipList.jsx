// src/components/career/student/ScholarshipList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import ScholarshipCard from './ScholarshipCard';
import "../../../App.css";

const ScholarshipList = () => {
  const [scholarships, setScholarships] = useState([]);
  const [filteredScholarships, setFilteredScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const navigate = useNavigate();

  // Fetch scholarships and filter data
  useEffect(() => {
    fetchScholarships();
    fetchFilters();
  }, []);

  // Apply filters whenever filters or scholarships change
  useEffect(() => {
    applyFilters();
  }, [scholarships, searchTerm, categoryFilter, typeFilter, levelFilter, amountFilter, sortBy]);

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/career/scholarships');
      
      if (response.data.success) {
        setScholarships(response.data.data || []);
        setError('');
      } else {
        setError('Failed to load scholarships.');
        setScholarships([]);
      }
    } catch (err) {
      console.error('Error fetching scholarships:', err);
      setError('Failed to load scholarships. Please try again later.');
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      // Fetch categories
      const catResponse = await axios.get('/api/career/scholarships/categories/all');
      if (catResponse.data.success) {
        setCategories(catResponse.data.data || []);
      }

      // Fetch types from scholarships data
      const response = await axios.get('/api/career/scholarships');
      if (response.data.success) {
        const allTypes = new Set();
        response.data.data.forEach(scholarship => {
          if (scholarship.type) {
            allTypes.add(scholarship.type);
          }
        });
        setTypes(Array.from(allTypes).sort());
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...scholarships];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(scholarship =>
        (scholarship.title && scholarship.title.toLowerCase().includes(term)) ||
        (scholarship.organization?.name && scholarship.organization.name.toLowerCase().includes(term)) ||
        (scholarship.description && scholarship.description.toLowerCase().includes(term)) ||
        (scholarship.shortDescription && scholarship.shortDescription.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(scholarship => scholarship.category === categoryFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(scholarship => scholarship.type === typeFilter);
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(scholarship => scholarship.level === levelFilter);
    }

    // Amount filter
    if (amountFilter !== 'all') {
      filtered = filtered.filter(scholarship => {
        if (!scholarship.funding?.amount) return false;
        const amount = scholarship.funding.amount;
        
        if (amountFilter === 'under-1000') return amount < 1000;
        if (amountFilter === '1000-5000') return amount >= 1000 && amount <= 5000;
        if (amountFilter === '5000-10000') return amount > 5000 && amount <= 10000;
        if (amountFilter === 'over-10000') return amount > 10000;
        if (amountFilter === 'full-tuition') return scholarship.funding.type === 'full-tuition';
        
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'deadline':
          const deadlineA = new Date(a.applicationDetails?.deadline || '9999-12-31');
          const deadlineB = new Date(b.applicationDetails?.deadline || '9999-12-31');
          return deadlineA - deadlineB;
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'featured':
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        case 'amount-high':
          return (b.funding?.amount || 0) - (a.funding?.amount || 0);
        case 'amount-low':
          return (a.funding?.amount || 0) - (b.funding?.amount || 0);
        default:
          return 0;
      }
    });

    setFilteredScholarships(filtered);
  };

  const formatCategory = (category) => {
    if (!category) return 'General';
    return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const handleRetry = () => {
    setError('');
    fetchScholarships();
  };

  const handleCreateScholarship = () => {
    navigate('/admin/career/scholarships/create');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading scholarships...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Scholarships</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  // Calculate statistics
  const featuredScholarships = filteredScholarships.filter(s => s.isFeatured);
  const activeScholarships = filteredScholarships.filter(s => 
    s.status === 'active' || s.status === 'Active' || s.status === 'published'
  );

  return (
    <div className="scholarship-list">
      {/* Header */}
      <div className="list-header">
        <h1>Scholarship Opportunities</h1>
        <p className="subtitle">
          Discover and apply for scholarships to fund your education
        </p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{scholarships.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active:</span>
          <span className="stat-value">{activeScholarships.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Featured:</span>
          <span className="stat-value">{featuredScholarships.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Filtered:</span>
          <span className="stat-value">{filteredScholarships.length}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search scholarships by title, organization, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-grid">
          <div className="filter-group">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Scholarship Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Education Level</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Levels</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="phd">PhD</option>
              <option value="postdoc">Postdoctoral</option>
              <option value="all-levels">All Levels</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Amount</label>
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Amounts</option>
              <option value="under-1000">Under $1,000</option>
              <option value="1000-5000">$1,000 - $5,000</option>
              <option value="5000-10000">$5,000 - $10,000</option>
              <option value="over-10000">Over $10,000</option>
              <option value="full-tuition">Full Tuition</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="deadline">Deadline Soonest</option>
              <option value="title">Title (A-Z)</option>
              <option value="featured">Featured First</option>
              <option value="amount-high">Amount (High to Low)</option>
              <option value="amount-low">Amount (Low to High)</option>
            </select>
          </div>
        </div>

        <div className="active-filters">
          {searchTerm && (
            <span className="active-filter">
              Search: "{searchTerm}"
              <button onClick={() => setSearchTerm('')}>×</button>
            </span>
          )}
          {categoryFilter !== 'all' && (
            <span className="active-filter">
              Category: {formatCategory(categoryFilter)}
              <button onClick={() => setCategoryFilter('all')}>×</button>
            </span>
          )}
          {typeFilter !== 'all' && (
            <span className="active-filter">
              Type: {typeFilter}
              <button onClick={() => setTypeFilter('all')}>×</button>
            </span>
          )}
          {levelFilter !== 'all' && (
            <span className="active-filter">
              Level: {levelFilter}
              <button onClick={() => setLevelFilter('all')}>×</button>
            </span>
          )}
          {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' || levelFilter !== 'all' || amountFilter !== 'all') && (
            <button 
              className="clear-all-btn"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setTypeFilter('all');
                setLevelFilter('all');
                setAmountFilter('all');
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredScholarships.length}</strong> of{' '}
          <strong>{scholarships.length}</strong> scholarships
        </p>
      </div>

      {/* Featured Scholarships */}
      {featuredScholarships.length > 0 && (
        <div className="featured-section">
          <h2 className="section-title">
            <span className="featured-icon">⭐</span> Featured Scholarships
          </h2>
          <p className="section-subtitle">Highlighted opportunities you shouldn't miss</p>
          <div className="featured-grid">
            {featuredScholarships.map(scholarship => (
              <ScholarshipCard 
                key={scholarship._id} 
                scholarship={scholarship}
                featured={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Scholarships */}
      <div className="all-scholarships-section">
        <h2 className="section-title">
          {featuredScholarships.length > 0 ? 'All Scholarships' : 'Available Scholarships'}
        </h2>
        
        {filteredScholarships.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No scholarships found</h3>
            <p>Try adjusting your filters or search term to find more opportunities</p>
            <button 
              className="reset-btn"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setTypeFilter('all');
                setLevelFilter('all');
                setAmountFilter('all');
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="scholarships-grid">
            {filteredScholarships
              .filter(s => !s.isFeatured || featuredScholarships.length === 0)
              .map(scholarship => (
                <ScholarshipCard 
                  key={scholarship._id} 
                  scholarship={scholarship}
                  featured={false}
                />
              ))}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="tips-section">
        <div className="tips-header">
          <h3><span className="tip-icon">💡</span> Tips for Success</h3>
          <p className="tips-subtitle">Maximize your chances of securing scholarships</p>
        </div>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-number">01</div>
            <h4>Start Early</h4>
            <p>Begin searching for scholarships well before application deadlines.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">02</div>
            <h4>Tailor Your Essays</h4>
            <p>Customize your personal statements for each specific scholarship.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">03</div>
            <h4>Meet All Requirements</h4>
            <p>Carefully review eligibility criteria before applying.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">04</div>
            <h4>Follow Instructions</h4>
            <p>Submit all required documents in the specified format.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipList;