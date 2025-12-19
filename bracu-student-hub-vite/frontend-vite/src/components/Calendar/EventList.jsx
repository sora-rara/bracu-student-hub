import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

import calendarApi from '../../services/calendarApi';

const EventList = ({ eventType, title, description }) => {
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    fetchUpcomingEvents();
  }, [eventType]);

  const fetchEvents = async () => {
    try {
      console.log(`📋 Fetching ${eventType} events...`);
      const response = await calendarApi.getEventsByType(eventType);

      console.log(`✅ ${eventType} events response:`, response);

      if (response.success) {
        // Filter out events with invalid dates and ensure unique IDs
        const validEvents = response.events.filter(event =>
          event && event._id && event.start && !isNaN(new Date(event.start).getTime())
        );

        // Remove duplicates by _id
        const uniqueEvents = validEvents.filter((event, index, self) =>
          index === self.findIndex(e => e._id === event._id)
        );

        console.log(`📊 Found ${uniqueEvents.length} unique ${eventType} events`);
        setEvents(uniqueEvents);
      }
    } catch (error) {
      console.error(`Error fetching ${eventType} events:`, error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await calendarApi.getEventsByType(eventType);
      if (response.success) {
        // Filter out events with invalid dates
        const validEvents = response.events.filter(event =>
          event && event._id && event.start && !isNaN(new Date(event.start).getTime())
        );

        // Get upcoming events (events that start today or in the future)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        const upcoming = validEvents.filter(event => {
          const eventDate = new Date(event.start);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= now;
        });

        // Remove duplicates by _id
        const uniqueUpcoming = upcoming.filter((event, index, self) =>
          index === self.findIndex(e => e._id === event._id)
        );

        setUpcomingEvents(uniqueUpcoming);
        setLoading(false);
      }
    } catch (error) {
      console.error(`Error fetching upcoming ${eventType} events:`, error);
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    navigate('/add-event', {
      state: {
        preSelectedType: eventType,
        sourcePage: eventType
      }
    });
  };

  const handleViewInCalendar = () => {
    navigate('/calendar');
  };

  // Safe date parsing utility
  const safeParseDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatDate = (dateString) => {
    const date = safeParseDate(dateString);
    if (!date) return 'Date not set';

    try {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  const formatEventTime = (event) => {
    if (!event || !event.start) {
      return '🕒 Date not set';
    }

    const startDate = safeParseDate(event.start);
    if (!startDate) return '🕒 Invalid date';

    // If no end date or invalid end date, just show start date
    const endDate = safeParseDate(event.end);
    if (!endDate) {
      return `🕒 ${formatDate(event.start)}`;
    }

    // Check if the dates are on the same day
    const isSameDay = startDate.toDateString() === endDate.toDateString();

    if (isSameDay) {
      // Same day, show start date with time and end time only
      const startTime = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTime = endDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const datePart = startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return `🕒 ${datePart}, ${startTime} - ${endTime}`;
    } else {
      // Different days, show both full dates
      return `🕒 ${formatDate(event.start)} to ${formatDate(event.end)}`;
    }
  };

  const getTypeDisplayName = () => {
    const names = {
      'academic': 'Academic Dates',
      'club': 'Club Activities',
      'exam': 'Exam Schedule',
      'holiday': 'Holidays',
      'other': 'Other Events'
    };
    return names[eventType] || eventType;
  };

  const getTypeColor = () => {
    const colors = {
      'academic': '#e74c3c',
      'club': '#2ecc71',
      'exam': '#f39c12',
      'holiday': '#9b59b6',
      'other': '#3498db'
    };
    return colors[eventType] || '#3498db';
  };

  // Safely extract date components
  const getDateComponents = (dateString) => {
    const date = safeParseDate(dateString);
    if (!date) return { day: '?', month: '---' };

    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' })
    };
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      try {
        console.log(`🗑️ Deleting event ${eventId} from EventList`);
        const response = await calendarApi.deleteEvent(eventId);

        if (response.success) {
          alert('✅ Event deleted successfully!');
          // Refresh events
          fetchEvents();
          fetchUpcomingEvents();
        } else {
          alert('❌ Failed to delete event: ' + response.error);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('❌ Failed to delete event. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="event-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading {getTypeDisplayName()}...</p>
        </div>
      </div>
    );
  }

  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : events;

  return (
    <div className="event-list-container">
      <div className="event-list-header">
        <div className="header-left">
          <h1 className="page-title">
            <span className="type-icon" style={{ backgroundColor: getTypeColor() }}>
              {eventType === 'academic' ? '📚' :
                eventType === 'club' ? '🎯' :
                  eventType === 'exam' ? '📝' : '📅'}
            </span>
            {title || getTypeDisplayName()}
          </h1>
          <p className="page-description">
            {description || `All ${getTypeDisplayName().toLowerCase()} at your university`}
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={handleAddEvent}
          >
            + Add New {getTypeDisplayName().slice(0, -1)}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleViewInCalendar}
          >
            📅 View in Calendar
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{upcomingEvents.length}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{events.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {upcomingEvents.length > 0 && upcomingEvents[0]?.start
              ? (() => {
                const date = safeParseDate(upcomingEvents[0].start);
                return date ? date.toLocaleDateString('en-US', { weekday: 'short' }) : 'No upcoming';
              })()
              : 'No upcoming'}
          </div>
          <div className="stat-label">Next Event</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingEvents.length})
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Events ({events.length})
        </button>
      </div>

      {displayEvents.length === 0 ? (
        <div className="no-events">
          <div className="no-events-icon">
            {eventType === 'academic' ? '📚' :
              eventType === 'club' ? '🎯' :
                eventType === 'exam' ? '📝' : '📅'}
          </div>
          <h3>No {getTypeDisplayName().toLowerCase()} found</h3>
          <p>Be the first to add a {getTypeDisplayName().slice(0, -1).toLowerCase()}!</p>
          <button
            className="btn btn-primary"
            onClick={handleAddEvent}
          >
            + Add Your First {getTypeDisplayName().slice(0, -1)}
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {displayEvents.map((event, index) => {
            const dateComponents = getDateComponents(event.start);
            // Create a unique key using _id and index to prevent duplicate key warnings
            const uniqueKey = event._id ? `${event._id}-${index}` : `event-${index}-${Date.now()}`;

            return (
              <div key={uniqueKey} className="event-card">
                <div
                  className="event-type-badge"
                  style={{ backgroundColor: getTypeColor() }}
                >
                  {eventType === 'academic' ? 'Academic' :
                    eventType === 'club' ? 'Club' :
                      eventType === 'exam' ? 'Exam' : 'Event'}
                </div>

                <div className="event-date">
                  <div className="date-day">
                    {dateComponents.day}
                  </div>
                  <div className="date-month">
                    {dateComponents.month}
                  </div>
                </div>

                <div className="event-content">
                  <h3 className="event-title">{event.title || 'Untitled Event'}</h3>
                  <p className="event-time">
                    {formatEventTime(event)}
                  </p>
                  {event.location && (
                    <p className="event-location">
                      📍 {event.location}
                    </p>
                  )}
                  {event.description && (
                    <p className="event-description">
                      {event.description.length > 100
                        ? `${event.description.substring(0, 100)}...`
                        : event.description}
                    </p>
                  )}
                  <div className="event-meta">
                    <span className="meta-item">
                      👤 {event.organizer || 'Unknown'}
                    </span>
                    {event.category && (
                      <span className="meta-item">
                        🏷️ {event.category}
                      </span>
                    )}
                    {event.isUniversityEvent && (
                      <span className="meta-item">
                        🏛️ University Event
                      </span>
                    )}
                  </div>
                </div>

                <div className="event-actions">
                  <button
                    className="btn-action"
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn-action"
                    onClick={() => navigate('/calendar', {
                      state: { highlightEvent: event._id }
                    })}
                  >
                    View in Calendar
                  </button>
                  <button
                    className="btn-action btn-danger"
                    onClick={() => handleDeleteEvent(event._id, event.title)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="sync-info">
        <div className="info-card">
          <h4>🔗 Synced with Calendar</h4>
          <p>All events added here automatically appear in the main calendar view.</p>
          <button
            className="btn btn-outline"
            onClick={handleViewInCalendar}
          >
            Go to Calendar →
          </button>
        </div>

        <div className="info-card">
          <h4>📊 Event Statistics</h4>
          <ul>
            <li>Total {getTypeDisplayName().toLowerCase()}: {events.length}</li>
            <li>Upcoming: {upcomingEvents.length}</li>
            <li>Past: {events.length - upcomingEvents.length}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EventList;