import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaArrowLeft, FaUsers, FaUser, FaUserPlus, FaSignOutAlt,
    FaBook, FaCar, FaEnvelope, FaCheck, FaTimes, FaCog,
    FaGlobe, FaLock, FaCalendar, FaMapMarker
} from 'react-icons/fa';
import apiService from '../../services/api';
import authService from '../../services/auth';

function GroupDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinMessage, setJoinMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(null); // {requestId, action}

    const user = authService.getCurrentUser();
    const isAdminUser = user && (user.role === 'admin' || user.isAdmin);

    useEffect(() => {
        fetchGroupDetails();
    }, [id]);

    const fetchGroupDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getGroup(id);

            if (response.success) {
                setGroup(response.data);
            }
        } catch (err) {
            setError('Failed to load group details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isMember = group?.members?.some(m => m.user?._id === user?.id);
    // GroupDetail.jsx - FIXED
    const isGroupAdmin = group?.creator === user?.id;  // ✅ Only creator
    const hasPendingRequest = group?.joinRequests?.some(r =>
        r.user?._id === user?.id && r.status === 'pending'
    );

    const handleJoinRequest = async () => {
        if (!joinMessage.trim()) {
            setError('Please add a message to your join request');
            return;
        }

        try {
            setProcessing(true);
            const response = await apiService.requestToJoinGroup(id, joinMessage);

            if (response.success) {
                alert('Join request sent successfully!');
                setShowJoinModal(false);
                setJoinMessage('');
                fetchGroupDetails(); // Refresh group data
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send join request');
        } finally {
            setProcessing(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm('Are you sure you want to leave this group?')) return;

        try {
            setProcessing(true);
            const response = await apiService.leaveGroup(id);

            if (response.success) {
                alert('Left group successfully');
                navigate('/find-my-group/my-groups');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to leave group');
            setProcessing(false);
        }
    };

    const handleRequestAction = async (requestId, action) => {
        try {
            setProcessing(true);
            const response = await apiService.handleJoinRequest(id, requestId, action);

            if (response.success) {
                alert(`Request ${action} successfully`);
                setShowRequestModal(null);
                fetchGroupDetails();
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${action} request`);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = () => {
        const statusConfig = {
            'active': { color: 'success', label: 'Active', icon: '🟢' },
            'full': { color: 'warning', label: 'Full', icon: '🔴' },
            'inactive': { color: 'secondary', label: 'Inactive', icon: '⚫' },
            'archived': { color: 'dark', label: 'Archived', icon: '📁' }
        };

        const config = statusConfig[group?.status] || statusConfig.active;
        return (
            <span className={`badge bg-${config.color}`}>
                {config.icon} {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading group details...</p>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">
                    Group not found
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/find-my-group')}>
                    <FaArrowLeft className="me-2" /> Back to Groups
                </button>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {/* Back Button */}
            <div className="mb-4">
                <button className="btn btn-outline-secondary" onClick={() => navigate('/find-my-group/my-groups')}>
                    <FaArrowLeft className="me-2" /> Back to My Groups
                </button>
            </div>

            {/* Error Alert */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Group Header */}
            <div className="card mb-4">
                <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            {group.type === 'study' ? (
                                <FaBook className="display-6 text-primary" />
                            ) : (
                                <FaCar className="display-6 text-success" />
                            )}
                            <div>
                                <h2 className="mb-0">{group.name}</h2>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                    {getStatusBadge()}
                                    <span className={`badge ${group.privacy === 'private' ? 'bg-dark' : 'bg-info'}`}>
                                        {group.privacy === 'private' ? <FaLock className="me-1" /> : <FaGlobe className="me-1" />}
                                        {group.privacy}
                                    </span>
                                    <span className="badge bg-secondary">
                                        {group.type === 'study' ? 'Study Group' : 'Transport'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            {!isMember && !hasPendingRequest && group.status === 'active' && !isAdminUser && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowJoinModal(true)}
                                    disabled={group.members?.length >= group.maxMembers}
                                >
                                    <FaUserPlus className="me-2" />
                                    {group.members?.length >= group.maxMembers ? 'Group Full' : 'Request to Join'}
                                </button>
                            )}

                            {hasPendingRequest && (
                                <span className="badge bg-warning p-2">
                                    <FaEnvelope className="me-2" /> Request Pending
                                </span>
                            )}

                            {isMember && !isAdminUser && (
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={handleLeaveGroup}
                                    disabled={processing}
                                >
                                    <FaSignOutAlt className="me-2" /> Leave Group
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    {/* Description */}
                    {group.description && (
                        <div className="mb-4">
                            <h5>Description</h5>
                            <p className="text-muted">{group.description}</p>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <h5>Group Details</h5>
                            <div className="details-list">
                                {group.type === 'study' ? (
                                    <>
                                        {group.subject && (
                                            <div className="detail-item">
                                                <FaBook className="me-2 text-primary" />
                                                <strong>Subject:</strong> {group.subject}
                                            </div>
                                        )}
                                        {group.courseCode && (
                                            <div className="detail-item">
                                                <strong>Course Code:</strong> {group.courseCode}
                                            </div>
                                        )}
                                        {group.meetingLocation && (
                                            <div className="detail-item">
                                                <FaMapMarker className="me-2" />
                                                <strong>Location:</strong> {group.meetingLocation}
                                            </div>
                                        )}
                                        {group.meetingSchedule && (
                                            <div className="detail-item">
                                                <FaCalendar className="me-2" />
                                                <strong>Schedule:</strong> {group.meetingSchedule}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {group.route && (
                                            <div className="detail-item">
                                                <FaMapMarker className="me-2 text-success" />
                                                <strong>Route:</strong> {group.route}
                                            </div>
                                        )}
                                        {group.pickupLocation && (
                                            <div className="detail-item">
                                                <strong>Pickup:</strong> {group.pickupLocation}
                                            </div>
                                        )}
                                        {group.dropoffLocation && (
                                            <div className="detail-item">
                                                <strong>Drop-off:</strong> {group.dropoffLocation}
                                            </div>
                                        )}
                                        {group.schedule && (
                                            <div className="detail-item">
                                                <FaCalendar className="me-2" />
                                                <strong>Schedule:</strong> {group.schedule}
                                            </div>
                                        )}
                                        {group.vehicleType && (
                                            <div className="detail-item">
                                                <FaCar className="me-2" />
                                                <strong>Vehicle:</strong> {group.vehicleType}
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="detail-item">
                                    <FaUsers className="me-2" />
                                    <strong>Members:</strong> {group.members?.length || 0}/{group.maxMembers}
                                </div>

                                <div className="detail-item">
                                    <strong>Created:</strong> {formatDate(group.createdAt)}
                                </div>

                                <div className="detail-item">
                                    <strong>Last Activity:</strong> {formatDate(group.lastActivity || group.updatedAt)}
                                </div>
                            </div>
                        </div>

                        {/* Creator & Members */}
                        <div className="col-md-6">
                            <h5>Creator</h5>
                            <div className="creator-card mb-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="creator-avatar bg-primary text-white">
                                        <FaUser className="fs-4" />
                                    </div>
                                    <div>
                                        <h6 className="mb-1">{group.creatorName}</h6>
                                        <p className="text-muted mb-0">{group.creator?.email}</p>
                                        <span className="badge bg-info">Creator</span>
                                    </div>
                                </div>
                            </div>

                            <h5>Members</h5>
                            <div className="members-list">
                                {group.members?.map((member, index) => (
                                    <div key={index} className="member-card">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="member-avatar">
                                                    <FaUser />
                                                </div>
                                                <div>
                                                    <h6 className="mb-0">{member.name}</h6>
                                                    <small className="text-muted">{member.email}</small>
                                                </div>
                                            </div>
                                            <div>
                                                {member.role === 'admin' && (
                                                    <span className="badge bg-success">Admin</span>
                                                )}
                                                <small className="text-muted d-block">
                                                    Joined: {formatDate(member.joinedAt)}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Join Requests (for admins only) */}
                    {isGroupAdmin && group.joinRequests?.length > 0 && (
                        <div className="mb-4">
                            <h5>
                                <FaEnvelope className="me-2" />
                                Pending Join Requests ({group.joinRequests.filter(r => r.status === 'pending').length})
                            </h5>
                            <div className="requests-list">
                                {group.joinRequests
                                    .filter(r => r.status === 'pending')
                                    .map((request, index) => (
                                        <div key={index} className="request-card">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-1">{request.name}</h6>
                                                    <p className="text-muted mb-1 small">{request.user?.email}</p>
                                                    {request.message && (
                                                        <p className="mb-0 small">"{request.message}"</p>
                                                    )}
                                                    <small className="text-muted">
                                                        Requested: {formatDate(request.requestedAt)}
                                                    </small>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleRequestAction(request._id, 'approved')}
                                                        disabled={processing}
                                                    >
                                                        <FaCheck className="me-1" /> Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleRequestAction(request._id, 'rejected')}
                                                        disabled={processing}
                                                    >
                                                        <FaTimes className="me-1" /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Actions */}
                    {isGroupAdmin && (
                        <div className="admin-actions mt-4">
                            <h5>
                                <FaCog className="me-2" />
                                Admin Actions
                            </h5>
                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-primary">
                                    Edit Group
                                </button>
                                <button className="btn btn-outline-warning">
                                    Manage Members
                                </button>
                                {group.status === 'active' && (
                                    <button className="btn btn-outline-danger">
                                        Archive Group
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="card-footer">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <small className="text-muted">
                                Group ID: {group._id}
                            </small>
                        </div>
                        <div>
                            {group.createdFromPost && (
                                <Link
                                    to={`/find-my-group/${group.createdFromPost}`}
                                    className="btn btn-sm btn-outline-info"
                                >
                                    View Original Post
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Join Request Modal */}
            {showJoinModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Request to Join Group</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowJoinModal(false)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <p>Send a message to the group admins about why you want to join:</p>
                            <textarea
                                value={joinMessage}
                                onChange={(e) => setJoinMessage(e.target.value)}
                                className="form-control"
                                rows="4"
                                placeholder={`Hi, I'd like to join your ${group.type === 'study' ? 'study group' : 'transport'}...`}
                            />
                            {group.privacy === 'private' && (
                                <div className="alert alert-info mt-3">
                                    <FaLock className="me-2" />
                                    This is a private group. Your request will need to be approved by an admin.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowJoinModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleJoinRequest}
                                disabled={processing || !joinMessage.trim()}
                            >
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <FaEnvelope className="me-2" /> Send Request
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupDetail;