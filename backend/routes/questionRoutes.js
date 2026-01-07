const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/adminMiddleware");

const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  markSeen,
} = require("../controllers/questionController");

// all Q/A is behind login in your app anyway
router.get("/", requireAuth, getQuestions);
router.get("/:id", requireAuth, getQuestionById);

router.post("/", requireAuth, createQuestion);
router.put("/:id", requireAuth, updateQuestion);
router.delete("/:id", requireAuth, deleteQuestion);

router.post("/:id/answers", requireAuth, addAnswer);
router.put("/:id/answers/:answerId", requireAuth, updateAnswer);
router.delete("/:id/answers/:answerId", requireAuth, deleteAnswer);

router.post("/:id/seen", requireAuth, markSeen);

module.exports = router;
