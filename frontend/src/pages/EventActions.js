// components/EventActions.js
import React, { useState } from 'react';
import axios from 'axios';
import './EventActions.css';

const API_BASE_URL = 'http://localhost:5000/api';

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
      
      const response = await axios.delete(`${API_BASE_URL}/events/${event.id}`);
      
      if (response.data.success) {
        if (onDelete) onDelete(event.id);
        if (onClose) onClose();
      } else {
        setError(response.data.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete event');
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
      
      const formattedData = {
        ...editData,
        organizer: 'User'
      };
      
      const response = await axios.put(`${API_BASE_URL}/events/${event.id}`, formattedData);
      
      if (response.data.success) {
        if (onEdit) onEdit(response.data.event);
        setShowEditForm(false);
        if (onClose) onClose();
      } else {
        setError(response.data.error || 'Failed to update event');
      }
    } catch (err) {
      console.error('Edit error:', err);
      setError(err.response?.data?.error || 'Failed to update event');
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <h4>{event.title}</h4>
          <p><strong>Start:</strong> {formatDate(event.start)}</p>
          <p><strong>End:</strong> {formatDate(event.end)}</p>
          <p><strong>Type:</strong> {event.extendedProps?.eventType || 'N/A'}</p>
          <p><strong>Location:</strong> {event.extendedProps?.location || 'N/A'}</p>
          <p><strong>Description:</strong> {event.extendedProps?.description || 'N/A'}</p>
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
              
              <div className="confirmation-buttons">
                <button 
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
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