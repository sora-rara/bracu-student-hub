const mongoose = require("mongoose");

const RoutinePickSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    term: { type: String, required: true }, // Spring/Summer/Fall
    year: { type: Number, required: true },

    // student chooses theory sections only
    picks: [
      {
        courseCode: { type: String, required: true },
        sectionName: { type: String, required: true }, // from Connect: item.sectionName
      },
    ],
  },
  { timestamps: true }
);

RoutinePickSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("RoutinePick", RoutinePickSchema);
