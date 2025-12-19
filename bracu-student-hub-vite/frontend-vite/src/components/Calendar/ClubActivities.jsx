import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios.jsx';
import calendarApi from '../../services/calendarApi.jsx';
import '../../App.css';

const ClubActivities = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClubEvents();
  }, []);

  const fetchClubEvents = async () => {
    try {
      setLoading(true);
      const response = await calendarApi.getEventsByType('club');

      if (response.success) {
        setEvents(response.events);
      }
    } catch (err) {
      console.error('Error fetching club events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Delete this club activity?')) {
      try {
        await calendarApi.deleteEvent(eventId);
        setEvents(prev => prev.filter(event => event._id !== eventId));
        alert('✅ Club activity deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('❌ Failed to delete club activity. Please try again.');
      }
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
          year: year
        }
      });
    } else {
      navigate('/calendar');
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

  if (loading) {
    return (
      <div className="category-page-wrapper">
        <div className="category-container">
          <div className="text-center py-5">
            <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-3">Loading club activities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page-wrapper">
      <div className="category-container">
        {/* FIXED: Header Section */}
        <div className="category-header club">
          <div className="page-header-with-actions">
            <div className="page-header-content">
              <h1 className="category-title">🎯 Club Activities</h1>
              <p className="category-subtitle">
                {events.length} club event{events.length !== 1 ? 's' : ''}
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
                className="btn btn-success btn-sm"
                onClick={() => navigate('/add-event', {
                  state: { defaultType: 'club' }
                })}
              >
                ➕ Add Activity
              </button>
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No Club Activities Found</h3>
            <p className="text-muted mb-4">Add your first club activity to get started!</p>
            <button
              className="btn btn-success"
              onClick={() => navigate('/add-event', {
                state: { defaultType: 'club' }
              })}
            >
              ➕ Add First Club Activity
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="stats-summary">
              <div className="stats-grid">
                <div className="stat-card success">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <h3>{events.length}</h3>
                    <p>Total Activities</p>
                  </div>
                </div>
                <div className="stat-card success">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-content">
                    <h3>
                      {events.filter(event => new Date(event.start) >= new Date()).length}
                    </h3>
                    <p>Upcoming</p>
                  </div>
                </div>
                <div className="stat-card success">
                  <div className="stat-icon">🏷️</div>
                  <div className="stat-content">
                    <h3>
                      {[...new Set(events.map(event => event.clubName || 'General'))].length}
                    </h3>
                    <p>Clubs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activities Grid */}
            <div className="events-grid">
              {events.map(event => (
                <div key={event._id} className="event-card">
                  <div className="event-type-badge" style={{ backgroundColor: '#2ecc71', color: 'white' }}>
                    Club
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
                      <span>{formatTime(event.start)}</span>
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
                      {event.clubName && (
                        <div className="meta-item">
                          <span>🏷️</span>
                          <span>{event.clubName}</span>
                        </div>
                      )}
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
                      onClick={() => handleDeleteEvent(event._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card mt-4">
              <div className="card-header">
                <h3>⚡ Quick Club Actions</h3>
              </div>
              <div className="card-body">
                <div className="quick-actions-grid">
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate('/add-event', {
                      state: { defaultType: 'club' }
                    })}
                  >
                    <span className="action-icon">➕</span>
                    <span className="action-label">Add Activity</span>
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
                    onClick={fetchClubEvents}
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
            <p>💡 <strong>Tip:</strong> Right-click on calendar events to view details or delete club activities.</p>
            <button
              className="btn btn-outline btn-sm mt-2"
              onClick={fetchClubEvents}
            >
              🔄 Refresh Activities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubActivities;