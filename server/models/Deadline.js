const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema({
  courseCode: { type: String, required: true }, // e.g. "CSE220"
  category: {
    type: String,
    enum: ["exam", "assignment"], // exam or assignment
    required: true,
  },
  name: { type: String, required: true }, // e.g. "Quiz 1", "Mid", "Class Assignment 1"
  syllabus: { type: String },             // optional details
  dueDate: { type: Date, required: true }, // for countdown
});

module.exports = mongoose.model("Deadline", deadlineSchema);
