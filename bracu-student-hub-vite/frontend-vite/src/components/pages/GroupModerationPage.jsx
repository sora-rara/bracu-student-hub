// components/pages/GroupModerationPage.jsx
import React, { useState, useEffect } from 'react';
import {
    FaEye, FaArchive, FaCheckCircle, FaTimesCircle, FaChartBar,
    FaFilter, FaSearch, FaUsers, FaBook, FaCar, FaShieldAlt,
    FaTrash, FaBan, FaCheck, FaExclamationTriangle, FaSpinner
} from 'react-icons/fa';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

function GroupModerationPage() {
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        type: ''
    });
    const [analytics, setAnalytics] = useState(null);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab, filters]);

    const fetchData = async () => {
        try {
            setLoading(true);

            if (activeTab === 'posts') {
                const response = await apiService.adminGetAllNeedPosts(filters);
                if (response.success) {
                    setPosts(response.data?.posts || []);
                }
            } else if (activeTab === 'groups') {
                const response = await apiService.adminGetAllGroups(filters);
                if (response.success) {
                    setGroups(response.data?.groups || []);
                }
            } else if (activeTab === 'analytics') {
                const response = await apiService.getGroupAnalytics();
                if (response.success) {
                    setAnalytics(response.data);
                }
            }
        } catch (err) {
            console.error('Error fetching admin data:', err);
            if (err.status === 403 || err.status === 401) {
                alert('Admin access required');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const updatePostStatus = async (postId, status, reason = '') => {
        try {
            setProcessing(true);
            const response = await apiService.adminUpdatePostStatus(postId, { status, reason });
            if (response.success) {
                alert(`Post status updated to ${status}`);
                fetchData();
            }
        } catch (err) {
            console.error('Error updating post:', err);
            alert('Failed to update post status');
        } finally {
            setProcessing(false);
        }
    };

    const updateGroupStatus = async (groupId, status, reason = '') => {
        try {
            setProcessing(true);
            const response = await apiService.adminUpdateGroupStatus(groupId, { status, reason });
            if (response.success) {
                alert(`Group status updated to ${status}`);
                fetchData();
            }
        } catch (err) {
            console.error('Error updating group:', err);
            alert('Failed to update group status');
        } finally {
            setProcessing(false);
        }
    };

    const deletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            setProcessing(true);
            // Use the admin delete endpoint
            const response = await apiService.adminDeletePost(postId);
            if (response.success) {
                alert('Post deleted successfully');
                fetchData();
            }
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'open': { color: 'success', label: 'Open', bg: '#28a745' },
            'closed': { color: 'secondary', label: 'Closed', bg: '#6c757d' },
            'fulfilled': { color: 'info', label: 'Fulfilled', bg: '#17a2b8' },
            'archived': { color: 'dark', label: 'Archived', bg: '#343a40' },
            'flagged': { color: 'danger', label: 'Flagged', bg: '#dc3545' },
            'active': { color: 'success', label: 'Active', bg: '#28a745' },
            'full': { color: 'warning', label: 'Full', bg: '#ffc107' },
            'inactive': { color: 'secondary', label: 'Inactive', bg: '#6c757d' },
            'suspended': { color: 'danger', label: 'Suspended', bg: '#dc3545' }
        };

        const config = statusConfig[status] || { color: 'secondary', label: status, bg: '#6c757d' };
        return (
            <span className="badge" style={{
                backgroundColor: config.bg,
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500'
            }}>
                {config.label}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const typeConfig = {
            'study': { icon: <FaBook />, color: '#007bff', label: 'Study' },
            'transport': { icon: <FaCar />, color: '#28a745', label: 'Transport' }
        };

        const config = typeConfig[type] || { icon: null, color: '#6c757d', label: type };
        return (
            <span className="type-badge" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: `${config.color}20`,
                color: config.color,
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                border: `1px solid ${config.color}40`
            }}>
                {config.icon} {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading && posts.length === 0 && groups.length === 0) {
        return (
            <div className="moderation-container" style={{ padding: '20px' }}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <FaSpinner className="fa-spin" style={{ fontSize: '40px', color: '#007bff' }} />
                    <p>Loading moderation data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="moderation-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FaShieldAlt style={{ color: '#007bff' }} /> Group & Post Moderation
                </h1>
                <p className="text-muted">Admin panel for managing all group-related activities</p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                borderBottom: '1px solid #dee2e6',
                marginBottom: '20px'
            }}>
                <button
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: activeTab === 'posts' ? '#007bff' : 'transparent',
                        color: activeTab === 'posts' ? 'white' : '#495057',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'posts' ? '2px solid #007bff' : 'none',
                        fontWeight: activeTab === 'posts' ? '600' : '400'
                    }}
                    onClick={() => setActiveTab('posts')}
                >
                    <FaBook style={{ marginRight: '8px' }} />
                    Need Posts ({posts.length})
                </button>
                <button
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: activeTab === 'groups' ? '#007bff' : 'transparent',
                        color: activeTab === 'groups' ? 'white' : '#495057',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'groups' ? '2px solid #007bff' : 'none',
                        fontWeight: activeTab === 'groups' ? '600' : '400'
                    }}
                    onClick={() => setActiveTab('groups')}
                >
                    <FaUsers style={{ marginRight: '8px' }} />
                    Groups ({groups.length})
                </button>
                <button
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: activeTab === 'analytics' ? '#007bff' : 'transparent',
                        color: activeTab === 'analytics' ? 'white' : '#495057',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'analytics' ? '2px solid #007bff' : 'none',
                        fontWeight: activeTab === 'analytics' ? '600' : '400'
                    }}
                    onClick={() => setActiveTab('analytics')}
                >
                    <FaChartBar style={{ marginRight: '8px' }} />
                    Analytics
                </button>
            </div>

            {/* Filters */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#6c757d'
                            }} />
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 40px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                                placeholder={`Search ${activeTab}...`}
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <select
                            style={{
                                padding: '10px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: '14px',
                                minWidth: '150px'
                            }}
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="">All Types</option>
                            <option value="study">Study</option>
                            <option value="transport">Transport</option>
                        </select>
                    </div>

                    <div>
                        <select
                            style={{
                                padding: '10px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: '14px',
                                minWidth: '150px'
                            }}
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            {activeTab === 'posts' ? (
                                <>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                    <option value="fulfilled">Fulfilled</option>
                                    <option value="flagged">Flagged</option>
                                    <option value="archived">Archived</option>
                                </>
                            ) : (
                                <>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="archived">Archived</option>
                                    <option value="suspended">Suspended</option>
                                </>
                            )}
                        </select>
                    </div>

                    <button
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                        onClick={() => setFilters({ search: '', status: '', type: '' })}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'posts' ? (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6' }}>
                        <h3 style={{ margin: 0 }}>Need Posts Management</h3>
                        <p className="text-muted" style={{ margin: '5px 0 0 0' }}>
                            {posts.length} post(s) found
                        </p>
                    </div>

                    {posts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p className="text-muted">No posts found matching your filters</p>
                            <button
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}
                                onClick={() => setFilters({ search: '', status: '', type: '' })}
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Title</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Type</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Creator</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Status</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Interested</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Created</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map(post => (
                                        <tr key={post._id} style={{ borderBottom: '1px solid #e9ecef', transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '5px' }}>{post.title}</div>
                                                <div style={{ fontSize: '13px', color: '#6c757d' }}>
                                                    {post.description?.substring(0, 60)}...
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                {getTypeBadge(post.type)}
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: '500' }}>{post.createdBy?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '12px', color: '#6c757d' }}>{post.createdBy?.email || 'No email'}</div>
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                {getStatusBadge(post.status)}
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                {post.interestedUsers?.length || 0}
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                {formatDate(post.createdAt)}
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#17a2b8',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            opacity: processing ? 0.6 : 1
                                                        }}
                                                        onClick={() => window.open(`/admin/find-my-group/${post._id}`, '_blank')}
                                                        disabled={processing}
                                                    >
                                                        <FaEye /> View
                                                    </button>

                                                    {/* Archive Button */}
                                                    {post.status !== 'archived' && (
                                                        <button
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#6c757d',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                opacity: processing ? 0.6 : 1
                                                            }}
                                                            onClick={() => updatePostStatus(post._id, 'archived', 'Archived by admin')}
                                                            disabled={processing}
                                                        >
                                                            <FaArchive /> Archive
                                                        </button>
                                                    )}

                                                    {/* Flag/Unflag Button */}
                                                    {post.status !== 'flagged' ? (
                                                        <button
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#ffc107',
                                                                color: '#212529',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                opacity: processing ? 0.6 : 1
                                                            }}
                                                            onClick={() => updatePostStatus(post._id, 'flagged', 'Flagged by admin')}
                                                            disabled={processing}
                                                        >
                                                            <FaBan /> Flag
                                                        </button>
                                                    ) : (
                                                        <button
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                opacity: processing ? 0.6 : 1
                                                            }}
                                                            onClick={() => updatePostStatus(post._id, 'open', 'Approved by admin')}
                                                            disabled={processing}
                                                        >
                                                            <FaCheck /> Approve
                                                        </button>
                                                    )}

                                                    {/* Delete Button - ADMIN ONLY */}
                                                    <button
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            opacity: processing ? 0.6 : 1
                                                        }}
                                                        onClick={() => deletePost(post._id)}
                                                        disabled={processing}
                                                    >
                                                        <FaTrash /> Delete
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
            ) : activeTab === 'groups' ? (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6' }}>
                        <h3 style={{ margin: 0 }}>Groups Management</h3>
                        <p className="text-muted" style={{ margin: '5px 0 0 0' }}>
                            {groups.length} group(s) found
                        </p>
                    </div>

                    {groups.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p className="text-muted">No groups found matching your filters</p>
                            <button
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}
                                onClick={() => setFilters({ search: '', status: '', type: '' })}
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Group Name</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Type</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Creator</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Members</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Status</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Created</th>
                                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map(group => (
                                        <tr key={group._id} style={{ borderBottom: '1px solid #e9ecef', transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '5px' }}>{group.name}</div>
                                                <div style={{ fontSize: '13px', color: '#6c757d' }}>
                                                    {group.description?.substring(0, 60)}...
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                {getTypeBadge(group.type)}
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: '500' }}>{group.creator?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '12px', color: '#6c757d' }}>{group.creator?.email || 'No email'}</div>
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                {group.members?.length || 0}/{group.maxMembers}
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                {getStatusBadge(group.status)}
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                {formatDate(group.createdAt)}
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#17a2b8',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            opacity: processing ? 0.6 : 1
                                                        }}
                                                        onClick={() => window.open(`/groups/${group._id}`, '_blank')}
                                                        disabled={processing}
                                                    >
                                                        <FaEye /> View
                                                    </button>

                                                    {/* Suspend/Reactivate Button */}
                                                    {group.status === 'active' ? (
                                                        <button
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#dc3545',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                opacity: processing ? 0.6 : 1
                                                            }}
                                                            onClick={() => updateGroupStatus(group._id, 'suspended', 'Suspended by admin')}
                                                            disabled={processing}
                                                        >
                                                            <FaTimesCircle /> Suspend
                                                        </button>
                                                    ) : group.status === 'suspended' ? (
                                                        <button
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                opacity: processing ? 0.6 : 1
                                                            }}
                                                            onClick={() => updateGroupStatus(group._id, 'active', 'Reactivated by admin')}
                                                            disabled={processing}
                                                        >
                                                            <FaCheckCircle /> Reactivate
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '20px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Group System Analytics</h2>

                    {analytics ? (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ backgroundColor: '#007bff', color: 'white', padding: '20px', borderRadius: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '24px' }}>{analytics.overview?.totalPosts || 0}</h3>
                                    <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Total Posts</p>
                                </div>
                                <div style={{ backgroundColor: '#28a745', color: 'white', padding: '20px', borderRadius: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '24px' }}>{analytics.overview?.totalGroups || 0}</h3>
                                    <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Total Groups</p>
                                </div>
                                <div style={{ backgroundColor: '#17a2b8', color: 'white', padding: '20px', borderRadius: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '24px' }}>{analytics.overview?.activePosts || 0}</h3>
                                    <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Active Posts</p>
                                </div>
                                <div style={{ backgroundColor: '#ffc107', color: '#212529', padding: '20px', borderRadius: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '24px' }}>{analytics.overview?.activeGroups || 0}</h3>
                                    <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Active Groups</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '30px' }}>
                                <h4>Posts by Type</h4>
                                {analytics.byType?.posts?.map(type => (
                                    <div key={type._id} style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span>{type._id || 'Unknown'}</span>
                                            <span>{type.count} posts</span>
                                        </div>
                                        <div style={{
                                            height: '10px',
                                            backgroundColor: '#e9ecef',
                                            borderRadius: '5px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                backgroundColor: type._id === 'study' ? '#007bff' : '#28a745',
                                                width: `${Math.min((type.count / (analytics.overview?.totalPosts || 1)) * 100, 100)}%`
                                            }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p className="text-muted">No analytics data available</p>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Stats Footer */}
            <div style={{
                marginTop: '30px',
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
                    <div>
                        <h4 style={{ color: '#007bff', margin: '0 0 5px 0' }}>
                            {posts.filter(p => p.status === 'open').length}
                        </h4>
                        <p style={{ margin: 0, color: '#6c757d' }}>Open Posts</p>
                    </div>
                    <div>
                        <h4 style={{ color: '#28a745', margin: '0 0 5px 0' }}>
                            {groups.filter(g => g.status === 'active').length}
                        </h4>
                        <p style={{ margin: 0, color: '#6c757d' }}>Active Groups</p>
                    </div>
                    <div>
                        <h4 style={{ color: '#17a2b8', margin: '0 0 5px 0' }}>
                            {posts.reduce((total, post) => total + (post.interestedUsers?.length || 0), 0)}
                        </h4>
                        <p style={{ margin: 0, color: '#6c757d' }}>Total Interests</p>
                    </div>
                    <div>
                        <h4 style={{ color: '#ffc107', margin: '0 0 5px 0' }}>
                            {groups.reduce((total, group) => total + (group.members?.length || 0), 0)}
                        </h4>
                        <p style={{ margin: 0, color: '#6c757d' }}>Total Members</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GroupModerationPage;