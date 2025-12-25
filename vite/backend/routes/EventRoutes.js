const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Event = require('../models/Event');
const { requireAuth } = require('../middleware/adminMiddleware');

// =========================
// 📌 MAIN EVENTS ROUTES
// =========================

// GET all events
router.get('/events', requireAuth, async (req, res) => {
  try {
    console.log(`🔍 Fetching events for ${req.isAdmin ? 'ADMIN' : 'USER'}:`, req.userId);

    let events;
    let query;

    if (req.isAdmin) {
      // Admin sees ALL events
      query = { isDeleted: { $ne: true } };
    } else {
      // User sees university events + their own personal events
      query = {
        isDeleted: { $ne: true },
        $or: [
          { eventOwnerType: 'university' },
          { userId: req.userId }
        ]
      };
    }

    events = await Event.find(query).sort({ start: 1 });
    console.log(`📊 Found ${events.length} events`);

    // Format response
    const formattedEvents = events.map(event => {
      const isUniversity = event.eventOwnerType === 'university';
      const isOwner = event.userId && event.userId.toString() === req.userId;

      return {
        ...event.toObject(),
        isEditable: isUniversity ? req.isAdmin : isOwner,
        isDeletable: isUniversity ? req.isAdmin : isOwner,
        isPersonal: !isUniversity
      };
    });

    res.json({
      success: true,
      events: formattedEvents,
      count: events.length
    });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

// =========================
// ✏️ CREATE EVENT - FINAL FIXED VERSION
// =========================
router.post('/events', requireAuth, async (req, res) => {
  try {
    console.log('🎯 [CREATE EVENT] Request received');
    console.log('User:', req.userId);
    console.log('Is Admin:', req.isAdmin);
    console.log('Request body:', req.body);

    let eventData = { ...req.body };

    // Validate required fields
    if (!eventData.title || !eventData.start) {
      return res.status(400).json({
        success: false,
        error: 'Title and start date are required'
      });
    }

    // Ensure end date exists
    if (!eventData.end) {
      eventData.end = eventData.start;
    }

    // ==============================================
    // 🎯 CRITICAL: Determine eventOwnerType
    // ==============================================
    let eventOwnerType = 'personal';

    if (req.isAdmin) {
      // Admin can create university events
      if (eventData.isUniversityEvent === true ||
        eventData.eventOwnerType === 'university') {
        eventOwnerType = 'university';
      }
    }
    // Non-admins can ONLY create personal events

    console.log('📝 Event ownership determination:', {
      isAdmin: req.isAdmin,
      isUniversityEventFromBody: eventData.isUniversityEvent,
      eventOwnerTypeFromBody: eventData.eventOwnerType,
      finalEventOwnerType: eventOwnerType
    });

    // ==============================================
    // 🎯 CRITICAL: Fix eventType if it's 'university'
    // ==============================================
    let eventTypeForDB = eventData.eventType || 'general';

    // Check if eventType is valid
    const validEventTypes = ['academic', 'club', 'exam', 'holiday', 'workshop', 'personal', 'general'];
    if (eventTypeForDB === 'university' || !validEventTypes.includes(eventTypeForDB)) {
      // If 'university' or invalid, default based on eventOwnerType
      eventTypeForDB = eventOwnerType === 'university' ? 'academic' : 'personal';
    }

    // ==============================================
    // 🎯 Prepare base event data
    // ==============================================
    const baseEventData = {
      title: eventData.title,
      description: eventData.description || '',
      start: new Date(eventData.start),
      end: new Date(eventData.end || eventData.start),
      allDay: eventData.allDay || false,
      color: eventData.color || '#3788d8',
      location: eventData.location || '',
      eventType: eventTypeForDB,
      eventOwnerType: eventOwnerType,
      category: eventData.category || 'General',
      organizer: eventData.organizer || '',
      isImportant: eventData.isImportant || false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // ==============================================
    // 🎯 Create the event
    // ==============================================
    if (eventOwnerType === 'university') {
      // University event
      const finalEventData = {
        ...baseEventData,
        userId: null,
        userEmail: '',
        createdBy: 'admin'  // ✅ MUST be 'admin' not email
      };

      console.log('🏫 Creating UNIVERSITY event:', finalEventData);

      const newEvent = new Event(finalEventData);
      await newEvent.save();

      res.status(201).json({
        success: true,
        event: {
          ...newEvent.toObject(),
          isEditable: true,
          isDeletable: true,
          isPersonal: false
        },
        message: 'University event created successfully'
      });

    } else {
      // Personal event
      const finalEventData = {
        ...baseEventData,
        userId: req.userId,
        userEmail: req.user.email || '',
        createdBy: 'user'  // ✅ MUST be 'user' not email
      };

      console.log('👤 Creating PERSONAL event:', finalEventData);

      const newEvent = new Event(finalEventData);
      await newEvent.save();

      res.status(201).json({
        success: true,
        event: {
          ...newEvent.toObject(),
          isEditable: true,
          isDeletable: true,
          isPersonal: true
        },
        message: 'Personal event created successfully'
      });
    }

  } catch (error) {
    console.error('❌ Error creating event:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create event'
    });
  }
});

// =========================
// 🗑️ DELETE EVENT
// =========================
router.delete('/events/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID format'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check permissions based on eventOwnerType
    if (event.eventOwnerType === 'university') {
      // Only admin can delete university events
      if (!req.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Only admins can delete university events'
        });
      }
    } else {
      // Only owner can delete personal events (admin can also delete)
      const isOwner = event.userId && event.userId.toString() === req.userId;
      if (!isOwner && !req.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own events'
        });
      }
    }

    // Hard delete
    await Event.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Event deleted successfully',
      deletedEventId: id
    });

  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during delete'
    });
  }
});

// =========================
// 🔄 UPDATE EVENT
// =========================
router.put('/events/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✏️ Updating event:', id);

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check permissions
    if (event.eventOwnerType === 'university') {
      // University event: Only admin can edit
      if (!req.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Only admins can edit university events'
        });
      }
    } else {
      // Personal event: Only owner can edit
      const isOwner = event.userId && event.userId.toString() === req.userId;
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own events'
        });
      }
    }

    // Update event
    const updatedData = { ...req.body, updatedAt: Date.now() };
    const updatedEvent = await Event.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true
    });

    console.log('✅ Event updated:', id);

    res.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// =========================
// 📍 GET EVENTS BY TYPE
// =========================
router.get('/events/type/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;

    console.log(`📋 Fetching ${type} events for ${req.isAdmin ? 'admin' : 'user'}:`, req.userId);

    let query = { eventType: type, isDeleted: { $ne: true } };

    if (!req.isAdmin) {
      // Users see university events + their own personal events
      query = {
        eventType: type,
        isDeleted: { $ne: true },
        $or: [
          { eventOwnerType: 'university' },
          { userId: req.userId }
        ]
      };
    }

    const events = await Event.find(query).sort({ start: 1 });

    console.log(`Found ${events.length} ${type} events`);

    res.json({
      success: true,
      events: events.map(event => {
        const isUniversity = event.eventOwnerType === 'university';
        const isOwner = event.userId && event.userId.toString() === req.userId;

        return {
          ...event.toObject(),
          isEditable: isUniversity ? req.isAdmin : isOwner,
          isDeletable: isUniversity ? req.isAdmin : isOwner,
          isPersonal: !isUniversity
        };
      }),
      count: events.length
    });
  } catch (error) {
    console.error('❌ Error fetching events by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

// =========================
// ✅ HEALTH CHECK
// =========================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Calendar API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      getEvents: 'GET /events',
      deleteEvent: 'DELETE /events/:id',
      createEvent: 'POST /events',
      updateEvent: 'PUT /events/:id',
      getByType: 'GET /events/type/:type'
    }
  });
});

module.exports = router;