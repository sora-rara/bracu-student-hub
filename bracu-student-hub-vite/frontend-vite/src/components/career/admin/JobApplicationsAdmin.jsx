// src/components/career/admin/JobApplicationsAdmin.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const JobApplicationsAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedApps, setSelectedApps] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [baseRoute, setBaseRoute] = useState('');

  const discoverBaseRoute = async () => {
    const testRoutes = [
      `/api/jobs/admin/${id}`,
      `/api/admin/career/jobs/${id}`,
      `/api/admin/jobs/${id}`,
      `/api/career/jobs/admin/${id}`,
      `/api/career/admin/jobs/${id}`,
      `/api/jobs/${id}`
    ];

    for (const route of testRoutes) {
      try {
        const res = await axios.get(route, { withCredentials: true });
        if (res.status === 200 || res.status === 201) {
          console.log(`✅ Found working route: ${route}`);
          return route.replace(`/${id}`, ''); // Return base route without ID
        }
      } catch (err) {
        // Continue testing other routes
      }
    }
    return null;
  };

  useEffect(() => {
    const initialize = async () => {
      if (!baseRoute) {
        const discoveredRoute = await discoverBaseRoute();
        if (discoveredRoute) {
          setBaseRoute(discoveredRoute);
        } else {
          setError('Cannot connect to backend. Please check server.');
        }
      }
    };
    initialize();
  }, [baseRoute, id]);

  useEffect(() => {
    if (baseRoute) {
      fetchJobAndApplications();
    }
  }, [baseRoute, id]);

  const fetchJobAndApplications = async () => {
    if (!baseRoute) return;
    
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await axios.get(`${baseRoute}/${id}`, {
        withCredentials: true
      });
      
      if (jobResponse.data.success) {
        setJob(jobResponse.data.data);
      }
      
      // Fetch applications
      const appsResponse = await axios.get(`${baseRoute}/${id}/applications`, {
        withCredentials: true
      });
      
      if (appsResponse.data.success) {
        setApplications(appsResponse.data.data || []);
      } else {
        setError('Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const response = await axios.put(
        `${baseRoute}/${id}/applications/${applicationId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('Application status updated');
        fetchJobAndApplications();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update application status');
    }
  };

  const handleDeleteApplication = async (applicationId, studentName) => {
    if (!window.confirm(`Delete application from ${studentName}?`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `${baseRoute}/${id}/applications/${applicationId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('Application deleted');
        fetchJobAndApplications();
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    }
  };

  const handleSelectApp = (appId) => {
    if (selectedApps.includes(appId)) {
      setSelectedApps(selectedApps.filter(id => id !== appId));
    } else {
      setSelectedApps([...selectedApps, appId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedApps.length === filteredApps.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filteredApps.map(app => app._id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedApps.length === 0) {
      alert('Please select an action and at least one application');
      return;
    }

    if (!window.confirm(`Apply "${bulkAction}" to ${selectedApps.length} selected application(s)?`)) {
      return;
    }

    try {
      for (const appId of selectedApps) {
        await axios.put(
          `${baseRoute}/${id}/applications/${appId}/status`,
          { status: bulkAction },
          { withCredentials: true }
        );
      }
      
      alert(`Successfully updated ${selectedApps.length} application(s)`);
      setSelectedApps([]);
      setBulkAction('');
      fetchJobAndApplications();
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
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'pending',
      submitted: 'submitted',
      reviewed: 'reviewed',
      shortlisted: 'shortlisted',
      'interview-scheduled': 'shortlisted',
      accepted: 'accepted',
      rejected: 'rejected',
      withdrawn: 'withdrawn'
    };
    
    const statusText = {
      pending: 'Pending',
      submitted: 'Submitted',
      reviewed: 'Reviewed',
      shortlisted: 'Shortlisted',
      'interview-scheduled': 'Interview',
      accepted: 'Accepted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    
    return (
      <span className={`status-badge badge-${colors[status] || 'default'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const getStatusCount = (status) => {
    return applications.filter(app => app.status === status).length;
  };

  // Filter applications
  const filteredApps = applications.filter(app => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const studentName = app.studentId?.name || '';
      const studentEmail = app.studentId?.email || '';
      
      if (!studentName.toLowerCase().includes(term) && 
          !studentEmail.toLowerCase().includes(term)) {
        return false;
      }
    }
    
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  // Sort applications
  const sortedApps = [...filteredApps].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt);
      case 'oldest':
        return new Date(a.submittedAt || a.createdAt) - new Date(b.submittedAt || b.createdAt);
      case 'name':
        return (a.studentId?.name || '').localeCompare(b.studentId?.name || '');
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (!baseRoute && !loading) {
    return (
      <div className="error-container">
        <h2>Connection Error</h2>
        <p>Cannot connect to backend server. Please check if the server is running.</p>
        <button onClick={() => window.location.reload()} className="btn-retry">
          Retry Connection
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="job-applications-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div className="header-left">
          <h1>Job Applications</h1>
          <p className="subtitle">
            {job?.title || 'Job Applications'} • {applications.length} total applications
            {baseRoute && <small style={{display: 'block', marginTop: '5px', color: '#666'}}>
              Using API: {baseRoute}
            </small>}
          </p>
        </div>
        <div className="header-right">
          <button 
            onClick={() => navigate('/admin/career/jobs')}
            className="btn-back"
          >
            ← Back to Jobs
          </button>
        </div>
      </div>

      {/* Job Info */}
      {job && (
        <div className="job-info-card">
          <div className="job-info-header">
            <div className="job-logo">
              {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h2>{job.title}</h2>
              <p>{job.company?.name}</p>
            </div>
          </div>
          <div className="job-info-details">
            <span>📍 {job.location}</span>
            <span>⏰ {job.schedule}</span>
            <span>📅 Deadline: {formatDate(job.deadline)}</span>
            <span>📄 {job.applicationsCount || 0} applications</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="applications-stats">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-number">{applications.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending:</span>
          <span className="stat-number">{getStatusCount('pending')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Reviewed:</span>
          <span className="stat-number">{getStatusCount('reviewed')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Shortlisted:</span>
          <span className="stat-number">{getStatusCount('shortlisted') + getStatusCount('interview-scheduled')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Accepted:</span>
          <span className="stat-number">{getStatusCount('accepted')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rejected:</span>
          <span className="stat-number">{getStatusCount('rejected')}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by student name or email..."
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
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview-scheduled">Interview</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="status">Status</option>
          </select>

          <button onClick={fetchJobAndApplications} className="btn-refresh">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedApps.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <strong>{selectedApps.length}</strong> application(s) selected
          </div>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="bulk-select"
          >
            <option value="">Bulk Actions</option>
            <option value="reviewed">Mark as Reviewed</option>
            <option value="shortlisted">Shortlist</option>
            <option value="accepted">Accept</option>
            <option value="rejected">Reject</option>
          </select>
          <button onClick={handleBulkAction} className="btn-bulk-action">
            Apply
          </button>
          <button onClick={() => setSelectedApps([])} className="btn-clear">
            Clear Selection
          </button>
        </div>
      )}

      {/* Applications Table */}
      <div className="admin-table-container">
        {error ? (
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
            <button onClick={fetchJobAndApplications} className="btn-retry-small">Retry</button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="no-results">
            <p>No applications found</p>
            <button onClick={fetchJobAndApplications} className="btn-secondary">Refresh</button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedApps.length === filteredApps.length && filteredApps.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Student</th>
                <th>Email</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>GPA</th>
                <th>Major</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedApps.map(app => (
                <tr key={app._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedApps.includes(app._id)}
                      onChange={() => handleSelectApp(app._id)}
                    />
                  </td>
                  <td>
                    <div className="student-info">
                      <strong>{app.studentId?.name || 'N/A'}</strong>
                      <small>{app.studentId?.universityId || ''}</small>
                    </div>
                  </td>
                  <td>
                    <a href={`mailto:${app.studentId?.email}`}>
                      {app.studentId?.email || 'N/A'}
                    </a>
                  </td>
                  <td>{formatDate(app.submittedAt || app.createdAt)}</td>
                  <td>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview-scheduled">Interview</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </td>
                  <td>
                    {app.academicInfo?.currentGPA 
                      ? app.academicInfo.currentGPA.toFixed(2) 
                      : app.studentId?.cgpa 
                      ? app.studentId.cgpa.toFixed(2) 
                      : 'N/A'}
                  </td>
                  <td>{app.academicInfo?.major || app.studentId?.major || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/admin/career/jobs/${id}/applications/${app._id}`}
                        className="btn-view"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => handleDeleteApplication(app._id, app.studentId?.name || 'student')}
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

      {/* Export Options */}
      <div className="export-section">
        <h3>Export Applications</h3>
        <div className="export-buttons">
          <button className="btn-export">
            📊 Export to Excel
          </button>
          <button className="btn-export">
            📄 Export to PDF
          </button>
          <button className="btn-export">
            👥 Email All Applicants
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationsAdmin;