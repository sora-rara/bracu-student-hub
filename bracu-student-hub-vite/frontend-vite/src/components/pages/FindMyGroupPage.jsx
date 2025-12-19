// components/pages/FindMyGroupPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaPlus, FaUsers, FaCar, FaBook } from 'react-icons/fa';
import apiService from '../../services/api';
import authService from '../../services/auth';
import NeedPostCard from '../Groups/NeedPostCard';


function FindMyGroupPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        search: '',
        gender: '',
        page: 1,
        limit: 12
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        pages: 1
    });

    const user = authService.getCurrentUser();
    const isAdmin = user && (user.role === 'admin' || user.isAdmin);

    useEffect(() => {
        fetchPosts();
    }, [filters.type, filters.gender, filters.page]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllNeedPosts({
                type: filters.type || undefined,
                search: filters.search || undefined,
                gender: filters.gender || undefined,
                page: filters.page,
                limit: filters.limit
            });

            if (response.success) {
                setPosts(response.data.posts);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPosts();
    };

    const clearFilters = () => {
        setFilters({
            type: '',
            search: '',
            gender: '',
            page: 1,
            limit: 12
        });
    };

    return (
        <div className="find-my-group-page">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <h1><FaUsers /> Find My Group</h1>
                    <p className="subtitle">
                        Connect with fellow students for study groups or transportation partnerships.
                        {isAdmin && ' (Admin View)'}
                    </p>

                    <div className="hero-stats">
                        <div className="stat-card">
                            <div className="stat-icon study">
                                <FaBook />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">
                                    {posts.filter(p => p.type === 'study').length}
                                </div>
                                <div className="stat-label">Study Groups</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon transport">
                                <FaCar />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">
                                    {posts.filter(p => p.type === 'transport').length}
                                </div>
                                <div className="stat-label">Transport</div>
                            </div>
                        </div>
                    </div>
                </div>

                {!isAdmin && (
                    <div className="hero-actions">
                        <Link to="/find-my-group/create" className="btn btn-primary btn-lg">
                            <FaPlus /> Create New Post
                        </Link>
                    </div>
                )}
            </div>

            {/* Filters Section */}
            <div className="filters-section">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by course, subject, route, or keywords..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="search-input"
                        />
                        <button type="submit" className="btn btn-primary">Search</button>
                    </div>
                </form>

                <div className="filter-controls">
                    <div className="filter-group">
                        <FaFilter className="filter-icon" />
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                            className="filter-select"
                        >
                            <option value="">All Types</option>
                            <option value="study">Study Groups</option>
                            <option value="transport">Transport</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <select
                            value={filters.gender}
                            onChange={(e) => setFilters({ ...filters, gender: e.target.value, page: 1 })}
                            className="filter-select"
                        >
                            <option value="">Any Gender</option>
                            <option value="any">Open to All</option>
                            <option value="female-only">Female Only</option>
                            <option value="male-only">Male Only</option>
                        </select>
                    </div>

                    {(filters.type || filters.search || filters.gender) && (
                        <button onClick={clearFilters} className="btn btn-outline">
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <Link to="/find-my-group/my-posts" className="action-link">
                    <FaUsers /> My Posts
                </Link>
                <Link to="/find-my-group/my-groups" className="action-link">
                    <FaUsers /> My Groups
                </Link>
                {isAdmin && (
                    <Link to="/find-my-group/admin" className="action-link admin">
                        <FaUsers /> Admin Panel
                    </Link>
                )}
            </div>

            {/* Posts Section */}
            <div className="posts-section">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading posts...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No posts found</h3>
                        <p>
                            {filters.type || filters.search || filters.gender
                                ? "Try changing your filters"
                                : "Be the first to create a post!"
                            }
                        </p>
                        {!isAdmin && !filters.type && !filters.search && !filters.gender && (
                            <Link to="/find-my-group/create" className="btn btn-primary">
                                Create First Post
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="posts-header">
                            <h3>
                                {filters.type === 'study' ? 'Study Group Requests' :
                                    filters.type === 'transport' ? 'Transport Requests' :
                                        'All Posts'} ({pagination.total})
                            </h3>
                            <div className="pagination-info">
                                Page {pagination.page} of {pagination.pages}
                            </div>
                        </div>

                        <div className="posts-grid">
                            {posts.map(post => (
                                <NeedPostCard
                                    key={post._id}
                                    post={post}
                                    refreshPosts={fetchPosts}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page === 1}
                                >
                                    Previous
                                </button>
                                <span className="page-info">
                                    Page {filters.page} of {pagination.pages}
                                </span>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page === pagination.pages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default FindMyGroupPage;