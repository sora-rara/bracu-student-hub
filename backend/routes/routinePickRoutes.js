const express = require("express");
const router = express.Router();
const RoutinePick = require("../models/RoutinePick");
const { requireAuth } = require("../middleware/adminMiddleware");

// helper: your middleware might set req.userId OR session userId
function getUserId(req) {
  return req.userId || req.session?.userId;
}

// GET /api/routine/picks
router.get("/picks", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const doc = await RoutinePick.findOne({ userId }).lean();
    res.json({ success: true, data: doc || null });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load picks", error: err.message });
  }
});

// POST /api/routine/picks
router.post("/picks", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { term, year, picks } = req.body;

    if (!term || !year || !Array.isArray(picks)) {
      return res.status(400).json({ success: false, message: "term, year, picks[] required" });
    }

    const clean = picks
      .filter((p) => p?.courseCode && p?.sectionName)
      .map((p) => ({
        courseCode: String(p.courseCode).trim().toUpperCase(),
        sectionName: String(p.sectionName).trim(),
      }));

    const updated = await RoutinePick.findOneAndUpdate(
      { userId },
      { userId, term: String(term), year: Number(year), picks: clean },
      { upsert: true, new: true }
    ).lean();

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save picks", error: err.message });
  }
});

module.exports = router;
