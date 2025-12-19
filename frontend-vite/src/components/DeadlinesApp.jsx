// src/components/Deadlines/DeadlinesApp.jsx
import { useEffect, useState } from "react";
import axios from '../api/axios.jsx';
import Countdown from "./Countdown.jsx"; // adjust path if needed

export default function DeadlinesApp() {
    const searchParams = new URLSearchParams(window.location.search);
    const ownerEmail = searchParams.get("user") || null;

    const [deadlines, setDeadlines] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // form state
    const [courseCode, setCourseCode] = useState("");
    const [category, setCategory] = useState("select");
    const [name, setName] = useState("");
    const [syllabus, setSyllabus] = useState("");
    const [dueDate, setDueDate] = useState("");

    const [room, setRoom] = useState(""); // exam-only
    const [mode, setMode] = useState(""); // assignment-only
    const [submissionLink, setSubmissionLink] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [searchCourse, setSearchCourse] = useState("");
    const [quickFilter, setQuickFilter] = useState("all");

    const loadDeadlines = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/deadlines", {
                params: ownerEmail ? { ownerEmail } : {},
            });
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
    }, [ownerEmail]);

    const resetForm = () => {
        setCourseCode("");
        setCategory("select");
        setName("");
        setSyllabus("");
        setDueDate("");
        setRoom("");
        setMode("");
        setSubmissionLink("");
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!courseCode.trim()) { alert("Course code is required."); return; }
        if (category === "select") { alert("Please select exam or assignment."); return; }
        if (!name.trim()) { alert("Name is required."); return; }
        if (!dueDate) { alert("Due date & time are required."); return; }

        try {
            const payload = {
                courseCode,
                category,
                name,
                syllabus,
                dueDate,
                room: category === "exam" ? room : "",
                mode: category === "assignment" ? mode : "",
                submissionLink: category === "assignment" ? submissionLink : "",
                ownerEmail: ownerEmail || undefined,
            };

            if (editingId) {
                await axios.put(`/deadlines/${editingId}`, payload);
            } else {
                await axios.post("/deadlines", payload);
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
        const local = iso.slice(0, 16);
        setDueDate(local);

        setRoom(item.room || "");
        setMode(item.mode || "");
        setSubmissionLink(item.submissionLink || "");
        setEditingId(item._id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this deadline?")) return;
        try {
            await axios.delete(`/deadlines/${id}`);
            if (editingId === id) resetForm();
            loadDeadlines();
        } catch (err) {
            console.error(err);
            alert("Failed to delete deadline");
        }
    };

    const courseCodes = Array.from(new Set(deadlines.map(d => d.courseCode))).sort();

    const dueTodayCount = deadlines.filter(d => {
        const due = new Date(d.dueDate);
        const now = new Date();
        return due.toDateString() === now.toDateString();
    }).length;

    const dueTomorrowCount = deadlines.filter(d => {
        const due = new Date(d.dueDate);
        const t = new Date();
        t.setDate(t.getDate() + 1);
        return due.toDateString() === t.toDateString();
    }).length;

    let filtered = deadlines;
    if (searchCourse) filtered = filtered.filter(d => d.courseCode === searchCourse);
    if (quickFilter === "today") filtered = filtered.filter(d => new Date(d.dueDate).toDateString() === new Date().toDateString());
    if (quickFilter === "tomorrow") filtered = filtered.filter(d => {
        const t = new Date(); t.setDate(t.getDate() + 1);
        return new Date(d.dueDate).toDateString() === t.toDateString();
    });

    const groupedByCourse = filtered.reduce((acc, d) => {
        if (!acc[d.courseCode]) acc[d.courseCode] = { exams: [], assignments: [] };
        if (d.category === "exam") acc[d.courseCode].exams.push(d);
        else acc[d.courseCode].assignments.push(d);
        return acc;
    }, {});

    const groupedCourseCodes = Object.keys(groupedByCourse).sort();

    return (
        <div style={{ minHeight: "100vh", margin: 0, background: "#f3f4f6", padding: "2rem 0", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)", padding: "2rem 2.2rem 2.4rem", boxSizing: "border-box" }}>
                <header style={{ marginBottom: "1.8rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
                    <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 700, color: "#111827" }}>BRACU Student Hub — Deadline Manager</h1>
                    <p style={{ marginTop: "0.4rem", color: "#6b7280" }}>Keep tracks of your upcoming exams and assignments with live countdown!</p>
                </header>

                {/* Form + Overview */}
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "1.8rem" }}>
                    {/* Form Card */}
                    <div style={{ flex: 2, minWidth: "280px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.2rem 1.4rem", background: "#f9fafb" }}>
                        <h2 style={{ marginTop: 0, marginBottom: "0.8rem", fontSize: "1.1rem", color: "#111827" }}>{editingId ? "Edit Deadline" : "Add Deadline"}</h2>
                        <form onSubmit={handleSubmit}>
                            {/* Course & Type */}
                            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
                                <div style={{ flex: 1, minWidth: "180px" }}>
                                    <label style={labelStyle}>Course Code</label>
                                    <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="e.g. CSE220" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1, minWidth: "180px" }}>
                                    <label style={labelStyle}>Type</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                                        <option value="select">Select</option>
                                        <option value="exam">Exam</option>
                                        <option value="assignment">Assignment</option>
                                    </select>
                                </div>
                            </div>

                            {/* Name */}
                            <div style={{ marginBottom: "0.7rem" }}>
                                <label style={labelStyle}>Name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Quiz 1, Mid, Final, Assignment 1..." style={inputStyle} />
                            </div>

                            {/* Syllabus */}
                            <div style={{ marginBottom: "0.7rem" }}>
                                <label style={labelStyle}>Syllabus / Details</label>
                                <input value={syllabus} onChange={(e) => setSyllabus(e.target.value)} placeholder="Ch 1–3, lab topics, etc." style={inputStyle} />
                            </div>

                            {/* Exam-only */}
                            {category === "exam" && (
                                <div style={{ marginBottom: "0.7rem" }}>
                                    <label style={labelStyle}>Room Number</label>
                                    <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 09D-18C or UB20103" style={inputStyle} />
                                </div>
                            )}

                            {/* Assignment-only */}
                            {category === "assignment" && (
                                <>
                                    <div style={{ marginBottom: "0.7rem" }}>
                                        <label style={labelStyle}>Mode</label>
                                        <select value={mode} onChange={(e) => setMode(e.target.value)} style={inputStyle}>
                                            <option value="">Select</option>
                                            <option value="online">Online</option>
                                            <option value="offline">Offline</option>
                                            <option value="both">Both</option>
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: "0.7rem" }}>
                                        <label style={labelStyle}>Submission Link</label>
                                        <input value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} placeholder="Google Classroom / Moodle link" style={inputStyle} />
                                    </div>
                                </>
                            )}

                            {/* Deadline */}
                            <div style={{ marginBottom: "0.9rem" }}>
                                <label style={labelStyle}>Deadline (Date & Time)</label>
                                <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
                            </div>

                            <div>
                                <button type="submit" style={primaryBtn}>{editingId ? "Update Deadline" : "Save Deadline"}</button>
                                {editingId && <button type="button" onClick={resetForm} style={secondaryBtn}>Cancel Edit</button>}
                            </div>
                        </form>
                    </div>

                    {/* Overview Card */}
                    <div style={{ flex: 1, minWidth: "220px", borderRadius: "12px", padding: "1.1rem 1.3rem", border: "1px solid #e5e7eb", background: "#ffffff" }}>
                        <h3 style={{ marginTop: 0, marginBottom: "0.7rem", fontSize: "1rem", color: "#111827" }}>Overview</h3>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#6b7280" }}>Total deadlines: <strong>{deadlines.length}</strong></p>
                        <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "#6b7280" }}>Due today: <strong>{dueTodayCount}</strong></p>
                        <p style={{ margin: "0.1rem 0 0.9rem", fontSize: "0.85rem", color: "#6b7280" }}>Due tomorrow: <strong>{dueTomorrowCount}</strong></p>

                        <label style={{ ...labelStyle, marginBottom: "0.3rem", marginTop: "0.3rem" }}>Filter by course</label>
                        <select value={searchCourse} onChange={(e) => setSearchCourse(e.target.value)} style={inputStyle}>
                            <option value="">All courses</option>
                            {courseCodes.map(code => <option key={code} value={code}>{code}</option>)}
                        </select>

                        <label style={{ ...labelStyle, marginTop: "1rem", marginBottom: "0.3rem" }}>Quick filter</label>
                        <select value={quickFilter} onChange={(e) => setQuickFilter(e.target.value)} style={inputStyle}>
                            <option value="all">All deadlines</option>
                            <option value="today">Due today</option>
                            <option value="tomorrow">Due tomorrow</option>
                        </select>

                        <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#9ca3af" }}>Combine course filter and quick filter for a focused view.</p>
                    </div>
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}
                {loading && <p>Loading...</p>}

                {groupedCourseCodes.length === 0 && !loading && <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>No deadlines found. Try adding some above or clearing filters.</p>}

                {groupedCourseCodes.map(code => {
                    const { exams, assignments } = groupedByCourse[code];
                    return (
                        <div key={code} style={{ border: "1px solid #e5e7eb", marginTop: "1.2rem", padding: "1rem 1.2rem", borderRadius: "12px", background: "#f9fafb" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
                                <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#111827" }}>{code}</h2>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>{exams.length} exams · {assignments.length} assignments</p>
                            </div>

                            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginTop: "0.8rem", flexWrap: "wrap" }}>
                                {/* Exams */}
                                <div style={{ flex: 1, minWidth: "260px" }}>
                                    <h3 style={columnTitle}>Exams</h3>
                                    {exams.length === 0 && <p style={emptyText}>No exams.</p>}
                                    {exams.map(exam => (
                                        <div key={exam._id} style={{ marginBottom: "0.8rem" }}>
                                            <Countdown title={exam.syllabus ? `${exam.name} – ${exam.syllabus}` : exam.name} targetDate={exam.dueDate} />
                                            <div style={{ marginTop: "0.3rem" }}>
                                                <button onClick={() => handleEdit(exam)} style={tinyBtn}>Edit</button>
                                                <button onClick={() => handleDelete(exam._id)} style={tinyDangerBtn}>Delete</button>
                                            </div>
                                            {exam.room && <p style={{ fontSize: "0.8rem", marginTop: "0.2rem", color: "#4b5563" }}>Room: {exam.room}</p>}
                                        </div>
                                    ))}
                                </div>

                                {/* Assignments */}
                                <div style={{ flex: 1, minWidth: "260px" }}>
                                    <h3 style={columnTitle}>Assignments</h3>
                                    {assignments.length === 0 && <p style={emptyText}>No assignments.</p>}
                                    {assignments.map(assn => (
                                        <div key={assn._id} style={{ marginBottom: "0.8rem" }}>
                                            <Countdown title={assn.syllabus ? `${assn.name} – ${assn.syllabus}` : assn.name} targetDate={assn.dueDate} />
                                            <div style={{ marginTop: "0.3rem" }}>
                                                <button onClick={() => handleEdit(assn)} style={tinyBtn}>Edit</button>
                                                <button onClick={() => handleDelete(assn._id)} style={tinyDangerBtn}>Delete</button>
                                            </div>
                                            {(assn.mode || assn.submissionLink) && (
                                                <p style={{ fontSize: "0.8rem", marginTop: "0.2rem", color: "#4b5563" }}>
                                                    {assn.mode && <>Mode: {assn.mode} </>}
                                                    {assn.submissionLink && <>| <a href={assn.submissionLink} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>Submission link</a></>}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* Styles */
const labelStyle = { display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", color: "#6b7280" };
const inputStyle = { width: "100%", padding: "0.45rem 0.6rem", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none", fontSize: "0.9rem", boxSizing: "border-box" };
const primaryBtn = { padding: "0.5rem 1.2rem", borderRadius: "999px", border: "none", background: "#2563eb", color: "#ffffff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" };
const secondaryBtn = { padding: "0.48rem 1.1rem", borderRadius: "999px", border: "1px solid #9ca3af", background: "#ffffff", color: "#111827", fontSize: "0.85rem", marginLeft: "0.6rem", cursor: "pointer" };
const columnTitle = { fontSize: "1rem", marginBottom: "0.4rem", color: "#111827" };
const emptyText = { fontSize: "0.85rem", color: "#6b7280", fontStyle: "italic" };
const tinyBtn = { padding: "0.25rem 0.6rem", marginRight: "0.3rem", borderRadius: "8px", border: "1px solid #2563eb", background: "#ffffff", color: "#2563eb", fontSize: "0.75rem", cursor: "pointer" };
const tinyDangerBtn = { ...tinyBtn, border: "1px solid #dc2626", color: "#dc2626" };
