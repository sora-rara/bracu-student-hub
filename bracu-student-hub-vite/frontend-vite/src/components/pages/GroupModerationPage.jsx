// components/pages/GroupModerationPage.jsx
import React, { useState, useEffect } from 'react';
import { FaFilter, FaSearch, FaEye, FaArchive, FaCheckCircle, FaTimesCircle, FaChartBar } from 'react-icons/fa';
import apiService from '../../services/api';


function GroupModerationPage() {
    const [posts, setPosts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        type: ''
    });

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
            } else {
                const response = await apiService.getAllGroups({
                    search: filters.search || undefined,
                    status: filters.status || undefined,
                    type: filters.type || undefined
                });
                if (response.success) {
                    setGroups(response.data.groups);
                }
            }
        } catch (err) {
            console.error('Error fetching moderation data:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (type, id, status, reason = '') => {
        try {
            const endpoint = type === 'post'
                ? `/api/admin/groups/need-posts/${id}/status`
                : `/api/admin/groups/groups/${id}/status`;

            const response = await apiService.put(endpoint, { status, reason });

            if (response.success) {
                fetchData(); // Refresh data
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} status updated successfully`);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'open': { color: '#28a745', label: 'Open' },
            'closed': { color: '#6c757d', label: 'Closed' },
            'fulfilled': { color: '#17a2b8', label: 'Fulfilled' },
            'archived': { color: '#6c757d', label: 'Archived' },
            'flagged': { color: '#dc3545', label: 'Flagged' },
            'active': { color: '#28a745', label: 'Active' },
            'inactive': { color: '#ffc107', label: 'Inactive' },
            'suspended': { color: '#dc3545', label: 'Suspended' }
        };

        const config = statusConfig[status] || { color: '#6c757d', label: status };
        return (
            <span className="status-badge" style={{ backgroundColor: config.color }}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="moderation-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading moderation data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="moderation-container">
            <div className="moderation-header">
                <h1><FaEye /> Group & Post Moderation</h1>
                <p>Monitor and manage all group-related activities</p>
            </div>

            {/* Tabs */}
            <div className="moderation-tabs">
                <button
                    className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Need Posts ({posts.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('groups')}
                >
                    Groups ({groups.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    <FaChartBar /> Analytics
                </button>
            </div>

            {/* Filters */}
            <div className="moderation-filters">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>

                <div className="filter-controls">
                    <select
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

                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="study">Study</option>
                        <option value="transport">Transport</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="moderation-content">
                {activeTab === 'posts' ? (
                    <div className="posts-table">
                        <div className="table-header">
                            <div className="col-title">Title</div>
                            <div className="col-author">Author</div>
                            <div className="col-type">Type</div>
                            <div className="col-status">Status</div>
                            <div className="col-date">Created</div>
                            <div className="col-actions">Actions</div>
                        </div>

                        {posts.length === 0 ? (
                            <div className="empty-state">No posts found</div>
                        ) : (
                            posts.map(post => (
                                <div key={post._id} className="table-row">
                                    <div className="col-title">
                                        <strong>{post.title}</strong>
                                        <div className="post-preview">{post.description.substring(0, 60)}...</div>
                                    </div>
                                    <div className="col-author">
                                        {post.createdBy?.name || 'Unknown'}
                                        <div className="author-email">{post.createdBy?.email}</div>
                                    </div>
                                    <div className="col-type">
                                        <span className={`type-badge ${post.type}`}>
                                            {post.type === 'study' ? '📚' : '🚗'} {post.type}
                                        </span>
                                    </div>
                                    <div className="col-status">
                                        {getStatusBadge(post.status)}
                                    </div>
                                    <div className="col-date">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="col-actions">
                                        <button
                                            className="btn-action view"
                                            onClick={() => window.open(`/find-my-group/${post._id}`, '_blank')}
                                        >
                                            <FaEye /> View
                                        </button>
                                        {post.status === 'open' && (
                                            <button
                                                className="btn-action archive"
                                                onClick={() => updateStatus('post', post._id, 'archived', 'Moderated by admin')}
                                            >
                                                <FaArchive /> Archive
                                            </button>
                                        )}
                                        {post.status === 'flagged' && (
                                            <button
                                                className="btn-action approve"
                                                onClick={() => updateStatus('post', post._id, 'open', 'Approved by admin')}
                                            >
                                                <FaCheckCircle /> Approve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : activeTab === 'groups' ? (
                    <div className="groups-table">
                        <div className="table-header">
                            <div className="col-name">Group Name</div>
                            <div className="col-creator">Creator</div>
                            <div className="col-type">Type</div>
                            <div className="col-members">Members</div>
                            <div className="col-status">Status</div>
                            <div className="col-actions">Actions</div>
                        </div>

                        {groups.length === 0 ? (
                            <div className="empty-state">No groups found</div>
                        ) : (
                            groups.map(group => (
                                <div key={group._id} className="table-row">
                                    <div className="col-name">
                                        <strong>{group.name}</strong>
                                        <div className="group-preview">{group.description?.substring(0, 60)}...</div>
                                    </div>
                                    <div className="col-creator">
                                        {group.creator?.name || 'Unknown'}
                                        <div className="creator-email">{group.creator?.email}</div>
                                    </div>
                                    <div className="col-type">
                                        <span className={`type-badge ${group.type}`}>
                                            {group.type === 'study' ? '📚' : '🚗'} {group.type}
                                        </span>
                                    </div>
                                    <div className="col-members">
                                        {group.members?.length || 0} / {group.maxMembers}
                                    </div>
                                    <div className="col-status">
                                        {getStatusBadge(group.status)}
                                    </div>
                                    <div className="col-actions">
                                        <button
                                            className="btn-action view"
                                            onClick={() => window.open(`/groups/${group._id}`, '_blank')}
                                        >
                                            <FaEye /> View
                                        </button>
                                        {group.status === 'active' && (
                                            <button
                                                className="btn-action suspend"
                                                onClick={() => updateStatus('group', group._id, 'suspended', 'Suspended by admin')}
                                            >
                                                <FaTimesCircle /> Suspend
                                            </button>
                                        )}
                                        {group.status === 'suspended' && (
                                            <button
                                                className="btn-action approve"
                                                onClick={() => updateStatus('group', group._id, 'active', 'Reactivated by admin')}
                                            >
                                                <FaCheckCircle /> Reactivate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="analytics-panel">
                        <h2>Group System Analytics</h2>
                        <p>Analytics dashboard coming soon...</p>
                        {/* Implement analytics charts here */}
                    </div>
                )}
            </div>
        </div>
    );
}

export default GroupModerationPage;