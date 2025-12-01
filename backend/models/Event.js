// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  start: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end: {
    type: Date,
    required: [true, 'End date is required']
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['academic', 'club', 'exam', 'holiday', 'other', 'general'],
    default: 'general'
  },
  category: {
    type: String,
    default: 'General'
  },
  location: {
    type: String,
    default: ''
  },
  organizer: {
    type: String,
    default: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);