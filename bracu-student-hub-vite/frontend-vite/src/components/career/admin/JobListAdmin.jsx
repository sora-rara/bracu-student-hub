// src/components/career/admin/JobListAdmin.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const JobListAdmin = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/jobs/admin/all', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setJobs(response.data.data || []);
      } else {
        setError('Failed to load jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/jobs/admin/${jobId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('Job deleted successfully');
        fetchJobs();
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const response = await axios.put(
        `/api/jobs/admin/${jobId}`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('Job status updated');
        fetchJobs();
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      alert('Failed to update job status');
    }
  };

  const handleSelectJob = (jobId) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    } else {
      setSelectedJobs([...selectedJobs, jobId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job._id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedJobs.length === 0) {
      alert('Please select an action and at least one job');
      return;
    }

    if (!window.confirm(`Apply "${bulkAction}" to ${selectedJobs.length} selected job(s)?`)) {
      return;
    }

    try {
      for (const jobId of selectedJobs) {
        await axios.put(
          `/api/jobs/admin/${jobId}`,
          { status: bulkAction },
          { withCredentials: true }
        );
      }
      
      alert(`Successfully updated ${selectedJobs.length} job(s)`);
      setSelectedJobs([]);
      setBulkAction('');
      fetchJobs();
    } catch (err) {
      console.error('Error performing bulk action:', err);
      alert('Failed to perform bulk action');
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

  const formatSalary = (job) => {
    if (!job.salary) return 'Negotiable';
    
    const { amount, currency, period } = job.salary;
    
    let formatted = '';
    if (currency === 'USD') formatted = `$${amount}`;
    else if (currency === 'BDT') formatted = `৳${amount}`;
    else formatted = `${currency} ${amount}`;
    
    if (period === 'hourly') return `${formatted}/hour`;
    if (period === 'weekly') return `${formatted}/week`;
    if (period === 'monthly') return `${formatted}/month`;
    
    return formatted;
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'draft',
      active: 'active',
      closed: 'closed',
      archived: 'archived'
    };
    
    const statusText = {
      draft: 'Draft',
      active: 'Active',
      closed: 'Closed',
      archived: 'Archived'
    };
    
    return (
      <span className={`status-badge badge-${colors[status] || 'default'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!job.title.toLowerCase().includes(term) && 
          !job.company?.name?.toLowerCase().includes(term) &&
          !job.description.toLowerCase().includes(term)) {
        return false;
      }
    }
    
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }
    
    if (typeFilter !== 'all' && job.jobType !== typeFilter) {
      return false;
    }
    
    return true;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'deadline':
        return new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31');
      case 'title':
        return a.title.localeCompare(b.title);
      case 'applications':
        return (b.applicationsCount || 0) - (a.applicationsCount || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="job-list-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div className="header-left">
          <h1>Manage Jobs</h1>
          <p className="subtitle">
            Total: {jobs.length} jobs • Active: {jobs.filter(j => j.status === 'active').length}
          </p>
        </div>
        <div className="header-right">
          <button 
            onClick={() => navigate('/admin/career/jobs/create')}
            className="btn-primary"
          >
            + Create New Job
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-actions">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="part-time">Part-time</option>
            <option value="remote">Remote</option>
            <option value="on-campus">On-campus</option>
            <option value="freelance">Freelance</option>
            <option value="internship">Internship</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="deadline">Deadline Soonest</option>
            <option value="title">Title A-Z</option>
            <option value="applications">Most Applications</option>
          </select>

          <button onClick={fetchJobs} className="btn-refresh">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedJobs.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <strong>{selectedJobs.length}</strong> job(s) selected
          </div>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="bulk-select"
          >
            <option value="">Bulk Actions</option>
            <option value="active">Set as Active</option>
            <option value="closed">Set as Closed</option>
            <option value="archived">Archive</option>
          </select>
          <button onClick={handleBulkAction} className="btn-bulk-action">
            Apply
          </button>
          <button onClick={() => setSelectedJobs([])} className="btn-clear">
            Clear Selection
          </button>
        </div>
      )}

      {/* Jobs Table */}
      <div className="admin-table-container">
        {error ? (
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="no-results">
            <p>No jobs found</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Title</th>
                <th>Company</th>
                <th>Type</th>
                <th>Salary</th>
                <th>Deadline</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map(job => (
                <tr key={job._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job._id)}
                      onChange={() => handleSelectJob(job._id)}
                    />
                  </td>
                  <td>
                    <div className="job-title-cell">
                      <strong>{job.title}</strong>
                      {job.isFeatured && <span className="featured-badge">Featured</span>}
                    </div>
                  </td>
                  <td>{job.company?.name || 'N/A'}</td>
                  <td>
                    <span className="type-badge">{job.jobType}</span>
                  </td>
                  <td>{formatSalary(job)}</td>
                  <td>{formatDate(job.deadline)}</td>
                  <td>
                    <Link to={`/admin/career/jobs/applications/${job._id}`}>
                      {job.applicationsCount || 0} apps
                    </Link>
                  </td>
                  <td>
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/admin/career/jobs/edit/${job._id}`}
                        className="btn-edit"
                      >
                        Edit
                      </Link>
                      <Link 
                        to={`/career/jobs/${job._id}`}
                        target="_blank"
                        className="btn-view"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => handleDeleteJob(job._id, job.title)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <p className="stat-number">{jobs.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Jobs</h3>
          <p className="stat-number">{jobs.filter(j => j.status === 'active').length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-number">
            {jobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0)}
          </p>
        </div>
        <div className="stat-card">
          <h3>Featured Jobs</h3>
          <p className="stat-number">{jobs.filter(j => j.isFeatured).length}</p>
        </div>
      </div>
    </div>
  );
};

export default JobListAdmin;