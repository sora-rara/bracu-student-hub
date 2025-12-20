const mongoose = require("mongoose");

const savedOpportunitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opportunityType: {
    type: String,
    required: true,
    enum: ['job', 'internship', 'scholarship']
  },
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'opportunityType'
  },
  
  // Metadata
  savedAt: {
    type: Date,
    default: Date.now
  },
  notes: String,
  tags: [String],
  
  // Status tracking
  viewed: {
    type: Boolean,
    default: false
  },
  applied: {
    type: Boolean,
    default: false
  },
  appliedAt: Date
}, {
  timestamps: true
});

// Ensure unique combination
savedOpportunitySchema.index({ userId: 1, opportunityType: 1, opportunityId: 1 }, { unique: true });

module.exports = mongoose.model("SavedOpportunity", savedOpportunitySchema);