const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/university-calendar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Import Event model from MODELS folder (correct location)
const Event = require('./models/Event');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'University Calendar API',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Get all events from MongoDB
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ start: 1 });
    
    res.json({ 
      success: true, 
      events: events,
      count: events.length
    });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch events from database' 
    });
  }
});

// Add new event (POST endpoint) - UPDATED for startDate/endDate
app.post('/api/events', async (req, res) => {
  try {
    console.log('📥 Received event data:', req.body);
    
    const { 
      title, 
      startDate, 
      endDate, 
      startTime, 
      endTime, 
      location, 
      description, 
      type, 
      organizer 
    } = req.body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title is required' 
      });
    }
    
    if (!startDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date is required' 
      });
    }
    
    // Use endDate if provided, otherwise use startDate
    const finalEndDate = endDate || startDate;
    
    // Parse start and end dates
    let start, end;
    
    // Handle start date/time
    if (startTime && startTime.trim() !== '') {
      // Has start time: Combine startDate with startTime
      const startDateTimeString = `${startDate}T${startTime}:00`;
      start = new Date(startDateTimeString);
      
      if (isNaN(start.getTime())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid start date/time format' 
        });
      }
    } else {
      // No start time: Use start of day for startDate
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
    }
    
    // Handle end date/time
    if (endTime && endTime.trim() !== '') {
      // Has end time: Combine finalEndDate with endTime
      const endDateTimeString = `${finalEndDate}T${endTime}:00`;
      end = new Date(endDateTimeString);
      
      if (isNaN(end.getTime())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid end date/time format' 
        });
      }
    } else {
      // No end time: Use end of day for finalEndDate
      end = new Date(finalEndDate);
      end.setHours(23, 59, 59, 999);
    }
    
    // Validate end is after start
    if (end <= start) {
      return res.status(400).json({ 
        success: false, 
        error: 'End date/time must be after start date/time' 
      });
    }
    
    console.log('📅 Parsed dates:', { 
      start: start.toISOString(), 
      end: end.toISOString() 
    });
    
    // Determine category based on type
    const categoryMap = {
      'academic': 'Academic Dates',
      'club': 'Club Activities',
      'exam': 'Exam Schedule',
      'holiday': 'Holiday',
      'other': 'General',
      'general': 'General'
    };
    const category = categoryMap[type] || 'General';
    
    // Create event object for MongoDB
    const eventData = {
      title: title.trim(),
      description: description || '',
      start: start,
      end: end,
      eventType: type || 'general',
      category: category,
      location: location || '',
      organizer: organizer || 'User'
    };
    
    console.log('💾 Saving event to MongoDB:', eventData);
    
    // Save to MongoDB
    const event = new Event(eventData);
    const savedEvent = await event.save();
    
    console.log('✅ Event saved successfully with ID:', savedEvent._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Event added successfully!',
      event: savedEvent
    });
    
  } catch (error) {
    console.error('❌ Error adding event:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: messages.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

// Helper function for event colors
function getEventColor(eventType) {
  const colors = {
    'academic': '#1a5f7a',    // Blue
    'club': '#57c5b6',        // Teal
    'exam': '#e74c3c',        // Red
    'holiday': '#9b59b6',     // Purple
    'other': '#f39c12',       // Orange
    'general': '#3498db'      // Light Blue
  };
  return colors[eventType] || '#3498db';
}

// Get active events (for dashboard)
app.get('/api/events/active', async (req, res) => {
  try {
    const now = new Date();
    
    const activeEvents = await Event.find({
      start: { $lte: now },
      end: { $gte: now }
    }).sort({ start: 1 });
    
    res.json({ 
      success: true, 
      events: activeEvents,
      count: activeEvents.length
    });
    
  } catch (error) {
    console.error('Error fetching active events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch active events' 
    });
  }
});

// Update event by ID
app.put('/api/events/:id', async (req, res) => {
  try {
    console.log(`📝 Updating event ${req.params.id}:`, req.body);
    
    const { 
      title, 
      startDate, 
      endDate, 
      startTime, 
      endTime, 
      location, 
      description, 
      type, 
      organizer 
    } = req.body;
    
    // Find the event first
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }
    
    // Use existing values if not provided
    const existingStart = existingEvent.start;
    const existingEnd = existingEvent.end;
    
    let start, end;
    
    // If new startDate provided, use it
    if (startDate) {
      if (startTime && startTime.trim() !== '') {
        const startDateTimeString = `${startDate}T${startTime}:00`;
        start = new Date(startDateTimeString);
      } else {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      }
    } else {
      start = existingStart;
    }
    
    // If new endDate provided, use it
    if (endDate) {
      const finalEndDate = endDate || startDate || start.toISOString().split('T')[0];
      
      if (endTime && endTime.trim() !== '') {
        const endDateTimeString = `${finalEndDate}T${endTime}:00`;
        end = new Date(endDateTimeString);
      } else {
        end = new Date(finalEndDate);
        end.setHours(23, 59, 59, 999);
      }
    } else {
      end = existingEnd;
    }
    
    // Validate end is after start
    if (end <= start) {
      return res.status(400).json({ 
        success: false, 
        error: 'End date/time must be after start date/time' 
      });
    }
    
    // Determine category based on type
    const categoryMap = {
      'academic': 'Academic Dates',
      'club': 'Club Activities',
      'exam': 'Exam Schedule',
      'holiday': 'Holiday',
      'other': 'General',
      'general': 'General'
    };
    const category = categoryMap[type] || existingEvent.category;
    
    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title: title || existingEvent.title,
        description: description || existingEvent.description,
        start: start,
        end: end,
        eventType: type || existingEvent.eventType,
        category: category,
        location: location || existingEvent.location,
        organizer: organizer || existingEvent.organizer
      },
      { new: true, runValidators: true }
    );
    
    console.log('✅ Event updated successfully:', updatedEvent._id);
    
    res.json({ 
      success: true, 
      message: 'Event updated successfully!',
      event: updatedEvent
    });
    
  } catch (error) {
    console.error('❌ Error updating event:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: messages.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update event' 
    });
  }
});

// Delete event by ID
app.delete('/api/events/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting event ${req.params.id}`);
    
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }
    
    console.log('✅ Event deleted successfully:', event.title);
    
    res.json({ 
      success: true, 
      message: 'Event deleted successfully',
      deletedEvent: event
    });
    
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete event' 
    });
  }
});

// Get event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }
    
    res.json({ 
      success: true, 
      event: event
    });
    
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch event' 
    });
  }
});

// Get events by type
app.get('/api/events/type/:eventType', async (req, res) => {
  try {
    const { eventType } = req.params;
    const validTypes = ['academic', 'club', 'exam', 'holiday', 'other', 'general'];
    
    if (!validTypes.includes(eventType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type'
      });
    }
    
    const events = await Event.find({ eventType }).sort({ start: 1 });
    
    res.json({
      success: true,
      eventType,
      events: events,
      count: events.length
    });
    
  } catch (error) {
    console.error(`Error fetching ${eventType} events:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch ${eventType} events`
    });
  }
});

// Get upcoming events by type (next 30 days)
app.get('/api/events/type/:eventType/upcoming', async (req, res) => {
  try {
    const { eventType } = req.params;
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const events = await Event.find({
      eventType,
      start: { $gte: now, $lte: nextMonth }
    }).sort({ start: 1 });
    
    res.json({
      success: true,
      eventType,
      events: events,
      count: events.length
    });
    
  } catch (error) {
    console.error(`Error fetching upcoming ${eventType} events:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch upcoming ${eventType} events`
    });
  }
});

// Simple test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'University Calendar API is running!',
    endpoints: {
      health: '/api/health',
      allEvents: '/api/events',
      activeEvents: '/api/events/active',
      singleEvent: '/api/events/:id',
      addEvent: 'POST /api/events',
      updateEvent: 'PUT /api/events/:id',
      deleteEvent: 'DELETE /api/events/:id',
      eventsByType: '/api/events/type/:type',
      upcomingByType: '/api/events/type/:type/upcoming'
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📅 Events API: http://localhost:${PORT}/api/events`);
  console.log(`➕ Add events: POST http://localhost:${PORT}/api/events`);
});