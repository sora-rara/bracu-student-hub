import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddEvent.css';

const API_BASE_URL = 'http://localhost:5000/api';

const AddEvent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const preSelectedType = location.state?.preSelectedType;
  const sourcePage = location.state?.sourcePage;

  const [eventData, setEventData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    type: preSelectedType || 'academic',
    category: 'general'
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
    // Validate dates
    if (!eventData.startDate) {
      setError('Start date is required');
      setLoading(false);
      return;
    }

    // If end date is not provided, use start date
    const endDate = eventData.endDate || eventData.startDate;

    // Validate end date is not before start date
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

    // Format category based on type
    const categoryMap = {
      'academic': 'Academic Dates',
      'club': 'Club Activities',
      'exam': 'Exam Schedule',
      'holiday': 'Holiday',
      'other': 'General',
      'general': 'General'
    };
    const category = categoryMap[eventData.type] || 'General';

    const payload = {
      title: eventData.title,
      startDate: eventData.startDate,
      endDate: endDate,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      location: eventData.location,
      description: eventData.description,
      type: eventData.type,
      category: category,
      organizer: 'User'
    };

    console.log('📡 Sending event →', payload);

    const response = await axios.post(`${API_BASE_URL}/events`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Received response →', response.data);

    if (response.data.success) {
      setSuccess('✅ Event added successfully!');
      
      // Reset form (NO AUTO-REDIRECT)
      setEventData({
        title: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        type: preSelectedType || 'academic',
        category: 'general'
      });
    } else {
      setError(response.data.error || 'Failed to add event');
    }

  } catch (err) {
    console.error('❌ Error adding event:', err);
    setError(err.response?.data?.error || 'Failed to add event. Please try again.');
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
      category: 'general'
    });
    setError('');
    setSuccess('');
  };

const goBack = () => {
  // Optional: Add a confirmation if form has data
  const hasData = Object.values(eventData).some(
    (value, key) => key !== 'type' && value && value.toString().trim() !== ''
  );
  
  if (hasData && !success && !window.confirm('You have unsaved changes. Go back anyway?')) {
    return;
  }
  
  if (sourcePage) {
    switch(sourcePage) {
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
                min={eventData.startDate}
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
                  <br/>
                  <small>Duration: {calculateDuration()}</small>
                </>
              ) : 'Select dates'}
            </p>
            
            <p><strong>⏰ Time:</strong></p>
            <p>
              {eventData.startTime ? (
                <>
                  {eventData.startTime}
                  {eventData.endTime ? ` to ${eventData.endTime}` : ' (No end time)'}
                </>
              ) : 'All-day event'}
            </p>
            
            <p><strong>📍 Location:</strong></p>
            <p>{eventData.location || 'Not specified'}</p>
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

export default AddEvent;