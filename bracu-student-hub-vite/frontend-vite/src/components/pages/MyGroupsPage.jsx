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

    useEffect(() => {
        fetchMyGroups();
    }, []);

    const fetchMyGroups = async () => {
        try {
            setLoading(true);
            const response = await apiService.getUserGroups();

            if (response.success) {
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
        switch (filter) {
            case 'admin':
                return groups.filter(group =>
                    group.members?.some(m => m.user?._id === JSON.parse(localStorage.getItem('user'))?.id && m.role === 'admin') ||
                    group.creator === JSON.parse(localStorage.getItem('user'))?.id
                );
            case 'member':
                return groups.filter(group =>
                    group.members?.some(m => m.user?._id === JSON.parse(localStorage.getItem('user'))?.id && m.role === 'member')
                );
            case 'pending':
                return groups.filter(group =>
                    group.joinRequests?.some(r => r.user?._id === JSON.parse(localStorage.getItem('user'))?.id && r.status === 'pending')
                );
            default:
                return groups;
        }
    };

    const getStats = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        const total = groups.length;
        // MyGroupsPage.jsx - FIXED
        const adminGroups = groups.filter(group =>
            group.creator === user?.id  // ✅ Only creator, not admin role
        ).length;
        const memberGroups = groups.filter(group =>
            group.members?.some(m => m.user?._id === user?.id && m.role === 'member')
        ).length;
        const studyGroups = groups.filter(g => g.type === 'study').length;
        const transportGroups = groups.filter(g => g.type === 'transport').length;

        return { total, adminGroups, memberGroups, studyGroups, transportGroups };
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
                <div className="col-md-3 col-6">
                    <div className="card stat-card">
                        <div className="card-body text-center">
                            <h3><FaBook className="text-primary me-2" />{stats.studyGroups}</h3>
                            <p className="text-muted mb-0">Study Groups</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6">
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
                    <div className="btn-group" role="group">
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
                            Pending Requests
                        </button>
                    </div>
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
                    )}
                </div>
            </div>

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
                                                    {groups.reduce((total, group) => total + (group.members?.length || 0), 0)} members
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
                                                    {groups.filter(g => g.type === 'study' && g.status === 'active').length} active
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
                                                    {groups.filter(g => g.type === 'transport' && g.status === 'active').length} active
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