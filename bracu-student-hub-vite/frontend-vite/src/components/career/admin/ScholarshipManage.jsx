// src/components/career/admin/ScholarshipManage.jsx - WITHOUT AMOUNT COLUMN
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const ScholarshipManage = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScholarships, setTotalScholarships] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const itemsPerPage = 10;

  // Categories from CreateScholarship for consistency
  const categories = [
    'academic-merit',
    'need-based',
    'athletic',
    'minority',
    'women',
    'international',
    'graduate',
    'undergraduate',
    'research',
    'creative-arts',
    'stem',
    'humanities',
    'social-sciences',
    'business',
    'engineering',
    'medical',
    'law',
    'community-service',
    'leadership',
    'other'
  ];

  // Scholarship types
  const scholarshipTypes = [
    'full-tuition',
    'partial-tuition',
    'room-board',
    'book-stipend',
    'travel-grant',
    'research-grant',
    'fellowship',
    'bursary',
    'award',
    'prize'
  ];

  useEffect(() => {
    fetchScholarships();
  }, [currentPage, statusFilter, categoryFilter, refreshTrigger]);

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Try different endpoints
      let url;
      let response;
      
      try {
        // Try endpoint 1
        url = `/api/career/scholarships/admin/all?${params.toString()}`;
        console.log('🔍 Trying endpoint 1:', url);
        response = await axios.get(url, { withCredentials: true });
      } catch (err1) {
        console.log('❌ Endpoint 1 failed, trying endpoint 2');
        // Try endpoint 2
        url = `/api/career/admin/scholarships?${params.toString()}`;
        response = await axios.get(url, { withCredentials: true });
      }
      
      console.log('✅ API Response:', response.data);
      
      if (response.data.success) {
        const scholarshipsData = response.data.data || [];
        setScholarships(scholarshipsData);
        setTotalPages(response.data.totalPages || 1);
        setTotalScholarships(response.data.total || scholarshipsData.length);
      } else {
        setError(response.data.error || 'Failed to load scholarships');
        setScholarships([]);
      }
    } catch (err) {
      console.error('❌ Error fetching scholarships:', err);
      
      if (err.response?.status === 404) {
        setError('Scholarships endpoint not found. Please check backend routes.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('Admin access required!');
      } else {
        setError(err.response?.data?.error || 'Failed to load scholarships. Please try again.');
      }
      
      setScholarships([]);
      setTotalPages(1);
      setTotalScholarships(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scholarship? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting scholarship:', id);
      
      // Try different delete endpoints
      let response;
      try {
        response = await axios.delete(`/api/career/scholarships/admin/${id}`, {
          withCredentials: true
        });
      } catch (err1) {
        response = await axios.delete(`/api/career/admin/scholarships/${id}`, {
          withCredentials: true
        });
      }
      
      if (response.data.success) {
        alert('✅ Scholarship deleted successfully');
        // Refresh the list
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(`Failed to delete scholarship: ${response.data.error}`);
      }
    } catch (err) {
      console.error('❌ Error deleting scholarship:', err);
      alert(`❌ Failed to delete scholarship: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      console.log('🔄 Updating status:', { id, newStatus });
      
      // Convert to lowercase for backend
      const statusToSend = newStatus.toLowerCase();
      
      // Try different endpoints
      let response;
      try {
        response = await axios.put(`/api/career/scholarships/admin/${id}/status`, 
          { status: statusToSend },
          { withCredentials: true }
        );
      } catch (err1) {
        console.log('Trying alternative status endpoint');
        response = await axios.put(`/api/career/admin/scholarships/${id}/status`, 
          { status: statusToSend },
          { withCredentials: true }
        );
      }
      
      if (response.data.success) {
        alert('✅ Status updated successfully');
        // Update local state immediately for better UX
        setScholarships(prev => prev.map(scholarship => 
          scholarship._id === id 
            ? { ...scholarship, status: statusToSend }
            : scholarship
        ));
      } else {
        alert(`Failed to update status: ${response.data.error}`);
      }
    } catch (err) {
      console.error('❌ Error updating status:', err);
      alert(`❌ Failed to update status: ${err.response?.data?.error || err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (currency) => {
    const symbols = {
      'USD': 'US Dollar ($)',
      'EUR': 'Euro (€)',
      'GBP': 'British Pound (£)',
      'BDT': 'Bangladeshi Taka (৳)',
      'INR': 'Indian Rupee (₹)'
    };
    return symbols[currency] || currency;
  };

  const formatCategoryDisplay = (category) => {
    if (!category) return 'Not specified';
    
    // Convert from kebab-case to Title Case
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTypeDisplay = (type) => {
    if (!type) return 'Not specified';
    
    // Convert from kebab-case to Title Case
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'success',
      draft: 'warning',
      closed: 'error',
      archived: 'info',
      pending: 'info'
    };
    
    const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    
    return (
      <span className={`status-badge badge-${colors[status] || 'default'}`}>
        {displayStatus}
      </span>
    );
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Closed', class: 'deadline-passed' };
    if (diffDays === 0) return { text: 'Today', class: 'deadline-today' };
    if (diffDays <= 7) return { text: `${diffDays}d left`, class: 'deadline-urgent' };
    if (diffDays <= 30) return { text: `${diffDays}d left`, class: 'deadline-warning' };
    return { text: `${diffDays}d left`, class: 'deadline-normal' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading scholarships...</p>
      </div>
    );
  }

  return (
    <div className="scholarship-manage-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="header-left">
          <h1>Manage Scholarships</h1>
          <p className="subtitle">Manage all scholarship opportunities</p>
          <div className="header-stats">
            <span className="stat-item">
              <strong>{totalScholarships}</strong> scholarships
            </span>
            <span className="stat-item">
              <strong>{scholarships.filter(s => s.status === 'active').length}</strong> active
            </span>
            <span className="stat-item">
              <strong>{scholarships.filter(s => s.status === 'draft').length}</strong> drafts
            </span>
          </div>
        </div>
        <div className="header-right">
          <button 
            onClick={() => navigate('/admin/career/scholarships/create')}
            className="btn-create"
          >
            + Create New Scholarship
          </button>
          <button 
            onClick={() => navigate('/admin/career')}
            className="btn-back"
          >
            ← Back to Dashboard
          </button>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="btn-refresh"
            title="Refresh list"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="manage-filters">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search scholarships by title, organization, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              🔍 Search
            </button>
            {searchTerm && (
              <button 
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  setRefreshTrigger(prev => prev + 1);
                }}
                className="search-clear"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </form>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {formatCategoryDisplay(cat)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select
              className="filter-select"
              onChange={(e) => {
                // Implement sorting if needed
                console.log('Sort by:', e.target.value);
              }}
            >
              <option value="newest">Newest First</option>
              <option value="deadline">Deadline</option>
              <option value="type">Scholarship Type</option>
              <option value="applications">Applications</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <strong>Error:</strong> {error}
            <div className="alert-actions">
              <button onClick={fetchScholarships} className="btn-retry">
                Try Again
              </button>
              <button 
                onClick={() => setError('')}
                className="btn-secondary"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scholarships Table */}
      <div className="manage-table-container">
        {scholarships.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No scholarships found</h3>
            <p>
              {error 
                ? error 
                : searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first scholarship'
              }
            </p>
            <div className="empty-actions">
              <button 
                onClick={() => navigate('/admin/career/scholarships/create')}
                className="btn-create"
              >
                + Create Scholarship
              </button>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setCurrentPage(1);
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="table-info">
              Showing {scholarships.length} of {totalScholarships} scholarships
              {searchTerm && ` for "${searchTerm}"`}
            </div>
            
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Scholarship</th>
                  <th>Organization</th>
                  <th>Type</th>
                  <th>Deadline</th>
                  <th>Applications</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scholarships.map((scholarship) => {
                  const deadlineInfo = getDaysRemaining(scholarship.applicationDetails?.deadline);
                  
                  return (
                    <tr key={scholarship._id}>
                      <td>
                        <div className="scholarship-info">
                          <div className="scholarship-title">
                            <Link to={`/career/scholarships/${scholarship._id}`} target="_blank">
                              {scholarship.title || 'Untitled Scholarship'}
                            </Link>
                          </div>
                          <div className="scholarship-meta">
                            <span className="scholarship-category">
                              {formatCategoryDisplay(scholarship.category)}
                            </span>
                            <span className="scholarship-level">
                              {scholarship.level || 'Not specified'}
                            </span>
                          </div>
                          {scholarship.shortDescription && (
                            <div className="scholarship-description">
                              {scholarship.shortDescription.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="organization-cell">
                          <div className="organization-name">
                            {scholarship.organization?.name || 'Not specified'}
                          </div>
                          {scholarship.organization?.website && (
                            <a 
                              href={scholarship.organization.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="organization-website"
                            >
                              🌐 Website
                            </a>
                          )}
                          {scholarship.organization?.industry && (
                            <div className="organization-industry">
                              {scholarship.organization.industry}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="type-cell">
                          <span className="type-value">
                            {formatTypeDisplay(scholarship.type)}
                          </span>
                          {scholarship.funding?.type && scholarship.funding.type !== scholarship.type && (
                            <span className="funding-type">
                              ({formatTypeDisplay(scholarship.funding.type)})
                            </span>
                          )}
                          {scholarship.funding?.renewable && (
                            <span className="renewable-badge">
                              Renewable
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="deadline-cell">
                          <span className="deadline-date">
                            {formatDate(scholarship.applicationDetails?.deadline)}
                          </span>
                          {deadlineInfo && (
                            <span className={`deadline-indicator ${deadlineInfo.class}`}>
                              {deadlineInfo.text}
                            </span>
                          )}
                          {scholarship.applicationDetails?.applicationLink && (
                            <a 
                              href={scholarship.applicationDetails.applicationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="application-link"
                            >
                              Apply ↗
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="applications-cell">
                          <span className="applications-count">
                            {scholarship.applicationsCount || 0}
                          </span>
                          <span className="applications-label">applications</span>
                          {scholarship.applicationsCount > 0 && (
                            <Link 
                              to={`/admin/career/scholarships/applications/${scholarship._id}`}
                              className="view-applications"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="status-cell">
                          {getStatusBadge(scholarship.status)}
                          <select
                            value={scholarship.status || 'draft'}
                            onChange={(e) => handleStatusChange(scholarship._id, e.target.value)}
                            className="status-select"
                          >
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="closed">Closed</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link 
                            to={`/admin/career/scholarships/edit/${scholarship._id}`}
                            className="btn-edit"
                            title="Edit scholarship"
                          >
                            Edit
                          </Link>
                          <Link 
                            to={`/admin/career/scholarships/applications/${scholarship._id}`}
                            className="btn-applications"
                            title="View applications"
                          >
                            Applications
                          </Link>
                          <button
                            onClick={() => handleDelete(scholarship._id)}
                            className="btn-delete"
                            title="Delete scholarship"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn prev"
          >
            ← Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="page-dots">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="page-btn"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn next"
          >
            Next →
          </button>
          
          <div className="page-info">
            Page {currentPage} of {totalPages} • {totalScholarships} total scholarships
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipManage;