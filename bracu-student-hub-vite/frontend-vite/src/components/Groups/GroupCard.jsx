import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaUser, FaLock, FaGlobe, FaBook, FaCar, FaSignOutAlt } from 'react-icons/fa';
import apiService from '../../services/api';
import authService from '../../services/auth';

function GroupCard({ group, onLeaveGroup }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const user = authService.getCurrentUser();
    const isAdmin = user && (user.role === 'admin' || user.isAdmin);

    // GroupCard.jsx - FIXED
    const isGroupAdmin = group.creator === user?.id;  // ✅ Only creator check

    const isMember = group.members?.some(m => m.user?._id === user?.id);

    const handleLeaveGroup = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiService.leaveGroup(group._id);

            if (response.success) {
                if (onLeaveGroup) onLeaveGroup();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to leave group');
        } finally {
            setLoading(false);
            setShowLeaveConfirm(false);
        }
    };

    const getStatusBadge = () => {
        const statusConfig = {
            'active': { color: 'var(--success)', label: 'Active', icon: '🟢' },
            'full': { color: 'var(--warning)', label: 'Full', icon: '🔴' },
            'inactive': { color: 'var(--gray)', label: 'Inactive', icon: '⚫' },
            'archived': { color: 'var(--secondary)', label: 'Archived', icon: '📁' }
        };

        const config = statusConfig[group.status] || statusConfig.active;
        return (
            <span className="badge" style={{ backgroundColor: config.color, color: 'white' }}>
                {config.icon} {config.label}
            </span>
        );
    };

    return (
        <>
            <div className="card group-card">
                <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            {group.type === 'study' ? <FaBook className="text-primary" /> : <FaCar className="text-success" />}
                            <h5 className="mb-0">{group.name}</h5>

                            {/* PRIVACY BADGE - ADDED HERE */}
                            <span className={`badge ${group.privacy === 'private' ? 'bg-dark' : 'bg-info'}`}>
                                {group.privacy === 'private' ? <FaLock className="me-1" /> : <FaGlobe className="me-1" />}
                                {group.privacy}
                            </span>

                            {getStatusBadge()}
                        </div>
                        <div className="text-muted">
                            <FaUsers /> {group.members?.length || 0}/{group.maxMembers}
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    {group.description && (
                        <p className="card-text text-muted mb-3">{group.description}</p>
                    )}

                    <div className="group-details mb-3">
                        {group.type === 'study' ? (
                            <>
                                {group.subject && (
                                    <div className="detail-item">
                                        <strong>Subject:</strong> {group.subject}
                                    </div>
                                )}
                                {group.courseCode && (
                                    <div className="detail-item">
                                        <strong>Course:</strong> {group.courseCode}
                                    </div>
                                )}
                                {group.meetingLocation && (
                                    <div className="detail-item">
                                        <strong>Location:</strong> {group.meetingLocation}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {group.route && (
                                    <div className="detail-item">
                                        <strong>Route:</strong> {group.route}
                                    </div>
                                )}
                                {group.pickupLocation && (
                                    <div className="detail-item">
                                        <strong>Pickup:</strong> {group.pickupLocation}
                                    </div>
                                )}
                                {group.schedule && (
                                    <div className="detail-item">
                                        <strong>Schedule:</strong> {group.schedule}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <FaUser className="text-secondary" />
                            <small>{group.creatorName || 'Unknown'}</small>
                            {isGroupAdmin && <span className="badge bg-info">Admin</span>}
                        </div>

                        <small className="text-muted">
                            Last activity: {new Date(group.lastActivity || group.createdAt).toLocaleDateString()}
                        </small>
                    </div>
                </div>

                <div className="card-footer">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {isMember && <span className="badge bg-success">Member</span>}
                            {group.joinRequests?.some(r => r.user?._id === user?.id && r.status === 'pending') && (
                                <span className="badge bg-warning">Request Pending</span>
                            )}
                        </div>

                        <div className="d-flex gap-2">
                            <Link to={`/groups/${group._id}`} className="btn btn-sm btn-outline-primary">
                                View Details
                            </Link>

                            {isMember && !isAdmin && (
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => setShowLeaveConfirm(true)}
                                    disabled={loading}
                                >
                                    <FaSignOutAlt /> Leave
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leave Group Confirmation Modal */}
            {showLeaveConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Leave Group</h5>
                            <button type="button" className="btn-close" onClick={() => setShowLeaveConfirm(false)}></button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to leave "{group.name}"?</p>
                            {error && <div className="alert alert-danger">{error}</div>}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowLeaveConfirm(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleLeaveGroup}
                                disabled={loading}
                            >
                                {loading ? 'Leaving...' : 'Leave Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default GroupCard;