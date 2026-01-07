// src/components/career/admin/ScholarshipApplications.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const ScholarshipApplications = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch scholarship from PUBLIC route
      const scholarshipResponse = await axios.get(`/api/career/scholarships/${id}`, {
        withCredentials: true
      });
      
      if (scholarshipResponse.data.success) {
        setScholarship(scholarshipResponse.data.data);
      }
      
      // Fetch applications from ADMIN route
      const applicationsResponse = await axios.get(`/api/career/scholarships/admin/${id}/applications`, {
        withCredentials: true
      });
      
      if (applicationsResponse.data.success) {
        setApplications(applicationsResponse.data.data || []);
      } else {
        setError(applicationsResponse.data.error || 'Failed to load applications');
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      
      // If admin route fails, try alternative
      if (err.response?.status === 404) {
        try {
          // Try using the public scholarship route to get basic info
          const altResponse = await axios.get(`/api/career/scholarships/${id}`, {
            withCredentials: true
          });
          
          if (altResponse.data.success) {
            setScholarship(altResponse.data.data);
            setApplications([]); // No applications data
            setError('Applications data not available. Please check backend routes.');
          }
        } catch (altErr) {
          setError('Failed to load scholarship information');
        }
      } else {
        setError('Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const response = await axios.put(
        `/api/career/scholarships/admin/${id}/applications/${applicationId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('Application status updated successfully');
        fetchData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update application status');
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/career/scholarships/admin/${id}/applications/${applicationId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('Application deleted successfully');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    }
  };

  const handleSelectApplication = (applicationId) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(app => app._id));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'pending',
      submitted: 'submitted',
      reviewed: 'reviewed',
      shortlisted: 'shortlisted',
      accepted: 'accepted',
      rejected: 'rejected',
      withdrawn: 'withdrawn'
    };
    
    const statusText = {
      pending: 'Pending',
      submitted: 'Submitted',
      reviewed: 'Reviewed',
      shortlisted: 'Shortlisted',
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

  const filteredApplications = applications.filter(app => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const studentName = app.student?.name?.toLowerCase() || '';
      const studentEmail = app.student?.email?.toLowerCase() || '';
      const universityId = app.student?.universityId?.toLowerCase() || '';
      
      if (!studentName.includes(term) && 
          !studentEmail.includes(term) && 
          !universityId.includes(term)) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.appliedAt) - new Date(a.appliedAt);
      case 'oldest':
        return new Date(a.appliedAt) - new Date(b.appliedAt);
      case 'name':
        return (a.student?.name || '').localeCompare(b.student?.name || '');
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="scholarship-applications-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="header-left">
          <h1>Applications for {scholarship?.title || 'Scholarship'}</h1>
          <p className="subtitle">Manage scholarship applications</p>
        </div>
        <div className="header-right">
          <button 
            onClick={() => navigate(`/admin/career/scholarships/edit/${id}`)}
            className="btn-edit"
          >
            Edit Scholarship
          </button>
          <button 
            onClick={() => navigate('/admin/career/scholarships')}
            className="btn-back"
          >
            ← Back to Scholarships
          </button>
        </div>
      </div>

      {/* Scholarship Info */}
      {scholarship && (
        <div className="scholarship-info-card">
          <div className="scholarship-header">
            <h3>{scholarship.title}</h3>
            <p className="organization">{scholarship.organization?.name || 'N/A'}</p>
          </div>
          <div className="scholarship-stats">
            <div className="stat-item">
              <span className="stat-label">Total Applications:</span>
              <span className="stat-value">{applications.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending:</span>
              <span className="stat-value">
                {applications.filter(a => a.status === 'pending' || a.status === 'submitted').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Accepted:</span>
              <span className="stat-value">
                {applications.filter(a => a.status === 'accepted').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rejected:</span>
              <span className="stat-value">
                {applications.filter(a => a.status === 'rejected').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">{error}</div>
          <button onClick={fetchData} className="btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Filters - Only show if we have applications */}
      {applications.length > 0 && (
        <>
          <div className="manage-filters">
            <div className="search-form">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by student name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-btn">🔍</span>
              </div>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>Status</label>
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
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
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
                  <option value="oldest">Oldest First</option>
                  <option value="name">Student Name (A-Z)</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="manage-table-container">
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Application Date</th>
                  <th>GPA</th>
                  <th>Major</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application._id}>
                    <td>
                      <div className="student-info">
                        <div className="student-name">
                          {application.student?.name || 'Anonymous'}
                        </div>
                        <div className="student-id">
                          ID: {application.student?.universityId || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="email-cell">
                        {application.student?.email || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        {formatDate(application.appliedAt)}
                      </div>
                    </td>
                    <td>
                      <div className="gpa-cell">
                        {typeof application.cgpa === 'number' ? application.cgpa.toFixed(2) : application.cgpa || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="major-cell">
                        {application.major || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        {getStatusBadge(application.status)}
                        <select
                          value={application.status}
                          onChange={(e) => handleStatusChange(application._id, e.target.value)}
                          className="status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="submitted">Submitted</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/admin/career/scholarships/applications/${id}/${application._id}`}
                          className="btn-view"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteApplication(application._id)}
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
          </div>
        </>
      )}

      {applications.length === 0 && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No applications yet</h3>
          <p>No students have applied for this scholarship yet.</p>
        </div>
      )}
    </div>
  );
};

export default ScholarshipApplications;