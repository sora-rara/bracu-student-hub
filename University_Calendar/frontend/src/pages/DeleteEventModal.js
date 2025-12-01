import React, { useState } from 'react';
import axios from 'axios';
import './CalendarView.css'; // or './DeleteEventModal.css' if you have separate CSS

const API_BASE_URL = 'http://localhost:5000/api';

const DeleteEventModal = ({ event, isOpen, onClose, onDeleteSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !event) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      setSuccess(false);
      
      // Get event ID - try multiple possible sources
      const eventId = event.id || event._id || event.extendedProps?._id;
      
      if (!eventId) {
        setError('No event ID found');
        return;
      }
      
      console.log(`🗑️ Sending DELETE request for event ID: ${eventId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/events/${eventId}`);
      
      console.log('✅ Backend response:', response.data);
      
      if (response.data.success) {
        setSuccess(true);
        
        // Wait 1.5 seconds then close and notify parent
        setTimeout(() => {
          onDeleteSuccess(eventId);
          onClose();
        }, 1500);
        
      } else {
        setError(response.data.error || 'Failed to delete event');
      }
      
    } catch (err) {
      console.error('❌ Delete error:', err);
      
      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`);
      } else if (err.request) {
        setError('No response from server. Make sure backend is running on http://localhost:5000');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeString = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">🗑️ Delete Event</h5>
          <button type="button" className="close-btn" onClick={onClose} disabled={deleting}>
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          {success ? (
            <div className="alert alert-success">
              <strong>✅ Success!</strong> Event deleted successfully.
              <p className="mb-0 mt-2">Closing in a moment...</p>
            </div>
          ) : (
            <>
              <div className="alert alert-warning">
                <strong>⚠️ Warning:</strong> This action cannot be undone!
              </div>
              
              <p>Are you sure you want to delete this event?</p>
              
              {/* Event Details Section */}
              <div className="event-details card mt-3">
                <div className="card-body">
                  <h6 className="card-title">{event.title}</h6>
                  <div className="card-text">
                    <p className="mb-2">
                      <strong>📅 Date:</strong> {formatDate(event.start)}
                      {event.start && event.end && !event.allDay && (
                        <span> ({getTimeString(event.start)} - {getTimeString(event.end)})</span>
                      )}
                    </p>
                    {event.extendedProps?.eventType && (
                      <p className="mb-2">
                        <strong>📌 Type:</strong> 
                        <span className="badge ms-2" style={{ 
                          backgroundColor: event.backgroundColor || '#e74c3c',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {event.extendedProps.eventType}
                        </span>
                      </p>
                    )}
                    {event.extendedProps?.location && (
                      <p className="mb-2"><strong>📍 Location:</strong> {event.extendedProps.location}</p>
                    )}
                    {event.extendedProps?.organizer && (
                      <p className="mb-2"><strong>👤 Organizer:</strong> {event.extendedProps.organizer}</p>
                    )}
                    <p className="mt-3 mb-0 text-muted">
                      <small>Event ID: {event.id || event._id || 'N/A'}</small>
                    </p>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="alert alert-danger mt-3">
                  <strong>❌ Error:</strong> {error}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="modal-footer">
          {!success ? (
            <>
              <button 
                className="btn btn-outline-secondary" 
                onClick={onClose}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : 'Delete Event Permanently'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DeleteEventModal;