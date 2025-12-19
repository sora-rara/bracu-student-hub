// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import React from 'react';
import "./App.css";

import Navbar from "./components/Layout/Navbar.jsx";
import Footer from "./components/Layout/Footer.jsx";
import authService from "./services/auth.jsx";
import axios from "./api/axios.jsx";

// Pages
import HomePage from "./components/pages/HomePage.jsx";
import LoginPage from "./components/pages/LoginPage.jsx";
import SignupPage from "./components/pages/SignupPage.jsx";
import DashboardPage from "./components/pages/DashboardPage.jsx";
import GPACalculatorPage from "./components/pages/GPACalculatorPage.jsx";
import Profile from "./components/Dashboard/Profile/Profile.jsx";
import AdminDashboard from "./components/Admin/adminDashboard.jsx";

// Calendar
import CalendarView from "./components/Calendar/CalendarView.jsx";
import AddEvent from "./components/Calendar/AddEvent.jsx";
import AcademicDates from "./components/Calendar/AcademicDates.jsx";
import ClubActivities from "./components/Calendar/ClubActivities.jsx";
import ExamSchedule from "./components/Calendar/ExamSchedule.jsx";

// Cafeteria
import MenuDisplay from "./components/Cafeteria/MenuDisplay.jsx";
import ReviewModal from "./components/Cafeteria/ReviewModal.jsx";
import FoodItemCard from "./components/Cafeteria/FoodItemCard.jsx";
import FoodItemsList from "./components/FoodItemList.jsx";
import TodayMenuAdmin from "./components/Cafeteria/TodayMenuAdmin.jsx";
import AddFoodItem from "./components/Admin/AddFoodItem.jsx";
import EditFoodItem from "./components/Admin/EditFoodItem.jsx";
import WeeklyPlanning from "./components/Admin/WeeklyPlanning.jsx";

// Deadline components
import Countdown from "./components/Countdown.jsx";

// ---------------------------
// Import Graduation Planner Components
// ---------------------------
import GraduationPage from './components/pages/GraduationPage.jsx';
import RemainingCourses from './components/Graduation/RemainingCourses.jsx';
//import GraduationTimelinePage from './pages/GraduationTimelinePage.jsx';


// ---------------------------
// Import Groups Components
// ---------------------------
import FindMyGroupPage from './components/pages/FindMyGroupPage.jsx';
import CreateNeedPost from './components/Groups/CreateNeedPost.jsx';
import MyPostsPage from './components/pages/MyPostsPage.jsx';
import MyGroupsPage from './components/pages/MyGroupsPage.jsx';
import NeedPostDetail from './components/Groups/NeedPostDetail.jsx';
import GroupDetail from './components/Groups/GroupDetail.jsx';
import GroupModerationPage from './components/pages/GroupModerationPage.jsx';
import GroupAnalyticsPage from "./components/pages/GroupAnalyticsPage.jsx";

// ---------------------------
// Protected Routes
// ---------------------------
const UserRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await authService.checkAuthStatus();
        if (result.loggedIn) {
          const user = authService.getCurrentUser();
          setAuthenticated(true);
          setIsUserAdmin(user?.role === "admin" || user?.isAdmin);
        } else setAuthenticated(false);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  if (loading) return <div>Verifying authentication...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (isUserAdmin) return <Navigate to="/admin" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await authService.checkAuthStatus();
        if (result.loggedIn) {
          const user = authService.getCurrentUser();
          setAuthenticated(true);
          setIsUserAdmin(user?.role === "admin" || user?.isAdmin);
        } else setAuthenticated(false);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  if (loading) return <div>Verifying admin access...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (!isUserAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// ---------------------------
// Graduation Planner Components
// ---------------------------

// Course Detail Modal Component
const CourseDetailModal = ({ course, isOpen, onClose }) => {
  const [prerequisites, setPrerequisites] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      fetchPrerequisites();
    }
  }, [isOpen, course]);

  const fetchPrerequisites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/graduation/courses/${course.courseCode}/prerequisites`);
      if (response.data.success) {
        setPrerequisites(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching prerequisites:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Course Details: {course.courseCode}</h3>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <div className="course-details">
            <h4>{course.courseName}</h4>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Credits:</strong> {course.credits}
              </div>
              <div className="detail-item">
                <strong>Category:</strong> {course.category}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {course.status || 'Not Started'}
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading prerequisites...</div>
            ) : prerequisites && (
              <div className="prerequisites-section">
                <h5>Prerequisites</h5>
                {prerequisites.hardPrerequisites?.length > 0 && (
                  <div className="prereq-group">
                    <strong className="text-danger">Hard Prerequisites:</strong>
                    <div className="prereq-list">
                      {prerequisites.hardPrerequisites.map((prereq, idx) => (
                        <div key={idx} className={`prereq-item ${prerequisites.missingHard?.includes(prereq.courseCode) ? 'missing' : 'met'}`}>
                          {prereq.courseCode}
                          {prerequisites.missingHard?.includes(prereq.courseCode) && (
                            <span className="badge bg-danger ms-2">Missing</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {prerequisites.softPrerequisites?.length > 0 && (
                  <div className="prereq-group">
                    <strong className="text-warning">Soft Prerequisites:</strong>
                    <div className="prereq-list">
                      {prerequisites.softPrerequisites.map((prereq, idx) => (
                        <div key={idx} className={`prereq-item ${prerequisites.missingSoft?.includes(prereq.courseCode) ? 'missing' : 'met'}`}>
                          {prereq.courseCode}
                          {prerequisites.missingSoft?.includes(prereq.courseCode) && (
                            <span className="badge bg-warning ms-2">Recommended</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!prerequisites.hardPrerequisites?.length && !prerequisites.softPrerequisites?.length && (
                  <p className="text-muted">No prerequisites required</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Graduation Quick Stats Component
const GraduationQuickStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/graduation/progress');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching graduation stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="graduation-quick-stats loading">
        <div className="spinner"></div>
        <p>Loading graduation progress...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="graduation-quick-stats empty">
        <p>No graduation plan found. <a href="/graduation">Initialize your plan</a></p>
      </div>
    );
  }

  return (
    <div className="graduation-quick-stats">
      <div className="stats-header">
        <h4>Graduation Progress</h4>
        <span className="badge bg-primary">{Math.round(stats.progressPercentage)}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${stats.progressPercentage}%` }}
        ></div>
      </div>
      <div className="stats-details">
        <div className="stat-item">
          <span className="stat-label">Credits:</span>
          <span className="stat-value">
            {stats.totalCreditsCompleted} / {stats.totalCreditsRequired}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Program:</span>
          <span className="stat-value">
            {typeof stats.program === "string"
              ? stats.program
              : stats.program?.name || stats.program?.code || "N/A"}
          </span>

        </div>
        <div className="view-link">
          <a href="/graduation">View Full Progress →</a>
        </div>
      </div>
    </div>
  );
};

// ---------------------------
// Deadline Manager Component
// ---------------------------
const DeadlineManager = () => {
  const user = authService.getCurrentUser();
  const ownerEmail = user?.email || null;

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

  // filters
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
    if (!courseCode.trim()) return alert("Course code is required.");
    if (category === "select") return alert("Please select exam or assignment.");
    if (!name.trim()) return alert("Name is required.");
    if (!dueDate) return alert("Due date & time are required.");

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
    } catch {
      alert("Failed to save deadline");
    }
  };

  const handleEdit = (item) => {
    setCourseCode(item.courseCode);
    setCategory(item.category);
    setName(item.name);
    setSyllabus(item.syllabus || "");
    setDueDate(item.dueDate.slice(0, 16));
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
    } catch {
      alert("Failed to delete deadline");
    }
  };

  // filters & grouping
  const courseCodes = Array.from(new Set(deadlines.map((d) => d.courseCode))).sort();
  const dueTodayCount = deadlines.filter(d => new Date(d.dueDate).toDateString() === new Date().toDateString()).length;
  const dueTomorrowCount = deadlines.filter(d => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return new Date(d.dueDate).toDateString() === t.toDateString();
  }).length;

  let filtered = deadlines;
  if (searchCourse) filtered = filtered.filter(d => d.courseCode === searchCourse);
  if (quickFilter === "today") filtered = filtered.filter(d => new Date(d.dueDate).toDateString() === new Date().toDateString());
  if (quickFilter === "tomorrow") filtered = filtered.filter(d => {
    const t = new Date(); t.setDate(t.getDate() + 1); return new Date(d.dueDate).toDateString() === t.toDateString();
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

        {/* FORM + OVERVIEW */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "1.8rem" }}>
          <div style={{ flex: 2, minWidth: "280px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.2rem 1.4rem", background: "#f9fafb" }}>
            <h2 style={{ marginTop: 0, marginBottom: "0.8rem", fontSize: "1.1rem", color: "#111827" }}>{editingId ? "Edit Deadline" : "Add Deadline"}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={labelStyle}>Course Code</label>
                  <input value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="e.g. CSE220" style={inputStyle} />
                </div>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={labelStyle}>Type</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                    <option value="select">Select</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "0.7rem" }}>
                <label style={labelStyle}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Quiz 1, Mid, Final, Assignment 1..." style={inputStyle} />
              </div>
              <div style={{ marginBottom: "0.7rem" }}>
                <label style={labelStyle}>Syllabus / Details</label>
                <input value={syllabus} onChange={e => setSyllabus(e.target.value)} placeholder="Ch 1–3, lab topics, etc." style={inputStyle} />
              </div>
              {category === "exam" && (
                <div style={{ marginBottom: "0.7rem" }}>
                  <label style={labelStyle}>Room Number</label>
                  <input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. 09D-18C or UB20103" style={inputStyle} />
                </div>
              )}
              {category === "assignment" && (
                <>
                  <div style={{ marginBottom: "0.7rem" }}>
                    <label style={labelStyle}>Mode</label>
                    <select value={mode} onChange={e => setMode(e.target.value)} style={inputStyle}>
                      <option value="">Select</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: "0.7rem" }}>
                    <label style={labelStyle}>Submission Link</label>
                    <input value={submissionLink} onChange={e => setSubmissionLink(e.target.value)} placeholder="Google Classroom / Moodle link" style={inputStyle} />
                  </div>
                </>
              )}
              <div style={{ marginBottom: "0.9rem" }}>
                <label style={labelStyle}>Deadline (Date & Time)</label>
                <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <button type="submit" style={primaryBtn}>{editingId ? "Update Deadline" : "Save Deadline"}</button>
                {editingId && <button type="button" onClick={resetForm} style={secondaryBtn}>Cancel Edit</button>}
              </div>
            </form>
          </div>

          <div style={{ flex: 1, minWidth: "220px", borderRadius: "12px", padding: "1.1rem 1.3rem", border: "1px solid #e5e7eb", background: "#ffffff" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.7rem", fontSize: "1rem", color: "#111827" }}>Overview</h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#6b7280" }}>Total deadlines: <strong>{deadlines.length}</strong></p>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "#6b7280" }}>Due today: <strong>{dueTodayCount}</strong></p>
            <p style={{ margin: "0.1rem 0 0.9rem", fontSize: "0.85rem", color: "#6b7280" }}>Due tomorrow: <strong>{dueTomorrowCount}</strong></p>

            <label style={{ ...labelStyle, marginBottom: "0.3rem", marginTop: "0.3rem" }}>Filter by course</label>
            <select value={searchCourse} onChange={e => setSearchCourse(e.target.value)} style={inputStyle}>
              <option value="">All courses</option>
              {courseCodes.map(code => <option key={code} value={code}>{code}</option>)}
            </select>

            <label style={{ ...labelStyle, marginTop: "1rem", marginBottom: "0.3rem" }}>Quick filter</label>
            <select value={quickFilter} onChange={e => setQuickFilter(e.target.value)} style={inputStyle}>
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
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 style={columnTitle}>Exams</h3>
                  {exams.length === 0 && <p style={emptyText}>No exams.</p>}
                  {exams.map(exam => (
                    <div key={exam._id} style={{ marginBottom: "0.8rem" }}>
                      <Countdown title={exam.syllabus ? `${exam.name} – ${exam.syllabus}` : exam.name} targetDate={exam.dueDate} />
                      <div style={{ marginTop: "0.3rem" }}>
                        <button onClick={() => handleEdit(exam)} style={tinyBtn}>Edit</button>
                        <button onClick={() => handleDelete(exam._id)} style={tinyBtn}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 style={columnTitle}>Assignments</h3>
                  {assignments.length === 0 && <p style={emptyText}>No assignments.</p>}
                  {assignments.map(a => (
                    <div key={a._id} style={{ marginBottom: "0.8rem" }}>
                      <Countdown title={a.syllabus ? `${a.name} – ${a.syllabus}` : a.name} targetDate={a.dueDate} />
                      <div style={{ marginTop: "0.3rem" }}>
                        <button onClick={() => handleEdit(a)} style={tinyBtn}>Edit</button>
                        <button onClick={() => handleDelete(a._id)} style={tinyBtn}>Delete</button>
                      </div>
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
};

// ---------------------------
// Styles for Deadline Manager
// ---------------------------
const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.2rem" };
const inputStyle = { width: "100%", padding: "0.5rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.875rem", outline: "none" };
const primaryBtn = { marginTop: "0.6rem", padding: "0.55rem 1rem", background: "#3b82f6", color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer" };
const secondaryBtn = { marginTop: "0.6rem", marginLeft: "0.6rem", padding: "0.55rem 1rem", background: "#d1d5db", color: "#111827", borderRadius: "8px", border: "none", cursor: "pointer" };
const tinyBtn = { padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "#f3f4f6", cursor: "pointer", marginRight: "0.3rem" };
const columnTitle = { marginTop: 0, marginBottom: "0.3rem", fontSize: "1rem", fontWeight: 600, color: "#111827" };
const emptyText = { fontSize: "0.85rem", color: "#6b7280", fontStyle: "italic" };

// ---------------------------
// Cafeteria Pages (Student & Admin)
// ---------------------------
const CafeteriaTodayMenu = () => <MenuDisplay />;

const CafeteriaSubmitReview = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    axios.get("/cafeteria/food-items/active")
      .then(res => setFoodItems(res.data.data?.foodItems || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="page-container">
      <h1>✍️ Submit Review</h1>
      <div className="food-items-grid">
        {foodItems.map(item => (
          <div key={item._id} className="food-item-card">
            <FoodItemCard item={item} />
            <button onClick={() => { setSelectedItem(item); setShowModal(true); }}>
              Review This Item
            </button>
          </div>
        ))}
      </div>
      {showModal && selectedItem && (
        <ReviewModal isOpen={showModal} onClose={() => setShowModal(false)} foodItem={selectedItem} />
      )}
    </div>
  );
};

const CafeteriaPastReviews = () => {
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    axios.get("/cafeteria/reviews/all")
      .then(res => setReviews(res.data.data?.reviews || []))
      .catch(err => console.error(err));
  }, []);
  return (
    <div className="page-container">
      <h1>📋 Past Reviews</h1>
      <div className="reviews-list">
        {reviews.map(r => (
          <div key={r._id} className="review-card">
            <strong>{r.anonymous ? "Anonymous" : r.studentName}</strong>
            <span>{"★".repeat(r.rating)}</span>
            <p>{r.comment}</p>
            <small>{new Date(r.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

const CafeteriaAllItems = () => <FoodItemsList />;

const CafeteriaWeeklyCalendar = () => {
  const [calendarData, setCalendarData] = useState([]);
  useEffect(() => {
    axios.get("/cafeteria/menu/weekly-calendar")
      .then(res => setCalendarData(res.data.data?.calendar || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="calendar-grid">
      {calendarData.map((day, idx) => (
        <div key={idx} className="calendar-day">
          <h3>{day.dayName}</h3>
          <p>{day.date}</p>
          {day.menuItems?.map((item, i) => <div key={i}>{item.name} - ৳{item.price?.toFixed(2)}</div>)}
        </div>
      ))}
    </div>
  );
};

const CafeteriaAdminPanel = () => {
  const [foodItems, setFoodItems] = useState([]);
  useEffect(() => fetchFoodItems(), []);

  const fetchFoodItems = async () => {
    try {
      const res = await axios.get("/cafeteria/admin/food-items");
      setFoodItems(res.data.data?.foodItems || []);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async id => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`/cafeteria/admin/food-items/${id}`);
        fetchFoodItems();
      } catch { alert("Error deleting item"); }
    }
  };

  return (
    <div className="page-container">
      <h1>🍽️ Cafeteria Admin Panel</h1>
      <button onClick={() => window.location.href = "/cafeteria/admin/add-item"}>➕ Add Food Item</button>
      <button onClick={() => window.location.href = "/cafeteria/admin/menu-planning"}>📅 Weekly Planning</button>
      <button onClick={() => window.location.href = "/admin"}>← Back to Admin Dashboard</button>

      <div className="food-items-grid">
        {foodItems.map(item => (
          <div key={item._id} className="food-item-card">
            {item.image && <img src={`http://localhost:5000${item.image}`} alt={item.name} />}
            <h3>{item.name}</h3>
            <p>৳{item.price?.toFixed(2)}</p>
            <div>
              <button onClick={() => window.location.href = `/cafeteria/admin/edit-item/${item._id}`}>Edit</button>
              <button onClick={() => handleDelete(item._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------
// Enhanced Dashboard with Graduation Stats
// ---------------------------
const EnhancedDashboard = () => {
  const [graduationStats, setGraduationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGraduationStats();
  }, []);

  const fetchGraduationStats = async () => {
    try {
      const response = await axios.get('/api/graduation/progress');
      console.log('Graduation Stats Full Response:', response.data); // Debug

      if (response.data.success) {
        const data = response.data.data;
        console.log('Graduation Data:', data); // Debug
        console.log('Progress Percentage:', data.progressPercentage); // Debug
        console.log('Program Object:', data.program); // Debug

        setGraduationStats(data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch graduation stats');
      }
    } catch (err) {
      console.error('Error fetching graduation stats:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Safely get progress percentage
  const getProgressPercentage = () => {
    if (!graduationStats || graduationStats.progressPercentage == null) return 0;
    const percent = parseFloat(graduationStats.progressPercentage);
    return isNaN(percent) ? 0 : Math.round(percent);
  };

  // Safely get program name
  const getProgramName = () => {
    if (!graduationStats || !graduationStats.program) return 'N/A';

    const program = graduationStats.program;
    if (typeof program === 'string') return program;
    if (typeof program === 'object') {
      // Handle object with code/name/department
      return program.name || program.code || 'N/A';
    }
    return 'N/A';
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <button className="btn btn-sm btn-link" onClick={fetchGraduationStats}>
            Retry
          </button>
        </div>
      )}

      {/* Graduation Stats Widget */}
      {graduationStats && !loading && (
        <div className="graduation-widget card mb-4">
          <div className="card-body">
            <h3 className="card-title">Graduation Progress</h3>

            <div className="progress-summary d-flex align-items-center">
              {/* Progress Circle */}
              <div className="progress-circle me-4 text-center">
                <div className="display-4 fw-bold text-primary">
                  {getProgressPercentage()}%
                </div>
                <div className="text-muted">Complete</div>
              </div>

              {/* Progress Details */}
              <div className="progress-details flex-grow-1">
                <div className="row mb-2">
                  <div className="col-6">
                    <div className="detail-item">
                      <span className="text-muted small">Credits</span>
                      <div className="fw-bold">
                        {graduationStats.totalCreditsCompleted || 0}/
                        {graduationStats.totalCreditsRequired || 0}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="detail-item">
                      <span className="text-muted small">Program</span>
                      <div className="fw-bold">
                        {getProgramName()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="progress mt-2" style={{ height: '8px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${getProgressPercentage()}%` }}
                    aria-valuenow={getProgressPercentage()}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>

                <a href="/graduation" className="btn btn-outline-primary btn-sm mt-3">
                  View Details →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Graduation Plan */}
      {!graduationStats && !loading && !error && (
        <div className="card mb-4 text-center">
          <div className="card-body">
            <h5 className="card-title">Graduation Planner</h5>
            <p className="text-muted">Set up your graduation plan to track your progress</p>
            <a href="/graduation" className="btn btn-primary">
              Get Started
            </a>
          </div>
        </div>
      )}

      {/* Other dashboard widgets */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-title">Upcoming Deadlines</h3>
              <p className="card-text">Track your exams and assignments</p>
              <a href="/deadlines" className="btn btn-outline-secondary">
                View All →
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-title">Today's Menu</h3>
              <p className="card-text">Check cafeteria offerings</p>
              <a href="/cafeteria/today-menu" className="btn btn-outline-secondary">
                View Menu →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



// ---------------------------
// App Component
// ---------------------------
export default function App() {
  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* User */}
          <Route path="/dashboard" element={<UserRoute><EnhancedDashboard /></UserRoute>} />
          <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
          <Route path="/gpa-calculator" element={<UserRoute><GPACalculatorPage /></UserRoute>} />
          <Route path="/deadlines" element={<UserRoute><DeadlineManager /></UserRoute>} />

          {/* Graduation Planner Routes */}
          <Route path="/graduation" element={<UserRoute><GraduationPage /></UserRoute>} />
          <Route path="/graduation/remaining" element={<UserRoute><RemainingCourses /></UserRoute>} />


          {/* Cafeteria Student */}
          <Route path="/cafeteria/today-menu" element={<UserRoute><CafeteriaTodayMenu /></UserRoute>} />
          <Route path="/cafeteria/submit-review" element={<UserRoute><CafeteriaSubmitReview /></UserRoute>} />
          <Route path="/cafeteria/past-reviews" element={<UserRoute><CafeteriaPastReviews /></UserRoute>} />
          <Route path="/cafeteria/weekly-calendar" element={<UserRoute><CafeteriaWeeklyCalendar /></UserRoute>} />
          <Route path="/cafeteria/all-items" element={<UserRoute><CafeteriaAllItems /></UserRoute>} />

          {/* Cafeteria Admin */}
          <Route path="/cafeteria/admin" element={<AdminRoute><CafeteriaAdminPanel /></AdminRoute>} />
          <Route path="/cafeteria/admin/add-item" element={<AdminRoute><AddFoodItem /></AdminRoute>} />
          <Route path="/cafeteria/admin/edit-item/:id" element={<AdminRoute><EditFoodItem /></AdminRoute>} />
          <Route path="/cafeteria/admin/menu-planning" element={<AdminRoute><WeeklyPlanning /></AdminRoute>} />
          <Route path="/cafeteria/admin/today-menu" element={<AdminRoute><TodayMenuAdmin /></AdminRoute>} />

          {/* Calendar */}
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/calendar/add-event" element={<AddEvent />} />
          <Route path="/calendar/academic-dates" element={<AcademicDates />} />
          <Route path="/calendar/club-activities" element={<ClubActivities />} />
          <Route path="/calendar/exam-schedule" element={<ExamSchedule />} />


          {/* Groups */}
          <Route path="/find-my-group" element={<UserRoute><FindMyGroupPage /></UserRoute>} />
          <Route path="/find-my-group/create" element={<UserRoute><CreateNeedPost /></UserRoute>} />
          <Route path="/find-my-group/:id" element={<UserRoute><NeedPostDetail /></UserRoute>} />
          <Route path="/find-my-group/my-posts" element={<UserRoute><MyPostsPage /></UserRoute>} />
          <Route path="/find-my-group/my-groups" element={<UserRoute><MyGroupsPage /></UserRoute>} />
          <Route path="/groups/:id" element={<UserRoute><GroupDetail /></UserRoute>} />

          {/* Admin routes */}
          <Route path="/find-my-group/admin" element={<AdminRoute><GroupModerationPage /></AdminRoute>} />
          <Route path="/find-my-group/admin/analytics" element={<AdminRoute><GroupAnalyticsPage /></AdminRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Catch-all */}
          <Route
            path="*"
            element={
              authService.isAuthenticated()
                ? authService.isAdmin()
                  ? <Navigate to="/admin" />
                  : <Navigate to="/dashboard" />
                : <Navigate to="/" />
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}