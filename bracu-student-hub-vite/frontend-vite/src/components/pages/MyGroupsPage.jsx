import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaUser, FaBook, FaCar, FaSignOutAlt, FaPlus, FaUserPlus } from 'react-icons/fa';
import apiService from '../../services/api';
import GroupCard from '../Groups/GroupCard';

function MyGroupsPage() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, admin, member, pending

    // Get current user once
    const getCurrentUser = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            return JSON.parse(userStr);
        } catch (err) {
            console.error('Error parsing user from localStorage:', err);
            return null;
        }
    };

    const currentUser = getCurrentUser();
    const userId = currentUser?.id;

    useEffect(() => {
        fetchMyGroups();
    }, []);

    const fetchMyGroups = async () => {
        try {
            setLoading(true);
            const response = await apiService.getUserGroups();

            if (response.success) {
                console.log('Fetched groups:', response.data);
                setGroups(response.data);
            }
        } catch (err) {
            setError('Failed to load your groups');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveGroup = (groupId) => {
        // GroupCard handles the actual API call
        // Just refresh the list
        fetchMyGroups();
    };

    const getFilteredGroups = () => {
        if (!userId) return groups; // If no user, return all groups

        console.log('Filtering with userId:', userId, 'filter:', filter);

        const filtered = groups.filter(group => {
            // Check if user is a member
            const isMember = group.members?.some(member => {
                const memberUserId = member.user?._id || member.user;
                return memberUserId?.toString() === userId?.toString();
            });

            // Check if user is creator
            const isCreator = group.creator?.toString() === userId?.toString();

            // Check if user has pending request
            const hasPendingRequest = group.joinRequests?.some(request => {
                const requestUserId = request.user?._id || request.user;
                return requestUserId?.toString() === userId?.toString() &&
                    request.status === 'pending';
            });

            // Check user role in group
            const userMember = group.members?.find(member => {
                const memberUserId = member.user?._id || member.user;
                return memberUserId?.toString() === userId?.toString();
            });
            const userRole = userMember?.role;

            // Apply filter
            switch (filter) {
                case 'admin':
                    // User is admin if they are creator OR have admin role
                    return isCreator || userRole === 'admin';
                case 'member':
                    // User is a regular member (not creator, not admin)
                    return isMember && !isCreator && userRole === 'member';
                case 'pending':
                    // User has pending join request
                    return hasPendingRequest;
                case 'all':
                default:
                    // Show groups where user is member OR has pending request
                    return isMember || hasPendingRequest || isCreator;
            }
        });

        console.log(`Filter result: ${filter} -> ${filtered.length} groups`);
        return filtered;
    };

    const getStats = () => {
        if (!userId) {
            return { total: 0, adminGroups: 0, memberGroups: 0, studyGroups: 0, transportGroups: 0 };
        }

        const stats = {
            total: 0,
            adminGroups: 0,
            memberGroups: 0,
            studyGroups: 0,
            transportGroups: 0,
            pendingRequests: 0
        };

        groups.forEach(group => {
            const isMember = group.members?.some(member => {
                const memberUserId = member.user?._id || member.user;
                return memberUserId?.toString() === userId?.toString();
            });

            const isCreator = group.creator?.toString() === userId?.toString();

            const userMember = group.members?.find(member => {
                const memberUserId = member.user?._id || member.user;
                return memberUserId?.toString() === userId?.toString();
            });
            const userRole = userMember?.role;

            const hasPendingRequest = group.joinRequests?.some(request => {
                const requestUserId = request.user?._id || request.user;
                return requestUserId?.toString() === userId?.toString() &&
                    request.status === 'pending';
            });

            // Count total groups user is involved with
            if (isMember || isCreator || hasPendingRequest) {
                stats.total++;

                // Count by type
                if (group.type === 'study') stats.studyGroups++;
                if (group.type === 'transport') stats.transportGroups++;

                // Count by role/status
                if (isCreator || userRole === 'admin') {
                    stats.adminGroups++;
                } else if (userRole === 'member') {
                    stats.memberGroups++;
                }

                if (hasPendingRequest) {
                    stats.pendingRequests++;
                }
            }
        });

        console.log('Calculated stats:', stats);
        return stats;
    };

    const stats = getStats();
    const filteredGroups = getFilteredGroups();

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your groups...</p>
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
                        <h2><FaUsers className="me-2" /> My Groups</h2>
                        <Link to="/find-my-group" className="btn btn-outline-primary">
                            <FaPlus className="me-2" /> Find Groups
                        </Link>
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}
                </div>
            </div>

            {/* Stats */}
            <div className="row mb-4">
                <div className="col-md-2 col-6">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3 className="text-primary">{stats.total}</h3>
                            <p className="text-muted mb-0">Total Groups</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3 className="text-success">{stats.adminGroups}</h3>
                            <p className="text-muted mb-0">Admin</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3 className="text-info">{stats.memberGroups}</h3>
                            <p className="text-muted mb-0">Member</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3 className="text-warning">{stats.pendingRequests}</h3>
                            <p className="text-muted mb-0">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3><FaBook className="text-primary me-2" />{stats.studyGroups}</h3>
                            <p className="text-muted mb-0">Study</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3><FaCar className="text-success me-2" />{stats.transportGroups}</h3>
                            <p className="text-muted mb-0">Transport</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="btn-group flex-wrap" role="group">
                        <button
                            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            className={`btn ${filter === 'admin' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setFilter('admin')}
                        >
                            Admin ({stats.adminGroups})
                        </button>
                        <button
                            className={`btn ${filter === 'member' ? 'btn-info' : 'btn-outline-info'}`}
                            onClick={() => setFilter('member')}
                        >
                            Member ({stats.memberGroups})
                        </button>
                        <button
                            className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => setFilter('pending')}
                        >
                            Pending ({stats.pendingRequests})
                        </button>
                    </div>
                    <small className="text-muted mt-2 d-block">
                        Showing {filteredGroups.length} of {stats.total} groups
                    </small>
                </div>
            </div>

            {/* Groups List */}
            <div className="row">
                <div className="col-12">
                    {filteredGroups.length === 0 ? (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <FaUsers className="display-1 text-muted mb-3" />
                                <h4>No Groups Found</h4>
                                <p className="text-muted mb-4">
                                    {filter === 'all'
                                        ? "You haven't joined any groups yet."
                                        : `No ${filter} groups found.`
                                    }
                                </p>
                                {filter === 'all' && (
                                    <Link to="/find-my-group" className="btn btn-primary">
                                        <FaUserPlus className="me-2" /> Find Groups to Join
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="alert alert-info">
                                <strong>Filter:</strong> {filter.charAt(0).toUpperCase() + filter.slice(1)} •
                                <strong> Showing:</strong> {filteredGroups.length} groups
                            </div>
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {filteredGroups.map(group => (
                                    <div key={group._id} className="col">
                                        <GroupCard
                                            group={group}
                                            onLeaveGroup={handleLeaveGroup}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card border-danger">
                            <div className="card-header bg-danger text-white">
                                <h6 className="mb-0">Debug Info</h6>
                            </div>
                            <div className="card-body">
                                <p><strong>User ID:</strong> {userId || 'No user found'}</p>
                                <p><strong>Current Filter:</strong> {filter}</p>
                                <p><strong>Total Groups:</strong> {groups.length}</p>
                                <p><strong>Filtered Groups:</strong> {filteredGroups.length}</p>
                                <details>
                                    <summary>All Groups (click to expand)</summary>
                                    <pre className="mt-2" style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                                        {JSON.stringify(groups.map(g => ({
                                            id: g._id,
                                            name: g.name,
                                            creator: g.creator,
                                            members: g.members?.map(m => ({
                                                userId: m.user?._id || m.user,
                                                role: m.role
                                            })),
                                            joinRequests: g.joinRequests
                                        })), null, 2)}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Stats */}
            {filteredGroups.length > 0 && (
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Group Activity Summary</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="activity-item">
                                            <FaUsers className="text-primary me-2" />
                                            <div>
                                                <h6>Total Members Across Groups</h6>
                                                <p className="mb-0">
                                                    {filteredGroups.reduce((total, group) => total + (group.members?.length || 0), 0)} members
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="activity-item">
                                            <FaBook className="text-success me-2" />
                                            <div>
                                                <h6>Active Study Groups</h6>
                                                <p className="mb-0">
                                                    {filteredGroups.filter(g => g.type === 'study' && g.status === 'active').length} active
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="activity-item">
                                            <FaCar className="text-info me-2" />
                                            <div>
                                                <h6>Active Transport Groups</h6>
                                                <p className="mb-0">
                                                    {filteredGroups.filter(g => g.type === 'transport' && g.status === 'active').length} active
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyGroupsPage;