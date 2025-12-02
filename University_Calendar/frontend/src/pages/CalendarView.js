import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import axios from 'axios';
import DeleteEventModal from './DeleteEventModal';
import './CalendarView.css';

const API_BASE_URL = 'http://localhost:5000/api';

const CalendarView = () => {
  const navigate = useNavigate();
  
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

  // REF to track the right-clicked event
  const rightClickedEventRef = useRef(null);

  // Color mapping for event types
  const eventTypeColors = {
    academic: '#e74c3c',
    club: '#2ecc71',
    exam: '#f39c12',
    holiday: '#9b59b6',
    other: '#3498db',
    general: '#3498db'
  };

  // Fetch events function
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching events from backend...');
      
      const response = await axios.get(`${API_BASE_URL}/events`);
      
      console.log('📊 Backend response:', response.data);
      
      if (response.data.success) {
        const formattedEvents = response.data.events.map(event => {
          const color = eventTypeColors[event.eventType] || '#1a5f7a';
          
          return {
            id: event._id,
            title: event.title,
            start: event.start,
            end: event.end,
            backgroundColor: color,
            borderColor: color,
            extendedProps: {
              eventType: event.eventType,
              category: event.category,
              location: event.location,
              description: event.description,
              organizer: event.organizer
            }
          };
        });
        
        console.log(`✅ Loaded ${formattedEvents.length} events`);
        setEvents(formattedEvents);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setError(response.data.error || 'Failed to load events from server');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`);
      } else if (err.request) {
        setError('Could not connect to backend server. Make sure it\'s running on http://localhost:5000');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Close context menu when clicking anywhere
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, event: null });
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // useEffect FOR RIGHT-CLICK HANDLING
  useEffect(() => {
    console.log('🔄 Setting up right-click handlers for events...');
    
    // Function to attach right-click handlers to calendar events
    const attachRightClickHandlers = () => {
      // Wait a moment for the calendar to render
      setTimeout(() => {
        // Find all calendar event elements
        const eventElements = document.querySelectorAll(
          '.fc-event, .fc-daygrid-event, .fc-event-main, [data-event-id]'
        );
        
        console.log(`🔍 Found ${eventElements.length} calendar event elements`);
        
        eventElements.forEach((element, index) => {
          // Remove any existing handler to avoid duplicates
          element.oncontextmenu = null;
          
          // Add right-click handler
          element.oncontextmenu = (e) => {
            e.preventDefault();
            console.log(`🖱️ Right-click detected on event element ${index}`);
            
            // Try to find the event data
            let eventId = element.getAttribute('data-event-id');
            
            // If no data-event-id, try to find from text
            if (!eventId) {
              const eventTitleElement = element.querySelector('.fc-event-title');
              if (eventTitleElement) {
                const eventTitle = eventTitleElement.textContent;
                const matchingEvent = events.find(ev => ev.title === eventTitle);
                if (matchingEvent) {
                  eventId = matchingEvent.id;
                  element.setAttribute('data-event-id', eventId);
                }
              }
            }
            
            if (eventId) {
              const event = events.find(ev => ev.id === eventId);
              if (event) {
                console.log(`🎯 Found event: ${event.title} (ID: ${eventId})`);
                
                // Create a mock FullCalendar event object
                const calendarEvent = {
                  id: event.id,
                  title: event.title,
                  start: event.start,
                  end: event.end,
                  extendedProps: event.extendedProps,
                  backgroundColor: event.backgroundColor,
                  borderColor: event.borderColor
                };
                
                setSelectedEvent(calendarEvent);
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  event: calendarEvent
                });
                
                // Debug log
                console.log('📋 Context menu should now be visible');
              }
            } else {
              console.warn('⚠️ Could not find event ID for clicked element');
            }
          };
          
          // Add hover effect for visual feedback
          element.style.cursor = 'pointer';
        });
      }, 1500); // Wait 1.5 seconds for calendar to fully render
    };
    
    // Run when events are loaded
    if (events.length > 0) {
      attachRightClickHandlers();
      
      // Also re-attach after calendar view changes
      const calendarViewChangeHandler = () => {
        setTimeout(attachRightClickHandlers, 500);
      };
      
      // Listen for calendar view changes
      const viewButtons = document.querySelectorAll('.fc-button');
      viewButtons.forEach(button => {
        button.addEventListener('click', calendarViewChangeHandler);
      });
      
      return () => {
        // Cleanup
        viewButtons.forEach(button => {
          button.removeEventListener('click', calendarViewChangeHandler);
        });
      };
    }
  }, [events]); // This useEffect depends on events

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
          dateTimeInfo = `📅 Date: ${startDate.toLocaleDateString()}\n⏰ Time: ${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n⏱️ Duration: ${duration}`;
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
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes}m`;
    } else {
      return `${diffMinutes} minutes`;
    }
  };

  // Legacy right-click handler (kept for reference)
  const handleEventRightClick = (clickInfo) => {
    console.log('Legacy right-click handler called');
  };

  const handleDeleteEvent = (deletedEventId) => {
    console.log(`🔄 Removing event ${deletedEventId} from frontend state`);
    
    // Remove from frontend state immediately for better UX
    setEvents(prev => prev.filter(event => event.id !== deletedEventId));
    
    // Close modals
    setDeleteModalOpen(false);
    setSelectedEvent(null);
    setContextMenu({ visible: false, x: 0, y: 0, event: null });
    
    // Show success notification
    const deletedEventTitle = events.find(e => e.id === deletedEventId)?.title || 'Event';
    alert(`✅ "${deletedEventTitle}" has been deleted successfully!`);
    
    // Refresh events after a moment
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

  // Loading state
  if (loading && events.length === 0) {
    return (
      <div className="calendar-container">
        <h2 className="text-primary mb-4">📅 University Event Calendar</h2>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading calendar...</span>
          </div>
          <p className="mt-3">Loading university events from backend...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && events.length === 0) {
    return (
      <div className="calendar-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-primary mb-0">📅 University Event Calendar</h2>
            <p className="text-muted mb-0">Backend Connection Issue</p>
          </div>
        </div>
        
        <div className="alert alert-danger">
          <h4>❌ Backend Connection Failed</h4>
          <p>{error}</p>
          <div className="mt-3">
            <p><strong>To fix this:</strong></p>
            <ol>
              <li>Make sure your backend is running: Open terminal and run <code>npm run dev</code> in the <code>backend</code> folder</li>
              <li>Check if MongoDB is running</li>
              <li>Test backend directly: <a href="http://localhost:5000/api/events" target="_blank" rel="noreferrer">http://localhost:5000/api/events</a></li>
              <li>If backend is on a different port, update the API_BASE_URL in the component</li>
            </ol>
            <button 
              className="btn btn-primary mt-2"
              onClick={handleRefresh}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary mb-0">📅 University Event Calendar</h2>
          <p className="text-muted mb-0">
            {events.length} event{events.length !== 1 ? 's' : ''} • 
            Last updated: {lastUpdated || 'Never'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh Events'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend mb-3">
        <div className="d-flex flex-wrap gap-3">
          <div className="d-flex align-items-center">
            <div className="legend-color" style={{backgroundColor: eventTypeColors.academic}}></div>
            <span>Academic Dates</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="legend-color" style={{backgroundColor: eventTypeColors.club}}></div>
            <span>Club Activities</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="legend-color" style={{backgroundColor: eventTypeColors.exam}}></div>
            <span>Exams</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="legend-color" style={{backgroundColor: eventTypeColors.holiday}}></div>
            <span>Holidays</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="legend-color" style={{backgroundColor: eventTypeColors.other}}></div>
            <span>Other Events</span>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1001
          }}
        >
          <div className="context-menu-content">
            <button 
              onClick={() => {
                const event = contextMenu.event;
                const extendedProps = event.extendedProps;
                const startDate = event.start ? new Date(event.start) : null;
                const endDate = event.end ? new Date(event.end) : null;
                
                let dateTimeInfo = '';
                if (startDate) {
                  if (event.allDay) {
                    dateTimeInfo = `📅 Date: ${startDate.toLocaleDateString()}`;
                  } else {
                    dateTimeInfo = `📅 Start: ${startDate.toLocaleString()}\n⏰ End: ${endDate ? endDate.toLocaleString() : 'N/A'}`;
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
                setContextMenu({ visible: false, x: 0, y: 0, event: null });
              }}
              className="context-menu-item"
            >
              👁️ View Details
            </button>
            <button 
              onClick={() => openDeleteModal(contextMenu.event)}
              className="context-menu-item delete"
            >
              🗑️ Delete Event
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteEventModal
        event={selectedEvent}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDeleteSuccess={handleDeleteEvent}
      />

      {/* The Calendar */}
      <div className="calendar-wrapper shadow-sm rounded">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
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
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
        />
      </div>

      {/* Debug Info (optional) */}
      <div className="mt-3 p-3 bg-light rounded">
        <details>
          <summary>🔍 Quick Links & Debug Info</summary>
          <div className="mt-2">
            <p className="mb-2"><strong>Right-click Instructions:</strong> Right-click on any calendar event to open context menu.</p>
            <div className="d-flex gap-2 flex-wrap">
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/academic-dates')}
              >
                📚 Academic Dates
              </button>
              <button 
                className="btn btn-sm btn-outline-success"
                onClick={() => navigate('/club-activities')}
              >
                🎯 Club Activities
              </button>
              <button 
                className="btn btn-sm btn-outline-warning"
                onClick={() => navigate('/exam-schedule')}
              >
                📝 Exam Schedule
              </button>
              <button 
                className="btn btn-sm btn-outline-info"
                onClick={() => navigate('/dashboard')}
              >
                📊 Dashboard
              </button>
            </div>
          </div>
        </details>
      </div>

      {/* Status */}
      <div className="row mt-3">
        <div className="col-md-6">
          <div className="alert alert-info">
            <strong>ℹ️ Event Types Summary</strong>
            <ul className="mb-0 mt-2">
              {Object.entries(eventTypeColors).map(([type, color]) => {
                const count = events.filter(e => e.extendedProps?.eventType === type).length;
                return count > 0 ? (
                  <li key={type}>
                    <span className="dot" style={{backgroundColor: color}}></span>
                    {type.charAt(0).toUpperCase() + type.slice(1)}: {count} events
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className={`alert ${error ? 'alert-warning' : 'alert-success'}`}>
            <strong>{error ? '⚠️ Issues Detected' : '✅ Backend Status'}</strong>
            <p className="mb-1">
              {error ? error : `Connected to: ${API_BASE_URL}`}
            </p>
            <p className="mb-0">
              {lastUpdated && `Last updated: ${lastUpdated}`}
            </p>
            <p className="mb-0 mt-2">
              <small>Right-click on calendar events to delete.</small>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;