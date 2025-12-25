
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import './App.css';

const CalendarAdmin = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'university', 'personal'
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventForm, setShowEventForm] = useState(false);
    const [showUniversityForm, setShowUniversityForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start: '',
        end: '',
        eventType: 'general',
        category: '',
        location: '',
        isUniversityEvent: false,
        isImportant: false
    });

    const API_BASE = 'http://localhost:5000/api/calendar';

    // Fetch events based on active tab
    const fetchEvents = async () => {
        try {
            setLoading(true);
            let endpoint = '/events';

            if (activeTab === 'university') {
                endpoint = '/events/university';
            } else if (activeTab === 'personal') {
                endpoint = '/events/personal';
            }

            const response = await axios.get(`${API_BASE}${endpoint}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setEvents(response.data.events);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    // Format date for input field
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = parseISO(dateString);
        return format(date, "yyyy-MM-dd'T'HH:mm");
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            start: '',
            end: '',
            eventType: 'general',
            category: '',
            location: '',
            isUniversityEvent: false,
            isImportant: false
        });
        setSelectedEvent(null);
    };

    // Submit university event (admin only)
    const handleSubmitUniversityEvent = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${API_BASE}/events/university`,
                formData,
                { withCredentials: true }
            );

            if (response.data.success) {
                alert('✅ University event created successfully!');
                resetForm();
                setShowUniversityForm(false);
                fetchEvents();
            }
        } catch (err) {
            console.error('Error creating university event:', err);
            if (err.response?.status === 403) {
                alert('❌ Admin access required for university events');
            } else {
                alert('Error creating university event');
            }
        }
    };

    // Update event (works for both personal and university)
    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        if (!selectedEvent) return;

        try {
            const response = await axios.put(
                `${API_BASE}/events/${selectedEvent._id}`,
                formData,
                { withCredentials: true }
            );

            if (response.data.success) {
                alert('✅ Event updated successfully!');
                resetForm();
                setShowEventForm(false);
                fetchEvents();
            }
        } catch (err) {
            console.error('Error updating event:', err);
            if (err.response?.status === 403) {
                alert('❌ You do not have permission to edit this event');
            } else {
                alert('Error updating event');
            }
        }
    };

    // Delete event
    const handleDeleteEvent = async (eventId, isUniversityEvent) => {
        const message = isUniversityEvent
            ? 'Are you sure you want to delete this university event? This will remove it for ALL users.'
            : 'Are you sure you want to delete this event?';

        if (!window.confirm(message)) return;

        try {
            const response = await axios.delete(`${API_BASE}/events/${eventId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                alert('✅ Event deleted successfully!');
                fetchEvents();
            }
        } catch (err) {
            console.error('Error deleting event:', err);
            if (err.response?.status === 403) {
                alert('❌ You do not have permission to delete this event');
            } else {
                alert('Error deleting event');
            }
        }
    };

    // Edit event
    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            start: formatDateForInput(event.start),
            end: formatDateForInput(event.end),
            eventType: event.eventType || 'general',
            category: event.category || '',
            location: event.location || '',
            isUniversityEvent: event.isUniversityEvent || false,
            isImportant: event.isImportant || false
        });

        if (event.isUniversityEvent || event.visibleToAll) {
            setShowUniversityForm(true);
            setShowEventForm(false);
        } else {
            setShowEventForm(true);
            setShowUniversityForm(false);
        }
    };

    // Fetch events on component mount or tab change
    useEffect(() => {
        fetchEvents();
    }, [activeTab]);

    const filteredEvents = events.filter(event => {
        if (activeTab === 'all') return true;
        if (activeTab === 'university') return event.isUniversityEvent || event.visibleToAll;
        if (activeTab === 'personal') return event.userId || event.isPersonalEvent;
        return true;
    });

    return (
        <div className="calendar-admin">
            <div className="calendar-admin-header">
                <h1>📅 Calendar Admin</h1>
                <p>Manage university events (visible to all users) and view user events</p>

                <div className="admin-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => {
                            resetForm();
                            setShowUniversityForm(!showUniversityForm);
                            setShowEventForm(false);
                        }}
                    >
                        {showUniversityForm ? 'Cancel' : '🏫 Add University Event'}
                    </button>

                    <button className="btn-refresh" onClick={fetchEvents}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="admin-tabs">
                <button
                    className={activeTab === 'all' ? 'active' : ''}
                    onClick={() => setActiveTab('all')}
                >
                    🌟 All Events
                </button>
                <button
                    className={activeTab === 'university' ? 'active' : ''}
                    onClick={() => setActiveTab('university')}
                >
                    🏫 University Events
                </button>
                <button
                    className={activeTab === 'personal' ? 'active' : ''}
                    onClick={() => setActiveTab('personal')}
                >
                    👤 User Events
                </button>
            </div>

            {/* University Event Form */}
            {showUniversityForm && (
                <div className="event-form-section university-form">
                    <h2>{selectedEvent ? '✏️ Edit University Event' : '🏫 Add University Event'}</h2>
                    <p className="form-description">
                        University events are visible to ALL students campus-wide.
                    </p>

                    <form onSubmit={selectedEvent ? handleUpdateEvent : handleSubmitUniversityEvent} className="event-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Event Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter university event title"
                                />
                            </div>

                            <div className="form-group">
                                <label>Event Type</label>
                                <select
                                    name="eventType"
                                    value={formData.eventType}
                                    onChange={handleInputChange}
                                >
                                    <option value="academic">Academic</option>
                                    <option value="exam">Exam</option>
                                    <option value="holiday">Holiday</option>
                                    <option value="general">General</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="club">Club</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    name="start"
                                    value={formData.start}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>End Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    name="end"
                                    value={formData.end}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                placeholder="e.g., Academic Dates, University Holiday"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="University event description..."
                            />
                        </div>

                        <div className="form-checkboxes">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isImportant"
                                    checked={formData.isImportant}
                                    onChange={handleInputChange}
                                />
                                <span>Mark as Important (High Priority)</span>
                            </label>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" className="btn-submit">
                                {selectedEvent ? 'Update University Event' : 'Create University Event'}
                            </button>
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => {
                                    setShowUniversityForm(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Events List */}
            <div className="events-list-section">
                <h2>
                    {activeTab === 'all' ? 'All Calendar Events' :
                        activeTab === 'university' ? 'University Events' : 'User Personal Events'}
                    ({filteredEvents.length})
                </h2>

                {loading ? (
                    <div className="loading">Loading events...</div>
                ) : filteredEvents.length === 0 ? (
                    <div className="no-events">
                        <p>No events found.</p>
                    </div>
                ) : (
                    <div className="events-table-container">
                        <table className="events-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Date & Time</th>
                                    <th>Visibility</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvents.map(event => {
                                    const startDate = parseISO(event.start);
                                    const endDate = parseISO(event.end);
                                    const isUniversityEvent = event.isUniversityEvent || event.visibleToAll;
                                    const isPersonalEvent = event.userId || event.isPersonalEvent;

                                    return (
                                        <tr key={event._id} className={isUniversityEvent ? 'university-event' : 'personal-event'}>
                                            <td>
                                                <div className="event-title">
                                                    <strong>{event.title}</strong>
                                                    {event.isImportant && <span className="important-badge">⚠️ Important</span>}
                                                    {isPersonalEvent && <span className="personal-badge">👤 Personal</span>}
                                                </div>
                                                {event.description && (
                                                    <div className="event-description">{event.description}</div>
                                                )}
                                                {event.userEmail && (
                                                    <div className="event-user">User: {event.userEmail}</div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`event-type-badge ${event.eventType}`}>
                                                    {event.eventType}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="event-dates">
                                                    <div><strong>Start:</strong> {format(startDate, 'MMM dd, yyyy HH:mm')}</div>
                                                    <div><strong>End:</strong> {format(endDate, 'MMM dd, yyyy HH:mm')}</div>
                                                </div>
                                            </td>
                                            <td>
                                                {isUniversityEvent ? (
                                                    <span className="university-badge">🏫 Visible to ALL</span>
                                                ) : isPersonalEvent ? (
                                                    <span className="personal-visibility">👤 Only to User</span>
                                                ) : (
                                                    <span className="regular-badge">Limited</span>
                                                )}
                                            </td>
                                            <td className="event-actions">
                                                {isUniversityEvent ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditEvent(event)}
                                                            className="btn-edit"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event._id, true)}
                                                            className="btn-delete"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </>
                                                ) : isPersonalEvent ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditEvent(event)}
                                                            className="btn-edit"
                                                            disabled={!event.canEdit}
                                                        >
                                                            ✏️ View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event._id, false)}
                                                            className="btn-delete"
                                                            disabled={!event.canDelete}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarAdmin;
