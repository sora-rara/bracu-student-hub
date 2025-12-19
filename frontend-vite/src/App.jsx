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
import BudgetPage from "./pages/BudgetPage.jsx";
import Profile from "./components/Dashboard/Profile/Profile.jsx";

// Admin Components
import AdminDashboard from "./components/Admin/AdminDashboard.jsx";
import AddFoodItem from "./components/Admin/AddFoodItem.jsx";
import EditFoodItem from "./components/Admin/EditFoodItem.jsx";
import WeeklyPlanning from "./components/Admin/WeeklyPlanning.jsx";
import TodayMenuAdmin from "./components/Cafeteria/TodayMenuAdmin.jsx";

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

// Deadline components
import Countdown from "./components/Countdown.jsx";

// Course Components
import CourseContentPage from "./pages/CourseContentPage.jsx";
import CourseReviewsPage from "./pages/CourseReviewsPage.jsx";
import MyUploadsPage from "./pages/MyUploadsPage.jsx";

// ==================== NEW IMPORT ====================
// Course Admin Panel - Add this import
import CourseAdminPanel from "./components/Admin/CourseAdminPanel.jsx";

// ---------------------------
// Protected Routes
// ---------------------------
const UserRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await authService.checkAuthStatus();
        setAuthenticated(result.loggedIn);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  if (loading) return <div className="loading-screen">Verifying authentication...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
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
          setIsUserAdmin(user?.role === 'admin' || user?.isAdmin);
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

  if (loading) return <div className="loading-screen">Verifying admin access...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (!isUserAdmin) {
    alert("Admin access required. Redirecting to dashboard.");
    return <Navigate to="/dashboard" replace />;
  }
  return children;
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
// Cafeteria Admin Panel Component
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

  const getImageUrl = (imageName) => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (!imageName || typeof imageName !== 'string') return 'https://via.placeholder.com/150';
    if (imageName.startsWith('http')) return imageName;
    if (imageName.startsWith('/uploads/')) return `${BASE_URL.replace('/api', '')}${imageName}`;
    return `${BASE_URL.replace('/api', '')}/uploads/${imageName}`;
  };

  const handleDelete = async id => {
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
    <div className="page-container">
      <div className="admin-header">
        <h1>🍽️ Cafeteria Management</h1>
        <p>Manage all food items in the cafeteria</p>
        <div className="header-actions">
          <button 
            onClick={() => window.location.href = "/cafeteria/admin/add-item"}
            className="primary-btn"
          >
            ➕ Add New Food Item
          </button>
          <button 
            onClick={() => window.location.href = "/cafeteria/admin/menu-planning"}
            className="secondary-btn"
          >
            📅 Weekly Planning
          </button>
          <button 
            onClick={() => window.location.href = "/admin"}
            className="outline-btn"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading food items...</p>
        </div>
      ) : foodItems.length === 0 ? (
        <div className="empty-state">
          <p>No food items found.</p>
          <button 
            onClick={() => window.location.href = "/cafeteria/admin/add-item"}
            className="primary-btn"
          >
            Add Your First Food Item
          </button>
        </div>
      ) : (
        <div className="food-items-grid">
          {foodItems.map(item => (
            <div key={item._id} className="food-item-card">
              <div className="food-item-image">
                <img 
                  src={getImageUrl(item.image)} 
                  alt={item.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150';
                  }}
                />
              </div>
              
              <div className="food-item-info">
                <h3>{item.name}</h3>
                <div className="food-item-tags">
                  <span className={`category-tag ${item.category}`}>
                    {item.category?.replace('_', ' ') || 'Uncategorized'}
                  </span>
                  <span className={`meal-time-tag ${item.mealTime}`}>
                    {item.mealTime || 'N/A'}
                  </span>
                </div>
                
                <p className="food-description">
                  {item.shortDescription || item.description?.substring(0, 80) + '...'}
                </p>
                
                <div className="food-item-footer">
                  <span className="food-price">
                    ৳{item.price?.toFixed(2) || '0.00'}
                  </span>
                  <div className="food-item-actions">
                    <button 
                      onClick={() => window.location.href = `/cafeteria/admin/edit-item/${item._id}`}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {Array.isArray(item.dietaryTags) && item.dietaryTags.length > 0 && (
                  <div className="dietary-tags">
                    {item.dietaryTags.map(tag => (
                      <span key={tag} className="dietary-tag">
                        {tag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
                
                {item.featured && (
                  <div className="featured-badge">
                    ⭐ Featured Item
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------
// App Component with All Routes
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

        {/* User Routes */}
        <Route path="/dashboard" element={<UserRoute><DashboardPage /></UserRoute>} />
        <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
        <Route path="/gpa-calculator" element={<UserRoute><GPACalculatorPage /></UserRoute>} />
        <Route path="/budget" element={<UserRoute><BudgetPage /></UserRoute>} />

        {/* Deadlines */}
        <Route path="/deadlines" element={<UserRoute><DeadlineManager /></UserRoute>} />

        {/* Calendar Routes */}
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/calendar/add-event" element={<AddEvent />} />
        <Route path="/calendar/academic-dates" element={<AcademicDates />} />
        <Route path="/calendar/club-activities" element={<ClubActivities />} />
        <Route path="/calendar/exam-schedule" element={<ExamSchedule />} />

        {/* Course Content & Reviews */}
        <Route path="/course-content" element={<UserRoute><CourseContentPage /></UserRoute>} />
        <Route path="/course-content/:courseCode" element={<UserRoute><CourseContentPage /></UserRoute>} />
        <Route path="/course-reviews" element={<UserRoute><CourseReviewsPage /></UserRoute>} />
        <Route path="/course-reviews/:courseCode" element={<UserRoute><CourseReviewsPage /></UserRoute>} />
        <Route path="/my-uploads" element={<UserRoute><MyUploadsPage /></UserRoute>} />

        {/* ==================== ADDED COURSE ADMIN PANEL ROUTE ==================== */}
        <Route path="/course-content/admin" element={<AdminRoute><CourseAdminPanel /></AdminRoute>} />

        {/* Cafeteria Student Routes */}
        <Route path="/cafeteria/today-menu" element={<UserRoute><CafeteriaTodayMenu /></UserRoute>} />
        <Route path="/cafeteria/submit-review" element={<UserRoute><CafeteriaSubmitReview /></UserRoute>} />
        <Route path="/cafeteria/weekly-calendar" element={<UserRoute><CafeteriaWeeklyCalendar /></UserRoute>} />
        <Route path="/cafeteria/all-items" element={<UserRoute><CafeteriaAllItems /></UserRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        
        {/* Cafeteria Admin Routes */}
        <Route path="/cafeteria/admin" element={<AdminRoute><CafeteriaAdminPanel /></AdminRoute>} />
        <Route path="/cafeteria/admin/add-item" element={<AdminRoute><AddFoodItem /></AdminRoute>} />
        <Route path="/cafeteria/admin/edit-item/:id" element={<AdminRoute><EditFoodItem /></AdminRoute>} />
        <Route path="/cafeteria/admin/menu-planning" element={<AdminRoute><WeeklyPlanning /></AdminRoute>} />
        <Route path="/cafeteria/admin/today-menu" element={<AdminRoute><TodayMenuAdmin /></AdminRoute>} />

        {/* Catch-all Route */}
        <Route path="*" element={
          authService.isAuthenticated()
            ? authService.isAdmin()
              ? <Navigate to="/admin" />
              : <Navigate to="/dashboard" />
            : <Navigate to="/" />
        } />
      </Routes>
      <Footer />
    </>
  );
}

// ---------------------------
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
// Enhanced Food Item Card with Reviews - IMPROVED VERSION
// ---------------------------
const FoodItemCardWithReviews = ({ item, onReviewClick }) => {
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);

  const getImageUrl = (imageName) => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (!imageName || typeof imageName !== 'string') return 'https://via.placeholder.com/150';
    if (imageName.startsWith('http')) return imageName;
    if (imageName.startsWith('/uploads/')) return `${BASE_URL.replace('/api', '')}${imageName}`;
    return `${BASE_URL.replace('/api', '')}/uploads/${imageName}`;
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

  return (
    <div className="food-item-card-with-reviews">
      <div className="food-item-card-enhanced">
        <div className="food-item-image">
          <img 
            src={getImageUrl(item.image)} 
            alt={item.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
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
// Styles for Deadline Manager (inline styles only)
// ---------------------------
const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.2rem" };
const inputStyle = { width: "100%", padding: "0.5rem 0.7rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.875rem", outline: "none" };
const primaryBtn = { marginTop: "0.6rem", padding: "0.55rem 1rem", background: "#3b82f6", color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer" };
const secondaryBtn = { marginTop: "0.6rem", marginLeft: "0.6rem", padding: "0.55rem 1rem", background: "#d1d5db", color: "#111827", borderRadius: "8px", border: "none", cursor: "pointer" };
const tinyBtn = { padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "#f3f4f6", cursor: "pointer", marginRight: "0.3rem" };
const columnTitle = { marginTop: 0, marginBottom: "0.3rem", fontSize: "1rem", fontWeight: 600, color: "#111827" };
const emptyText = { fontSize: "0.85rem", color: "#6b7280", fontStyle: "italic" };