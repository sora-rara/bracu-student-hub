const mongoose = require("mongoose");

const questionReadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    lastSeenAnswerAt: { type: Date, default: null },
  },
  { timestamps: true }
);

questionReadSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model("QuestionRead", questionReadSchema);
