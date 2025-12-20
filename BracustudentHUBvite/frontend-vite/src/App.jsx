// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";

import Navbar from "./components/Layout/Navbar.jsx";
import Footer from "./components/Layout/Footer.jsx";
import authService from "./services/auth.jsx";
import axios from "./api/axios.jsx";

// Pages
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import GPACalculatorPage from "./pages/GPACalculatorPage.jsx";
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

// Faculty Rating Components
import FacultyRatingPage from './pages/FacultyRatingPage.jsx';
import FacultyManagementPage from './pages/FacultyManagementPage.jsx';

// Career
import CareerPortalPage from './pages/CareerPortalPage';
import CareerDashboardPage from './pages/CareerDashboardPage';
import JobBoardPage from './pages/JobBoardPage';
import JobDetailPage from './pages/JobDetailPage';
import InternshipTrackerPage from './pages/InternshipTrackerPage';
import InternshipDetailPage from './pages/InternshipDetailPage';
import ScholarshipFinderPage from './pages/ScholarshipFinderPage';
import ScholarshipDetailPage from './pages/ScholarshipDetailPage';
import ApplicationsPage from './pages/ApplicationsPage';
import SavedOpportunitiesPage from './pages/SavedOpportunitiesPage';
import AdminEventManagement from './components/Admin/AdminEventManagement';

// ---------------------------
// Protected Route Component (MISSING FROM YOUR CODE)
// ---------------------------
const ProtectedRoute = ({ children, adminOnly = false }) => {
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
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  if (loading) return <div className="loading">Checking authorization...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isUserAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// ---------------------------
// User Route (Alternative to ProtectedRoute without admin check)
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
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  if (loading) return <div className="loading">Verifying authentication...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (isUserAdmin) return <Navigate to="/admin" replace />;
  return children;
};

// ---------------------------
// Admin Route (Alternative to ProtectedRoute with admin check)
// ---------------------------
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
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  if (loading) return <div className="loading">Verifying admin access...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (!isUserAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// ---------------------------
// Deadline Manager Component (KEEP AS IS)
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
  const [room, setRoom] = useState("");
  const [mode, setMode] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [editingId, setEditingId] = useState(null);

  // filters
  const [searchCourse, setSearchCourse] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");

  const loadDeadlines = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/deadlines", {
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
    if (!courseCode.trim()) {
      alert("Course code is required.");
      return;
    }
    if (category === "select") {
      alert("Please select exam or assignment.");
      return;
    }
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    if (!dueDate) {
      alert("Due date & time are required.");
      return;
    }

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
        await axios.put(`/api/deadlines/${editingId}`, payload);
      } else {
        await axios.post("/api/deadlines", payload);
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
      await axios.delete(`/api/deadlines/${id}`);
      if (editingId === id) resetForm();
      loadDeadlines();
    } catch {
      alert("Failed to delete deadline");
    }
  };

  const courseCodes = Array.from(new Set(deadlines.map((d) => d.courseCode))).sort();
  const dueTodayCount = deadlines.filter(d => new Date(d.dueDate).toDateString() === new Date().toDateString()).length;
  const dueTomorrowCount = deadlines.filter(d => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return new Date(d.dueDate).toDateString() === t.toDateString();
  }).length;

  let filtered = deadlines;
  if (searchCourse) {
    filtered = filtered.filter(d => d.courseCode === searchCourse);
  }
  if (quickFilter === "today") {
    filtered = filtered.filter(d => new Date(d.dueDate).toDateString() === new Date().toDateString());
  }
  if (quickFilter === "tomorrow") {
    filtered = filtered.filter(d => {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      return new Date(d.dueDate).toDateString() === t.toDateString();
    });
  }

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
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.title}>BRACU Student Hub — Deadline Manager</h1>
          <p style={styles.subtitle}>Keep track of your upcoming exams and assignments with live countdown!</p>
        </header>

        <div style={styles.formSection}>
          <div style={styles.formContainer}>
            <h2 style={styles.formTitle}>{editingId ? "Edit Deadline" : "Add Deadline"}</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Course Code</label>
                  <input 
                    value={courseCode} 
                    onChange={e => setCourseCode(e.target.value)} 
                    placeholder="e.g. CSE220" 
                    style={styles.input} 
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Type</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    style={styles.input}
                  >
                    <option value="select">Select</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Name</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Quiz 1, Mid, Final, Assignment 1..." 
                  style={styles.input} 
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Syllabus / Details</label>
                <input 
                  value={syllabus} 
                  onChange={e => setSyllabus(e.target.value)} 
                  placeholder="Ch 1–3, lab topics, etc." 
                  style={styles.input} 
                />
              </div>
              
              {category === "exam" && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Room Number</label>
                  <input 
                    value={room} 
                    onChange={e => setRoom(e.target.value)} 
                    placeholder="e.g. 09D-18C or UB20103" 
                    style={styles.input} 
                  />
                </div>
              )}
              
              {category === "assignment" && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mode</label>
                    <select 
                      value={mode} 
                      onChange={e => setMode(e.target.value)} 
                      style={styles.input}
                    >
                      <option value="">Select</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Submission Link</label>
                    <input 
                      value={submissionLink} 
                      onChange={e => setSubmissionLink(e.target.value)} 
                      placeholder="Google Classroom / Moodle link" 
                      style={styles.input} 
                    />
                  </div>
                </>
              )}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Deadline (Date & Time)</label>
                <input 
                  type="datetime-local" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  style={styles.input} 
                />
              </div>
              
              <div>
                <button type="submit" style={styles.primaryBtn}>
                  {editingId ? "Update Deadline" : "Save Deadline"}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    style={styles.secondaryBtn}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={styles.statsContainer}>
            <h3 style={styles.statsTitle}>Overview</h3>
            <p style={styles.statItem}>Total deadlines: <strong>{deadlines.length}</strong></p>
            <p style={styles.statItem}>Due today: <strong>{dueTodayCount}</strong></p>
            <p style={styles.statItem}>Due tomorrow: <strong>{dueTomorrowCount}</strong></p>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Filter by course</label>
              <select 
                value={searchCourse} 
                onChange={e => setSearchCourse(e.target.value)} 
                style={styles.input}
              >
                <option value="">All courses</option>
                {courseCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Quick filter</label>
              <select 
                value={quickFilter} 
                onChange={e => setQuickFilter(e.target.value)} 
                style={styles.input}
              >
                <option value="all">All deadlines</option>
                <option value="today">Due today</option>
                <option value="tomorrow">Due tomorrow</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {loading && <p>Loading...</p>}

        {groupedCourseCodes.length === 0 && !loading && (
          <p style={styles.emptyMessage}>No deadlines found. Try adding some above or clearing filters.</p>
        )}

        {groupedCourseCodes.map(code => {
          const { exams, assignments } = groupedByCourse[code];
          return (
            <div key={code} style={styles.courseSection}>
              <div style={styles.courseHeader}>
                <h2 style={styles.courseTitle}>{code}</h2>
                <p style={styles.courseStats}>{exams.length} exams · {assignments.length} assignments</p>
              </div>
              
              <div style={styles.deadlinesGrid}>
                <div style={styles.deadlineColumn}>
                  <h3 style={styles.columnTitle}>Exams</h3>
                  {exams.length === 0 ? (
                    <p style={styles.emptyText}>No exams.</p>
                  ) : (
                    exams.map(exam => (
                      <div key={exam._id} style={styles.deadlineItem}>
                        <div>
                          <strong>{exam.name}</strong>
                          {exam.syllabus && <span> – {exam.syllabus}</span>}
                          <p>Due: {new Date(exam.dueDate).toLocaleString()}</p>
                        </div>
                        <div style={styles.actionButtons}>
                          <button 
                            onClick={() => handleEdit(exam)} 
                            style={styles.smallBtn}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(exam._id)} 
                            style={styles.smallBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div style={styles.deadlineColumn}>
                  <h3 style={styles.columnTitle}>Assignments</h3>
                  {assignments.length === 0 ? (
                    <p style={styles.emptyText}>No assignments.</p>
                  ) : (
                    assignments.map(assignment => (
                      <div key={assignment._id} style={styles.deadlineItem}>
                        <div>
                          <strong>{assignment.name}</strong>
                          {assignment.syllabus && <span> – {assignment.syllabus}</span>}
                          <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
                        </div>
                        <div style={styles.actionButtons}>
                          <button 
                            onClick={() => handleEdit(assignment)} 
                            style={styles.smallBtn}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(assignment._id)} 
                            style={styles.smallBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Styles for Deadline Manager
const styles = {
  container: {
    minHeight: "100vh",
    margin: 0,
    background: "#f3f4f6",
    padding: "2rem 0",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  content: {
    maxWidth: "1100px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
    padding: "2rem 2.2rem 2.4rem",
    boxSizing: "border-box"
  },
  header: {
    marginBottom: "1.8rem",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "1rem"
  },
  title: {
    margin: 0,
    fontSize: "2.2rem",
    fontWeight: 700,
    color: "#111827"
  },
  subtitle: {
    marginTop: "0.4rem",
    color: "#6b7280"
  },
  formSection: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "1.8rem"
  },
  formContainer: {
    flex: 2,
    minWidth: "280px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "1.2rem 1.4rem",
    background: "#f9fafb"
  },
  formTitle: {
    marginTop: 0,
    marginBottom: "0.8rem",
    fontSize: "1.1rem",
    color: "#111827"
  },
  formRow: {
    display: "flex",
    gap: "0.8rem",
    flexWrap: "wrap",
    marginBottom: "0.7rem"
  },
  formGroup: {
    marginBottom: "0.7rem",
    flex: 1,
    minWidth: "180px"
  },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.2rem"
  },
  input: {
    width: "100%",
    padding: "0.5rem 0.7rem",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "0.875rem",
    outline: "none"
  },
  primaryBtn: {
    marginTop: "0.6rem",
    padding: "0.55rem 1rem",
    background: "#3b82f6",
    color: "#fff",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer"
  },
  secondaryBtn: {
    marginTop: "0.6rem",
    marginLeft: "0.6rem",
    padding: "0.55rem 1rem",
    background: "#d1d5db",
    color: "#111827",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer"
  },
  statsContainer: {
    flex: 1,
    minWidth: "220px",
    borderRadius: "12px",
    padding: "1.1rem 1.3rem",
    border: "1px solid #e5e7eb",
    background: "#ffffff"
  },
  statsTitle: {
    marginTop: 0,
    marginBottom: "0.7rem",
    fontSize: "1rem",
    color: "#111827"
  },
  statItem: {
    margin: "0.1rem 0",
    fontSize: "0.9rem",
    color: "#6b7280"
  },
  filterGroup: {
    marginTop: "1rem"
  },
  error: {
    color: "#dc2626"
  },
  emptyMessage: {
    color: "#6b7280",
    fontSize: "0.95rem"
  },
  courseSection: {
    border: "1px solid #e5e7eb",
    marginTop: "1.2rem",
    padding: "1rem 1.2rem",
    borderRadius: "12px",
    background: "#f9fafb"
  },
  courseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "1rem",
    flexWrap: "wrap"
  },
  courseTitle: {
    margin: 0,
    fontSize: "1.25rem",
    color: "#111827"
  },
  courseStats: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#6b7280"
  },
  deadlinesGrid: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-start",
    marginTop: "0.8rem",
    flexWrap: "wrap"
  },
  deadlineColumn: {
    flex: 1,
    minWidth: "260px"
  },
  columnTitle: {
    marginTop: 0,
    marginBottom: "0.3rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#111827"
  },
  deadlineItem: {
    marginBottom: "0.8rem",
    padding: "0.5rem",
    background: "white",
    borderRadius: "8px",
    border: "1px solid #e5e7eb"
  },
  actionButtons: {
    marginTop: "0.3rem"
  },
  smallBtn: {
    padding: "0.25rem 0.5rem",
    fontSize: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#f3f4f6",
    cursor: "pointer",
    marginRight: "0.3rem"
  },
  emptyText: {
    fontSize: "0.85rem",
    color: "#6b7280",
    fontStyle: "italic"
  }
};

// ---------------------------
// App Component
// ---------------------------
export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* User Protected Routes */}
        <Route path="/dashboard" element={<UserRoute><DashboardPage /></UserRoute>} />
        <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
        <Route path="/gpa-calculator" element={<UserRoute><GPACalculatorPage /></UserRoute>} />
        <Route path="/deadlines" element={<UserRoute><DeadlineManager /></UserRoute>} />
        <Route path="/faculty-rating" element={<UserRoute><FacultyRatingPage /></UserRoute>} />

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/faculty-management" element={<AdminRoute><FacultyManagementPage /></AdminRoute>} />

        {/* Calendar Routes */}
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/calendar/add-event" element={<AddEvent />} />
        <Route path="/calendar/academic-dates" element={<AcademicDates />} />
        <Route path="/calendar/club-activities" element={<ClubActivities />} />
        <Route path="/calendar/exam-schedule" element={<ExamSchedule />} />
        <Route path="/academic-dates" element={<AcademicDates />} />
        <Route path="/club-activities" element={<ClubActivities />} />
        <Route path="/exam-schedule" element={<ExamSchedule />} />
        
        {/* Cafeteria Routes */}
        <Route path="/cafeteria/today-menu" element={<MenuDisplay />} />
        <Route path="/cafeteria/submit-review" element={<ReviewModal />} />
        <Route path="/cafeteria/past-reviews" element={<FoodItemsList />} />
        <Route path="/cafeteria/weekly-calendar" element={<WeeklyPlanning />} />
        <Route path="/cafeteria/admin" element={<AdminRoute><FoodItemsList /></AdminRoute>} />
        <Route path="/cafeteria/admin/add-food" element={<AdminRoute><AddFoodItem /></AdminRoute>} />
        <Route path="/cafeteria/admin/edit-food/:id" element={<AdminRoute><EditFoodItem /></AdminRoute>} />
        <Route path="/cafeteria/admin/today-menu" element={<AdminRoute><TodayMenuAdmin /></AdminRoute>} />
        <Route path="/cafeteria/admin/menu-planning" element={<AdminRoute><WeeklyPlanning /></AdminRoute>} />
        
        {/* Career Routes */}
        {/* Main Career Portal */}
        <Route path="/career" element={<CareerPortalPage />} />
        <Route path="/career/dashboard" element={<CareerDashboardPage />} />

        {/* Jobs */}
        <Route path="/career/jobs" element={<JobBoardPage />} />
        <Route path="/career/jobs/:id" element={<JobDetailPage />} />

        {/* Internships */}
        <Route path="/career/internships" element={<InternshipTrackerPage />} />
        <Route path="/career/internships/:id" element={<InternshipDetailPage />} />

        {/* Scholarships */}
        <Route path="/career/scholarships" element={<ScholarshipFinderPage />} />
        <Route path="/career/scholarships/:id" element={<ScholarshipDetailPage />} />

        {/* Applications & Saved */}
        <Route path="/career/applications" element={<ApplicationsPage />} />
        <Route path="/career/saved" element={<SavedOpportunitiesPage />} />
        
        {/* Admin Event Management - ONLY POST EVENT */}
        <Route 
          path="/admin/post-event" 
          element={
            <ProtectedRoute adminOnly>
              <AdminEventManagement />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}