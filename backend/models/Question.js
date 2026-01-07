const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const questionSchema = new mongoose.Schema(
  {
    // no title needed
    body: { type: String, required: true, trim: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    answers: [answerSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
