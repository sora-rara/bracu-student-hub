import React, { useState } from 'react';
import '../../App.css';

import calendarApi from '../../services/calendarApi';

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

      console.log('=== DELETE EVENT DEBUG START ===');
      console.log('Event object:', event);
      console.log('User from localStorage:', localStorage.getItem('user'));

      // Get event ID - try multiple possible sources
      const eventId = event.id || event._id || event.extendedProps?._id;

      if (!eventId) {
        setError('No event ID found. Event object: ' + JSON.stringify(event, null, 2));
        console.log('=== DELETE EVENT DEBUG END - NO ID ===');
        return;
      }

      console.log(`🗑️ Attempting to delete event ID: ${eventId}`);
      console.log('calendarApi available:', !!calendarApi);
      console.log('calendarApi.deleteEvent method:', calendarApi.deleteEvent);

      // Log session info
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Current user data:', userData);
        console.log('Is admin?', userData.role === 'admin' || userData.isAdmin);
      } catch (e) {
        console.log('Error reading user data:', e);
      }

      const response = await calendarApi.deleteEvent(eventId);

      console.log('✅ Backend response:', response);

      if (response.success) {
        setSuccess(true);
        console.log('=== DELETE EVENT DEBUG END - SUCCESS ===');

        // Wait 1.5 seconds then close and notify parent
        setTimeout(() => {
          onDeleteSuccess(eventId);
          onClose();
        }, 1500);

      } else {
        setError(response.error || 'Failed to delete event');
        console.log('=== DELETE EVENT DEBUG END - API ERROR ===');
      }

    } catch (err) {
      console.error('❌ Delete error:', err);
      console.error('Full error object:', err);
      console.error('Error response:', err.response?.data);
      console.log('=== DELETE EVENT DEBUG END - CATCH ERROR ===');

      // Check if it's an admin access error
      if (err.response?.status === 403) {
        setError('Admin access required. You are logged in as: ' +
          JSON.parse(localStorage.getItem('user') || '{}').role || 'unknown role');
      } else if (err.response) {
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Date error';
    }
  };

  const getTimeString = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">🗑️ Delete Event</h5>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={deleting}
          >
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
                  <h6 className="card-title">{event.title || 'Untitled Event'}</h6>
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
                      <small>Event ID: {event.id || event._id || event.extendedProps?._id || 'N/A'}</small>
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
                    <span className="spinner" style={{ marginRight: '8px' }}></span>
                    Deleting...
                  </>
                ) : 'Delete Event Permanently'}
              </button>
            </>
          ) : null}
        </div>

        {/* Debug section */}
        <div className="mt-3 p-2 border-top">
          <small className="text-muted">
            Debug: Event ID - {event.id || event._id || event.extendedProps?._id || 'Not found'}
          </small>
          <button
            onClick={() => console.log('Full event object:', event)}
            className="btn btn-sm btn-outline ms-2"
          >
            Log Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEventModal;