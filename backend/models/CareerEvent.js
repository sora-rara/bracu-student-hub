// routes/careerRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/adminMiddleware');

// Career event model
const CareerEvent = require('../models/CareerEvent');

// ====================
// PUBLIC CAREER ROUTES
// ====================

// Get all active career events
router.get('/events', async (req, res) => {
  try {
    console.log('Fetching career events...');
    const events = await CareerEvent.find({ 
      status: 'active',
      deadline: { $gte: new Date() }
    }).sort({ deadline: 1 });
    
    console.log(`Found ${events.length} events`);
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching career events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch career events'
    });
  }
});

// ====================
// ADMIN CAREER ROUTES
// ====================

// Admin: Create new career event
router.post('/admin/events', requireAdmin, async (req, res) => {
  console.log('=== ADMIN: Creating new career event ===');
  console.log('Session user:', req.session?.user);
  console.log('Request body:', req.body);
  
  try {
    const {
      title,
      type,
      organization,
      description,
      deadline,
      link,
      location,
      tags,
      contactEmail,
      status = 'active'
    } = req.body;

    // Validate required fields
    if (!title || !type || !organization || !deadline || !link) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, type, organization, deadline, link'
      });
    }

    // Validate type
    const validTypes = ['job', 'internship', 'scholarship'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type. Must be: job, internship, or scholarship'
      });
    }

    // Create new event
    const newEvent = new CareerEvent({
      title,
      type,
      organization,
      description,
      deadline: new Date(deadline),
      link,
      location: location || 'On-campus',
      tags: tags || [],
      contactEmail: contactEmail || req.session?.user?.email,
      postedBy: req.session?.userId,
      status,
      views: 0,
      applications: 0
    });

    console.log('Saving new event:', newEvent);
    
    // Save to database
    const savedEvent = await newEvent.save();
    
    console.log('Event saved successfully:', savedEvent._id);
    
    res.status(201).json({
      success: true,
      message: 'Career opportunity posted successfully',
      data: savedEvent
    });
    
  } catch (error) {
    console.error('❌ Error creating career event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create career event: ' + error.message
    });
  }
});

// Test route to check if admin middleware is working
router.get('/admin/test', requireAdmin, (req, res) => {
  console.log('Admin test route accessed');
  res.json({
    success: true,
    message: 'Admin route is working',
    user: req.session?.user,
    userId: req.session?.userId
  });
});

module.exports = router;