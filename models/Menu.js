const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  cafeteria: {
    type: String,
    enum: ['main', 'annex', 'ub', 'faculty'],
    default: 'main'
  },
  foodItems: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem'
    },
    available: {
      type: Boolean,
      default: true
    },
    specialNote: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  views: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Website-specific methods
menuSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

menuSchema.methods.getCafeteriaName = function() {
  const cafeteriaNames = {
    'main': 'Main Cafeteria',
    'annex': 'Annex Building Cafeteria',
    'ub': 'UB Cafeteria',
    'faculty': 'Faculty Cafeteria'
  };
  return cafeteriaNames[this.cafeteria] || 'Cafeteria';
};

module.exports = mongoose.model('Menu', menuSchema);