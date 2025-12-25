// models/Fooditem.js
const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true // Add this to handle potential duplicates
  },
  description: {
    type: String,
    default: ''
  },
  shortDescription: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['main_course', 'appetizer', 'dessert', 'beverage', 'side_dish', 'snack']
  },
  mealTime: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    default: 'lunch'
  },
  dietaryTags: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'spicy', 'low_calorie']
  }],
  nutritionalInfo: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'deleted'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Add text index for search
foodItemSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });

module.exports = mongoose.model('FoodItem', foodItemSchema);