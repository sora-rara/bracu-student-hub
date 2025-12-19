import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaArrowLeft, FaBook, FaCar, FaUsers, FaUser, FaClock,
    FaEnvelope, FaCheck, FaTimes, FaGenderless, FaFemale,
    FaMale, FaUserPlus, FaUserMinus, FaPlus, FaCheckCircle, FaTimesCircle,
    FaEye, FaEyeSlash, FaLock
} from 'react-icons/fa';
import apiService from '../../services/api';
import authService from '../../services/auth';

function NeedPostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [showInterestModal, setShowInterestModal] = useState(false);
    const [interestMessage, setInterestMessage] = useState('');
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [addingMembers, setAddingMembers] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [userGroups, setUserGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [closingPost, setClosingPost] = useState(false);
    const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
    const [isExpressingInterest, setIsExpressingInterest] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    // ✅ NEW: State to show/hide interested users
    const [showInterestedUsers, setShowInterestedUsers] = useState(false);

    const user = authService.getCurrentUser();
    const isAdmin = user && (user.role === 'admin' || user.isAdmin);
    const isCreator = post?.createdBy?._id === user?.id || post?.createdBy === user?.id;

    useEffect(() => {
        fetchPostDetails();
        if (user) {
            fetchUserGroups();
        }
    }, [id]);

    useEffect(() => {
        if (post && user) {
            const alreadyInterested = post.interestedUsers?.some(
                interest => interest.userId?.toString() === user.id?.toString()
            );
            setHasExpressedInterest(alreadyInterested);
        }
    }, [post, user]);

    const fetchPostDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getNeedPost(id);

            if (response.success) {
                setPost(response.data);
                console.log('Post details:', response.data);
            }
        } catch (err) {
            setError('Failed to load post details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserGroups = async () => {
        try {
            setLoadingGroups(true);
            const response = await apiService.getUserGroups();
            if (response.success) {
                console.log('User groups fetched:', response.data);
                setUserGroups(response.data || []);
            }
        } catch (err) {
            console.error('Error fetching user groups:', err);
        } finally {
            setLoadingGroups(false);
        }
    };

    // ✅ FIXED: Get groups created from this post
    const getGroupsFromThisPost = () => {
        if (!userGroups.length) return [];

        // Check different possible structures
        return userGroups.filter(group => {
            // Check various ways the post might be referenced
            return (
                (group.createdFromPost && group.createdFromPost.toString() === id) ||
                (group.originalPost && group.originalPost.toString() === id) ||
                (group.postId && group.postId.toString() === id) ||
                (group.post && group.post.toString() === id)
            );
        });
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setError('Group name is required');
            return;
        }

        try {
            setCreatingGroup(true);
            setError('');

            const groupData = {
                groupName: groupName.trim(),
                description: groupDescription.trim() || undefined,
                maxMembers: 5
            };

            console.log('Creating group from post:', id, groupData);
            const response = await apiService.createGroupFromPost(id, groupData);

            if (response.success) {
                alert('✅ Group created successfully!');
                setShowCreateGroupModal(false);
                setGroupName('');
                setGroupDescription('');
                fetchUserGroups(); // Refresh groups
                fetchPostDetails(); // Refresh post
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Failed to create group. Please try again.';
            setError(errorMessage);
            console.error('Create group error:', err);
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) {
            setError('Please select users to add');
            return;
        }

        if (!selectedGroup) {
            setError('Please select a group first');
            return;
        }

        try {
            setAddingMembers(true);
            setError('');

            console.log('Adding members to group:', {
                groupId: selectedGroup._id,
                userIds: selectedUsers
            });

            const response = await apiService.addMembersToGroup(selectedGroup._id, selectedUsers);

            if (response.success) {
                alert(`✅ ${selectedUsers.length} member${selectedUsers.length !== 1 ? 's' : ''} added successfully!`);
                setShowAddMembersModal(false);
                setSelectedUsers([]);
                setSelectedGroup(null);

                // Refresh all data
                fetchPostDetails();
                fetchUserGroups();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to add members';
            setError(errorMsg);
            console.error('Add members error:', err);
        } finally {
            setAddingMembers(false);
        }
    };

    const handleClosePost = async () => {
        if (!window.confirm('Are you sure you want to close this post? It will no longer accept new interests.')) {
            return;
        }

        try {
            setClosingPost(true);
            const response = await apiService.closeNeedPost(id);

            if (response.success) {
                alert('Post closed successfully');
                fetchPostDetails(); // Refresh the post
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to close post';
            setError(errorMsg);
        } finally {
            setClosingPost(false);
        }
    };

    // ✅ ADD THIS MISSING FUNCTION
    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
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

            console.log('Sending interest for post:', post._id);
            const response = await apiService.expressInterest(id, interestMessage);

            if (response.success) {
                setHasExpressedInterest(true);
                alert('Interest expressed successfully! The post creator has been notified.');
                setShowInterestModal(false);
                setInterestMessage('');
                fetchPostDetails();
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Failed to express interest';

            if (errorMessage.includes('already expressed interest')) {
                setHasExpressedInterest(true);
                setError('You have already expressed interest in this post');
            } else {
                setError(errorMessage);
            }

            console.error('Express interest error details:', {
                error: err,
                response: err.response?.data
            });
        } finally {
            setIsExpressingInterest(false);
        }
    };

    const getGenderIcon = () => {
        switch (post?.genderPreference) {
            case 'female-only': return <FaFemale title="Female only" className="text-pink" />;
            case 'male-only': return <FaMale title="Male only" className="text-blue" />;
            default: return <FaGenderless title="Any gender" className="text-secondary" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading post details...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">
                    Post not found
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/find-my-group')}>
                    <FaArrowLeft className="me-2" /> Back to Posts
                </button>
            </div>
        );
    }

    const groupsFromPost = getGroupsFromThisPost();
    const pendingInterests = post.interestedUsers?.filter(i => i.status === 'pending') || [];
    const approvedInterests = post.interestedUsers?.filter(i => i.status === 'approved') || [];
    const rejectedInterests = post.interestedUsers?.filter(i => i.status === 'rejected') || [];

    console.log('Debug info:', {
        isCreator,
        postId: id,
        userGroupsCount: userGroups.length,
        groupsFromPostCount: groupsFromPost.length,
        groupsFromPost,
        pendingInterestsCount: pendingInterests.length
    });

    return (
        <div className="container mt-4">
            {/* Back Button */}
            <div className="mb-4">
                <button className="btn btn-outline-secondary" onClick={() => navigate('/find-my-group')}>
                    <FaArrowLeft className="me-2" /> Back to Posts
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {/* Main Post Card */}
            <div className="card mb-4">
                <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            {post.type === 'study' ? (
                                <FaBook className="display-6 text-primary" />
                            ) : (
                                <FaCar className="display-6 text-success" />
                            )}
                            <div>
                                <h3 className="mb-0">{post.title}</h3>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                    <span className={`badge ${post.status === 'open' ? 'bg-success' :
                                        post.status === 'fulfilled' ? 'bg-primary' : 'bg-secondary'}`}>
                                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                    </span>
                                    <span className="badge bg-primary">
                                        {post.type === 'study' ? 'Study Group' : 'Transport'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            {/* 🔐 ONLY SHOW THESE TO NON-CREATORS */}
                            {!isCreator && post.status === 'open' && (
                                <button
                                    className={`btn ${hasExpressedInterest ? 'btn-success' : 'btn-primary'}`}
                                    onClick={() => setShowInterestModal(true)}
                                    disabled={hasExpressedInterest || isExpressingInterest}
                                >
                                    {isExpressingInterest ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Sending...
                                        </>
                                    ) : hasExpressedInterest ? (
                                        <>
                                            <FaCheck className="me-2" /> Interest Expressed
                                        </>
                                    ) : (
                                        <>
                                            <FaEnvelope className="me-2" /> Express Interest
                                        </>
                                    )}
                                </button>
                            )}

                            {/* 🔐 ONLY CREATOR CAN SEE THESE */}
                            {isCreator && post.status === 'open' && (
                                <>
                                    {/* Show "Create Group" only if no groups exist yet */}
                                    {groupsFromPost.length === 0 ? (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => setShowCreateGroupModal(true)}
                                        >
                                            <FaUsers className="me-2" /> Create Group
                                        </button>
                                    ) : (
                                        <span className="badge bg-success">
                                            <FaCheck className="me-1" /> Group Created
                                        </span>
                                    )}

                                    {/* ✅ FIXED: Always show Add Members button to creator (not just when pending interests exist) */}
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => setShowAddMembersModal(true)}
                                        disabled={!pendingInterests || pendingInterests.length === 0}
                                    >
                                        <FaUserPlus className="me-2" />
                                        {pendingInterests && pendingInterests.length > 0
                                            ? `Add Members (${pendingInterests.length})`
                                            : 'Add Members (0)'
                                        }
                                    </button>

                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={handleClosePost}
                                        disabled={closingPost}
                                    >
                                        {closingPost ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Closing...
                                            </>
                                        ) : (
                                            'Close Post'
                                        )}
                                    </button>
                                </>
                            )}

                            {/* 🔐 Admins can view but not interact */}
                            {isAdmin && (
                                <span className="badge bg-info">
                                    <FaLock className="me-1" /> Admin View
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    {/* Description */}
                    <div className="mb-4">
                        <h5>Description</h5>
                        <p className="text-muted">{post.description}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <h5>Post Details</h5>
                            <div className="details-list">
                                {post.type === 'study' ? (
                                    <>
                                        {post.subject && (
                                            <div className="detail-item">
                                                <strong>Subject:</strong> {post.subject}
                                            </div>
                                        )}
                                        {post.courseCode && (
                                            <div className="detail-item">
                                                <strong>Course Code:</strong> {post.courseCode}
                                            </div>
                                        )}
                                        {post.meetingFrequency && (
                                            <div className="detail-item">
                                                <strong>Meeting Frequency:</strong> {post.meetingFrequency}
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
                                                <strong>Vehicle Type:</strong> {post.vehicleType}
                                            </div>
                                        )}
                                        {post.schedule && (
                                            <div className="detail-item">
                                                <strong>Schedule:</strong> {post.schedule}
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="detail-item">
                                    <strong>Gender Preference:</strong>
                                    {post.genderPreference === 'female-only' ? 'Female only' :
                                        post.genderPreference === 'male-only' ? 'Male only' : 'Any'}
                                </div>
                                <div className="detail-item">
                                    <strong>Looking for:</strong> {post.maxMembers - 1} more people
                                </div>
                                <div className="detail-item">
                                    <strong>Created:</strong> {formatDate(post.createdAt)}
                                </div>
                            </div>
                        </div>

                        {/* Creator Info */}
                        <div className="col-md-6">
                            <h5>Created By</h5>
                            <div className="creator-card">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="creator-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                        <FaUser className="fs-4" />
                                    </div>
                                    <div>
                                        <h6 className="mb-1">{post.createdByName}</h6>
                                        <p className="text-muted mb-0">{post.createdByEmail}</p>
                                        <small className="text-muted">
                                            {post.createdByRole === 'admin' ? 'Administrator' : 'Student'}
                                        </small>
                                    </div>
                                </div>
                                {isCreator && (
                                    <div className="alert alert-info">
                                        <FaUser className="me-2" />
                                        <strong>You created this post.</strong>
                                        {post.status === 'open' ?
                                            ' You can create a group and add members from interested users.' :
                                            ' This post is no longer accepting new interests.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Groups Created from This Post */}
                    {groupsFromPost.length > 0 && (
                        <div className="mb-4">
                            <h5>
                                <FaUsers className="me-2" />
                                Groups Created from This Post
                            </h5>
                            <div className="row">
                                {groupsFromPost.map(group => (
                                    <div key={group._id} className="col-md-6 mb-3">
                                        <div className="card h-100">
                                            <div className="card-body">
                                                <h6 className="card-title">{group.name}</h6>
                                                <p className="card-text small text-muted">
                                                    {group.description?.substring(0, 100)}...
                                                </p>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className={`badge ${group.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                                            {group.status}
                                                        </span>
                                                        <span className="badge bg-info ms-2">
                                                            {group.members?.length || 0}/{group.maxMembers} members
                                                        </span>
                                                    </div>
                                                    <Link to={`/groups/${group._id}`} className="btn btn-sm btn-outline-primary">
                                                        View Group
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 🔐 INTERESTED USERS SECTION - ONLY VISIBLE TO CREATOR */}
                    {isCreator && (pendingInterests.length > 0 || approvedInterests.length > 0 || rejectedInterests.length > 0) && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">
                                    <FaLock className="me-2" />
                                    Interested Users (Private - Only You Can See)
                                </h5>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setShowInterestedUsers(!showInterestedUsers)}
                                >
                                    {showInterestedUsers ? (
                                        <>
                                            <FaEyeSlash className="me-1" /> Hide
                                        </>
                                    ) : (
                                        <>
                                            <FaEye className="me-1" /> Show ({pendingInterests.length + approvedInterests.length + rejectedInterests.length})
                                        </>
                                    )}
                                </button>
                            </div>

                            {showInterestedUsers && (
                                <>
                                    {/* Pending Interests */}
                                    {pendingInterests.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="text-warning">Pending ({pendingInterests.length})</h6>
                                            <div className="list-group">
                                                {pendingInterests.map((interest, index) => (
                                                    <div key={index} className="list-group-item">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <strong>{interest.name}</strong>
                                                                <div className="text-muted small">{interest.email}</div>
                                                                {interest.message && (
                                                                    <div className="small mt-1 text-muted">
                                                                        <em>"{interest.message}"</em>
                                                                    </div>
                                                                )}
                                                                <div className="small text-muted mt-1">
                                                                    Expressed: {formatDate(interest.createdAt || post.createdAt)}
                                                                </div>
                                                            </div>
                                                            <div className="d-flex gap-2">
                                                                <button
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => {
                                                                        setSelectedUsers([interest.userId]);
                                                                        setShowAddMembersModal(true);
                                                                    }}
                                                                    title="Add to Group"
                                                                >
                                                                    <FaCheckCircle /> Add
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Approved Interests */}
                                    {approvedInterests.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="text-success">Approved ({approvedInterests.length})</h6>
                                            <div className="list-group">
                                                {approvedInterests.map((interest, index) => (
                                                    <div key={index} className="list-group-item list-group-item-success">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <strong>{interest.name}</strong>
                                                                <div className="text-muted small">{interest.email}</div>
                                                            </div>
                                                            <span className="badge bg-success">
                                                                <FaCheckCircle /> Added to Group
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejected Interests */}
                                    {rejectedInterests.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="text-danger">Rejected ({rejectedInterests.length})</h6>
                                            <div className="list-group">
                                                {rejectedInterests.map((interest, index) => (
                                                    <div key={index} className="list-group-item list-group-item-danger">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <strong>{interest.name}</strong>
                                                                <div className="text-muted small">{interest.email}</div>
                                                            </div>
                                                            <span className="badge bg-danger">
                                                                <FaTimesCircle /> Rejected
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* 🔐 Show count only to non-creators */}
                    {!isCreator && post.interestedUsers && post.interestedUsers.length > 0 && (
                        <div className="alert alert-secondary">
                            <FaLock className="me-2" />
                            <strong>{post.interestedUsers.length} person(s)</strong> have expressed interest in this post.
                            <div className="small mt-1">Only the post creator can see who they are.</div>
                        </div>
                    )}
                </div>

                <div className="card-footer bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                            <FaClock className="me-1" />
                            Last updated: {formatDate(post.updatedAt)}
                        </small>
                        {post.status === 'open' && (
                            <small className="text-success">
                                <FaEnvelope className="me-1" />
                                Accepting interest requests ({post.interestedUsers?.length || 0} total)
                            </small>
                        )}
                    </div>
                </div>
            </div>

            {/* Express Interest Modal */}
            {showInterestModal && !hasExpressedInterest && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
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
                                <p>Send a message to <strong>{post.createdByName}</strong> about why you're interested:</p>
                                <textarea
                                    value={interestMessage}
                                    onChange={(e) => setInterestMessage(e.target.value)}
                                    className="form-control"
                                    rows="4"
                                    placeholder={`Hi, I'm interested in your ${post.type === 'study' ? 'study group' : 'transport'} request...`}
                                    disabled={isExpressingInterest}
                                />
                                {error && (
                                    <div className="alert alert-danger mt-2">{error}</div>
                                )}
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
                                        <>
                                            <FaEnvelope className="me-2" /> Send Interest
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateGroupModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create Group from Post</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowCreateGroupModal(false)}
                                    disabled={creatingGroup}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Group Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder={`${post.type === 'study' ? 'Study' : 'Transport'} Group for ${post.title}`}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Description (Optional)</label>
                                    <textarea
                                        className="form-control"
                                        value={groupDescription}
                                        onChange={(e) => setGroupDescription(e.target.value)}
                                        rows="3"
                                        placeholder="Additional details about the group..."
                                    />
                                </div>

                                <div className="alert alert-info">
                                    <FaUsers className="me-2" />
                                    This will create a {post.type === 'transport' ? 'private' : 'public'} group.
                                    {pendingInterests.length > 0 && (
                                        <span> {pendingInterests.length} interested users will be notified.</span>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateGroupModal(false)}
                                    disabled={creatingGroup}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleCreateGroup}
                                    disabled={creatingGroup || !groupName.trim()}
                                >
                                    {creatingGroup ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck className="me-2" /> Create Group
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Members Modal */}
            {showAddMembersModal && isCreator && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Members to Group</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowAddMembersModal(false);
                                        setSelectedUsers([]);
                                        setSelectedGroup(null);
                                    }}
                                    disabled={addingMembers}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* 🟢 ADDED: DEBUG INFO WITH GROUP TEST BUTTONS */}
                                {groupsFromPost.length > 0 && (
                                    <div className="alert alert-success mb-3">
                                        <strong>✅ Groups found:</strong>
                                        <ul className="mb-0">
                                            {groupsFromPost.map(g => (
                                                <li key={g._id} className="mb-2 d-flex align-items-center">
                                                    <span className="me-2">{g.name} (ID: {g._id})</span>
                                                    <button
                                                        className="btn btn-sm btn-info ms-2"
                                                        onClick={() => {
                                                            console.log('Testing group:', g._id);
                                                            apiService.getGroup(g._id)
                                                                .then(res => console.log('Group API response:', res))
                                                                .catch(err => console.error('Group API error:', err));
                                                        }}
                                                    >
                                                        Test API
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Debug info - remove in production */}
                                <div className="alert alert-info small mb-3">
                                    <strong>Debug Info:</strong>
                                    <div>Groups found: {groupsFromPost.length}</div>
                                    <div>Pending interests: {pendingInterests.length}</div>
                                </div>

                                {/* Group Selection */}
                                <div className="mb-4">
                                    <h6>1. Select a Group to Add Members To</h6>
                                    {loadingGroups ? (
                                        <div className="text-center">
                                            <div className="spinner-border spinner-border-sm"></div>
                                            <p className="mt-2">Loading groups...</p>
                                        </div>
                                    ) : groupsFromPost.length === 0 ? (
                                        <div className="alert alert-warning">
                                            <FaUsers className="me-2" />
                                            No groups found from this post. Please create a group first.
                                            <button
                                                className="btn btn-sm btn-success mt-2"
                                                onClick={() => {
                                                    setShowAddMembersModal(false);
                                                    setShowCreateGroupModal(true);
                                                }}
                                            >
                                                Create Group First
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="list-group">
                                            {groupsFromPost.map(group => (
                                                <div
                                                    key={group._id}
                                                    className={`list-group-item list-group-item-action ${selectedGroup?._id === group._id ? 'active' : ''}`}
                                                    onClick={() => setSelectedGroup(group)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <strong>{group.name}</strong>
                                                            <div className="small">
                                                                {group.members?.length || 0}/{group.maxMembers} members • {group.type}
                                                            </div>
                                                            {group.description && (
                                                                <div className="small text-muted mt-1">
                                                                    {group.description.substring(0, 100)}...
                                                                </div>
                                                            )}
                                                        </div>
                                                        {selectedGroup?._id === group._id && <FaCheck className="text-success" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* User Selection */}
                                {selectedGroup && pendingInterests.length > 0 && (
                                    <div>
                                        <h6>2. Select Users to Add (Pending: {pendingInterests.length})</h6>
                                        <div className="list-group">
                                            {pendingInterests.map((interest, index) => {
                                                const isAlreadyMember = selectedGroup.members?.some(
                                                    member => {
                                                        const memberId = member.user?._id || member.user;
                                                        return memberId.toString() === interest.userId.toString();
                                                    }
                                                );

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`list-group-item list-group-item-action ${selectedUsers.includes(interest.userId) ? 'active' : ''} ${isAlreadyMember ? 'disabled' : ''}`}
                                                        onClick={() => {
                                                            if (!isAlreadyMember) {
                                                                toggleUserSelection(interest.userId);
                                                            }
                                                        }}
                                                        style={{
                                                            cursor: isAlreadyMember ? 'not-allowed' : 'pointer',
                                                            opacity: isAlreadyMember ? 0.6 : 1
                                                        }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <strong>{interest.name}</strong>
                                                                <div className="small text-muted">{interest.email}</div>
                                                                {interest.message && (
                                                                    <div className="small mt-1">
                                                                        <em>"{interest.message}"</em>
                                                                    </div>
                                                                )}
                                                                {isAlreadyMember && (
                                                                    <span className="badge bg-secondary mt-1">Already in group</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                {selectedUsers.includes(interest.userId) && <FaCheck className="text-success" />}
                                                                {isAlreadyMember && <FaCheck className="text-muted" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {selectedGroup && pendingInterests.length === 0 && (
                                    <div className="alert alert-info">
                                        No pending interest requests to add.
                                    </div>
                                )}

                                {/* Selected Summary */}
                                {selectedGroup && selectedUsers.length > 0 && (
                                    <div className="alert alert-success mt-3">
                                        <FaUserPlus className="me-2" />
                                        <strong>Ready to add {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}</strong>
                                        <div className="mt-1">
                                            Group: <strong>"{selectedGroup.name}"</strong>
                                        </div>
                                        <div className="mt-2">
                                            Selected users will be added and their interest status will be updated to "approved".
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowAddMembersModal(false);
                                        setSelectedUsers([]);
                                        setSelectedGroup(null);
                                    }}
                                    disabled={addingMembers}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleAddMembers}
                                    disabled={addingMembers || !selectedGroup || selectedUsers.length === 0}
                                >
                                    {addingMembers ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <FaUserPlus className="me-2" />
                                            Add {selectedUsers.length} Member{selectedUsers.length > 1 ? 's' : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NeedPostDetail;