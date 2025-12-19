const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema(
  {
    // NEW: which Student Hub user this deadline belongs to
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    courseCode: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["exam", "assignment"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    syllabus: {
      type: String,
      default: "",
      trim: true,
    },
    // NEW: room number for exams
    room: {
      type: String,
      trim: true,
    },
    // NEW: mode for assignments (online/offline/both)
    mode: {
      type: String,
      trim: true,
    },
    // NEW: submission link for assignments
    submissionLink: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deadline", deadlineSchema);
