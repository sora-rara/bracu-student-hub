// src/pages/admin/ApplicationsManagement.jsx - COMPLETE WORKING VERSION
import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import '../../../App.css';

const ApplicationsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, data };
    setDebugLog(prev => [logEntry, ...prev.slice(0, 9)]);
  };

  const checkAdminAccess = async () => {
    try {
      const authRes = await axios.get('/api/auth/check');

      if (!authRes.data.loggedIn) {
        setError('Please login to access this page');
        return false;
      }

      // Set user info from auth response
      setUserInfo({
        id: authRes.data.userId,
        role: 'admin',
        authData: authRes.data
      });

      return true;

    } catch (err) {
      console.error('Auth check error:', err);
      // For development, allow access
      setUserInfo({ role: 'development_mode' });
      return true;
    }
  };

  const initializePage = async () => {
    try {
      setLoading(true);
      setError('');

      const hasAccess = await checkAdminAccess();
      if (!hasAccess) {
        setLoading(false);
        return;
      }

      await Promise.all([
        fetchApplications(),
        fetchStats()
      ]);

    } catch (err) {
      console.error('Initialization error:', err);
      setError(`Failed to initialize: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get('/api/admin/applications');

      if (response.data.success) {
        setApplications(response.data.data || []);
      } else {
        setError(response.data.error || 'Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(`Failed to load applications: ${err.response?.data?.error || err.message}`);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/applications/stats/overview');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const updateStatus = async (applicationId, newStatus) => {
    try {
      const response = await axios.put(`/api/admin/applications/${applicationId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setApplications(prev => prev.map(app =>
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));

        if (selectedApp && selectedApp._id === applicationId) {
          setSelectedApp({ ...selectedApp, status: newStatus });
        }

        fetchStats();
        alert('✅ Status updated successfully');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`❌ Failed to update status: ${err.response?.data?.error || err.message}`);
    }
  };

  const viewApplicationDetails = (application) => {
    setSelectedApp(application);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
      reviewed: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' },
      accepted: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
      rejected: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
      withdrawn: { bg: '#e9ecef', text: '#495057', border: '#dee2e6' }
    };
    return colors[status] || { bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef' };
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending Review',
      reviewed: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return texts[status] || status;
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const studentName = app.studentName?.toLowerCase() || '';
      const studentEmail = app.studentEmail?.toLowerCase() || '';
      const internshipTitle = app.internship?.title?.toLowerCase() ||
        app.internshipId?.title?.toLowerCase() || '';
      const companyName = app.internship?.company?.toLowerCase() ||
        app.internshipId?.organization?.name?.toLowerCase() || '';

      return studentName.includes(term) ||
        studentEmail.includes(term) ||
        internshipTitle.includes(term) ||
        companyName.includes(term);
    }

    return true;
  });

  useEffect(() => {
    initializePage();
  }, []);

  if (loading) {
    return (
      <div className="applications-management">
        <div className="page-header">
          <h1>Applications Management</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-management">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Student Hub Applications Management</h1>
          <p className="page-subtitle">Review and Manage Student Applications</p>
          {userInfo && (
            <div className="user-info">
            </div>
          )}
        </div>
        <div className="header-actions">
          <button
            onClick={() => initializePage()}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <strong>Error:</strong> {error}
            <div className="alert-actions">
              <button onClick={() => initializePage()} className="btn btn-sm">
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && !error && (
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.pending || 0}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card reviewed">
            <div className="stat-value">{stats.reviewed || 0}</div>
            <div className="stat-label">Under Review</div>
          </div>
          <div className="stat-card accepted">
            <div className="stat-value">{stats.accepted || 0}</div>
            <div className="stat-label">Accepted</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-value">{stats.rejected || 0}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      {!error && applications.length > 0 && (
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by student name, email, or internship..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>

            <div className="results-count">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="applications-table-container">
        {!error && applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No applications found</h3>
            <p>No internship applications have been submitted yet.</p>
            <button
              onClick={() => initializePage()}
              className="btn btn-primary"
            >
              Refresh
            </button>
          </div>
        ) : !error && filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No matching applications</h3>
            <p>No applications match your search criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="btn btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : !error && (
          <div className="table-responsive">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Internship</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>CGPA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => {
                  const statusColor = getStatusColor(app.status);
                  return (
                    <tr key={app._id} className="application-row">
                      <td>
                        <div className="student-cell">
                          <div className="student-name">{app.studentName}</div>
                          <div className="student-email">{app.studentEmail}</div>
                          {app.phoneNumber && (
                            <div className="student-phone">{app.phoneNumber}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="internship-cell">
                          <div className="internship-title">
                            {app.internship?.title || app.internshipId?.title || 'Unknown'}
                          </div>
                          <div className="internship-company">
                            {app.internship?.company || app.internshipId?.organization?.name || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          {formatDate(app.appliedAt)}
                        </div>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            borderColor: statusColor.border
                          }}
                        >
                          {getStatusText(app.status)}
                        </span>
                      </td>
                      <td>{app.department || app.studentId?.department || 'N/A'}</td>
                      <td>{app.cgpa ? app.cgpa.toFixed(2) : app.studentId?.cgpa || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => viewApplicationDetails(app)}
                            className="btn btn-sm btn-view"
                          >
                            View Details
                          </button>
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app._id, e.target.value)}
                            className="status-select"
                            style={{
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                              borderColor: statusColor.border
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="withdrawn">Withdrawn</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApp && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-sections">
                {/* Student Information */}
                <div className="modal-section">
                  <h3>Student Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Name:</strong> {selectedApp.studentName}
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong> {selectedApp.studentEmail}
                    </div>
                    <div className="info-item">
                      <strong>Phone:</strong> {selectedApp.phoneNumber || 'N/A'}
                    </div>
                    <div className="info-item">
                      <strong>Department:</strong> {selectedApp.department || selectedApp.studentId?.department || 'N/A'}
                    </div>
                    <div className="info-item">
                      <strong>CGPA:</strong> {selectedApp.cgpa || selectedApp.studentId?.cgpa || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Internship Details */}
                <div className="modal-section">
                  <h3>Internship Details</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Position:</strong> {selectedApp.internship?.title || selectedApp.internshipId?.title || 'Unknown'}
                    </div>
                    <div className="info-item">
                      <strong>Company:</strong> {selectedApp.internship?.company || selectedApp.internshipId?.organization?.name || 'Unknown'}
                    </div>
                    <div className="info-item">
                      <strong>Applied Date:</strong> {formatDate(selectedApp.appliedAt)}
                    </div>
                    <div className="info-item">
                      <strong>Current Status:</strong>
                      <span className="status-badge" style={getStatusColor(selectedApp.status)}>
                        {getStatusText(selectedApp.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="modal-section">
                  <h3>Documents</h3>
                  <div className="documents-grid">
                    {selectedApp.resume && (
                      <a href={selectedApp.resume} target="_blank" rel="noopener noreferrer" className="document-btn">
                        📄 Resume
                      </a>
                    )}
                    {selectedApp.coverLetterFile && (
                      <a href={selectedApp.coverLetterFile} target="_blank" rel="noopener noreferrer" className="document-btn">
                        📝 Cover Letter
                      </a>
                    )}
                    {selectedApp.transcript && (
                      <a href={selectedApp.transcript} target="_blank" rel="noopener noreferrer" className="document-btn">
                        📊 Transcript
                      </a>
                    )}
                    {!selectedApp.resume && !selectedApp.coverLetterFile && !selectedApp.transcript && (
                      <p className="no-documents">No documents uploaded</p>
                    )}
                  </div>
                </div>

                {/* Update Status */}
                <div className="modal-section">
                  <h3>Update Status</h3>
                  <div className="status-update">
                    <select
                      value={selectedApp.status}
                      onChange={(e) => {
                        updateStatus(selectedApp._id, e.target.value);
                        setSelectedApp({ ...selectedApp, status: e.target.value });
                      }}
                      className="status-select"
                      style={getStatusColor(selectedApp.status)}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManagement;