import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaEye, FaArchive, FaCheckCircle, FaTimesCircle, FaChartBar,
    FaFilter, FaSearch, FaUsers, FaBook, FaCar, FaShieldAlt
} from 'react-icons/fa';
import apiService from '../../services/api';

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

    useEffect(() => {
        fetchData();
    }, [activeTab, filters]);

    const fetchData = async () => {
        try {
            setLoading(true);

            if (activeTab === 'posts') {
                const response = await apiService.getAllNeedPosts({
                    search: filters.search || undefined,
                    status: filters.status || undefined,
                    type: filters.type || undefined
                });
                if (response.success) {
                    setPosts(response.data.posts);
                }
            } else if (activeTab === 'groups') {
                const response = await apiService.getAllGroups({
                    search: filters.search || undefined,
                    status: filters.status || undefined,
                    type: filters.type || undefined
                });
                if (response.success) {
                    setGroups(response.data.groups);
                }
            } else if (activeTab === 'analytics') {
                const response = await apiService.getGroupAnalytics();
                if (response.success) {
                    setAnalytics(response.data);
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const updatePostStatus = async (postId, status, reason = '') => {
        try {
            setProcessing(true);
            // Call to admin API endpoint
            // const response = await apiService.adminUpdatePostStatus(postId, { status, reason });
            // if (response.success) {
            //   fetchData();
            // }
            alert(`Post ${status} functionality to be implemented with admin API`);
        } catch (err) {
            console.error('Error updating post:', err);
        } finally {
            setProcessing(false);
        }
    };

    const updateGroupStatus = async (groupId, status, reason = '') => {
        try {
            setProcessing(true);
            // Call to admin API endpoint
            // const response = await apiService.adminUpdateGroupStatus(groupId, { status, reason });
            // if (response.success) {
            //   fetchData();
            // }
            alert(`Group ${status} functionality to be implemented with admin API`);
        } catch (err) {
            console.error('Error updating group:', err);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'open': { color: 'success', label: 'Open' },
            'closed': { color: 'secondary', label: 'Closed' },
            'fulfilled': { color: 'primary', label: 'Fulfilled' },
            'archived': { color: 'dark', label: 'Archived' },
            'flagged': { color: 'danger', label: 'Flagged' },
            'active': { color: 'success', label: 'Active' },
            'full': { color: 'warning', label: 'Full' },
            'inactive': { color: 'secondary', label: 'Inactive' },
            'suspended': { color: 'danger', label: 'Suspended' }
        };

        const config = statusConfig[status] || { color: 'secondary', label: status };
        return (
            <span className={`badge bg-${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getTypeIcon = (type) => {
        return type === 'study' ? <FaBook className="text-primary" /> : <FaCar className="text-success" />;
    };

    return (
        <div className="container mt-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <FaShieldAlt className="display-4 text-primary" />
                        <div>
                            <h2 className="mb-0">Group & Post Moderation</h2>
                            <p className="text-muted mb-0">Admin panel for managing all group-related activities</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="row mb-4">
                <div className="col-12">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('posts')}
                            >
                                <FaBook className="me-2" />
                                Need Posts ({posts.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'groups' ? 'active' : ''}`}
                                onClick={() => setActiveTab('groups')}
                            >
                                <FaUsers className="me-2" />
                                Groups ({groups.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analytics')}
                            >
                                <FaChartBar className="me-2" />
                                Analytics
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <FaSearch />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={`Search ${activeTab}...`}
                                            value={filters.search}
                                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filters.type}
                                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    >
                                        <option value="">All Types</option>
                                        <option value="study">Study</option>
                                        <option value="transport">Transport</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="row">
                <div className="col-12">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading {activeTab}...</p>
                        </div>
                    ) : activeTab === 'posts' ? (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Need Posts Management</h5>
                            </div>
                            <div className="card-body">
                                {posts.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No posts found matching your filters</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Title</th>
                                                    <th>Type</th>
                                                    <th>Creator</th>
                                                    <th>Status</th>
                                                    <th>Interested</th>
                                                    <th>Created</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {posts.map(post => (
                                                    <tr key={post._id}>
                                                        <td>
                                                            <strong>{post.title}</strong>
                                                            <div className="text-muted small">{post.description.substring(0, 50)}...</div>
                                                        </td>
                                                        <td>
                                                            {getTypeIcon(post.type)}
                                                            <span className="ms-2">{post.type}</span>
                                                        </td>
                                                        <td>
                                                            <div>{post.createdByName}</div>
                                                            <div className="text-muted small">{post.createdByEmail}</div>
                                                        </td>
                                                        <td>{getStatusBadge(post.status)}</td>
                                                        <td>{post.interestedUsers?.length || 0}</td>
                                                        <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Link
                                                                    to={`/find-my-group/${post._id}`}
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    target="_blank"
                                                                >
                                                                    <FaEye />
                                                                </Link>
                                                                {post.status === 'open' && (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-warning"
                                                                        onClick={() => updatePostStatus(post._id, 'flagged', 'Flagged by admin')}
                                                                        disabled={processing}
                                                                    >
                                                                        Flag
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => updatePostStatus(post._id, 'archived', 'Archived by admin')}
                                                                    disabled={processing}
                                                                >
                                                                    <FaArchive />
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
                    ) : activeTab === 'groups' ? (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Groups Management</h5>
                            </div>
                            <div className="card-body">
                                {groups.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No groups found matching your filters</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Group Name</th>
                                                    <th>Type</th>
                                                    <th>Creator</th>
                                                    <th>Members</th>
                                                    <th>Status</th>
                                                    <th>Privacy</th>
                                                    <th>Created</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groups.map(group => (
                                                    <tr key={group._id}>
                                                        <td>
                                                            <strong>{group.name}</strong>
                                                            {group.description && (
                                                                <div className="text-muted small">{group.description.substring(0, 50)}...</div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {getTypeIcon(group.type)}
                                                            <span className="ms-2">{group.type}</span>
                                                        </td>
                                                        <td>
                                                            <div>{group.creatorName}</div>
                                                            <div className="text-muted small">{group.creator?.email}</div>
                                                        </td>
                                                        <td>{group.members?.length || 0}/{group.maxMembers}</td>
                                                        <td>{getStatusBadge(group.status)}</td>
                                                        <td>
                                                            <span className={`badge ${group.privacy === 'private' ? 'bg-dark' : 'bg-info'}`}>
                                                                {group.privacy}
                                                            </span>
                                                        </td>
                                                        <td>{new Date(group.createdAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Link
                                                                    to={`/groups/${group._id}`}
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    target="_blank"
                                                                >
                                                                    <FaEye />
                                                                </Link>
                                                                {group.status === 'active' && (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => updateGroupStatus(group._id, 'suspended', 'Suspended by admin')}
                                                                        disabled={processing}
                                                                    >
                                                                        Suspend
                                                                    </button>
                                                                )}
                                                                {group.status === 'suspended' && (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-success"
                                                                        onClick={() => updateGroupStatus(group._id, 'active', 'Reactivated by admin')}
                                                                        disabled={processing}
                                                                    >
                                                                        Reactivate
                                                                    </button>
                                                                )}
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
                    ) : (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">System Analytics</h5>
                            </div>
                            <div className="card-body">
                                {analytics ? (
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="card bg-primary text-white mb-3">
                                                <div className="card-body text-center">
                                                    <h1>{analytics.overview?.totalPosts || 0}</h1>
                                                    <p className="mb-0">Total Posts</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card bg-success text-white mb-3">
                                                <div className="card-body text-center">
                                                    <h1>{analytics.overview?.totalGroups || 0}</h1>
                                                    <p className="mb-0">Total Groups</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card bg-info text-white mb-3">
                                                <div className="card-body text-center">
                                                    <h1>{analytics.overview?.activePosts || 0}</h1>
                                                    <p className="mb-0">Active Posts</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <h5 className="mt-4">Posts by Type</h5>
                                            <div className="row">
                                                {analytics.byType?.posts?.map(type => (
                                                    <div key={type._id} className="col-md-6">
                                                        <div className="card mb-3">
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                        <h6 className="mb-0">{type._id || 'Unknown'}</h6>
                                                                        <p className="text-muted mb-0">{type.count} posts</p>
                                                                    </div>
                                                                    {type._id === 'study' ? <FaBook className="text-primary fs-4" /> : <FaCar className="text-success fs-4" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <h5 className="mt-4">Recent Activity (Last 7 Days)</h5>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="card">
                                                        <div className="card-body">
                                                            <h6>New Posts</h6>
                                                            <h2 className="text-primary">{analytics.recentActivity?.last7Days?.posts || 0}</h2>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="card">
                                                        <div className="card-body">
                                                            <h6>New Groups</h6>
                                                            <h2 className="text-success">{analytics.recentActivity?.last7Days?.groups || 0}</h2>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 mt-4">
                                            <div className="alert alert-info">
                                                <FaChartBar className="me-2" />
                                                More detailed analytics coming soon...
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">Analytics data not available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-md-3">
                                    <h4 className="text-primary">{posts.filter(p => p.status === 'open').length}</h4>
                                    <p className="text-muted mb-0">Open Posts</p>
                                </div>
                                <div className="col-md-3">
                                    <h4 className="text-success">{groups.filter(g => g.status === 'active').length}</h4>
                                    <p className="text-muted mb-0">Active Groups</p>
                                </div>
                                <div className="col-md-3">
                                    <h4 className="text-info">{posts.reduce((total, post) => total + (post.interestedUsers?.length || 0), 0)}</h4>
                                    <p className="text-muted mb-0">Total Interests</p>
                                </div>
                                <div className="col-md-3">
                                    <h4 className="text-warning">{groups.reduce((total, group) => total + (group.members?.length || 0), 0)}</h4>
                                    <p className="text-muted mb-0">Total Members</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GroupModerationPage;