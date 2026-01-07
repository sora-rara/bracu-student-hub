import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBook, FaCar, FaUsers, FaTrash, FaPlus, FaEye, FaUserFriends } from 'react-icons/fa';
import apiService from '../../services/api';

function MyPostsPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            setLoading(true);
            const response = await apiService.getUserNeedPosts();

            if (response.success) {
                setPosts(response.data);
            }
        } catch (err) {
            setError('Failed to load your posts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            setDeleting(true);
            const response = await apiService.deleteNeedPost(postId);
            if (response.success) {
                setPosts(posts.filter(post => post._id !== postId));
                alert('Post deleted successfully!');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete post');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(null);
        }
    };

    const handleCreateGroup = async (postId) => {
        try {
            const groupName = prompt('Enter group name:');
            if (!groupName) return;

            const response = await apiService.createGroupFromPost(postId, { groupName });
            if (response.success) {
                alert('Group created successfully!');
                fetchMyPosts();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create group');
        }
    };

    const handleViewDetails = (postId) => {
        navigate(`/find-my-group/${postId}`);
    };

    const getStats = () => {
        const total = posts.length;
        const study = posts.filter(p => p.type === 'study').length;
        const transport = posts.filter(p => p.type === 'transport').length;
        const open = posts.filter(p => p.status === 'open').length;
        const closed = posts.filter(p => p.status === 'closed').length;

        return { total, study, transport, open, closed };
    };

    const getFilteredPosts = () => {
        switch (filter) {
            case 'open':
                return posts.filter(post => post.status === 'open');
            case 'closed':
                return posts.filter(post => post.status === 'closed');
            case 'study':
                return posts.filter(post => post.type === 'study');
            case 'transport':
                return posts.filter(post => post.type === 'transport');
            default:
                return posts;
        }
    };

    const stats = getStats();
    const filteredPosts = getFilteredPosts();

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your posts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2>My Posts</h2>
                        <Link to="/find-my-group/create" className="btn btn-primary">
                            <FaPlus className="me-2" /> Create New Post
                        </Link>
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}
                </div>
            </div>

            {/* Stats */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3 className="text-primary">{stats.total}</h3>
                            <p className="text-muted mb-0">Total Posts</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3 className="text-success">{stats.open}</h3>
                            <p className="text-muted mb-0">Open Posts</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3><FaBook className="text-primary me-2" />{stats.study}</h3>
                            <p className="text-muted mb-0">Study Groups</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3><FaCar className="text-success me-2" />{stats.transport}</h3>
                            <p className="text-muted mb-0">Transport</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="mb-4">
                <div className="btn-group" role="group">
                    <button
                        className={`btn btn-outline-primary ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({stats.total})
                    </button>
                    <button
                        className={`btn btn-outline-primary ${filter === 'open' ? 'active' : ''}`}
                        onClick={() => setFilter('open')}
                    >
                        Open ({stats.open})
                    </button>
                    <button
                        className={`btn btn-outline-primary ${filter === 'closed' ? 'active' : ''}`}
                        onClick={() => setFilter('closed')}
                    >
                        Closed ({stats.closed})
                    </button>
                    <button
                        className={`btn btn-outline-primary ${filter === 'study' ? 'active' : ''}`}
                        onClick={() => setFilter('study')}
                    >
                        Study ({stats.study})
                    </button>
                    <button
                        className={`btn btn-outline-primary ${filter === 'transport' ? 'active' : ''}`}
                        onClick={() => setFilter('transport')}
                    >
                        Transport ({stats.transport})
                    </button>
                </div>
            </div>

            {/* Posts List */}
            <div className="row">
                <div className="col-12">
                    {posts.length === 0 ? (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <FaUsers className="display-1 text-muted mb-3" />
                                <h4>No Posts Yet</h4>
                                <p className="text-muted mb-4">You haven't created any posts yet.</p>
                                <Link to="/find-my-group/create" className="btn btn-primary">
                                    Create Your First Post
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {filteredPosts.map(post => (
                                    <div key={post._id} className="col">
                                        <div className="card h-100 shadow-sm">
                                            <div className="card-header bg-light">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center gap-2">
                                                        {post.type === 'study' ? (
                                                            <FaBook className="text-primary fs-5" />
                                                        ) : (
                                                            <FaCar className="text-success fs-5" />
                                                        )}
                                                        <span className={`badge ${post.status === 'open' ? 'bg-success' : 'bg-secondary'}`}>
                                                            {post.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-muted small">
                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-body d-flex flex-column">
                                                <h5 className="card-title mb-3">{post.title}</h5>

                                                <p className="card-text text-muted mb-3 flex-grow-1">
                                                    {post.description ?
                                                        `${post.description.substring(0, 120)}${post.description.length > 120 ? '...' : ''}`
                                                        : 'No description'
                                                    }
                                                </p>

                                                {/* Tags/Badges */}
                                                <div className="mb-3">
                                                    {post.type === 'study' ? (
                                                        <>
                                                            {post.subject && (
                                                                <span className="badge bg-info me-1 mb-1">{post.subject}</span>
                                                            )}
                                                            {post.courseCode && (
                                                                <span className="badge bg-primary me-1 mb-1">{post.courseCode}</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {post.route && (
                                                                <span className="badge bg-success me-1 mb-1">{post.route}</span>
                                                            )}
                                                            {post.pickupLocation && (
                                                                <span className="badge bg-warning me-1 mb-1">{post.pickupLocation}</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Stats */}
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <small className="text-muted">
                                                        <FaUsers className="me-1" />
                                                        {post.interestedUsers?.length || 0} interested
                                                    </small>
                                                    {post.hasGroup && (
                                                        <span className="badge bg-info">
                                                            <FaUserFriends className="me-1" /> Has Group
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Buttons - NO DROPDOWN */}
                                                <div className="d-grid gap-2 d-md-flex justify-content-md-between">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => handleViewDetails(post._id)}
                                                    >
                                                        <FaEye className="me-1" /> View Details
                                                    </button>

                                                    <div className="d-flex gap-2">
                                                        {post.status === 'open' && !post.hasGroup && (
                                                            <button
                                                                className="btn btn-outline-success btn-sm"
                                                                onClick={() => handleCreateGroup(post._id)}
                                                            >
                                                                <FaUsers className="me-1" /> Create Group
                                                            </button>
                                                        )}

                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => setShowDeleteConfirm(post._id)}
                                                            disabled={deleting}
                                                        >
                                                            <FaTrash className="me-1" /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredPosts.length === 0 && posts.length > 0 && (
                                <div className="text-center py-5">
                                    <FaUsers className="display-1 text-muted mb-3" />
                                    <h4>No Posts Found</h4>
                                    <p className="text-muted">
                                        No posts match the current filter. Try a different filter.
                                    </p>
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => setFilter('all')}
                                    >
                                        Show All Posts
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div className="modal-content" style={{
                        background: 'white',
                        borderRadius: '8px',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}>
                        <div className="modal-header" style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #e9ecef',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h5 className="modal-title">Delete Post</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowDeleteConfirm(null)}
                                disabled={deleting}
                            ></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <p>Are you sure you want to delete this post? This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer" style={{
                            padding: '16px 20px',
                            borderTop: '1px solid #e9ecef',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px'
                        }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteConfirm(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleDeletePost(showDeleteConfirm)}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyPostsPage;