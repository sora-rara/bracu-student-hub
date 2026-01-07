import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios.jsx";
import authService from "../../services/auth.jsx";

const QuestionDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const me = authService.getCurrentUser();

  const [q, setQ] = useState(null);
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState("");

  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editQuestionBody, setEditQuestionBody] = useState("");

  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswerBody, setEditAnswerBody] = useState("");

  const markSeen = async () => {
    try {
      await axios.post(`/questions/${id}/seen`);
    } catch (e) {
      console.log("markSeen failed:", e?.response?.data || e.message);
    }
  };

  const load = async () => {
    try {
      setErr("");
      const res = await axios.get(`/questions/${id}`);
      const data = res.data?.data || null;
      setQ(data);
      setEditQuestionBody(data?.body || "");

      // only the question owner needs "seen" tracking
      const isOwner = me?.id && data?.user?._id && String(me.id) === String(data.user._id);
      if (isOwner) await markSeen();
    } catch (e) {
      console.log(e);
      setErr("Failed to load question");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  const postAnswer = async (e) => {
    e.preventDefault();
    try {
      setErr("");
      const res = await axios.post(`/questions/${id}/answers`, { body: answer });
      if (res.data?.success) {
        setAnswer("");
        await load();
      } else {
        setErr(res.data?.message || "An error occurred");
      }
    } catch (e2) {
      console.log(e2);
      setErr(e2?.response?.data?.message || "An error occurred");
    }
  };

  const deleteQuestion = async () => {
    if (!window.confirm("Delete this question?")) return;
    try {
      setErr("");
      const res = await axios.delete(`/questions/${id}`);
      if (res.data?.success) nav("/questions");
      else setErr(res.data?.message || "An error occurred");
    } catch (e) {
      console.log(e);
      setErr(e?.response?.data?.message || "An error occurred");
    }
  };

  const saveQuestionEdit = async () => {
    try {
      setErr("");
      const res = await axios.put(`/questions/${id}`, { body: editQuestionBody });
      if (res.data?.success) {
        setEditingQuestion(false);
        await load();
      } else setErr(res.data?.message || "An error occurred");
    } catch (e) {
      console.log(e);
      setErr(e?.response?.data?.message || "An error occurred");
    }
  };

  const deleteAnswer = async (answerId) => {
    if (!window.confirm("Delete this answer?")) return;
    try {
      setErr("");
      const res = await axios.delete(`/questions/${id}/answers/${answerId}`);
      if (res.data?.success) await load();
      else setErr(res.data?.message || "An error occurred");
    } catch (e) {
      console.log(e);
      setErr(e?.response?.data?.message || "An error occurred");
    }
  };

  const saveAnswerEdit = async () => {
    try {
      setErr("");
      const res = await axios.put(`/questions/${id}/answers/${editingAnswerId}`, {
        body: editAnswerBody,
      });
      if (res.data?.success) {
        setEditingAnswerId(null);
        setEditAnswerBody("");
        await load();
      } else setErr(res.data?.message || "An error occurred");
    } catch (e) {
      console.log(e);
      setErr(e?.response?.data?.message || "An error occurred");
    }
  };

  if (!q) return <div style={{ padding: 20 }}>{err ? err : "Loading..."}</div>;

  const isOwner = me?.id && q.user?._id && String(me.id) === String(q.user._id);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <button onClick={() => nav("/questions")} style={{ marginBottom: 10 }}>
        ← Back
      </button>

      <h2>Question</h2>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
        by {q.user?.name || "Unknown"} •{" "}
        {q.createdAt ? new Date(q.createdAt).toLocaleString() : ""}
      </div>

      {isOwner ? (
        <>
          {editingQuestion ? (
            <>
              <textarea
                value={editQuestionBody}
                onChange={(e) => setEditQuestionBody(e.target.value)}
                style={{ width: "100%", padding: 10, minHeight: 120 }}
              />
              <button onClick={saveQuestionEdit} style={{ padding: "8px 12px", marginRight: 8 }}>
                Save
              </button>
              <button
                onClick={() => {
                  setEditingQuestion(false);
                  setEditQuestionBody(q.body || "");
                }}
                style={{ padding: "8px 12px" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <p style={{ whiteSpace: "pre-wrap" }}>{q.body}</p>
              <button
                onClick={() => setEditingQuestion(true)}
                style={{ padding: "8px 12px", marginRight: 8 }}
              >
                Edit Question
              </button>

              <button
                onClick={deleteQuestion}
                style={{ padding: "8px 12px", background: "crimson", color: "white" }}
              >
                Delete Question
              </button>
            </>
          )}
        </>
      ) : (
        <p style={{ whiteSpace: "pre-wrap" }}>{q.body}</p>
      )}

      <hr style={{ margin: "20px 0" }} />

      <h3>Answers ({q.answers?.length || 0})</h3>

      {q.answers?.map((a) => {
        const myAnswer = me?.id && a.user?._id && String(me.id) === String(a.user._id);
        const isEditingThis = editingAnswerId === a._id;

        return (
          <div
            key={a._id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {a.user?.name || "Unknown"} •{" "}
              {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
            </div>

            {myAnswer && isEditingThis ? (
              <>
                <textarea
                  value={editAnswerBody}
                  onChange={(e) => setEditAnswerBody(e.target.value)}
                  style={{ width: "100%", padding: 10, minHeight: 80 }}
                />
                <button onClick={saveAnswerEdit} style={{ padding: "6px 10px", marginRight: 8 }}>
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingAnswerId(null);
                    setEditAnswerBody("");
                  }}
                  style={{ padding: "6px 10px" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <p style={{ whiteSpace: "pre-wrap" }}>{a.body}</p>
            )}

            {myAnswer ? (
              <div style={{ display: "flex", gap: 8 }}>
                {!isEditingThis ? (
                  <button
                    onClick={() => {
                      setEditingAnswerId(a._id);
                      setEditAnswerBody(a.body || "");
                    }}
                    style={{ padding: "6px 10px" }}
                  >
                    Edit
                  </button>
                ) : null}

                <button
                  onClick={() => deleteAnswer(a._id)}
                  style={{ padding: "6px 10px", background: "crimson", color: "white" }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        );
      })}

      <form onSubmit={postAnswer} style={{ marginTop: 20 }}>
        <textarea
          placeholder="Write an answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          style={{ width: "100%", padding: 10, minHeight: 80 }}
        />
        <button style={{ marginTop: 10, padding: "10px 14px" }}>
          Post Answer
        </button>
      </form>

      {err ? <p style={{ color: "crimson" }}>{err}</p> : null}
    </div>
  );
};

export default QuestionDetail;
