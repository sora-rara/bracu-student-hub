// models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  position: { type: String, required: true },
  type: { type: String, enum: ['job', 'internship', 'scholarship', 'other'], required: true },
  description: { type: String },
  deadline: { type: Date },
  appliedDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['interested', 'applied', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn'],
    default: 'applied'
  },
  notes: { type: String },
  link: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Application', applicationSchema);