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

    // NEW: State to show/hide interested users
    const [showInterestedUsers, setShowInterestedUsers] = useState(false);

    const user = authService.getCurrentUser();
    const isAdmin = user && (user.role === 'admin' || user.isAdmin);
    const isCreator = post?.createdBy?._id === user?.id || post?.createdBy === user?.id;

    // Check if user session is valid
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await apiService.checkAuth();
            } catch (error) {
                if (error.status === 401) {
                    console.log('Session expired, redirecting to login');
                    localStorage.removeItem('user');
                    navigate('/login', {
                        state: { from: `/find-my-group/${id}` }
                    });
                }
            }
        };

        if (user) {
            checkAuth();
        }
    }, [user, navigate, id]);

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

    // ✅ Get groups created from this post
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
        // First check if user is authenticated
        if (!user) {
            setError('You must be logged in to express interest. Redirecting to login...');
            setTimeout(() => {
                navigate('/login', {
                    state: { from: `/find-my-group/${id}` }
                });
            }, 2000);
            return;
        }

        // 🔐 PREVENT ADMINS FROM EXPRESSING INTEREST
        if (isAdmin) {
            setError('Admins cannot express interest in posts.');
            return;
        }

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
            console.log('Current user:', user);

            // Make sure we have a valid session
            const response = await apiService.expressInterest(id, interestMessage);

            if (response.success) {
                setHasExpressedInterest(true);
                alert('Interest expressed successfully! The post creator has been notified.');
                setShowInterestModal(false);
                setInterestMessage('');
                fetchPostDetails();
            }
        } catch (err) {
            console.error('Express interest error:', err);

            // Handle 401 specifically
            if (err.status === 401 || err.message?.includes('Authentication') || err.message?.includes('Unauthorized')) {
                setError('Your session has expired. Please log in again.');

                // Clear local storage and redirect
                setTimeout(() => {
                    localStorage.removeItem('user');
                    navigate('/login', {
                        state: {
                            from: `/find-my-group/${id}`,
                            message: 'Session expired. Please log in again.'
                        }
                    });
                }, 2000);
                return;
            }

            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Failed to express interest';

            if (errorMessage.includes('already expressed interest')) {
                setHasExpressedInterest(true);
                setError('You have already expressed interest in this post');
            } else {
                setError(errorMessage);
            }
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
                            {/* 🔐 ONLY SHOW THESE TO NON-CREATORS AND NON-ADMINS */}
                            {!isCreator && !isAdmin && post.status === 'open' && (
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

                            {/* 🔐 ONLY CREATOR CAN SEE THESE (NOT ADMIN) */}
                            {isCreator && !isAdmin && post.status === 'open' && (
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

                                    {/* Always show Add Members button to creator (not just when pending interests exist) */}
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
                                    <FaLock className="me-1" /> Admin View (Read Only)
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
                                {isCreator && !isAdmin && (
                                    <div className="alert alert-info">
                                        <FaUser className="me-2" />
                                        <strong>You created this post.</strong>
                                        {post.status === 'open' ?
                                            ' You can create a group and add members from interested users.' :
                                            ' This post is no longer accepting new interests.'}
                                    </div>
                                )}
                                {isAdmin && (
                                    <div className="alert alert-warning">
                                        <FaLock className="me-2" />
                                        <strong>Admin View Only.</strong> You cannot interact with this post as an administrator.
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

                    {/* 🔐 INTERESTED USERS SECTION - ONLY VISIBLE TO CREATOR (NOT ADMIN) */}
                    {isCreator && !isAdmin && (pendingInterests.length > 0 || approvedInterests.length > 0 || rejectedInterests.length > 0) && (
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
                    {!isCreator && !isAdmin && post.interestedUsers && post.interestedUsers.length > 0 && (
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

            {/* Express Interest Modal - Only for non-admins */}
            {showInterestModal && !hasExpressedInterest && !isAdmin && (
                <div className="modal-overlay">
                    <div className="modal-content-wrapper">
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

            {/* Create Group Modal - Only for creators (not admins) */}
            {showCreateGroupModal && !isAdmin && (
                <div className="modal-overlay">
                    <div className="modal-content-wrapper">
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

            {/* Add Members Modal - Only for creators (not admins) */}
            {showAddMembersModal && isCreator && !isAdmin && (
                <div className="modal-overlay">
                    <div className="modal-lg-content-wrapper">
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
                                {/* Removed debug info and test buttons - too complex for users */}

                                {/* Group Selection - SIMPLIFIED */}
                                <div className="mb-4">
                                    <h6>Select Group</h6>
                                    {loadingGroups ? (
                                        <div className="text-center py-3">
                                            <div className="spinner-border spinner-border-sm text-primary"></div>
                                            <p className="mt-2 text-muted">Loading groups...</p>
                                        </div>
                                    ) : groupsFromPost.length === 0 ? (
                                        <div className="alert alert-warning">
                                            <FaUsers className="me-2" />
                                            No groups found from this post. Please create a group first.
                                            <button
                                                className="btn btn-sm btn-success w-100 mt-2"
                                                onClick={() => {
                                                    setShowAddMembersModal(false);
                                                    setShowCreateGroupModal(true);
                                                }}
                                            >
                                                Create Group First
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mb-3">
                                            <label className="form-label">Choose a group:</label>
                                            <select
                                                className="form-select"
                                                value={selectedGroup?._id || ''}
                                                onChange={(e) => {
                                                    const group = groupsFromPost.find(g => g._id === e.target.value);
                                                    setSelectedGroup(group);
                                                    setSelectedUsers([]); // Clear selection when group changes
                                                }}
                                            >
                                                <option value="">Select a group...</option>
                                                {groupsFromPost.map(group => (
                                                    <option key={group._id} value={group._id}>
                                                        {group.name} ({group.members?.length || 0}/{group.maxMembers} members)
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedGroup && (
                                                <div className="mt-2 small text-muted">
                                                    {selectedGroup.description && (
                                                        <div>{selectedGroup.description}</div>
                                                    )}
                                                    <div>
                                                        Type: {selectedGroup.type} •
                                                        Status: <span className={`badge ${selectedGroup.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                                            {selectedGroup.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* User Selection - SIMPLIFIED */}
                                {selectedGroup && pendingInterests.length > 0 && (
                                    <div className="mb-4">
                                        <h6>Select Users to Add ({pendingInterests.length} available)</h6>
                                        <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {pendingInterests.map((interest, index) => {
                                                const isAlreadyMember = selectedGroup.members?.some(
                                                    member => {
                                                        const memberId = member.user?._id || member.user;
                                                        return memberId.toString() === interest.userId.toString();
                                                    }
                                                );

                                                const isSelected = selectedUsers.includes(interest.userId);

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`p-3 mb-2 border rounded ${isSelected ? 'border-primary bg-primary-light' : 'border-light'} ${isAlreadyMember ? 'opacity-50' : ''}`}
                                                        style={{
                                                            cursor: isAlreadyMember ? 'not-allowed' : 'pointer',
                                                            backgroundColor: isSelected ? 'rgba(13, 110, 253, 0.1)' : 'transparent'
                                                        }}
                                                        onClick={() => {
                                                            if (!isAlreadyMember) {
                                                                toggleUserSelection(interest.userId);
                                                            }
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex align-items-center">
                                                                    {isSelected && (
                                                                        <FaCheckCircle className="text-primary me-2" />
                                                                    )}
                                                                    <div>
                                                                        <strong>{interest.name}</strong>
                                                                        <div className="small text-muted">{interest.email}</div>
                                                                        {interest.message && (
                                                                            <div className="small mt-1">
                                                                                <em>"{interest.message.substring(0, 80)}..."</em>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                {isAlreadyMember ? (
                                                                    <span className="badge bg-secondary">Already member</span>
                                                                ) : (
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleUserSelection(interest.userId)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                )}
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
                                        <FaInfoCircle className="me-2" />
                                        No pending interest requests to add to this group.
                                    </div>
                                )}

                                {/* Selected Summary - SIMPLIFIED */}
                                {selectedGroup && selectedUsers.length > 0 && (
                                    <div className="alert alert-success">
                                        <div className="d-flex align-items-center">
                                            <FaUserPlus className="me-2 fs-5" />
                                            <div>
                                                <strong>Ready to add {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''}</strong>
                                                <div className="small">
                                                    Group: <strong>"{selectedGroup.name}"</strong>
                                                </div>
                                            </div>
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