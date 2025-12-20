// models/Review.js - UPDATED VERSION
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem',
    required: true
  },
  studentName: {  // Changed from userName to match frontend
    type: String,
    trim: true,
    default: 'Anonymous'
  },
  userEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active'],
    default: 'approved'
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update food item rating when review is saved
reviewSchema.post('save', async function () {
  try {
    const FoodItem = mongoose.model('FoodItem');
    const reviews = await this.constructor.find({
      foodItem: this.foodItem,
      status: { $in: ['approved', 'active'] }
    });

    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;

    await FoodItem.findByIdAndUpdate(this.foodItem, {
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating food item rating:', error);
  }
});

// Add index for better query performance
reviewSchema.index({ foodItem: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);