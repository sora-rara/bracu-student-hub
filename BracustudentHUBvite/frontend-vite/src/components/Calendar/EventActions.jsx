// components/EventActions.js - FIXED VERSION
import React, { useState } from 'react';
import axios from 'axios';
import '../../App.css';

// FIXED: Update base URL to match backend route
const API_BASE_URL = 'http://localhost:5000/api/calendar'; // Changed from '/api' to '/api/calendar'

const EventActions = ({ event, onDelete, onEdit, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({
    title: event.title,
    date: event.start ? new Date(event.start).toISOString().split('T')[0] : '',
    time: event.start ? new Date(event.start).toTimeString().slice(0, 5) : '',
    location: event.extendedProps?.location || '',
    description: event.extendedProps?.description || '',
    type: event.extendedProps?.eventType || 'general',
    organizer: event.extendedProps?.organizer || 'User'
  });

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');

      // FIXED: Get event ID from multiple possible sources
      const eventId = event.id || event._id || event.extendedProps?._id;
      
      if (!eventId) {
        setError('No event ID found');
        return;
      }

      console.log(`🗑️ Attempting to delete event ID: ${eventId}`);
      console.log(`📤 Sending DELETE to: ${API_BASE_URL}/events/${eventId}`);

      // FIXED: Use correct URL with /calendar prefix
      const response = await axios.delete(`${API_BASE_URL}/events/${eventId}`, {
        withCredentials: true // Important for session cookies
      });

      console.log('✅ Delete response:', response.data);

      if (response.data.success) {
        if (onDelete) onDelete(eventId);
        if (onClose) onClose();
      } else {
        setError(response.data.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('❌ Delete error details:', err);
      
      if (err.response) {
        console.error('Error status:', err.response.status);
        console.error('Error data:', err.response.data);
        setError(err.response.data?.error || `Server error: ${err.response.status}`);
      } else if (err.request) {
        console.error('No response received. Request:', err.request);
        setError('No response from server. Make sure backend is running.');
      } else {
        console.error('Request setup error:', err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // FIXED: Get event ID from multiple possible sources
      const eventId = event.id || event._id || event.extendedProps?._id;
      
      if (!eventId) {
        setError('No event ID found');
        return;
      }

      const formattedData = {
        ...editData,
        organizer: 'User'
      };

      console.log(`✏️ Attempting to update event ID: ${eventId}`);
      console.log(`📤 Sending PUT to: ${API_BASE_URL}/events/${eventId}`);
      console.log('Update data:', formattedData);

      // FIXED: Use correct URL with /calendar prefix
      const response = await axios.put(`${API_BASE_URL}/events/${eventId}`, formattedData, {
        withCredentials: true // Important for session cookies
      });

      console.log('✅ Update response:', response.data);

      if (response.data.success) {
        if (onEdit) onEdit(response.data.event);
        setShowEditForm(false);
        if (onClose) onClose();
      } else {
        setError(response.data.error || 'Failed to update event');
      }
    } catch (err) {
      console.error('❌ Edit error details:', err);
      
      if (err.response) {
        console.error('Error status:', err.response.status);
        console.error('Error data:', err.response.data);
        setError(err.response.data?.error || `Server error: ${err.response.status}`);
      } else if (err.request) {
        console.error('No response received');
        setError('No response from server');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date error';
    }
  };

  // Debug: Log event details
  console.log('📋 EventActions received event:', {
    id: event.id,
    _id: event._id,
    extendedProps: event.extendedProps,
    title: event.title,
    start: event.start
  });

  return (
    <div className="event-actions-modal">
      <div className="event-actions-content">
        <div className="event-actions-header">
          <h3>Event Actions</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="alert alert-error">
            ❌ {error}
          </div>
        )}

        {/* Event Details */}
        <div className="event-details-section">
          <h4>{event.title || 'Untitled Event'}</h4>
          <p><strong>Event ID:</strong> {event.id || event._id || 'N/A'}</p>
          <p><strong>Start:</strong> {formatDate(event.start)}</p>
          <p><strong>End:</strong> {formatDate(event.end)}</p>
          <p><strong>Type:</strong> {event.extendedProps?.eventType || 'N/A'}</p>
          <p><strong>Location:</strong> {event.extendedProps?.location || 'N/A'}</p>
          <p><strong>Description:</strong> {event.extendedProps?.description || 'N/A'}</p>
          <p><strong>Owner:</strong> {event.extendedProps?.organizer || 'User'}</p>
        </div>

        {/* Edit Form */}
        {showEditForm ? (
          <form onSubmit={handleEdit} className="edit-event-form">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={editData.title}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={editData.date}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  name="time"
                  value={editData.time}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Event Type *</label>
              <select
                name="type"
                value={editData.type}
                onChange={handleInputChange}
                required
                disabled={loading}
              >
                <option value="academic">Academic</option>
                <option value="club">Club Activity</option>
                <option value="exam">Exam</option>
                <option value="holiday">Holiday</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={editData.location}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleInputChange}
                rows="3"
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Event'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowEditForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Action Buttons */
          <div className="action-buttons">
            <button
              className="btn-edit"
              onClick={() => setShowEditForm(true)}
              disabled={loading}
            >
              ✏️ Edit Event
            </button>

            <button
              className="btn-delete"
              onClick={() => setShowConfirm(true)}
              disabled={loading}
            >
              🗑️ Delete Event
            </button>
          </div>
        )}

        {/* Delete Confirmation */}
        {showConfirm && (
          <div className="confirmation-dialog">
            <div className="confirmation-content">
              <h4>Confirm Delete</h4>
              <p>Are you sure you want to delete "{event.title}"?</p>
              <p className="warning-text">This action cannot be undone.</p>
              <p className="debug-info">
                <small>Event ID: {event.id || event._id || 'N/A'}</small>
              </p>

              <div className="confirmation-buttons">
                <button
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Deleting...
                    </>
                  ) : 'Yes, Delete'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventActions;