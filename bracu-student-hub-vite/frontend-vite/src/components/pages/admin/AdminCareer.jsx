// src/pages/admin/AdminCareer.jsx - CLEAN VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../../App.css';

const API_BASE = 'http://localhost:5000';

const AdminCareer = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, featured: 0, expired: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/career/admin/internships`, {
        withCredentials: true
      });

      console.log('API Response:', response.data); // Debug log

      if (response.data.success) {
        setInternships(response.data.data || []);

        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      alert('Failed to load internships. Please check your authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;

    try {
      await axios.delete(`${API_BASE}/api/career/admin/internships/${id}`, {
        withCredentials: true
      });
      alert('Internship deleted!');
      fetchInternships();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const toggleFeatured = async (id, currentStatus, title) => {
    try {
      await axios.put(`${API_BASE}/api/career/admin/internships/${id}`, {
        isFeatured: !currentStatus
      }, {
        withCredentials: true
      });

      alert(`"${title}" ${!currentStatus ? 'featured' : 'unfeatured'}!`);
      fetchInternships();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const toggleStatus = async (id, currentStatus, title) => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';

    try {
      await axios.put(`${API_BASE}/api/career/admin/internships/${id}`, {
        status: newStatus
      }, {
        withCredentials: true
      });

      alert(`"${title}" status changed to ${newStatus}!`);
      fetchInternships();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { class: 'status-active', text: 'Active' },
      'draft': { class: 'status-draft', text: 'Draft' },
      'closed': { class: 'status-closed', text: 'Closed' },
      'expired': { class: 'status-expired', text: 'Expired' },
      'filled': { class: 'status-closed', text: 'Filled' }
    };

    const config = statusConfig[status.toLowerCase()] || { class: 'status-draft', text: 'Unknown' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInternships();
  };

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = !searchTerm ||
      internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.organization?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      internship.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-career-page">
      <div className="admin-header">
        <div className="header-left">
          <h1>Career Opportunities Management</h1>
          <p className="subtitle">Manage internships, jobs, and scholarships</p>
        </div>
        <div className="header-right">
          <Link to="/admin/career/create" className="btn-primary">
            + Create New Opportunity
          </Link>
          <Link to="/admin" className="btn-secondary">
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Opportunities</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.featured}</h3>
            <p>Featured</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.expired}</h3>
            <p>Expired</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/admin/career/create" className="action-btn">
            <span className="btn-icon">+</span>
            Create New Internship
          </Link>
          <Link to="/career/internships" className="action-btn" target="_blank">
            <span className="btn-icon">👁️</span>
            View Student Portal
          </Link>
          <Link to="/admin/career/applications" className="action-btn">
            <span className="btn-icon">📋</span>
            View Applications
          </Link>
          <button className="action-btn" onClick={fetchInternships}>
            <span className="btn-icon">🔄</span>
            Refresh List
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="table-header">
          <h2>All Internships</h2>
          <div className="table-actions">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search internships..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-button">🔍</button>
            </form>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Drafts</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading internships...</p>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Internships Found</h3>
            <p>Create your first internship opportunity to get started.</p>
            <Link to="/admin/career/create" className="btn-primary">
              Create Your First Internship
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Organization</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Views</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInternships.map(internship => (
                  <tr key={internship._id}>
                    <td>
                      <div className="internship-title-cell">
                        <strong>{internship.title}</strong>
                        <small>{internship.category}</small>
                      </div>
                    </td>
                    <td>{internship.organization?.name || 'N/A'}</td>
                    <td>{internship.type || 'Internship'}</td>
                    <td>{getStatusBadge(internship.status)}</td>
                    <td>
                      {formatDate(internship.applicationDetails?.deadline)}
                      {internship.applicationDetails?.deadline &&
                        new Date(internship.applicationDetails.deadline) < new Date() && (
                          <span className="expired-badge">Expired</span>
                        )}
                    </td>
                    <td>{internship.views || 0}</td>
                    <td>
                      <button
                        className={`featured-toggle ${internship.isFeatured ? 'featured' : ''}`}
                        onClick={() => toggleFeatured(internship._id, internship.isFeatured, internship.title)}
                        title={internship.isFeatured ? 'Unfeature' : 'Feature'}
                      >
                        {internship.isFeatured ? '⭐' : '☆'}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons-small">
                        <Link
                          to={`/career/internships/${internship._id}`}
                          className="btn-view"
                          target="_blank"
                        >
                          View
                        </Link>
                        <button
                          className="btn-status"
                          onClick={() => toggleStatus(internship._id, internship.status, internship.title)}
                        >
                          {internship.status === 'active' ? 'Draft' : 'Publish'}
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(internship._id, internship.title)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCareer;