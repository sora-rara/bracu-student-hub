import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axios.jsx";
import authService from "../../services/auth.jsx";

const Questions = () => {
  const me = authService.getCurrentUser();

  const [items, setItems] = useState([]);
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");

  const [sortMode, setSortMode] = useState("newest"); // newest, oldest, today, week
  const [query, setQuery] = useState("");

  const load = async () => {
    try {
      setErr("");
      const res = await axios.get("/questions");
      setItems(res.data?.data || []);
    } catch (e) {
      console.log(e);
      setErr("Failed to load questions");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setErr("");
      const res = await axios.post("/questions", { body });
      if (res.data?.success) {
        setBody("");
        load();
      } else {
        setErr(res.data?.message || "An error occurred");
      }
    } catch (e2) {
      console.log(e2);
      setErr(e2?.response?.data?.message || "An error occurred");
    }
  };

  const filtered = useMemo(() => {
    let list = [...items];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((x) => {
        const text = (x.body || "").toLowerCase();
        const author = (x.user?.name || "").toLowerCase();
        return text.includes(q) || author.includes(q);
      });
    }

    const now = new Date();
    const isSameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const startOfWeek = (d) => {
      const x = new Date(d);
      const day = x.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      x.setDate(x.getDate() + diff);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (sortMode === "today") {
      list = list.filter((x) => {
        const t = x.createdAt ? new Date(x.createdAt) : null;
        return t ? isSameDay(t, now) : false;
      });
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return list;
    }

    if (sortMode === "week") {
      list = list.filter((x) => {
        const t = x.createdAt ? new Date(x.createdAt) : null;
        return t ? t >= weekStart && t < weekEnd : false;
      });
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return list;
    }

    if (sortMode === "oldest") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return list;
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [items, sortMode, query]);

  const dotStyle = (status) => {
    if (status === "new") {
      return { width: 10, height: 10, borderRadius: "50%", background: "crimson", display: "inline-block" };
    }
    if (status === "seen") {
      return { width: 10, height: 10, borderRadius: "50%", background: "green", display: "inline-block" };
    }
    return { width: 10, height: 10, borderRadius: "50%", background: "#d1d5db", display: "inline-block" };
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Q / A</h2>

      <form onSubmit={submit} style={{ marginBottom: 16 }}>
        <textarea
          placeholder="Ask your question..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ width: "100%", padding: 10, minHeight: 110 }}
        />
        <button style={{ marginTop: 10, padding: "10px 14px" }}>
          Post Question
        </button>
      </form>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search keyword (question text / author)..."
          style={{ padding: 10, flex: 1, minWidth: 220 }}
        />

        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          style={{ padding: 10 }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
        </select>

        <button onClick={load} type="button" style={{ padding: "10px 14px" }}>
          Refresh
        </button>
      </div>

      {err ? <p style={{ color: "crimson" }}>{err}</p> : null}

      <div>
        {filtered.map((q) => {
          const isOwner = me?.id && q.user?._id && String(me.id) === String(q.user._id);

          return (
            <div
              key={q._id}
              style={{
                border: "1px solid #ddd",
                padding: 14,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isOwner ? (
                  <span
                    title={
                      q._dotStatus === "new"
                        ? "New answers"
                        : q._dotStatus === "seen"
                          ? "Seen"
                          : "No answers"
                    }
                    style={dotStyle(q._dotStatus || "none")}
                  />
                ) : null}

                <Link to={`/questions/${q._id}`} style={{ fontSize: 18 }}>
                  {(q.body || "").slice(0, 70)}
                  {(q.body || "").length > 70 ? "..." : ""}
                </Link>
              </div>

              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                by {q.user?.name || "Unknown"} •{" "}
                {q.createdAt ? new Date(q.createdAt).toLocaleString() : ""} •{" "}
                {q.answers?.length || 0} answers
              </div>
            </div>
          );
        })}

        {filtered.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No questions found for this filter/search.</p>
        ) : null}
      </div>
    </div>
  );
};

export default Questions;
