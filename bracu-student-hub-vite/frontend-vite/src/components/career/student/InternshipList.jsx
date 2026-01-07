// src/components/career/student/InternshipList.jsx - FIXED
import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios'; // Use your centralized axios instance
import InternshipCard from './InternshipCard';
import "../../../App.css";

const InternshipList = () => {
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);

  // Fetch internships and filter data
  useEffect(() => {
    fetchInternships();
    fetchFilters();
  }, []);

  // Apply filters whenever filters or internships change
  useEffect(() => {
    applyFilters();
  }, [internships, searchTerm, categoryFilter, typeFilter, locationFilter, sortBy]);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/career/internships');
      
      if (response.data.success) {
        setInternships(response.data.data || []);
        setError('');
      } else {
        setError('Failed to load internships.');
        setInternships([]);
      }
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError('Failed to load internships. Please try again later.');
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      // Fetch categories
      const catResponse = await axios.get('/api/career/categories');
      if (catResponse.data.success) {
        setCategories(catResponse.data.data || []);
      }

      // Fetch types from internships data
      const response = await axios.get('/api/career/internships');
      if (response.data.success) {
        const allTypes = new Set();
        response.data.data.forEach(internship => {
          if (internship.type) {
            allTypes.add(internship.type);
          }
        });
        setTypes(Array.from(allTypes).sort());
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...internships];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(internship =>
        (internship.title && internship.title.toLowerCase().includes(term)) ||
        (internship.organization?.name && internship.organization.name.toLowerCase().includes(term)) ||
        (internship.description && internship.description.toLowerCase().includes(term)) ||
        (internship.shortDescription && internship.shortDescription.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(internship => internship.category === categoryFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(internship => internship.type === typeFilter);
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(internship => {
        if (!internship.location) return false;
        const locationType = internship.location.type || 'on-site';
        if (locationFilter === 'remote') return locationType.toLowerCase().includes('remote');
        if (locationFilter === 'on-site') return locationType.toLowerCase().includes('on-site');
        if (locationFilter === 'hybrid') return locationType.toLowerCase().includes('hybrid');
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
        default:
          return 0;
      }
    });

    setFilteredInternships(filtered);
  };

  const formatCategory = (category) => {
    if (!category) return 'General';
    return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleRetry = () => {
    setError('');
    fetchInternships();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading internships...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Internships</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  // Calculate statistics
  const featuredInternships = filteredInternships.filter(i => i.isFeatured);
  const activeInternships = filteredInternships.filter(i => 
    i.status === 'active' || i.status === 'Active' || i.status === 'published'
  );

  return (
    <div className="internship-list">
      {/* Header */}
      <div className="list-header">
        <h1>Internship Opportunities</h1>
        <p className="subtitle">
          Discover and apply for internships from leading organizations
        </p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{internships.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active:</span>
          <span className="stat-value">{activeInternships.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Featured:</span>
          <span className="stat-value">{featuredInternships.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Filtered:</span>
          <span className="stat-value">{filteredInternships.length}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search internships by title, company, or keyword..."
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
            <label>Internship Type</label>
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
            <label>Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Locations</option>
              <option value="remote">Remote</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
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
          {locationFilter !== 'all' && (
            <span className="active-filter">
              Location: {locationFilter}
              <button onClick={() => setLocationFilter('all')}>×</button>
            </span>
          )}
          {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' || locationFilter !== 'all') && (
            <button 
              className="clear-all-btn"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setTypeFilter('all');
                setLocationFilter('all');
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
          Showing <strong>{filteredInternships.length}</strong> of{' '}
          <strong>{internships.length}</strong> internships
        </p>
      </div>

      {/* Featured Internships */}
      {featuredInternships.length > 0 && (
        <div className="featured-section">
          <h2 className="section-title">
            <span className="featured-icon">⭐</span> Featured Internships
          </h2>
          <p className="section-subtitle">Highlighted opportunities you shouldn't miss</p>
          <div className="featured-grid">
            {featuredInternships.map(internship => (
              <InternshipCard 
                key={internship._id} 
                internship={internship}
                featured={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Internships */}
      <div className="all-internships-section">
        <h2 className="section-title">
          {featuredInternships.length > 0 ? 'All Internships' : 'Available Internships'}
        </h2>
        
        {filteredInternships.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No internships found</h3>
            <p>Try adjusting your filters or search term to find more opportunities</p>
            <button 
              className="reset-btn"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setTypeFilter('all');
                setLocationFilter('all');
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="internships-grid">
            {filteredInternships
              .filter(i => !i.isFeatured || featuredInternships.length === 0)
              .map(internship => (
                <InternshipCard 
                  key={internship._id} 
                  internship={internship}
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
          <p className="tips-subtitle">Maximize your chances of landing the perfect internship</p>
        </div>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-number">01</div>
            <h4>Tailor Your Application</h4>
            <p>Customize your resume and cover letter for each specific role.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">02</div>
            <h4>Research Companies</h4>
            <p>Learn about the company's mission, culture, and recent projects.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">03</div>
            <h4>Network Effectively</h4>
            <p>Connect with professionals on LinkedIn and attend career fairs.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">04</div>
            <h4>Follow Up</h4>
            <p>Send thank-you emails after interviews to show continued interest.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipList;