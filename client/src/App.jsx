import { useEffect, useState } from "react";
import api from "./api";
import Countdown from "./components/Countdown";

function App() {
  const [deadlines, setDeadlines] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);



  // form state
  const [courseCode, setCourseCode] = useState("CSE220");
  const [category, setCategory] = useState("exam");
  const [name, setName] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState(null);

  // filter state
  const [searchCourse, setSearchCourse] = useState("");

  const loadDeadlines = async () => {
    try {
      setLoading(true);
      const res = await api.get("/deadlines"); // get ALL deadlines
      setDeadlines(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load deadlines from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeadlines();
  }, []);

  const resetForm = () => {
    setName("");
    setSyllabus("");
    setDueDate("");
    setCategory("exam");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseCode || !name || !dueDate) {
      alert("Please fill course code, name, and due date");
      return;
    }

    try {
      if (editingId) {
        // UPDATE
        await api.put(`/deadlines/${editingId}`, {
          courseCode,
          category,
          name,
          syllabus,
          dueDate,
        });
      } else {
        // CREATE
        await api.post("/deadlines", {
          courseCode,
          category,
          name,
          syllabus,
          dueDate,
        });
      }

      resetForm();
      loadDeadlines();
    } catch (err) {
      console.error(err);
      alert("Failed to save deadline");
    }
  };

  const handleEdit = (item) => {
    setCourseCode(item.courseCode);
    setCategory(item.category);
    setName(item.name);
    setSyllabus(item.syllabus || "");
    const iso = item.dueDate;
    const local = iso.slice(0, 16); // for datetime-local
    setDueDate(local);
    setEditingId(item._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this deadline?")) return;

    try {
      await api.delete(`/deadlines/${id}`);
      if (editingId === id) {
        resetForm();
      }
      loadDeadlines();
    } catch (err) {
      console.error(err);
      alert("Failed to delete deadline");
    }
  };

  // all course codes from data
  const courseCodes = Array.from(
    new Set(deadlines.map((d) => d.courseCode))
  ).sort();

  // apply dropdown filter
  const filtered = deadlines.filter((d) =>
    searchCourse ? d.courseCode === searchCourse : true
  );

  // group by course + category
  const groupedByCourse = filtered.reduce((acc, d) => {
    if (!acc[d.courseCode]) {
      acc[d.courseCode] = { exams: [], assignments: [] };
    }
    if (d.category === "exam") {
      acc[d.courseCode].exams.push(d);
    } else {
      acc[d.courseCode].assignments.push(d);
    }
    return acc;
  }, {});

  const groupedCourseCodes = Object.keys(groupedByCourse).sort();

  return (
    <div style={{ maxWidth: "1100px", margin: "2rem auto", fontFamily: "Arial" }}>
      <h1>BRACU Student Hub</h1>
      <h3 style={{ color: "#555" }}>Deadlines & Countdown Manager</h3>

      {/* FORM */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: "1rem",
          marginBottom: "1.5rem",
          borderRadius: "4px",
        }}
      >
        <h2>{editingId ? "Edit Deadline" : "Add Deadline"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Course Code:&nbsp;
              <input
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CSE220"
              />
            </label>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Type:&nbsp;
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="exam">Exam</option>
                <option value="assignment">Assignment</option>
              </select>
            </label>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Name:&nbsp;
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Quiz 1, Mid, Final, Assignment 1..."
                style={{ width: "260px" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Syllabus:&nbsp;
              <input
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="Ch 1–3, Lab topics, etc."
                style={{ width: "320px" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Deadline:&nbsp;
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          </div>

          <button type="submit">
            {editingId ? "Update Deadline" : "Save Deadline"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{ marginLeft: "1rem" }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      {/* COURSE DROPDOWN FILTER */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Course:&nbsp;
          <select
            value={searchCourse}
            onChange={(e) => setSearchCourse(e.target.value)}
          >
            <option value="">All courses</option>
            {courseCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {/* ALL COURSES + GROUPED */}
      {groupedCourseCodes.length === 0 && !loading && (
        <p>No deadlines found. Try adding some or clearing filter.</p>
      )}

      {groupedCourseCodes.map((code) => {
        const { exams, assignments } = groupedByCourse[code];
        return (
          <div
            key={code}
            style={{
              border: "1px solid #ccc",
              marginTop: "1.5rem",
              padding: "1rem",
              borderRadius: "4px",
            }}
          >
            <h2>{code}</h2>
            <div
              style={{
                display: "flex",
                gap: "2rem",
                alignItems: "flex-start",
                marginTop: "0.5rem",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3>Exams</h3>
                {exams.length === 0 && <p>No exams.</p>}
                {exams.map((exam) => (
                  <div key={exam._id}>
                    <Countdown
                      title={
                        exam.syllabus
                          ? `${exam.name} – ${exam.syllabus}`
                          : exam.name
                      }
                      targetDate={exam.dueDate}
                    />
                    <button onClick={() => handleEdit(exam)}>Edit</button>
                    <button
                      onClick={() => handleDelete(exam._id)}
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1 }}>
                <h3>Assignments</h3>
                {assignments.length === 0 && <p>No assignments.</p>}
                {assignments.map((assn) => (
                  <div key={assn._id}>
                    <Countdown
                      title={
                        assn.syllabus
                          ? `${assn.name} – ${assn.syllabus}`
                          : assn.name
                      }
                      targetDate={assn.dueDate}
                    />
                    <button onClick={() => handleEdit(assn)}>Edit</button>
                    <button
                      onClick={() => handleDelete(assn._id)}
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default App;
