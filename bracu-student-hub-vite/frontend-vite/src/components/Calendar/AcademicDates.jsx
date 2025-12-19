import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios.jsx';
import '../../App.css';
import calendarApi from '../../services/calendarApi.jsx';

const AcademicDates = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAcademicEvents();
  }, []);

  const fetchAcademicEvents = async () => {
    try {
      setLoading(true);
      const response = await calendarApi.getEventsByType('academic');

      if (response.success) {
        setEvents(response.events);
        setError(null);
      } else {
        setError(response.error || 'Failed to load academic events');
      }
    } catch (err) {
      console.error('Error fetching academic events:', err);
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInCalendar = (eventId, eventDate = null) => {
    if (eventDate) {
      const date = new Date(eventDate);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      navigate('/calendar', {
        state: {
          highlightEvent: eventId,
          month: month,
          year: year,
          filterType: 'academic'
        }
      });
    } else {
      navigate('/calendar', {
        state: {
          highlightEvent: eventId,
          filterType: 'academic'
        }
      });
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      try {
        await calendarApi.deleteEvent(eventId);
        setEvents(prev => prev.filter(event => event._id !== eventId));
        alert('✅ Academic event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('❌ Failed to delete event. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.start) >= now);
  };

  const getPastEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.start) < now);
  };

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  if (loading) {
    return (
      <div className="category-page-wrapper">
        <div className="category-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading academic dates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page-wrapper">
      <div className="category-container">
        {/* Header Section */}
        <div className="category-header academic">
          <div className="page-header-with-actions">
            <div className="page-header-content">
              <h1 className="category-title">🎓 Academic Dates</h1>
              <p className="category-subtitle">
                {events.length} academic event{events.length !== 1 ? 's' : ''}
                {upcomingEvents.length > 0 && ` • ${upcomingEvents.length} upcoming`}
              </p>
            </div>
            <div className="page-header-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/calendar')}
              >
                📅 View Calendar
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => navigate('/add-event', {
                  state: { defaultType: 'academic' }
                })}
              >
                ➕ Add Date
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <span className="alert-icon">⚠️</span>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>No Academic Dates Found</h3>
            <p className="text-muted mb-4">
              Add important academic dates like semester starts, holidays, and deadlines!
            </p>
            <button
              className="btn btn-danger"
              onClick={() => navigate('/add-event', {
                state: { defaultType: 'academic' }
              })}
            >
              ➕ Add First Academic Date
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="stats-summary">
              <div className="stats-grid">
                <div className="stat-card danger">
                  <div className="stat-icon">🎓</div>
                  <div className="stat-content">
                    <h3>{events.length}</h3>
                    <p>Total Dates</p>
                  </div>
                </div>
                <div className="stat-card danger">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-content">
                    <h3>{upcomingEvents.length}</h3>
                    <p>Upcoming</p>
                  </div>
                </div>
                <div className="stat-card danger">
                  <div className="stat-icon">📜</div>
                  <div className="stat-content">
                    <h3>{pastEvents.length}</h3>
                    <p>Past</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events - Card View */}
            {upcomingEvents.length > 0 && (
              <div className="dashboard-card mt-4">
                <div className="card-header">
                  <h3>📅 Upcoming Academic Dates</h3>
                  <span className="badge bg-danger">{upcomingEvents.length} upcoming</span>
                </div>
                <div className="card-body">
                  <div className="events-grid">
                    {upcomingEvents.map(event => (
                      <div key={event._id} className="event-card">
                        <div className="event-type-badge" style={{ backgroundColor: '#e74c3c', color: 'white' }}>
                          Academic
                        </div>
                        <div className="event-date">
                          <div className="date-day">
                            {new Date(event.start).getDate()}
                          </div>
                          <div className="date-month">
                            {new Date(event.start).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </div>
                        <div className="event-content">
                          <h3 className="event-title">{event.title}</h3>

                          <div className="event-time">
                            <span>⏰</span>
                            <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
                          </div>

                          {event.location && (
                            <div className="event-location">
                              <span>📍</span>
                              <span>{event.location}</span>
                            </div>
                          )}

                          {event.description && (
                            <div className="event-description">
                              <p>{event.description.substring(0, 100)}{event.description.length > 100 ? '...' : ''}</p>
                            </div>
                          )}

                          <div className="event-meta">
                            <div className="meta-item">
                              <span>📅</span>
                              <span>{formatDate(event.start)}</span>
                            </div>
                            {event.organizer && (
                              <div className="meta-item">
                                <span>👤</span>
                                <span>{event.organizer}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="event-actions">
                          <button
                            className="btn btn-outline"
                            onClick={() => handleViewInCalendar(event._id, event.start)}
                          >
                            📅 View in Calendar
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteEvent(event._id, event.title)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Past Events - Table View */}
            {pastEvents.length > 0 && (
              <div className="dashboard-card mt-4">
                <div className="card-header">
                  <h3>📜 Past Academic Dates</h3>
                  <span className="badge bg-secondary">{pastEvents.length} past</span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="spaced-table">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Date</th>
                          <th>Location</th>
                          <th>Type</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pastEvents.map(event => (
                          <tr key={event._id} className="opacity-75">
                            <td>
                              <div>
                                <h6 className="fw-bold mb-1">{event.title}</h6>
                                {event.description && (
                                  <p className="text-muted small mb-0">{event.description.substring(0, 60)}...</p>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="fw-medium">
                                {formatDate(event.start)}
                              </div>
                              <div className="text-muted small">
                                {formatTime(event.start)}
                              </div>
                            </td>
                            <td>
                              {event.location || 'Not specified'}
                            </td>
                            <td>
                              <span className="badge academic">Academic</span>
                            </td>
                            <td className="text-center">
                              <div className="action-button-group compact">
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleViewInCalendar(event._id, event.start)}
                                >
                                  📅 View
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteEvent(event._id, event.title)}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="dashboard-card mt-4">
              <div className="card-header">
                <h3>⚡ Quick Academic Actions</h3>
              </div>
              <div className="card-body">
                <div className="quick-actions-grid">
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate('/add-event', {
                      state: { defaultType: 'academic' }
                    })}
                  >
                    <span className="action-icon">➕</span>
                    <span className="action-label">Add Date</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate('/calendar')}
                  >
                    <span className="action-icon">📅</span>
                    <span className="action-label">Calendar View</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={fetchAcademicEvents}
                  >
                    <span className="action-icon">🔄</span>
                    <span className="action-label">Refresh</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => window.print()}
                  >
                    <span className="action-icon">🖨️</span>
                    <span className="action-label">Print Schedule</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-top">
          <div className="text-center text-muted small">
            <p>💡 <strong>Tip:</strong> Add semester starts, holidays, registration deadlines, and other important academic dates.</p>
            <button
              className="btn btn-outline btn-sm mt-2"
              onClick={fetchAcademicEvents}
            >
              🔄 Refresh Dates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicDates;