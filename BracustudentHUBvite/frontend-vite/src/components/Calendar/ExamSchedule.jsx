import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import calendarApi from '../../services/calendarApi.jsx';
import '../../App.css';

const ExamSchedule = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllExamEvents();
  }, []);

  // Updated to fetch both user exams and university exams
  const fetchAllExamEvents = async () => {
    try {
      setLoading(true);

      // Fetch user's personal exam events
      const userExamsResponse = await calendarApi.getEventsByType('exam');
      let userExams = [];

      if (userExamsResponse.success) {
        userExams = userExamsResponse.events.map(event => ({
          ...event,
          isUniversityEvent: false,
          source: 'personal'
        }));
      }

      // Fetch university exam events (if the function exists)
      let universityExams = [];
      try {
        if (calendarApi.getUniversityEvents) {
          const universityResponse = await calendarApi.getUniversityEvents();
          // Filter to only get exam type university events
          universityExams = universityResponse
            .filter(event => event.eventType === 'exam')
            .map(event => ({
              ...event,
              isUniversityEvent: true,
              source: 'university',
              // Map university event fields to match your existing event structure
              title: event.title,
              description: event.description,
              start: event.date ? `${event.date}T${event.time}` : event.date,
              end: event.date ? `${event.date}T${event.time}` : event.date,
              location: event.location,
              type: 'exam'
            }));
        }
      } catch (uniError) {
        console.log('University events not available:', uniError);
      }

      // Combine both types of events
      const allEvents = [...userExams, ...universityExams];

      setEvents(allEvents);
      setError(null);

    } catch (err) {
      console.error('Error fetching exam schedule:', err);
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
          year: year
        }
      });
    } else {
      navigate('/calendar', {
        state: {
          highlightEvent: eventId
        }
      });
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      try {
        await calendarApi.deleteEvent(eventId);
        setEvents(prev => prev.filter(event => event._id !== eventId));
        alert('✅ Exam deleted successfully!');
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('❌ Failed to delete exam. Please try again.');
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

  const getFilteredEvents = () => {
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return events.filter(event => new Date(event.start) >= now);
      case 'past':
        return events.filter(event => new Date(event.start) < now);
      default:
        return events;
    }
  };

  const getUpcomingExamsCount = () => {
    const now = new Date();
    return events.filter(event => new Date(event.start) >= now).length;
  };

  const calculateDaysUntil = (eventDate) => {
    const now = new Date();
    const examDate = new Date(eventDate);
    const diffTime = examDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredEvents = getFilteredEvents();
  const upcomingExamsCount = getUpcomingExamsCount();

  if (loading) {
    return (
      <div className="category-page-wrapper">
        <div className="category-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading exam schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page-wrapper">
      <div className="category-container">
        {/* Header Section */}
        <div className="category-header exam">
          <div className="page-header-with-actions">
            <div className="page-header-content">
              <h1 className="category-title">📝 Exam Schedule</h1>
              <p className="category-subtitle">
                {events.length} exam{events.length !== 1 ? 's' : ''}
                {upcomingExamsCount > 0 && ` • ${upcomingExamsCount} upcoming`}
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
                className="btn btn-warning btn-sm"
                onClick={() => navigate('/add-event', {
                  state: { defaultType: 'exam' }
                })}
              >
                ➕ Add Exam
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              📋 All ({events.length})
            </button>
            <button
              className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              ⏰ Upcoming ({getUpcomingExamsCount()})
            </button>
            <button
              className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
              onClick={() => setFilter('past')}
            >
              📜 Past ({events.length - getUpcomingExamsCount()})
            </button>
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
            <div className="empty-icon">📝</div>
            <h3>No Exams Scheduled</h3>
            <p className="text-muted mb-4">Add midterms, finals, and other important exams to the schedule!</p>
            <button
              className="btn btn-warning"
              onClick={() => navigate('/add-event', {
                state: { defaultType: 'exam' }
              })}
            >
              ➕ Add Your First Exam
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No {filter} exams found</h3>
            <p className="text-muted">Try changing the filter or add new exams.</p>
          </div>
        ) : (
          <div className="dashboard-card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="spaced-table">
                  <thead>
                    <tr>
                      <th className="exam-header-orange">Exam</th>
                      <th className="exam-header-green">Date & Time</th>
                      <th className="exam-header-blue text-center">Days Until</th>
                      <th className="exam-header-purple">Location</th>
                      <th className="exam-header-red">Type</th>
                      <th className="exam-header-teal text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(event => {
                      const daysUntil = calculateDaysUntil(event.start);
                      const isUpcoming = daysUntil >= 0;
                      const isUniversityEvent = event.isUniversityEvent || event.source === 'university';

                      return (
                        <tr key={event._id || event.id} className={isUpcoming ? '' : 'opacity-75'}>
                          <td>
                            <div className="flex-column">
                              <div className="mb-2">
                                {isUniversityEvent ? (
                                  <span className="badge bg-blue">
                                    🏛️ UNIVERSITY
                                  </span>
                                ) : isUpcoming ? (
                                  daysUntil === 0 ? (
                                    <span className="badge bg-red">
                                      🚨 TODAY
                                    </span>
                                  ) : daysUntil === 1 ? (
                                    <span className="badge bg-orange">
                                      ⚠️ TOMORROW
                                    </span>
                                  ) : daysUntil <= 7 ? (
                                    <span className="badge bg-light-blue">
                                      📌 THIS WEEK
                                    </span>
                                  ) : null
                                ) : (
                                  <span className="badge bg-gray">
                                    ✅ PAST
                                  </span>
                                )}
                              </div>
                              <div>
                                <h6 className="fw-bold mb-1">
                                  {event.title}
                                  {isUniversityEvent && (
                                    <span className="text-primary small">(University)</span>
                                  )}
                                </h6>
                                {event.description && (
                                  <p className="text-muted small mb-0">{event.description.substring(0, 60)}...</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium align-center gap-2 mb-1">
                              <span>📅</span>
                              <span>{formatDate(event.start)}</span>
                            </div>
                            <div className="text-muted small align-center gap-2">
                              <span>⏰</span>
                              <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            {isUpcoming ? (
                              <div className="flex-column align-center">
                                <span className={`badge ${daysUntil <= 3 ? 'bg-red' : daysUntil <= 7 ? 'bg-orange' : 'bg-green'} text-white mb-1`}>
                                  {daysUntil === 0 ? (
                                    <>
                                      🎯 Today
                                    </>
                                  ) : (
                                    <>
                                      ⏱️ {daysUntil}
                                    </>
                                  )}
                                </span>
                                {daysUntil > 0 && (
                                  <span className="text-muted small">day{daysUntil !== 1 ? 's' : ''}</span>
                                )}
                              </div>
                            ) : (
                              <span className="badge bg-gray">
                                ✅ Completed
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="align-center gap-2">
                              <span>📍</span>
                              <span>{event.location || 'Not specified'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-orange">
                              📝 Exam
                              {isUniversityEvent && <span>🏛️</span>}
                            </span>
                          </td>
                          <td>
                            <div className="action-button-group compact">
                              <button
                                className="btn btn-sm btn-green"
                                onClick={() => handleViewInCalendar(event._id || event.id, event.start)}
                              >
                                📅 Calendar
                              </button>
                              {!isUniversityEvent && (
                                <button
                                  className="btn btn-sm btn-red"
                                  onClick={() => handleDeleteEvent(event._id, event.title)}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Summary Section */}
        {upcomingExamsCount > 0 && (
          <div className="stats-summary">
            <div className="stats-grid">
              <div className="stat-card warning">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>{events.length}</h3>
                  <p>Total Exams</p>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <h3>{upcomingExamsCount}</h3>
                  <p>Upcoming Exams</p>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>
                    {upcomingExamsCount > 0 ?
                      calculateDaysUntil(events.filter(e => new Date(e.start) >= new Date())[0]?.start) :
                      'N/A'}
                  </h3>
                  <p>Next Exam In (days)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="dashboard-card mt-4">
          <div className="card-header">
            <h3>⚡ Quick Exam Actions</h3>
          </div>
          <div className="card-body">
            <div className="quick-actions-grid">
              <button
                className="quick-action-btn btn-orange"
                onClick={() => navigate('/add-event', {
                  state: { defaultType: 'exam' }
                })}
              >
                <span className="action-icon">➕</span>
                <span className="action-label">Add Exam</span>
              </button>
              <button
                className="quick-action-btn btn-blue"
                onClick={() => navigate('/calendar')}
              >
                <span className="action-icon">📅</span>
                <span className="action-label">Calendar View</span>
              </button>
              <button
                className="quick-action-btn btn-green"
                onClick={fetchAllExamEvents}
              >
                <span className="action-icon">🔄</span>
                <span className="action-label">Refresh</span>
              </button>
              <button
                className="quick-action-btn btn-purple"
                onClick={() => window.print()}
              >
                <span className="action-icon">🖨️</span>
                <span className="action-label">Print Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-4 border-top">
          <div className="justify-between align-center">
            <div className="text-muted small align-center gap-2">
              <span>💡</span>
              <span>Right-click on calendar events to view details or delete</span>
            </div>
            <button
              className="btn btn-outline btn-orange btn-sm"
              onClick={fetchAllExamEvents}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSchedule;