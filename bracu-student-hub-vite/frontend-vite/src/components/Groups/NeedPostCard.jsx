import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaClock, FaUsers, FaBook, FaCar, FaGenderless, FaFemale, FaMale, FaCheck } from 'react-icons/fa';
import apiService from '../../services/api';
import authService from '../../services/auth';

function NeedPostCard({ post, onInterestExpressed }) {
    const [showInterestModal, setShowInterestModal] = useState(false);
    const [interestMessage, setInterestMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
    const [isExpressingInterest, setIsExpressingInterest] = useState(false);

    const user = authService.getCurrentUser();
    const isAdmin = user && (user.role === 'admin' || user.isAdmin);
    const isOwnPost = post.createdBy?._id === user?.id || post.createdBy === user?.id;

    useEffect(() => {
        if (post && user) {
            const alreadyInterested = post.interestedUsers?.some(
                interest => interest.userId?.toString() === user.id?.toString() ||
                    interest.userId === user.id
            );
            setHasExpressedInterest(alreadyInterested);
        }
    }, [post, user]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / 3600000);
        const diffDays = Math.floor((now - date) / 86400000);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const handleExpressInterest = async () => {
        if (!interestMessage.trim()) {
            setError('Please add a message to your interest request');
            return;
        }

        if (hasExpressedInterest) {
            setError('You have already expressed interest in this post');
            return;
        }

        try {
            setIsExpressingInterest(true);
            setError('');
            const response = await apiService.expressInterest(post._id, interestMessage);

            if (response.success) {
                setSuccess('Interest expressed successfully!');
                setHasExpressedInterest(true);

                setTimeout(() => {
                    setShowInterestModal(false);
                    setSuccess('');
                    setInterestMessage('');
                    if (onInterestExpressed) onInterestExpressed();
                }, 2000);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to express interest';
            setError(errorMsg);

            if (errorMsg.includes('already expressed interest')) {
                setHasExpressedInterest(true);
            }
        } finally {
            setIsExpressingInterest(false);
        }
    };

    const getGenderIcon = () => {
        switch (post.genderPreference) {
            case 'female-only': return <FaFemale title="Female only" />;
            case 'male-only': return <FaMale title="Male only" />;
            default: return <FaGenderless title="Any gender" />;
        }
    };

    const getStatusBadge = () => {
        const statusConfig = {
            'open': { color: 'var(--success)', label: 'Open', icon: '🔓' },
            'closed': { color: 'var(--gray)', label: 'Closed', icon: '🔒' },
            'fulfilled': { color: 'var(--primary)', label: 'Fulfilled', icon: '✅' }
        };

        const config = statusConfig[post.status] || statusConfig.open;
        return (
            <span className="status-badge" style={{ backgroundColor: config.color }}>
                {config.icon} {config.label}
            </span>
        );
    };

    return (
        <>
            <div className="card post-card">
                <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            {post.type === 'study' ? <FaBook className="text-primary" /> : <FaCar className="text-success" />}
                            <span className="badge bg-primary">
                                {post.type === 'study' ? 'Study Group' : 'Transport'}
                            </span>
                            {getStatusBadge()}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted">
                                <FaClock /> {formatDate(post.createdAt)}
                            </span>
                            <span className="text-muted">
                                {getGenderIcon()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <h5 className="card-title">{post.title}</h5>
                    <p className="card-text text-muted">{post.description}</p>

                    <div className="post-details mb-3">
                        {post.type === 'study' ? (
                            <>
                                {post.subject && (
                                    <div className="detail-item">
                                        <strong>Subject:</strong> {post.subject}
                                    </div>
                                )}
                                {post.courseCode && (
                                    <div className="detail-item">
                                        <strong>Course:</strong> {post.courseCode}
                                    </div>
                                )}
                                {post.meetingFrequency && (
                                    <div className="detail-item">
                                        <strong>Frequency:</strong> {post.meetingFrequency}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {post.route && (
                                    <div className="detail-item">
                                        <strong>Route:</strong> {post.route}
                                    </div>
                                )}
                                {post.vehicleType && post.vehicleType !== 'any' && (
                                    <div className="detail-item">
                                        <strong>Vehicle:</strong> {post.vehicleType}
                                    </div>
                                )}
                                {post.schedule && (
                                    <div className="detail-item">
                                        <strong>Schedule:</strong> {post.schedule}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {post.interestedUsers && post.interestedUsers.length > 0 && (
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <FaUsers className="text-primary" />
                            <small className="text-muted">{post.interestedUsers.length} interested</small>
                        </div>
                    )}
                </div>

                <div className="card-footer">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <FaUser className="text-secondary" />
                            <small>{post.createdByName || 'Anonymous'}</small>
                        </div>

                        <div className="d-flex gap-2">
                            {isAdmin ? (
                                <Link to={`/find-my-group/${post._id}`} className="btn btn-sm btn-outline-primary">
                                    View Details
                                </Link>
                            ) : post.status === 'open' && !isOwnPost ? (
                                <>
                                    <button
                                        className={`btn btn-sm ${hasExpressedInterest ? 'btn-success' : 'btn-primary'}`}
                                        onClick={() => setShowInterestModal(true)}
                                        disabled={hasExpressedInterest || isExpressingInterest}
                                    >
                                        {hasExpressedInterest ? (
                                            <>
                                                <FaCheck className="me-1" /> Interested
                                            </>
                                        ) : isExpressingInterest ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                Sending...
                                            </>
                                        ) : (
                                            'Express Interest'
                                        )}
                                    </button>
                                    <Link to={`/find-my-group/${post._id}`} className="btn btn-sm btn-outline-primary">
                                        Details
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {isOwnPost ? (
                                        <span className="badge bg-info">Your Post</span>
                                    ) : (
                                        <span className="badge bg-secondary">Closed</span>
                                    )}
                                    <Link to={`/find-my-group/${post._id}`} className="btn btn-sm btn-outline-primary">
                                        View
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Interest Modal */}
            {showInterestModal && !isAdmin && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Express Interest</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowInterestModal(false)}
                                disabled={isExpressingInterest}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <p>Why are you interested in this {post.type} group?</p>
                            <textarea
                                value={interestMessage}
                                onChange={(e) => setInterestMessage(e.target.value)}
                                placeholder="Tell the creator about yourself and why you're interested..."
                                rows={4}
                                className="form-control"
                                disabled={isExpressingInterest}
                            />
                            {error && <div className="alert alert-danger mt-2">{error}</div>}
                            {success && <div className="alert alert-success mt-2">{success}</div>}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowInterestModal(false)}
                                disabled={isExpressingInterest}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleExpressInterest}
                                disabled={isExpressingInterest || !interestMessage.trim()}
                            >
                                {isExpressingInterest ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Sending...
                                    </>
                                ) : (
                                    'Send Interest'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default NeedPostCard;