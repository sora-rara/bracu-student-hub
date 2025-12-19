import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import axios from '../../api/axios.jsx';
import DeleteEventModal from './DeleteEventModal.jsx';
import '../../App.css';

const CalendarView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    event: null
  });

  // Color mapping for event types
  const eventTypeColors = {
    academic: '#e74c3c',
    club: '#2ecc71',
    exam: '#f39c12',
    holiday: '#9b59b6',
    other: '#3498db',
    general: '#3498db'
  };

  const API_BASE_URL = 'http://localhost:5000/api/calendar';

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Fetch all events from the calendar API
      const response = await axios.get(`${API_BASE_URL}/events`);

      if (response.data.success) {
        const formattedEvents = response.data.events.map(event => {
          const color = eventTypeColors[event.type] || '#3498db';

          return {
            id: event._id,
            title: event.title + (event.isUniversityEvent ? ' 🏛️' : ''),
            start: event.startDate || event.start,
            end: event.endDate || event.end,
            backgroundColor: color,
            borderColor: color,
            extendedProps: {
              eventType: event.type,
              category: event.category,
              location: event.location,
              description: event.description,
              organizer: event.organizer,
              isUniversityEvent: event.isUniversityEvent || false
            }
          };
        });

        setEvents(formattedEvents);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setError('Failed to fetch events from server');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(`Could not connect to backend at ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, event: null });
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle navigation from Dashboard
  useEffect(() => {
    if (location.state?.month && location.state?.year) {
      const month = location.state.month;
      const year = location.state.year;

      const navigateToMonth = () => {
        if (calendarRef.current) {
          const calendarApi = calendarRef.current.getApi();
          const targetDate = new Date(year, month - 1, 1);
          calendarApi.gotoDate(targetDate);
        }
      };

      navigateToMonth();
      setTimeout(navigateToMonth, 500);

      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 100);
    }
  }, [location.state]);

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const extendedProps = event.extendedProps;

    const startDate = event.start ? new Date(event.start) : null;
    const endDate = event.end ? new Date(event.end) : null;

    let dateTimeInfo = '';
    if (startDate) {
      const isSameDay = startDate.toDateString() === endDate?.toDateString();

      if (event.allDay) {
        if (isSameDay || !endDate) {
          dateTimeInfo = `📅 Date: ${startDate.toLocaleDateString()}`;
        } else {
          dateTimeInfo = `📅 From: ${startDate.toLocaleDateString()}\n📅 To: ${endDate.toLocaleDateString()}`;
        }
      } else {
        const duration = calculateDuration(startDate, endDate);
        if (isSameDay) {
          dateTimeInfo = `📅 Date: ${startDate.toLocaleDateString()}\n⏰ Time: ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n⏱️ Duration: ${duration}`;
        } else {
          dateTimeInfo = `📅 Start: ${startDate.toLocaleString()}\n📅 End: ${endDate ? endDate.toLocaleString() : 'N/A'}\n⏱️ Duration: ${duration}`;
        }
      }
    }

    alert(
      `📅 ${event.title}\n\n` +
      `${dateTimeInfo}\n` +
      `📌 Type: ${extendedProps.eventType || 'Not specified'}\n` +
      `🏷️ Category: ${extendedProps.category || 'Not specified'}\n` +
      `📍 Location: ${extendedProps.location || 'Not specified'}\n` +
      `👤 Organizer: ${extendedProps.organizer || 'Not specified'}\n\n` +
      `📝 Description:\n${extendedProps.description || 'No description available'}`
    );
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';

    const diffMs = endDate - startDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor(
      (diffMs % (1000 * 60 * 60)) / (1000 * 60)
    );

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes}m`;
    } else {
      return `${diffMinutes} minutes`;
    }
  };

  const handleDeleteEvent = (deletedEventId) => {
    setEvents(prev => prev.filter(event => event.id !== deletedEventId));
    setDeleteModalOpen(false);
    setSelectedEvent(null);
    setContextMenu({ visible: false, x: 0, y: 0, event: null });

    const deletedEventTitle =
      events.find(e => e.id === deletedEventId)?.title || 'Event';
    alert(`✅ "${deletedEventTitle}" has been deleted successfully!`);

    setTimeout(() => fetchEvents(), 1000);
  };

  const openDeleteModal = (event) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
    setContextMenu({ visible: false, x: 0, y: 0, event: null });
  };

  const handleRefresh = () => {
    fetchEvents();
  };

  // Handle right-click on events
  useEffect(() => {
    const handleContextMenu = (e) => {
      const target = e.target.closest('.fc-event');
      if (target) {
        e.preventDefault();
        // Find the event by title or other identifier
        const eventTitle = target.querySelector('.fc-event-title')?.textContent;
        const event = events.find(ev => ev.title === eventTitle);

        if (event) {
          setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            event: event
          });
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [events]);

  if (loading && events.length === 0) {
    return (
      <div className="calendar-container">
        <div className="page-header">
          <h1 className="page-title">📅 University Event Calendar</h1>
          <p className="page-subtitle">Loading events...</p>
        </div>
        <div className="text-center py-5">
          <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="mt-3">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="page-header">
        <h1 className="page-title">📅 University Event Calendar</h1>
        <p className="page-subtitle">
          {events.length} event{events.length !== 1 ? 's' : ''} • Last updated: {lastUpdated || 'Never'}
        </p>
      </div>

      <div className="calendar-actions">
        <button
          className="btn btn-primary"
          onClick={() => navigate('/add-event')}
        >
          ➕ Add Event
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: eventTypeColors.academic }}></div>
          <span>Academic Dates</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: eventTypeColors.club }}></div>
          <span>Club Activities</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: eventTypeColors.exam }}></div>
          <span>Exams</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: eventTypeColors.holiday }}></div>
          <span>Holidays</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <h4>❌ Error</h4>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={fetchEvents}>
            Try Again
          </button>
        </div>
      )}

      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
          }}
          events={events}
          eventClick={handleEventClick}
          height="700px"
          eventDisplay="block"
          editable={false}
          selectable={false}
          nowIndicator={true}
          dayMaxEvents={3}
          weekends={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
        />
      </div>

      {/* Quick Navigation */}
      <div className="quick-navigation">
        <button
          className="btn btn-outline"
          onClick={() => navigate('/academic-dates')}
        >
          📚 Academic Dates
        </button>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/club-activities')}
        >
          🎯 Club Activities
        </button>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/exam-schedule')}
        >
          📝 Exam Schedule
        </button>
      </div>

      <DeleteEventModal
        event={selectedEvent}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDeleteSuccess={handleDeleteEvent}
      />
    </div>
  );
};

export default CalendarView;