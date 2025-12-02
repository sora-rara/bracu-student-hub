const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// GET all events
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ start: 1 });
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// POST new event
router.post('/events', async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(201).json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE event by ID
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ DELETE request for event ID:', id);
    
    // Check if event exists
    const event = await Event.findById(id);
    
    if (!event) {
      console.log('❌ Event not found with ID:', id);
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Delete the event
    await Event.findByIdAndDelete(id);
    
    console.log('✅ Event deleted successfully:', id);
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {
        deletedEventId: id,
        title: event.title
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    
    // Handle invalid MongoDB ID format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      details: error.message
    });
  }
});

module.exports = router;