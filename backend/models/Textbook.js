const mongoose = require('mongoose');

const textbookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Textbook title is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  isbn: {
    type: String,
    trim: true
  },
  courseCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  courseName: {
    type: String,
    trim: true
  },
  edition: {
    type: String,
    default: 'Latest'
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  transactionType: {
    type: String,
    enum: ['Sell', 'Exchange', 'Both'],
    default: 'Sell'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  images: [{
    type: String,
    default: []
  }],
  status: {
    type: String,
    enum: ['Available', 'Pending', 'Sold', 'Exchanged'],
    default: 'Available'
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  sellerEmail: {
    type: String,
    required: true
  },
  contactMethod: {
    type: String,
    enum: ['Email', 'Phone', 'WhatsApp', 'Messenger'],
    default: 'Email'
  },
  contactInfo: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: 'BRAC University Campus'
  },
  tags: [{
    type: String,
    trim: true
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
textbookSchema.index({ title: 'text', author: 'text', courseCode: 'text', courseName: 'text' });
textbookSchema.index({ status: 1, createdAt: -1 });
textbookSchema.index({ sellerId: 1, status: 1 });
textbookSchema.index({ courseCode: 1, status: 1 });

const Textbook = mongoose.model('Textbook', textbookSchema);
module.exports = Textbook;