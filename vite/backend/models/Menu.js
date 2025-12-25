// models/Menu.js - COMPLETE REWRITE
const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  mealTime: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    required: [true, 'Meal time is required']
  },
  foodItems: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true
    },
    available: {
      type: Boolean,
      default: true
    },
    specialNote: {
      type: String,
      default: ''
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // NO middleware needed
});

// Add indexes for better performance
menuSchema.index({ date: 1, mealTime: 1 });
menuSchema.index({ status: 1 });

module.exports = mongoose.model('Menu', menuSchema);