import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css';

const API_BASE_URL = 'http://localhost:5000/api/calendar';

const AddEvent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get state from navigation - FIXED: Add optional chaining and defaults
  const preSelectedType = location.state?.preSelectedType || location.state?.defaultType;
  const sourcePage = location.state?.sourcePage;

  // Debug: Log when component loads
  useEffect(() => {
    console.log('📍 AddEvent loaded with location.state:', location.state);
    console.log('📍 sourcePage:', sourcePage);
    console.log('📍 preSelectedType:', preSelectedType);
    console.log('📍 Full location:', location);
  }, [location, sourcePage, preSelectedType]);

  const [eventData, setEventData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    type: preSelectedType || 'academic', // Use 'type' not 'eventType' for frontend
    category: 'General'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!eventData.title.trim()) {
        setError('Event title is required');
        setLoading(false);
        return;
      }

      if (!eventData.startDate) {
        setError('Start date is required');
        setLoading(false);
        return;
      }

      // If end date is not provided, use start date
      const endDate = eventData.endDate || eventData.startDate;

      // Validate dates
      const start = new Date(eventData.startDate);
      const end = new Date(endDate);

      if (end < start) {
        setError('End date cannot be before start date');
        setLoading(false);
        return;
      }

      // Validate times if provided
      if (eventData.startTime && eventData.endTime) {
        const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`);
        const endDateTime = new Date(`${endDate}T${eventData.endTime}:00`);

        if (endDateTime <= startDateTime) {
          setError('End time must be after start time');
          setLoading(false);
          return;
        }
      }

      // Map frontend types to backend eventType ENUM VALUES
      // Based on error: backend expects specific enum values
      const typeMap = {
        'academic': 'university', // Check if this is valid
        'club': 'club',          // Try 'club' instead of 'university'
        'exam': 'exam',          // Try 'exam' instead of 'university'
        'holiday': 'holiday',    // Try 'holiday' instead of 'university'
        'other': 'general'       // Try 'general' instead of 'university'
      };

      // Map to backend category
      const categoryMap = {
        'academic': 'Academic Dates',
        'club': 'Club Activities',
        'exam': 'Exam Schedule',
        'holiday': 'Holiday',
        'other': 'General'
      };

      // Format date/time to ISO string (as backend expects)
      const formatDateTime = (date, time) => {
        if (!date) return null;

        let dateTimeString = date;
        if (time) {
          dateTimeString += `T${time}:00`;
        } else {
          // If no time specified, set to start of day
          dateTimeString += 'T00:00:00';
        }

        return new Date(dateTimeString).toISOString();
      };

      // CRITICAL: Create payload that matches backend ENUM expectations
      const payload = {
        title: eventData.title.trim(),
        description: eventData.description.trim() || '',
        location: eventData.location.trim() || '',
        organizer: 'User',
        eventType: typeMap[eventData.type] || 'general', // Use mapped value
        category: categoryMap[eventData.type] || 'General',
        isUniversityEvent: false, // Set based on type
        visibleToAll: true,
        isImportant: false,
        createdBy: 'user', // FIXED: Use 'user' not email

        // These are the fields your backend expects
        start: formatDateTime(eventData.startDate, eventData.startTime),
        end: formatDateTime(endDate, eventData.endTime || '23:59'),

        // Optional: Set end time properly for all-day events
        allDay: !eventData.startTime
      };

      // If it's an all-day event, adjust end time
      if (!eventData.startTime) {
        const endDateObj = new Date(payload.end);
        endDateObj.setHours(23, 59, 59, 999);
        payload.end = endDateObj.toISOString();
      }

      // Set isUniversityEvent based on type
      if (eventData.type === 'academic') {
        payload.isUniversityEvent = true;
      }

      console.log('📡 Sending to backend:', JSON.stringify(payload, null, 2));
      console.log('🌐 Endpoint:', `${API_BASE_URL}/events`);

      const response = await axios.post(`${API_BASE_URL}/events`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      console.log('✅ Backend response:', response.data);

      if (response.data.success || response.data._id) {
        setSuccess('✅ Event added successfully!');

        // Reset form
        setEventData({
          title: '',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          location: '',
          description: '',
          type: preSelectedType || 'academic',
          category: 'General'
        });

        // Optional: Redirect after success - FIXED PATHS
        setTimeout(() => {
          if (sourcePage) {
            switch (sourcePage) {
              case 'academic':
                navigate('/academic-dates', { state: { refresh: true } });
                break;
              case 'club':
                navigate('/club-activities', { state: { refresh: true } });
                break;
              case 'exam':
                navigate('/exam-schedule', { state: { refresh: true } });
                break;
              default:
                navigate('/calendar', { state: { refresh: true } });
            }
          } else {
            navigate('/calendar', { state: { refresh: true } });
          }
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to add event');
      }

    } catch (err) {
      console.error('❌ Error:', err);

      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Error details:', err.response.data?.errors);

        if (err.response.status === 401 || err.response.status === 403) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.status === 400) {
          // Show validation errors
          const validationErrors = err.response.data?.errors || err.response.data?.error;
          if (validationErrors) {
            const errorMessages = Object.values(validationErrors).map(err => err.message || err);
            setError(`Validation errors: ${errorMessages.join(', ')}`);
          } else {
            setError(`Validation error: ${JSON.stringify(err.response.data)}`);
          }
        } else {
          setError(`Server error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
        }
      } else if (err.request) {
        setError('No response from server. Check if backend is running.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEventData({
      title: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      type: preSelectedType || 'academic',
      category: 'General'
    });
    setError('');
    setSuccess('');
  };

  const goBack = () => {
    const hasData = Object.values(eventData).some(
      (value, key) => key !== 'type' && value && value.toString().trim() !== ''
    );

    if (hasData && !success && !window.confirm('You have unsaved changes. Go back anyway?')) {
      return;
    }

    // FIXED: Use correct navigation paths
    if (sourcePage) {
      switch (sourcePage) {
        case 'academic': navigate('/academic-dates'); break;
        case 'club': navigate('/club-activities'); break;
        case 'exam': navigate('/exam-schedule'); break;
        default: navigate('/calendar');
      }
    } else {
      navigate(-1);
    }
  };

  const getPageTitle = () => {
    const typeNames = {
      'academic': 'Academic Date',
      'club': 'Club Activity',
      'exam': 'Exam',
      'holiday': 'Holiday',
      'other': 'Event'
    };
    const typeName = typeNames[eventData.type] || 'Event';
    return `Add New ${typeName}`;
  };

  // Calculate event duration
  const calculateDuration = () => {
    if (!eventData.startDate) return '';

    const start = new Date(eventData.startDate);
    const end = new Date(eventData.endDate || eventData.startDate);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays === 1) {
      return '1 day';
    } else {
      return `${diffDays} days`;
    }
  };

  // Get today's date for min attribute
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="add-event-container">
      <div className="page-header">
        <button
          onClick={goBack}
          className="back-button"
          disabled={loading}
        >
          ← Back
        </button>
        <h2 className="page-title">{getPageTitle()}</h2>
      </div>

      {success && (
        <div className="alert alert-success">
          <div className="alert-content">
            <span className="alert-icon">✅</span>
            <div>
              <strong>{success}</strong>
              <p>You will be redirected in 2 seconds...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <div className="alert-content">
            <span className="alert-icon">❌</span>
            <div>
              <strong>Error</strong>
              <p>{error}</p>
              <button
                onClick={() => setError('')}
                className="btn btn-sm btn-outline"
                style={{ marginTop: '8px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-section">
          <h3 className="section-title">Event Details</h3>

          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={eventData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={eventData.startDate}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
                min={getTodayDate()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date (Optional)</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={eventData.endDate}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
                min={eventData.startDate || getTodayDate()}
              />
              <small className="helper-text">Leave empty for single-day events</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time (Optional)</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={eventData.startTime}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
              />
              <small className="helper-text">Leave empty for all-day events</small>
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time (Optional)</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={eventData.endTime}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
              />
              <small className="helper-text">Leave empty for all-day events</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Event Type *</label>
              <select
                id="type"
                name="type"
                value={eventData.type}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-select"
              >
                <option value="academic">📚 Academic Date</option>
                <option value="club">🎯 Club Activity</option>
                <option value="exam">📝 Exam</option>
                <option value="holiday">🎄 Holiday</option>
                <option value="other">📅 Other Event</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location (Optional)</label>
              <input
                type="text"
                id="location"
                name="location"
                value={eventData.location}
                onChange={handleChange}
                placeholder="e.g., Room 301, Main Hall"
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Additional Information</h3>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={eventData.description}
              onChange={handleChange}
              placeholder="Enter event description..."
              rows="4"
              disabled={loading}
              className="form-textarea"
            />
            <small className="helper-text">
              Provide details about the event for attendees
            </small>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Event Summary</h3>
          <div className="info-box">
            <p><strong>📅 Dates:</strong></p>
            <p>
              {eventData.startDate ? (
                <>
                  {formatDate(eventData.startDate)}
                  {eventData.endDate && eventData.endDate !== eventData.startDate ? (
                    ` to ${formatDate(eventData.endDate)}`
                  ) : ''}
                  <br />
                  <small>Duration: {calculateDuration()}</small>
                </>
              ) : 'Select dates'}
            </p>

            <p><strong>⏰ Time:</strong></p>
            <p>
              {eventData.startTime ? (
                <>
                  {formatTime(eventData.startTime)}
                  {eventData.endTime ? ` to ${formatTime(eventData.endTime)}` : ' (No end time)'}
                </>
              ) : 'All-day event'}
            </p>

            <p><strong>📍 Location:</strong></p>
            <p>{eventData.location || 'Not specified'}</p>

            <p><strong>📋 Type:</strong></p>
            <p>
              {eventData.type.charAt(0).toUpperCase() + eventData.type.slice(1)}
              {eventData.type === 'academic' ? ' (Academic Dates)' :
                eventData.type === 'club' ? ' (Club Activities)' :
                  eventData.type === 'exam' ? ' (Exam Schedule)' :
                    eventData.type === 'holiday' ? ' (Holiday)' : ' (General)'}
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className={`submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Adding Event...
              </>
            ) : (
              '➕ Add Event'
            )}
          </button>

          <div className="action-buttons">
            <button
              type="button"
              onClick={clearForm}
              disabled={loading}
              className="secondary-btn"
            >
              Clear Form
            </button>
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              className="outline-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* Debug section */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f0f0f0',
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4 style={{ marginTop: 0 }}>🔧 Debug Info</h4>

        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={async () => {
              console.log('🧪 Testing calendar API...');
              try {
                const response = await axios.get(`${API_BASE_URL}/events`, {
                  withCredentials: true
                });
                console.log('✅ Calendar API test:', response.data);
                alert(`API Test Successful!\nFound ${response.data.count || response.data.events?.length || 0} events`);
              } catch (err) {
                console.error('❌ API test failed:', err);
                alert(`API Test Failed:\n${err.message}`);
              }
            }}
            className="btn btn-sm"
            style={{ marginRight: '10px' }}
          >
            Test Calendar API
          </button>

          <button
            onClick={() => {
              console.log('🔍 Current state:', {
                locationState: location.state,
                sourcePage,
                preSelectedType,
                eventData,
                user: localStorage.getItem('user')
              });
            }}
            className="btn btn-sm"
          >
            Log Current State
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#666' }}>
          <p><strong>Current State:</strong></p>
          <p>sourcePage: {sourcePage || 'Not set'}</p>
          <p>preSelectedType: {preSelectedType || 'Not set'}</p>
          <p>Form type: {eventData.type}</p>
          <p>Location state: {JSON.stringify(location.state || '{}')}</p>
          <p><strong>API Endpoint:</strong> POST {API_BASE_URL}/events</p>
          <p><strong>Note:</strong> Backend expects specific enum values for eventType</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to format time
const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

export default AddEvent;