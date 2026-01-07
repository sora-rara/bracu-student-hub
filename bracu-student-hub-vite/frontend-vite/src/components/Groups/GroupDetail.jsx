import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaArrowLeft, FaUsers, FaUser, FaUserPlus, FaSignOutAlt,
    FaBook, FaCar, FaEnvelope, FaCheck, FaTimes, FaCog,
    FaGlobe, FaLock, FaCalendar, FaMapMarker, FaEdit,
    FaTrash, FaHeart, FaPaperPlane
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
    const [showRequestModal, setShowRequestModal] = useState(null);

    // Messaging state
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showMessageSection, setShowMessageSection] = useState(true);

    // Edit/Delete message modals state
    const [showEditMessageModal, setShowEditMessageModal] = useState(false);
    const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [deleteMessageId, setDeleteMessageId] = useState(null);
    const [editMessageContent, setEditMessageContent] = useState('');

    // Edit group state
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState({
        name: '',
        description: '',
        privacy: 'public',
        maxMembers: 5
    });

    const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);

    const user = authService.getCurrentUser();
    const isAdminUser = user && (user.role === 'admin' || user.isAdmin);
    const isMember = group?.members?.some(m =>
        (m.user?._id?.toString() === user?.id?.toString()) ||
        (m.user?.toString() === user?.id?.toString())
    );
    const isGroupAdmin = group?.creator?._id?.toString() === user?.id?.toString();
    const hasPendingRequest = group?.joinRequests?.some(r =>
        r.user?._id === user?.id && r.status === 'pending'
    );

    useEffect(() => {
        fetchGroupDetails();
    }, [id]);

    useEffect(() => {
        if (group && user) {
            console.log('🔍 DEBUG Creator Check:', {
                groupCreator: group.creator,
                groupCreatorType: typeof group.creator,
                groupCreatorString: group.creator?.toString(),
                userId: user.id,
                userType: typeof user.id,
                userString: user.id?.toString(),
                isGroupAdmin: group.creator === user.id,
                isGroupAdminString: group.creator?.toString() === user.id?.toString(),
                isGroupAdminStrict: group.creator === user.id,
                isMember: group.members?.some(m => m.user?._id === user?.id),
                members: group.members
            });
        }
    }, [group, user]);

    const fetchGroupDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getGroup(id);
            console.log('📊 Group API Response:', {
                success: response.success,
                data: response.data,
                creator: response.data?.creator,
                creatorType: typeof response.data?.creator,
                user: user
            });

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

    const fetchMessages = async () => {
        try {
            console.log('📥 Fetching messages for group:', id);
            const response = await apiService.getGroupMessages(id, {
                page: 1,
                limit: 100
            });

            console.log('📥 Messages API response:', {
                success: response.success,
                messageCount: response.data?.messages?.length || 0,
                hasMessages: !!(response.data?.messages?.length > 0),
                messages: response.data?.messages
            });

            if (response.success && response.data?.messages) {
                const sortedMessages = [...response.data.messages].sort((a, b) =>
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                console.log(`✅ Loaded ${sortedMessages.length} messages`);
                setMessages(sortedMessages);
            } else {
                console.warn('⚠️ No messages found or API returned failure');
                setMessages([]);
            }
        } catch (err) {
            console.error('❌ Error fetching messages:', err);
            setError('Failed to load messages: ' + (err.message || 'Unknown error'));
        }
    };

    // Edit Message Handlers
    const handleEditMessageClick = (message) => {
        setEditingMessage(message);
        setEditMessageContent(message.content);
        setShowEditMessageModal(true);
        setError('');
    };

    const handleEditMessageConfirm = async () => {
        if (!editingMessage || !editMessageContent.trim()) {
            setError('Message cannot be empty');
            return;
        }

        if (editMessageContent.trim() === editingMessage.content) {
            setShowEditMessageModal(false);
            setEditingMessage(null);
            setEditMessageContent('');
            return;
        }

        try {
            setProcessing(true);
            setError('');

            console.log('🔄 Editing message:', {
                messageId: editingMessage._id,
                newContentLength: editMessageContent.length
            });

            const response = await apiService.editGroupMessage(id, editingMessage._id, {
                content: editMessageContent.trim()
            });

            console.log('✅ Edit response:', response);

            if (response.success) {
                setMessages(prev => prev.map(msg =>
                    msg._id === editingMessage._id
                        ? {
                            ...msg,
                            content: editMessageContent.trim(),
                            isEdited: true,
                            editedAt: new Date().toISOString()
                        }
                        : msg
                ));

                setShowEditMessageModal(false);
                setEditingMessage(null);
                setEditMessageContent('');
            } else {
                setError('Failed to edit message: ' + response.message);
            }
        } catch (err) {
            console.error('❌ Edit error:', err);
            setError(err.message || 'Failed to edit message');
        } finally {
            setProcessing(false);
        }
    };

    // Delete Message Handlers
    const handleDeleteMessageClick = (messageId) => {
        setDeleteMessageId(messageId);
        setShowDeleteMessageModal(true);
        setError('');
    };

    const handleDeleteMessageConfirm = async () => {
        if (!deleteMessageId) return;

        try {
            setProcessing(true);
            setError('');

            console.log('🗑️ Deleting message:', deleteMessageId);

            const response = await apiService.deleteGroupMessage(id, deleteMessageId);

            console.log('✅ Delete response:', response);

            if (response.success) {
                setMessages(prev => prev.filter(msg => msg._id !== deleteMessageId));
                setShowDeleteMessageModal(false);
                setDeleteMessageId(null);
            } else {
                setError('Failed to delete message: ' + response.message);
            }
        } catch (err) {
            console.error('❌ Delete error:', err);
            setError(err.message || 'Failed to delete message');
        } finally {
            setProcessing(false);
        }
    };

    // Like Message Handler
    const handleToggleLike = async (messageId) => {
        try {
            console.log('❤️ Toggling like for message:', messageId);

            const response = await apiService.toggleMessageLike(id, messageId);

            console.log('✅ Like response:', response);

            if (response.success) {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId
                        ? {
                            ...msg,
                            likes: response.data.likes || [],
                            likeCount: response.data.likeCount || 0
                        }
                        : msg
                ));
            } else {
                setError('Failed to like message: ' + response.message);
            }
        } catch (err) {
            console.error('❌ Like error:', err);
            setError(err.message || 'Failed to like message');
        }
    };

    // Send Message Handler
    const sendMessage = async () => {
        if (!newMessage.trim()) {
            setError('Message cannot be empty');
            return;
        }

        try {
            setSendingMessage(true);
            console.log('Sending message:', newMessage);
            const response = await apiService.postGroupMessage(id, {
                content: newMessage.trim()
            });

            console.log('Message sent response:', response);

            if (response.success) {
                setNewMessage('');
                if (response.data) {
                    setMessages(prev => [...prev, response.data]);
                } else {
                    setTimeout(() => {
                        fetchMessages();
                    }, 500);
                }
            } else {
                setError('Failed to send message: ' + response.message);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.message || 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    useEffect(() => {
        if (isMember && showMessageSection) {
            fetchMessages();
        }
    }, [id, isMember, showMessageSection]);

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
                fetchGroupDetails();
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
            } else {
                if (response.message && response.message.includes('creator cannot leave')) {
                    setShowDeleteGroupModal(true);
                } else {
                    setError(response.message || 'Failed to leave group');
                }
            }
        } catch (err) {
            console.error('Leave group error:', err);
            setError(err.message || 'Failed to leave group');
        } finally {
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

    const handleEditGroup = async () => {
        try {
            setProcessing(true);
            setError('');

            console.log('🔄 Editing group:', {
                groupId: id,
                editingGroup,
                isStudyGroup: group.type === 'study'
            });

            const response = await apiService.updateGroup(id, editingGroup);

            console.log('✅ Edit group response:', response);

            if (response.success) {
                alert('Group updated successfully');
                setShowEditGroupModal(false);
                fetchGroupDetails();
            } else {
                setError('Failed to update group: ' + response.message);
            }
        } catch (err) {
            console.error('❌ Edit group error details:', {
                message: err.message,
                status: err.status,
                response: err.response?.data,
                error: err
            });
            setError(err.message || 'Failed to update group');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteGroup = async () => {
        try {
            setProcessing(true);
            setError('');

            console.log('🗑️ Deleting group:', id);

            const response = await apiService.deleteGroup(id);

            console.log('✅ Delete group response:', response);

            if (response.success) {
                alert('Group deleted successfully!');
                navigate('/find-my-group/my-groups');
            } else {
                setError('Failed to delete group: ' + response.message);
            }
        } catch (err) {
            console.error('❌ Delete group error:', err);
            const errorMsg = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to delete group';
            setError(errorMsg);
            if (errorMsg.includes('creator')) {
                setError('Only the group creator can delete the group');
            } else if (errorMsg.includes('not found')) {
                setError('Group not found');
            }
        } finally {
            setProcessing(false);
            setShowDeleteGroupModal(false);
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

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
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
            {/* Custom CSS for modals */}
            <style>
                {`
                    /* Modal Overlay - Centered */
                    .custom-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                        padding: 20px;
                    }
                    
                    .custom-modal-content {
                        background: white;
                        border-radius: 8px;
                        max-width: 500px;
                        width: 100%;
                        max-height: 80vh;
                        overflow-y: auto;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    }
                    
                    .custom-modal-header {
                        padding: 16px 20px;
                        border-bottom: 1px solid #e9ecef;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .custom-modal-title {
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                    }
                    
                    .custom-modal-body {
                        padding: 20px;
                    }
                    
                    .custom-modal-footer {
                        padding: 16px 20px;
                        border-top: 1px solid #e9ecef;
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    }
                    
                    /* Button Styles - Smaller and in column */
                    .custom-btn {
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-weight: 500;
                        cursor: pointer;
                        border: 1px solid transparent;
                        transition: all 0.2s;
                        color: #0e274e;
                        min-width: 40px;
                        font-size: 9px;
                    }
                    
                    .custom-btn-primary {
                        background: #0e274e;
                        border-color: #0e274e;
                    }
                    
                    .custom-btn-primary:hover:not(:disabled) {
                        background: #0e274e;
                        border-color: #0e274e;
                    }
                    
                    .custom-btn-danger {
                        background: #dc3545;
                        border-color: #dc3545;
                    }
                    
                    .custom-btn-danger:hover:not(:disabled) {
                        background: #c82333;
                        border-color: #bd2130;
                    }
                    
                    .custom-btn-secondary {
                        background: #6c757d;
                        border-color: #6c757d;
                    }
                    
                    .custom-btn-secondary:hover:not(:disabled) {
                        background: #5a6268;
                        border-color: #545b62;
                    }
                    
                    .custom-btn-outline-secondary {
                        background: transparent;
                        color: #6c757d !important;
                        border-color: #6c757d;
                    }
                    
                    .custom-btn-outline-secondary:hover:not(:disabled) {
                        background: #6c757d;
                        color: white !important;
                    }
                    
                    .custom-btn:disabled {
                        opacity: 0.65;
                        cursor: not-allowed;
                    }
                    
                    /* Form Styles */
                    .custom-textarea {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ced4da;
                        border-radius: 4px;
                        resize: vertical;
                        min-height: 100px;
                        font-family: inherit;
                        font-size: 14px;
                    }
                    
                    .custom-textarea:focus {
                        outline: none;
                        border-color: #0e274e;
                        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
                    }
                    
                    .custom-form-label {
                        font-weight: 500;
                        margin-bottom: 8px;
                        display: block;
                    }
                    
                    .custom-char-counter {
                        font-size: 12px;
                        color: #6c757d;
                        text-align: right;
                        margin-top: 4px;
                    }
                    
                    /* UI Improvements - Button columns */
                    .btn-column {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        width: 100%;
                    }
                    
                    .btn-column .btn,
                    .btn-column .custom-btn {
                        width: 100%;
                        justify-content: center;
                        margin: 0 !important;
                    }
                    
                    .btn-sm-column {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                    }
                    
                    .btn-sm-column .btn-sm {
                        width: 100%;
                        justify-content: center;
                        margin: 0 !important;
                        padding: 4px 8px;
                        font-size: 12px;
                    }
                    
                    /* Group Admin Button Column */
                    .group-admin-buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        min-width: 120px;
                    }
                    
                    .group-admin-buttons .btn {
                        width: 100%;
                        justify-content: center;
                        padding: 6px 12px;
                        font-size: 14px;
                    }
                    
                    /* Message Action Buttons */
                    .message-actions-column {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        min-width: 60px;
                    }
                    
                    .message-actions-column .btn-sm {
                        width: 100%;
                        justify-content: center;
                        padding: 2px 6px;
                        font-size: 11px;
                    }
                    
                    /* Detail items */
                    .detail-item {
                        padding: 8px 0;
                        border-bottom: 1px solid #f0f0f0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .detail-item:last-child {
                        border-bottom: none;
                    }
                    
                    .member-card, .request-card {
                        padding: 12px;
                        border: 1px solid #e9ecef;
                        border-radius: 6px;
                        margin-bottom: 8px;
                        background: #f8f9fa;
                    }
                    
                    .message-item {
                        padding: 12px;
                        border-radius: 8px;
                        background: #f8f9fa;
                        margin-bottom: 10px;
                    }
                    
                    .message-own {
                        background: #e3f2fd;
                    }
                    
                    .message-avatar {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: #6c757d;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .creator-avatar {
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: #0e274e;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .member-avatar {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: #6c757d;
                        color: white;
                        display: flex;
                        align-items: center;
                                        justify-content: center;
                    }
                    
                    /* Responsive adjustments */
                    @media (max-width: 768px) {
                        .custom-modal-content {
                            max-width: 95%;
                        }
                        
                        .btn-column {
                            gap: 6px;
                        }
                        
                        .group-admin-buttons {
                            min-width: 100px;
                        }
                    }
                `}
            </style>

            {/* Back Button */}
            <div className="mb-4">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/find-my-group/my-groups')}>
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

                        <div className="d-flex gap-2 align-items-center mobile-stack">
                            {!isMember && !hasPendingRequest && group.status === 'active' && !isAdminUser && (
                                <button
                                    className="btn btn-sm btn-primary"
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

                            {/* Show appropriate buttons for members */}
                            {isMember && !isAdminUser && (
                                <div className="d-flex gap-2">
                                    {isGroupAdmin ? (
                                        // Creator sees both Edit and Delete buttons side by side
                                        <>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => {
                                                    setEditingGroup({
                                                        name: group.name,
                                                        description: group.description || '',
                                                        privacy: group.privacy,
                                                        maxMembers: group.maxMembers
                                                    });
                                                    setShowEditGroupModal(true);
                                                }}
                                                disabled={processing}
                                            >
                                                <FaEdit className="me-2" /> Edit Group
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => setShowDeleteGroupModal(true)}
                                                disabled={processing}
                                            >
                                                <FaTrash className="me-2" /> Delete Group
                                            </button>
                                        </>
                                    ) : (
                                        // Regular member sees only Leave button
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={handleLeaveGroup}
                                            disabled={processing}
                                        >
                                            <FaSignOutAlt className="me-2" /> Leave Group
                                        </button>
                                    )}
                                </div>
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

                    {/* Messaging Section - Always show if member */}
                    {isMember && (
                        <div className="mt-4 border-top pt-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5>Group Messages ({messages.length})</h5>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setShowMessageSection(!showMessageSection)}
                                >
                                    {showMessageSection ? 'Hide Messages' : 'Show Messages'}
                                </button>
                            </div>

                            {showMessageSection && (
                                <>
                                    {/* Messages List */}
                                    <div className="messages-container mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {messages.length === 0 ? (
                                            <div className="text-center py-3 text-muted">
                                                No messages yet. Start the conversation!
                                            </div>
                                        ) : (
                                            messages.map((message, index) => {
                                                const messageUser = message.user || {};
                                                const isCurrentUser = messageUser._id === user?.id ||
                                                    message.user?._id === user?.id ||
                                                    message.user === user?.id;

                                                return (
                                                    <div key={message._id || index} className={`message-item mb-3 ${isCurrentUser ? 'message-own' : ''}`}>
                                                        <div className="d-flex gap-2">
                                                            <div className="message-avatar">
                                                                <FaUser size={16} />
                                                            </div>
                                                            <div className="message-content flex-grow-1">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <strong>{message.userName || messageUser.name || 'Unknown'}</strong>
                                                                        <small className="text-muted ms-2">
                                                                            {message.createdAt ?
                                                                                formatTime(message.createdAt) :
                                                                                'Just now'
                                                                            }
                                                                        </small>
                                                                        {message.isEdited && (
                                                                            <small className="text-muted ms-2">(edited)</small>
                                                                        )}
                                                                    </div>
                                                                    {isCurrentUser && (
                                                                        <div className="d-flex gap-1">
                                                                            <button
                                                                                className="btn btn-sm btn-outline-secondary p-1"
                                                                                onClick={() => handleEditMessageClick(message)}
                                                                                title="Edit"
                                                                                disabled={processing}
                                                                            >
                                                                                <FaEdit size={12} />
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-danger p-1"
                                                                                onClick={() => handleDeleteMessageClick(message._id)}
                                                                                title="Delete"
                                                                                disabled={processing}
                                                                            >
                                                                                <FaTrash size={12} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="mb-1 mt-1">{message.content}</p>

                                                                {message.likes && message.likes.length > 0 && (
                                                                    <div className="d-flex align-items-center gap-1 mt-1">
                                                                        <FaHeart className="text-danger" size={12} />
                                                                        <small className="text-muted">
                                                                            {message.likes.length} like{message.likes.length !== 1 ? 's' : ''}
                                                                        </small>
                                                                    </div>
                                                                )}

                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary mt-1"
                                                                    onClick={() => handleToggleLike(message._id)}
                                                                    disabled={!message._id || processing}
                                                                >
                                                                    <FaHeart className="me-1" />
                                                                    Like ({message.likes?.length || 0})
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="message-input-container">
                                        <div className="input-group">
                                            <textarea
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                className="form-control"
                                                placeholder="Type your message..."
                                                rows={2}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        sendMessage();
                                                    }
                                                }}
                                                disabled={sendingMessage}
                                            />
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={sendMessage}
                                                disabled={sendingMessage || !newMessage.trim()}
                                            >
                                                {sendingMessage ? (
                                                    <span className="spinner-border spinner-border-sm"></span>
                                                ) : (
                                                    <FaPaperPlane />
                                                )}
                                            </button>
                                        </div>
                                        <small className="text-muted">Press Enter to send, Shift+Enter for new line</small>
                                    </div>
                                </>
                            )}
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

            {/* Edit Message Modal - Centered */}
            {showEditMessageModal && editingMessage && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <div className="custom-modal-header">
                            <h5 className="custom-modal-title">Edit Message</h5>
                            <button
                                type="button"
                                className="btn-sm btn-close"
                                onClick={() => {
                                    setShowEditMessageModal(false);
                                    setEditingMessage(null);
                                    setEditMessageContent('');
                                }}
                                disabled={processing}
                            ></button>
                        </div>
                        <div className="custom-modal-body">
                            <label className="custom-form-label">Message Content</label>
                            <textarea
                                value={editMessageContent}
                                onChange={(e) => setEditMessageContent(e.target.value)}
                                className="custom-textarea"
                                rows="4"
                                placeholder="Edit your message..."
                                disabled={processing}
                            />
                            <div className="custom-char-counter">
                                {editMessageContent.length}/1000 characters
                            </div>
                            {error && <div className="alert alert-danger mt-3">{error}</div>}
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                type="button"
                                className="custom-btn btn-sm custom-btn-outline-secondary"
                                onClick={() => {
                                    setShowEditMessageModal(false);
                                    setEditingMessage(null);
                                    setEditMessageContent('');
                                }}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="custom-btn btn-sm custom-btn-primary"
                                onClick={handleEditMessageConfirm}
                                disabled={processing || !editMessageContent.trim() || editMessageContent === editingMessage.content}
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Message Confirmation Modal - Centered */}
            {showDeleteMessageModal && deleteMessageId && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <div className="custom-modal-header">
                            <h5 className="custom-modal-title text-danger">
                                <FaTrash className="me-2" />
                                Delete Message
                            </h5>
                            <button
                                type="button"
                                className="btn-sm btn-close"
                                onClick={() => {
                                    setShowDeleteMessageModal(false);
                                    setDeleteMessageId(null);
                                }}
                                disabled={processing}
                            ></button>
                        </div>
                        <div className="custom-modal-body">
                            <div className="text-center mb-4">
                                <FaTrash className="text-danger mb-3" size={48} />
                                <h6>Are you sure you want to delete this message?</h6>
                                <p className="text-muted">
                                    This action cannot be undone. The message will be permanently deleted.
                                </p>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                type="button"
                                className="custom-btn btn-sm custom-btn-outline-secondary"
                                onClick={() => {
                                    setShowDeleteMessageModal(false);
                                    setDeleteMessageId(null);
                                }}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="custom-btn custom-btn-danger"
                                onClick={handleDeleteMessageConfirm}
                                disabled={processing}
                            >
                                {processing ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Request Modal - Centered */}
            {showJoinModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <div className="custom-modal-header">
                            <h5 className="custom-modal-title">Request to Join Group</h5>
                            <button
                                type="button"
                                className="btn-sm btn-close"
                                onClick={() => setShowJoinModal(false)}
                                disabled={processing}
                            ></button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Send a message to the group admins about why you want to join:</p>
                            <textarea
                                value={joinMessage}
                                onChange={(e) => setJoinMessage(e.target.value)}
                                className="custom-textarea"
                                rows="4"
                                placeholder={`Hi, I'd like to join your ${group.type === 'study' ? 'study group' : 'transport'}...`}
                                disabled={processing}
                            />
                            {group.privacy === 'private' && (
                                <div className="alert alert-info mt-3">
                                    <FaLock className="me-2" />
                                    This is a private group. Your request will need to be approved by an admin.
                                </div>
                            )}
                            {error && <div className="alert alert-danger mt-3">{error}</div>}
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                type="button"
                                className="custom-btn btn-sm custom-btn-secondary"
                                onClick={() => setShowJoinModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="custom-btn btn-sm custom-btn-primary"
                                onClick={handleJoinRequest}
                                disabled={processing || !joinMessage.trim()}
                            >
                                {processing ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Group Modal - Centered (Now matches delete modal style) */}
            {showEditGroupModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <div className="custom-modal-header">
                            <h5 className="custom-modal-title">Edit Group</h5>
                            <button
                                type="button"
                                className="btn-sm btn-close"
                                onClick={() => setShowEditGroupModal(false)}
                                disabled={processing}
                            ></button>
                        </div>
                        <div className="custom-modal-body">
                            <div className="mb-3">
                                <label className="form-label">Group Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editingGroup.name}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                    required
                                    disabled={processing}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    value={editingGroup.description}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                    rows="3"
                                    disabled={processing}
                                />
                            </div>

                            {group.type === 'study' && (
                                <div className="mb-3">
                                    <label className="form-label">Privacy Setting</label>
                                    <select
                                        className="form-control"
                                        value={editingGroup.privacy}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, privacy: e.target.value })}
                                        disabled={processing}
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                    </select>
                                    <small className="text-muted">
                                        {editingGroup.privacy === 'private'
                                            ? 'Users must request to join'
                                            : 'Anyone can join directly'}
                                    </small>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label">Maximum Members</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={editingGroup.maxMembers}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, maxMembers: parseInt(e.target.value) || 5 })}
                                    min="2"
                                    max="50"
                                    disabled={processing}
                                />
                                <small className="text-muted">Current: {group.members?.length || 0} members</small>
                            </div>

                            {error && <div className="alert alert-danger">{error}</div>}
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                type="button"
                                className="custom-btn custom-btn-secondary"
                                onClick={() => setShowEditGroupModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="custom-btn custom-btn-primary"
                                onClick={handleEditGroup}
                                disabled={processing || !editingGroup.name.trim()}
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Group Modal - Centered */}
            {showDeleteGroupModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <div className="custom-modal-header">
                            <h5 className="custom-modal-title text-danger">
                                <FaTrash className="me-2" />
                                Delete Group
                            </h5>
                            <button
                                type="button"
                                className="btn-sm btn-close"
                                onClick={() => setShowDeleteGroupModal(false)}
                                disabled={processing}
                            ></button>
                        </div>
                        <div className="custom-modal-body">
                            <div className="text-center mb-4">
                                <FaTrash className="text-danger mb-3" size={48} />
                                <h5>Delete "{group.name}"?</h5>

                                <div className="alert alert-danger mt-3">
                                    <strong>⚠️ You are the creator of this group!</strong>
                                    <p className="mb-0 mt-2">
                                        As the creator, you cannot leave the group. You must delete it.
                                        This will permanently delete:
                                    </p>
                                    <ul className="mt-2 mb-0">
                                        <li>All messages in this group</li>
                                        <li>All member information</li>
                                        <li>All join requests</li>
                                        <li>The group itself</li>
                                    </ul>
                                    <p className="mt-2 mb-0"><strong>This action cannot be undone!</strong></p>
                                </div>

                                <div className="mt-4">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="confirmDelete"
                                            onChange={(e) => {
                                                const confirmBtn = document.getElementById('confirmDeleteBtn');
                                                if (confirmBtn) {
                                                    confirmBtn.disabled = !e.target.checked;
                                                }
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor="confirmDelete">
                                            I understand that this action is permanent and cannot be undone.
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                type="button"
                                className="custom-btn  btn-smcustom-btn-secondary"
                                onClick={() => setShowDeleteGroupModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="custom-btn btn-sm custom-btn-danger"
                                onClick={handleDeleteGroup}
                                disabled={processing}
                                id="confirmDeleteBtn"
                            >
                                {processing ? 'Deleting...' : 'Delete Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupDetail;