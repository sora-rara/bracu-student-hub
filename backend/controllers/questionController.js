const Question = require("../models/Question");
const QuestionRead = require("../models/QuestionRead");

// helper: get latest answer createdAt (or null)
const getLastAnswerAt = (q) => {
  if (!q.answers || q.answers.length === 0) return null;
  let max = null;
  for (const a of q.answers) {
    const t = a?.createdAt ? new Date(a.createdAt) : null;
    if (t && (!max || t > max)) max = t;
  }
  return max;
};

// GET /api/questions  (protected)
const getQuestions = async (req, res) => {
  try {
    const userId = req.session.userId;

    const items = await Question.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    // only fetch read-state for questions owned by this user
    const ownedIds = items
      .filter((q) => String(q.user?._id || q.user) === String(userId))
      .map((q) => q._id);

    const reads = ownedIds.length
      ? await QuestionRead.find({
          user: userId,
          question: { $in: ownedIds },
        })
      : [];

    const readMap = new Map();
    for (const r of reads) readMap.set(String(r.question), r);

    const decorated = items.map((q) => {
      const plain = q.toObject();

      const isOwner = String(q.user?._id || q.user) === String(userId);

      // default: no dot info for non-owners
      plain._dotStatus = null; // frontend can hide
      plain._lastAnswerAt = null;

      if (isOwner) {
        const lastAnswerAt = getLastAnswerAt(q);
        const read = readMap.get(String(q._id));
        const lastSeenAnswerAt = read?.lastSeenAnswerAt ? new Date(read.lastSeenAnswerAt) : null;

        let status = "none"; // grey (owner only)
        if (lastAnswerAt) {
          if (!lastSeenAnswerAt || lastSeenAnswerAt < lastAnswerAt) status = "new"; // red
          else status = "seen"; // green
        }

        plain._dotStatus = status;
        plain._lastAnswerAt = lastAnswerAt;
      }

      return plain;
    });

    res.json({ success: true, data: decorated });
  } catch (err) {
    console.log("getQuestions error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/questions/:id  (protected)
const getQuestionById = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id)
      .populate("user", "name email role")
      .populate("answers.user", "name email role");

    if (!item) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: item });
  } catch (err) {
    console.log("getQuestionById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/questions  (protected)
const createQuestion = async (req, res) => {
  try {
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Question body required" });
    }

    const q = await Question.create({
      body,
      user: req.session.userId,
    });

    res.status(201).json({ success: true, data: q });
  } catch (err) {
    console.log("createQuestion error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/questions/:id  (protected - owner only)
const updateQuestion = async (req, res) => {
  try {
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Question body required" });
    }

    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });

    if (String(q.user) !== String(req.session.userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    q.body = body;
    await q.save();

    res.json({ success: true, message: "Question updated", data: q });
  } catch (err) {
    console.log("updateQuestion error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/questions/:id  (protected - owner only)
const deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });

    if (String(q.user) !== String(req.session.userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    await Question.findByIdAndDelete(req.params.id);
    await QuestionRead.deleteMany({ question: req.params.id });

    res.json({ success: true, message: "Question deleted" });
  } catch (err) {
    console.log("deleteQuestion error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/questions/:id/answers  (protected)
const addAnswer = async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Answer body required" });
    }

    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });

    q.answers.push({ body, user: req.session.userId });
    await q.save();

    res.status(201).json({ success: true, message: "Answer added" });
  } catch (err) {
    console.log("addAnswer error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/questions/:id/answers/:answerId  (protected - owner only)
const updateAnswer = async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Answer body required" });
    }

    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });

    const ans = q.answers.id(req.params.answerId);
    if (!ans) return res.status(404).json({ success: false, message: "Answer not found" });

    if (String(ans.user) !== String(req.session.userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    ans.body = body;
    await q.save();

    res.json({ success: true, message: "Answer updated" });
  } catch (err) {
    console.log("updateAnswer error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/questions/:id/answers/:answerId  (protected - owner only)
const deleteAnswer = async (req, res) => {
  try {
    const { id, answerId } = req.params;

    const q = await Question.findById(id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });

    const ans = q.answers.id(answerId);
    if (!ans) return res.status(404).json({ success: false, message: "Answer not found" });

    if (String(ans.user) !== String(req.session.userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    ans.deleteOne();
    await q.save();

    res.json({ success: true, message: "Answer deleted" });
  } catch (err) {
    console.log("deleteAnswer error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/questions/:id/seen  (protected)
// OWNER ONLY: mark as seen up to latest answer
const markSeen = async (req, res) => {
  try {
    const userId = req.session.userId;
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });

    // only the question owner can mark seen / track dots
    if (String(q.user) !== String(userId)) {
      return res.json({ success: true, message: "Ignored (not owner)" });
    }

    const lastAnswerAt = getLastAnswerAt(q);

    await QuestionRead.findOneAndUpdate(
      { user: userId, question: q._id },
      { $set: { lastSeenAnswerAt: lastAnswerAt || null } },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Seen updated" });
  } catch (err) {
    console.log("markSeen error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  markSeen,
};
