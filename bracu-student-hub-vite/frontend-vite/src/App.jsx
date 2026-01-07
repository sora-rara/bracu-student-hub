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
import BudgetPage from "./components/pages/BudgetPage.jsx";
import FreeLabsPage from "./components/pages/FreeLabsPage.jsx";
import RoutineSetupPage from "./components/pages/RoutineSetupPage.jsx";
import MyRoutinePage from "./components/pages/MyRoutinePage.jsx";
import Questions from "./components/pages/Questions.jsx";
import QuestionDetail from "./components/pages/QuestionDetail.jsx";


// Calendar
import CalendarView from "./components/Calendar/CalendarView.jsx";
import AddEvent from "./components/Calendar/AddEvent.jsx";
import AcademicDates from "./components/Calendar/AcademicDates.jsx";
import ClubActivities from "./components/Calendar/ClubActivities.jsx";
import ExamSchedule from "./components/Calendar/ExamSchedule.jsx";

// Cafeteria
import MenuDisplay from "./components/Cafeteria/MenuDisplay.jsx";
import ReviewModal from "./components/Cafeteria/ReviewModal.jsx";
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
import SemesterPlanner from './components/Graduation/SemesterPlanner.jsx';
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

// ===========================
// TEXTBOOK EXCHANGE IMPORTS
// ===========================
import TextbookExchange from './components/Textbook/TextbookExchange.jsx';
import TextbookDetail from './components/Textbook/TextbookDetail.jsx';
import TextbookForm from './components/Textbook/TextbookForm.jsx';
import MyListingsPage from './components/pages/MyListingsPage.jsx';
import FavoritesPage from './components/pages/FavoritesPage.jsx';
import TextbookAdminPanel from './components/Admin/TextbookAdminPanel.jsx';
// ===========================


// Course Components
import CourseContentPage from "./components/pages/CourseContentPage.jsx";
import CourseReviewsPage from "./components/pages/CourseReviewsPage.jsx";
import MyUploadsPage from "./components/pages/MyUploadsPage.jsx";

// Course Admin Panel
import CourseAdminPanel from "./components/Admin/CourseAdminPanel.jsx";


// Faculty Rating Components
import FacultyRatingPage from './components/pages/FacultyRatingPage.jsx';
import FacultyManagementPage from './components/pages/FacultyManagementPage.jsx';

// Career Components - SIMPLIFIED IMPORTS
import InternshipList from './components/career/student/InternshipList.jsx';
import InternshipCard from './components/career/student/InternshipCard.jsx';
import CreateInternship from './components/career/admin/CreateInternship.jsx';
import AdminCareer from './components/pages/admin/AdminCareer.jsx';
import CreateOpportunity from './components/career/admin/CreateOpportunity.jsx';
import InternshipDetail from './components/career/student/InternshipDetail.jsx';
import EditOpportunity from './components/career/admin/EditOpportunity.jsx';
import ApplicationsManagement from './components/pages/admin/ApplicationsManagement.jsx';
import MyApplications from './components/career/student/MyApplications.jsx';
import ApplicationPortal from './components/career/student/ApplicationPortal.jsx';

// Scholarship Components
import ScholarshipList from './components/career/student/ScholarshipList.jsx';
import ScholarshipDetail from './components/career/student/ScholarshipDetail.jsx';
import MyScholarshipApplications from './components/career/student/MyScholarshipApplications.jsx';
import ScholarshipApplicationPortal from './components/career/student/ScholarshipApplicationPortal.jsx';
import SavedScholarships from './components/career/student/SavedScholarships.jsx';
// Admin Scholarship Components
import ScholarshipManage from './components/career/admin/ScholarshipManage.jsx';
import CreateScholarship from './components/career/admin/CreateScholarship.jsx';
import EditScholarship from './components/career/admin/EditScholarship.jsx';
import ScholarshipApplications from './components/career/admin/ScholarshipApplications.jsx';
import ScholarshipApplicationDetail from './components/career/admin/ScholarshipApplicationDetail.jsx';

//Job Opportunity Components
import JobList from './components/career/student/JobList';
import JobDetail from './components/career/student/JobDetail';
import JobApplicationPortal from './components/career/student/JobApplicationPortal';
import MyJobApplications from './components/career/student/MyJobApplications';
import SavedJobs from './components/career/student/SavedJobs';
import JobListAdmin from './components/career/admin/JobListAdmin';
import CreateJob from './components/career/admin/CreateJob';
import EditJob from './components/career/admin/EditJob';
import JobApplicationsAdmin from './components/career/admin/JobApplicationsAdmin';
import JobApplicationDetail from './components/career/admin/JobApplicationDetail';
import AdminJobRoute from './components/admin/AdminJobRoute';

// ---------------------------
// Protected Routes
// ---------------------------
const UserRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // CORRECT - Separate useEffect hooks
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

  // SEPARATE useEffect for drag scrolling
  useEffect(() => {
    let scrollInterval = null;
    let isDragging = false;

    const handleDragOver = (e) => {
      if (!isDragging) return;

      const viewportHeight = window.innerHeight;
      const mouseY = e.clientY;
      const scrollThreshold = 100; // Start scrolling 100px from edges

      // Clear previous interval
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }

      // Scroll up if near top
      if (mouseY < scrollThreshold) {
        scrollInterval = setInterval(() => {
          window.scrollBy({ top: -10, behavior: 'smooth' });
        }, 16);
      }
      // Scroll down if near bottom
      else if (mouseY > viewportHeight - scrollThreshold) {
        scrollInterval = setInterval(() => {
          window.scrollBy({ top: 10, behavior: 'smooth' });
        }, 16);
      }
    };

    const handleDragStart = () => {
      isDragging = true;
      document.addEventListener('dragover', handleDragOver);
    };

    const handleDragEnd = () => {
      isDragging = false;
      document.removeEventListener('dragover', handleDragOver);
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    };

    // Add global event listeners
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('drop', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
      document.removeEventListener('dragover', handleDragOver);
      if (scrollInterval) clearInterval(scrollInterval);
    };
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
// Cafeteria Admin Panel Component - FIXED WITH HOOK RULES
// ---------------------------
const CafeteriaAdminPanel = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/cafeteria/admin/food-items");
      console.log('Food items response:', res.data);
      setFoodItems(res.data.data?.foodItems || []);
    } catch (err) {
      console.error('Error fetching food items:', err);
      alert('Error loading food items');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Remove external placeholder.com URLs
  const getImageUrl = (imageName) => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    if (!imageName || typeof imageName !== 'string') {
      return null; // Return null for local fallback
    }

    if (imageName.startsWith('http')) {
      return imageName;
    }

    if (imageName.startsWith('/uploads/')) {
      return `${BASE_URL}${imageName}`;
    }

    return `${BASE_URL}/uploads/${imageName}`;
  };

  // Local fallback image component
  const FallbackImage = () => (
    <div style={{
      width: '100%',
      height: '150px',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      border: '1px solid #ddd'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px' }}>🍽️</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>No Image</div>
      </div>
    </div>
  );

  // Create a separate component for FoodItemCard to avoid hook violation
  const FoodItemCard = ({ item }) => {
    const [imageError, setImageError] = useState(false); // ✅ Hook is now at top level of component
    const imageUrl = getImageUrl(item.image);

    const handleDelete = async (id) => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        try {
          await axios.delete(`/cafeteria/admin/food-items/${id}`);
          fetchFoodItems();
          alert('Item deleted successfully');
        } catch {
          alert("Error deleting item");
        }
      }
    };

    return (
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ height: '200px', overflow: 'hidden' }}>
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={item.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            <FallbackImage />
          )}
        </div>

        <div style={{ padding: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{item.name}</h3>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{
              backgroundColor: '#e8f4fd',
              color: '#0369a1',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px'
            }}>
              {item.category?.replace('_', ' ') || 'Uncategorized'}
            </span>
            <span style={{
              backgroundColor: '#f0f9ff',
              color: '#0c4a6e',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px'
            }}>
              {item.mealTime || 'N/A'}
            </span>
          </div>

          <p style={{
            color: '#555',
            fontSize: '14px',
            marginBottom: '12px',
            minHeight: '40px'
          }}>
            {item.shortDescription || item.description?.substring(0, 80) + '...' || 'No description'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#2ecc71'
            }}>
              ৳{item.price?.toFixed(2) || '0.00'}
            </span>

            {item.featured && (
              <span style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px'
              }}>
                ⭐ Featured
              </span>
            )}
          </div>

          {Array.isArray(item.dietaryTags) && item.dietaryTags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {item.dietaryTags.map(tag => (
                <span key={tag} style={{
                  backgroundColor: '#e7f7ef',
                  color: '#0f5132',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px'
                }}>
                  {tag.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.location.href = `/cafeteria/admin/edit-item/${item._id}`}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(item._id)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>🍽️ Cafeteria Management</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>Manage all food items in the cafeteria</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.href = "/cafeteria/admin/add-item"}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ➕ Add New Food Item
          </button>
          <button
            onClick={() => window.location.href = "/cafeteria/admin/menu-planning"}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📅 Weekly Planning
          </button>
          <button
            onClick={() => window.location.href = "/admin"}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #3498db',
              color: '#3498db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading food items...</p>
        </div>
      ) : foodItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed #ddd', borderRadius: '12px' }}>
          <p style={{ marginBottom: '20px' }}>No food items found.</p>
          <button
            onClick={() => window.location.href = "/cafeteria/admin/add-item"}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Add Your First Food Item
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {foodItems.map(item => (
            <FoodItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};// ---------------------------
// Cafeteria Pages (Student) - FIXED VERSION
// ---------------------------
const CafeteriaTodayMenu = () => <MenuDisplay />;

const CafeteriaSubmitReview = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userReviews, setUserReviews] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/cafeteria/food-items/active");
      const items = response.data.data?.foodItems || [];
      setFoodItems(items);

      // Load user's existing reviews for each item
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        const reviewPromises = items.map(async (item) => {
          try {
            const userReviewResponse = await axios.get(`/cafeteria/reviews/user/${item._id}`, {
              params: { userEmail: user?.email }
            });
            if (userReviewResponse.data?.success && userReviewResponse.data.data) {
              return { itemId: item._id, review: userReviewResponse.data.data };
            }
          } catch (error) {
            // User hasn't reviewed this item yet
            console.log(`No review found for item ${item._id}`);
          }
          return null;
        });

        const reviews = await Promise.all(reviewPromises);
        const reviewMap = {};
        reviews.forEach(result => {
          if (result) {
            reviewMap[result.itemId] = result.review;
          }
        });
        setUserReviews(reviewMap);
      }
    } catch (err) {
      console.error("Error loading food items:", err);
      alert("Failed to load food items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      if (!authService.isAuthenticated()) {
        alert("Please login to submit a review");
        window.location.href = "/login";
        return;
      }

      const user = authService.getCurrentUser();
      if (!user || !user.email) {
        alert("User information not found. Please login again.");
        return;
      }

      // Make sure we have the correct API endpoint
      const completeReviewData = {
        ...reviewData,
        userEmail: user.email
      };

      console.log("Submitting review to /cafeteria/reviews:", completeReviewData);

      const response = await axios.post("/cafeteria/reviews", completeReviewData);

      if (response.data.success) {
        alert("Review submitted successfully!");
        setShowModal(false);
        loadFoodItems(); // Refresh to show updated reviews
      } else {
        const errorMsg = response.data.message || "Failed to submit review";
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error submitting review:", error);

      // Better error handling
      if (error.response) {
        const errorMsg = error.response.data?.message ||
          error.response.data?.error ||
          "Server error occurred";
        alert(`Error: ${errorMsg} (Status: ${error.response.status})`);
      } else if (error.request) {
        alert("Network error: Could not connect to server. Please check your connection.");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  const handleReviewUpdate = async (reviewId, reviewData) => {
    try {
      if (!authService.isAuthenticated()) {
        alert("Please login to update review");
        window.location.href = "/login";
        return;
      }

      const user = authService.getCurrentUser();
      if (!user || !user.email) {
        alert("User information not found. Please login again.");
        return;
      }

      // Make sure we have the correct API endpoint
      const completeReviewData = {
        ...reviewData,
        userEmail: user.email
      };

      console.log("Updating review to /cafeteria/reviews/:id:", completeReviewData);

      const response = await axios.put(`/cafeteria/reviews/${reviewId}`, completeReviewData);

      if (response.data.success) {
        alert("Review updated successfully!");
        setShowModal(false);
        loadFoodItems(); // Refresh to show updated reviews
      } else {
        const errorMsg = response.data.message || "Failed to update review";
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error updating review:", error);

      if (error.response) {
        const errorMsg = error.response.data?.message ||
          error.response.data?.error ||
          "Server error occurred";
        alert(`Error: ${errorMsg} (Status: ${error.response.status})`);
      } else if (error.request) {
        alert("Network error: Could not connect to server.");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  const handleReviewClick = (item, existingReview) => {
    if (existingReview) {
      setSelectedItem({
        ...item,
        existingReview: existingReview
      });
    } else {
      setSelectedItem({
        ...item,
        existingReview: null
      });
    }
    setShowModal(true);
  };

  return (
    <div className="page-container">
      <div className="submit-review-header">
        <h1>✍️ Submit Review</h1>
        <p>Share your experience with cafeteria food items</p>
        {!authService.isAuthenticated() && (
          <div className="alert alert-warning" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '5px' }}>
            Please <a href="/login" style={{ color: '#856404', fontWeight: 'bold', textDecoration: 'underline' }}>login</a> to submit reviews.
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-container" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading food items...</p>
        </div>
      ) : foodItems.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>No food items available for review.</p>
        </div>
      ) : (
        <div className="food-items-grid-with-reviews">
          {foodItems.map(item => {
            const existingReview = userReviews[item._id];
            return (
              <FoodItemCardWithReviews
                key={item._id}
                item={item}
                onReviewClick={handleReviewClick}
                existingReview={existingReview}
              />
            );
          })}
        </div>
      )}

      {showModal && selectedItem && (
        <ReviewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          foodItem={selectedItem}
          onSubmitReview={handleReviewSubmit}
          onUpdateReview={handleReviewUpdate}
          existingReview={selectedItem.existingReview}
        />
      )}
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

// ---------------------------
// Enhanced Food Item Card with Reviews - FIXED VERSION
// ---------------------------
const FoodItemCardWithReviews = ({ item, onReviewClick, existingReview }) => {
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [imageError, setImageError] = useState(false);

  // ✅ FIXED: Proper image URL handling
  const getImageUrl = (imageName) => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    if (!imageName || typeof imageName !== 'string') {
      return null; // Return null for fallback
    }

    // If it's already a full URL
    if (imageName.startsWith('http')) {
      return imageName;
    }

    // If it's a relative path starting with /uploads/
    if (imageName.startsWith('/uploads/')) {
      return `${BASE_URL}${imageName}`;
    }

    // Default: assume it's a filename
    return `${BASE_URL}/uploads/${imageName}`;
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await axios.get(`/cafeteria/reviews/${item._id}`);
      if (response.data?.success) {
        setReviews(response.data.data?.reviews || []);
      }

      // Also fetch user's review if logged in
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        try {
          const userReviewResponse = await axios.get(`/cafeteria/reviews/user/${item._id}`, {
            params: { userEmail: user?.email }
          });
          if (userReviewResponse.data?.success && userReviewResponse.data.data) {
            setUserReview(userReviewResponse.data.data);
          }
        } catch (error) {
          // User hasn't reviewed this item yet
          console.log("User hasn't reviewed this item yet");
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const toggleReviews = () => {
    if (!showReviews) {
      fetchReviews();
    }
    setShowReviews(!showReviews);
  };

  const averageRating = item.averageRating || 0;
  const totalReviews = item.totalReviews || 0;

  // ✅ FIXED: Proper fallback image component
  const FallbackImage = () => (
    <div className="food-item-fallback-image">
      <div className="fallback-icon">🍽️</div>
      <div className="fallback-text">Food Image</div>
    </div>
  );

  // Get the image URL
  const imageUrl = getImageUrl(item.image);

  return (
    <div className="food-item-card-with-reviews">
      <div className="food-item-card-enhanced">
        {/* ✅ FIXED: Image container with proper styling */}
        <div className="food-item-image-container">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="food-item-image"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <FallbackImage />
          )}
        </div>

        <div className="food-item-info-enhanced">
          <div className="food-item-header">
            <h3 className="food-item-title">{item.name}</h3>
            <div className="food-price-tag">৳{item.price?.toFixed(2) || '0.00'}</div>
          </div>

          <div className="food-item-meta">
            <span className={`category-tag ${item.category}`}>
              {item.category?.replace('_', ' ') || 'Uncategorized'}
            </span>
            <span className={`meal-time-tag ${item.mealTime}`}>
              {item.mealTime || 'N/A'}
            </span>
            {item.featured && (
              <span className="featured-badge">
                ⭐ Featured
              </span>
            )}
          </div>

          <p className="food-description-enhanced">
            {item.shortDescription || item.description || 'No description available'}
          </p>

          {Array.isArray(item.dietaryTags) && item.dietaryTags.length > 0 && (
            <div className="dietary-tags-enhanced">
              {item.dietaryTags.map(tag => (
                <span key={tag} className="dietary-tag-enhanced">
                  {tag.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}

          <div className="rating-summary-enhanced">
            <div className="star-rating-main">
              <div className="stars-display">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={`star ${star <= Math.round(averageRating) ? 'filled' : ''}`}>
                    ★
                  </span>
                ))}
              </div>
              <div className="rating-details">
                <span className="rating-number">{averageRating.toFixed(1)}</span>
                <span className="review-count">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
              </div>
            </div>

            {userReview && (
              <div className="user-review-badge">
                <span className="user-review-icon">✍️</span>
                <span className="user-review-text">You reviewed</span>
                <span className="user-review-rating">
                  {userReview.rating}/5
                </span>
              </div>
            )}
          </div>

          <div className="food-item-actions-enhanced">
            <button
              onClick={() => onReviewClick(item, userReview)}
              className="review-btn-primary"
            >
              {userReview ? '✏️ Edit Review' : '✍️ Write Review'}
            </button>
            <button
              onClick={toggleReviews}
              className="view-reviews-btn-secondary"
            >
              {showReviews ? '▲ Hide Reviews' : '▼ View Reviews'}
            </button>
          </div>
        </div>
      </div>

      {showReviews && (
        <div className="reviews-section-enhanced">
          <div className="reviews-header">
            <h4>Reviews ({reviews.length})</h4>
            {reviews.length > 0 && (
              <div className="reviews-stats">
                <span className="average-rating-badge">
                  Average: {averageRating.toFixed(1)}/5
                </span>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div className="loading-reviews">
              <div className="spinner-small"></div>
              <span>Loading reviews...</span>
            </div>
          ) : reviews.length > 0 ? (
            <div className="reviews-list-enhanced">
              {reviews.map(review => {
                const isCurrentUser = authService.isAuthenticated() &&
                  review.userEmail === authService.getCurrentUser()?.email;

                return (
                  <div key={review._id} className={`review-item-enhanced ${isCurrentUser ? 'current-user-review' : ''}`}>
                    <div className="review-header-enhanced">
                      <div className="reviewer-info">
                        <strong className="reviewer-name">
                          {review.anonymous ? 'Anonymous' : review.studentName || 'Student'}
                        </strong>
                        {isCurrentUser && (
                          <span className="your-review-indicator">(You)</span>
                        )}
                      </div>
                      <div className="review-meta">
                        <span className="review-rating-enhanced">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`star-small ${i < review.rating ? 'filled' : ''}`}>
                              ★
                            </span>
                          ))}
                          <span className="rating-number-small">({review.rating.toFixed(1)})</span>
                        </span>
                        <small className="review-date">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </small>
                      </div>
                    </div>
                    <p className="review-comment-enhanced">{review.comment}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-reviews-enhanced">
              <p className="no-reviews-text">No reviews yet. Be the first to review this item!</p>
              {!authService.isAuthenticated() && (
                <p className="login-prompt">
                  Please <a href="/login" className="login-link">login</a> to submit a review.
                </p>
              )}
            </div>
          )}
        </div>
      )}
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

          {/* Deadlines (fully integrated) */}
          <Route path="/deadlines" element={<UserRoute><DeadlineManager /></UserRoute>} />
          <Route path="/free-labs" element={<UserRoute><FreeLabsPage /></UserRoute>} />
          <Route path="/routine-setup" element={<UserRoute><RoutineSetupPage /></UserRoute>} />
          <Route path="/routine" element={<UserRoute><MyRoutinePage /></UserRoute>} />

          {/* Q/A */}
          <Route path="/questions" element={<UserRoute><Questions /></UserRoute>} />
          <Route path="/questions/:id" element={<UserRoute><QuestionDetail /></UserRoute>} />

          {/* Graduation Planner Routes */}
          <Route path="/graduation" element={<UserRoute><GraduationPage /></UserRoute>} />
          <Route path="/graduation/remaining" element={<UserRoute><RemainingCourses /></UserRoute>} />

          {/* Add semester planner route*/}
          <Route path="/graduation/planner" element={<UserRoute><SemesterPlanner /></UserRoute>} />

          {/* Course Content & Reviews */}
          <Route path="/course-content" element={<UserRoute><CourseContentPage /></UserRoute>} />
          <Route path="/course-content/:courseCode" element={<UserRoute><CourseContentPage /></UserRoute>} />
          <Route path="/course-reviews" element={<UserRoute><CourseReviewsPage /></UserRoute>} />
          <Route path="/course-reviews/:courseCode" element={<UserRoute><CourseReviewsPage /></UserRoute>} />
          <Route path="/my-uploads" element={<UserRoute><MyUploadsPage /></UserRoute>} />

          {/* Course Admin Route */}
          <Route path="/course-content/admin" element={<AdminRoute><CourseAdminPanel /></AdminRoute>} />

          {/* Cafeteria Student Routes */}
          <Route path="/cafeteria/today-menu" element={<UserRoute><CafeteriaTodayMenu /></UserRoute>} />
          <Route path="/cafeteria/submit-review" element={<UserRoute><CafeteriaSubmitReview /></UserRoute>} />
          <Route path="/cafeteria/weekly-calendar" element={<UserRoute><CafeteriaWeeklyCalendar /></UserRoute>} />
          <Route path="/cafeteria/all-items" element={<UserRoute><CafeteriaAllItems /></UserRoute>} />

          {/* Cafeteria Admin Routes */}
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

          {/* Textbook Exchange Routes */}
          <Route path="/textbooks" element={<UserRoute><TextbookExchange /></UserRoute>} />
          <Route path="/textbooks/create" element={<UserRoute><TextbookForm /></UserRoute>} />

          <Route path="/textbooks/edit/:id" element={<UserRoute><TextbookForm /></UserRoute>} />
          <Route path="/textbooks/:id" element={<UserRoute><TextbookDetail /></UserRoute>} />
          <Route path="/textbooks/my-listings" element={<UserRoute><MyListingsPage /></UserRoute>} />
          <Route path="/textbooks/favorites" element={<UserRoute><FavoritesPage /></UserRoute>} />
          <Route path="/admin/textbooks" element={<AdminRoute><TextbookAdminPanel /></AdminRoute>} />


          {/* Groups - STUDENT ROUTES */}
          <Route path="/find-my-group" element={<UserRoute><FindMyGroupPage /></UserRoute>} />
          <Route path="/find-my-group/create" element={<UserRoute><CreateNeedPost /></UserRoute>} />
          <Route path="/find-my-group/:id" element={<UserRoute><NeedPostDetail /></UserRoute>} />
          <Route path="/find-my-group/my-posts" element={<UserRoute><MyPostsPage /></UserRoute>} />
          <Route path="/find-my-group/my-groups" element={<UserRoute><MyGroupsPage /></UserRoute>} />
          <Route path="/groups/:id" element={<UserRoute><GroupDetail /></UserRoute>} />

          {/* Groups - ADMIN ROUTES (FIXED: Using AdminRoute consistently) */}
          <Route path="/find-my-group/moderation" element={<AdminRoute><GroupModerationPage /></AdminRoute>} />
          <Route path="/find-my-group/analytics" element={<AdminRoute><GroupAnalyticsPage /></AdminRoute>} />
          <Route path="/admin/find-my-group/:id" element={<AdminRoute><NeedPostDetail /></AdminRoute>} />
          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Budget */}

          <Route path="/budget" element={<UserRoute><BudgetPage /></UserRoute>} />

          <Route path="/faculty-rating" element={<UserRoute><FacultyRatingPage /></UserRoute>} />

          {/* Career Routes for Students */}
          <Route path="/career/internships" element={<UserRoute><InternshipList /></UserRoute>} />
          <Route path="/career/internships/:id" element={<UserRoute><InternshipDetail /></UserRoute>} />
          <Route path="/career/my-applications" element={<UserRoute><MyApplications /></UserRoute>} />
          <Route path="/career/internships/:id/apply" element={<UserRoute><ApplicationPortal /></UserRoute>} />

          {/* Scholarship Routes for Students */}
          <Route path="/career/scholarships" element={<UserRoute><ScholarshipList /></UserRoute>} />
          <Route path="/career/scholarships/:id" element={<UserRoute><ScholarshipDetail /></UserRoute>} />
          <Route path="/career/scholarships/:id/apply" element={<UserRoute><ScholarshipApplicationPortal /></UserRoute>} />
          <Route path="/career/my-scholarship-applications" element={<UserRoute><MyScholarshipApplications /></UserRoute>} />
          <Route path="/career/scholarships/saved" element={<SavedScholarships />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/faculty-management" element={<AdminRoute><FacultyManagementPage /></AdminRoute>} />

          {/* Admin Career Routes */}
          <Route path="/admin/career" element={<AdminRoute><AdminCareer /></AdminRoute>} />
          <Route path="/admin/career/internships" element={<AdminRoute><AdminCareer /></AdminRoute>} />
          <Route path="/admin/career/create" element={<AdminRoute><CreateInternship /></AdminRoute>} />
          <Route path="/admin/career/create-opportunity" element={<AdminRoute><CreateOpportunity /></AdminRoute>} />
          <Route path="/admin/career/edit/:id" element={<AdminRoute><EditOpportunity /></AdminRoute>} />
          <Route path="/admin/career/applications" element={<AdminRoute><ApplicationsManagement /></AdminRoute>} />

          {/* Admin Scholarship Routes - FIXED */}
          <Route path="/admin/career/scholarships" element={<AdminRoute><ScholarshipManage /></AdminRoute>} />
          <Route path="/admin/career/scholarships/create" element={<AdminRoute><CreateScholarship /></AdminRoute>} />
          <Route path="/admin/career/scholarships/edit/:id" element={<AdminRoute><EditScholarship /></AdminRoute>} />
          <Route path="/admin/career/scholarships/applications/:id" element={<AdminRoute><ScholarshipApplications /></AdminRoute>} />
          <Route path="/admin/career/scholarships/applications/:scholarshipId/:applicationId" element={<AdminRoute><ScholarshipApplicationDetail /></AdminRoute>} />
          {/* Student Job Routes (already protected by API) */}
          <Route path="/career/jobs/:id/apply" element={<JobApplicationPortal />} />
          <Route path="/career/my-job-applications" element={<MyJobApplications />} />
          <Route path="/career/saved-jobs" element={<SavedJobs />} />
          {/* Admin Job Routes */}
          <Route path="/admin/career/jobs" element={<AdminRoute><JobListAdmin /></AdminRoute>} />
          <Route path="/admin/career/jobs/create" element={<AdminRoute><CreateJob /></AdminRoute>} />
          <Route path="/admin/career/jobs/edit/:id" element={<AdminRoute><EditJob /></AdminRoute>} />
          <Route path="/admin/career/jobs/:id/applications" element={<AdminRoute><JobApplicationsAdmin /></AdminRoute>} />
          <Route path="/admin/career/jobs/:jobId/applications/:applicationId" element={<AdminRoute><JobApplicationDetail /></AdminRoute>} />



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