import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaCar, FaUsers, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import apiService from '../../services/api';
import NeedPostCard from '../Groups/NeedPostCard';

function MyPostsPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

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
                fetchMyPosts(); // Refresh posts list
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create group');
        }
    };

    const getStats = () => {
        const total = posts.length;
        const study = posts.filter(p => p.type === 'study').length;
        const transport = posts.filter(p => p.type === 'transport').length;
        const open = posts.filter(p => p.status === 'open').length;

        return { total, study, transport, open };
    };

    const stats = getStats();

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
                            <div className="mb-3">
                                <div className="btn-group" role="group">
                                    <button className="btn btn-outline-primary active">All ({stats.total})</button>
                                    <button className="btn btn-outline-primary">Open ({stats.open})</button>
                                    <button className="btn btn-outline-primary">Study ({stats.study})</button>
                                    <button className="btn btn-outline-primary">Transport ({stats.transport})</button>
                                </div>
                            </div>

                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {posts.map(post => (
                                    <div key={post._id} className="col">
                                        <div className="card h-100">
                                            <div className="card-header">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center gap-2">
                                                        {post.type === 'study' ?
                                                            <FaBook className="text-primary" /> :
                                                            <FaCar className="text-success" />
                                                        }
                                                        <span className={`badge ${post.status === 'open' ? 'bg-success' : 'bg-secondary'}`}>
                                                            {post.status}
                                                        </span>
                                                    </div>
                                                    <div className="dropdown">
                                                        <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            Actions
                                                        </button>
                                                        <ul className="dropdown-menu">
                                                            <li>
                                                                <Link className="dropdown-item" to={`/find-my-group/${post._id}`}>
                                                                    <FaEdit className="me-2" /> View Details
                                                                </Link>
                                                            </li>
                                                            {post.status === 'open' && (
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item"
                                                                        onClick={() => handleCreateGroup(post._id)}
                                                                    >
                                                                        <FaUsers className="me-2" /> Create Group
                                                                    </button>
                                                                </li>
                                                            )}
                                                            <li><hr className="dropdown-divider" /></li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item text-danger"
                                                                    onClick={() => setShowDeleteConfirm(post._id)}
                                                                    disabled={deleting}
                                                                >
                                                                    <FaTrash className="me-2" /> Delete
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                <h5 className="card-title">{post.title}</h5>
                                                <p className="card-text text-muted small">{post.description.substring(0, 100)}...</p>

                                                <div className="mb-3">
                                                    {post.type === 'study' ? (
                                                        <>
                                                            {post.subject && (
                                                                <div className="badge bg-info me-2">{post.subject}</div>
                                                            )}
                                                            {post.courseCode && (
                                                                <div className="badge bg-primary">{post.courseCode}</div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {post.route && (
                                                                <div className="badge bg-success me-2">{post.route}</div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center">
                                                    <small className="text-muted">
                                                        <FaUsers className="me-1" />
                                                        {post.interestedUsers?.length || 0} interested
                                                    </small>
                                                    <small className="text-muted">
                                                        Created: {new Date(post.createdAt).toLocaleDateString()}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Delete Post</h5>
                            <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(null)}></button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete this post? This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
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
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyPostsPage;