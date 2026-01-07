import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import authService from "../../services/auth.jsx";

const MyUploadsPage = () => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchMyUploads();
  }, []);

  const fetchMyUploads = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/course-content/user/my-uploads');
      if (response.data.success) {
        setUploads(response.data.data);
        calculateStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
      alert('Failed to fetch your uploads');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (uploads) => {
    const stats = {
      total: uploads.length,
      approved: uploads.filter(u => u.status === 'approved').length,
      pending: uploads.filter(u => u.status === 'pending').length,
      rejected: uploads.filter(u => u.status === 'rejected').length
    };
    setStats(stats);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this upload?')) {
      return;
    }

    try {
      await axios.delete(`/api/course-content/${id}`);
      alert('Upload deleted successfully');
      fetchMyUploads();
    } catch (error) {
      console.error('Error deleting upload:', error);
      alert('Failed to delete upload');
    }
  };

  const handleEdit = (upload) => {
    navigate(`/course-content/${upload.courseCode}`, {
      state: { editUpload: upload }
    });
  };

  const filteredUploads = uploads.filter(upload => {
    if (filter === 'all') return true;
    return upload.status === filter;
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      approved: { bg: '#d1fae5', text: '#065f46', label: 'Approved' },
      pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
      rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' }
    };

    const statusInfo = statusColors[status] || { bg: '#e5e7eb', text: '#374151', label: status };

    return (
      <span style={{
        backgroundColor: statusInfo.bg,
        color: statusInfo.text,
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '500'
      }}>
        {statusInfo.label}
      </span>
    );
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '';
    if (fileType.includes('word')) return '';
    if (fileType.includes('powerpoint')) return '';
    if (fileType.includes('excel')) return '';
    if (fileType.includes('text')) return '';
    if (fileType.includes('zip') || fileType.includes('rar')) return '';
    if (fileType.includes('image')) return '';
    return '';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your uploads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container my-uploads-page">
      {/* Header */}
      <div className="page-header">
        <h1>📁 My Uploads</h1>
        <p>Manage your uploaded course content</p>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/course-content')}
          >
            📤 Upload New Content
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Uploads</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="content-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Uploads</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Uploads List */}
      {filteredUploads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No uploads found</h3>
          <p>{filter === 'all'
            ? "You haven't uploaded any content yet."
            : `You have no ${filter} uploads.`}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/course-content')}
          >
            📤 Upload Your First File
          </button>
        </div>
      ) : (
        <div className="content-list">
          {filteredUploads.map(upload => (
            <div key={upload._id} className="content-card">
              <div className="content-header">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(upload.fileType)}</span>
                  <div>
                    <h3>{upload.title}</h3>
                    <p className="file-meta">
                      {upload.courseCode} • {upload.contentType} •
                      {formatFileSize(upload.fileSize)} •
                      {new Date(upload.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  {getStatusBadge(upload.status)}
                  {upload.rejectionReason && upload.status === 'rejected' && (
                    <p className="rejection-reason" style={{
                      marginTop: '0.5rem',
                      color: '#ef4444',
                      fontSize: '0.8rem'
                    }}>
                      Reason: {upload.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              {upload.description && (
                <p className="content-description">{upload.description}</p>
              )}

              <div className="content-footer">
                <div className="content-stats">
                  <span className="stat">👁️ {upload.viewCount || 0} views</span>
                  <span className="stat">📥 {upload.downloadCount || 0} downloads</span>
                </div>

                <div className="content-actions">
                  {upload.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleEdit(upload)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(upload._id)}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                  {upload.status === 'approved' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/course-content/${upload.courseCode}`)}
                    >
                      👀 View in Course
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyUploadsPage;