const express = require("express");
const Deadline = require("../models/Deadline");

const router = express.Router();

// GET all deadlines (optionally filtered by ownerEmail)
router.get("/", async (req, res) => {
  try {
    const { ownerEmail } = req.query;

    // 👇 if ownerEmail is provided, only return that user's deadlines
    const query = ownerEmail ? { ownerEmail } : {};

    const items = await Deadline.find(query).sort({ dueDate: 1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch deadlines" });
  }
});

// POST create deadline
router.post("/", async (req, res) => {
  try {
    const {
      ownerEmail,   // 👈 NEW
      courseCode,
      category,
      name,
      syllabus,
      dueDate,
      room,
      mode,
      submissionLink,
    } = req.body;

    // 👇 now also require ownerEmail
    if (!ownerEmail || !courseCode || !category || !name || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const item = await Deadline.create({
      ownerEmail,   // 👈 NEW
      courseCode,
      category,
      name,
      syllabus,
      dueDate,
      room,
      mode,
      submissionLink,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create deadline" });
  }
});

// PUT update deadline
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ownerEmail,   // 👈 NEW (optional when updating)
      courseCode,
      category,
      name,
      syllabus,
      dueDate,
      room,
      mode,
      submissionLink,
    } = req.body;

    // Build update object
    const update = {
      courseCode,
      category,
      name,
      syllabus,
      dueDate,
      room,
      mode,
      submissionLink,
    };

    // Only overwrite ownerEmail if provided in body
    if (ownerEmail) {
      update.ownerEmail = ownerEmail;
    }

    const item = await Deadline.findByIdAndUpdate(id, update, { new: true });

    if (!item) {
      return res.status(404).json({ message: "Deadline not found" });
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update deadline" });
  }
});

// DELETE deadline
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Deadline.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "Deadline not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete deadline" });
  }
});

module.exports = router;
