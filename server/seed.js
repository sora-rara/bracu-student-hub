const mongoose = require("mongoose");
require("dotenv").config();
const Deadline = require("./models/Deadline");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    await Deadline.deleteMany({}); // clear old data

    await Deadline.create([
      // CSE220 exams
      {
        courseCode: "CSE220",
        category: "exam",
        name: "Quiz 1",
        dueDate: new Date("2025-12-05T10:00:00"),
      },
      {
        courseCode: "CSE220",
        category: "exam",
        name: "Mid",
        dueDate: new Date("2025-12-15T09:00:00"),
      },
      {
        courseCode: "CSE220",
        category: "exam",
        name: "Final",
        dueDate: new Date("2025-12-30T09:00:00"),
      },

      // CSE220 assignments
      {
        courseCode: "CSE220",
        category: "assignment",
        name: "Class Assignment 1",
        dueDate: new Date("2025-12-08T23:59:00"),
      },
      {
        courseCode: "CSE220",
        category: "assignment",
        name: "Lab Assignment 1",
        dueDate: new Date("2025-12-12T23:59:00"),
      },
    ]);

    console.log("Seeded deadlines");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
