// src/components/Layout/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.jsx';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [showCafeteriaDropdown, setShowCafeteriaDropdown] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const isAdmin = user && (user.role === 'admin' || user.isAdmin);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span>🎓</span>
          <span>Student Hub</span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`nav-link admin-link ${isActive('/admin')}`}
                >
                  Admin Dashboard
                </Link>
              )}

              {/* Calendar Dropdown */}
              <div className="dropdown-container">
                <button
                  className={`nav-link dropdown-toggle ${
                    showCalendarDropdown ? 'active' : ''
                  }`}
                  onClick={() =>
                    setShowCalendarDropdown(!showCalendarDropdown)
                  }
                  onMouseEnter={() => setShowCalendarDropdown(true)}
                  onMouseLeave={() => setShowCalendarDropdown(false)}
                >
                  Calendar ▼
                </button>
                {showCalendarDropdown && (
                  <div
                    className="dropdown-menu"
                    onMouseEnter={() => setShowCalendarDropdown(true)}
                    onMouseLeave={() => setShowCalendarDropdown(false)}
                  >
                    <Link
                      to="/calendar"
                      className="dropdown-item"
                      onClick={() => setShowCalendarDropdown(false)}
                    >
                      Main Calendar
                    </Link>
                    <Link
                      to="/calendar/academic-dates"
                      className="dropdown-item"
                      onClick={() => setShowCalendarDropdown(false)}
                    >
                      Academic Dates
                    </Link>
                    <Link
                      to="/calendar/exam-schedule"
                      className="dropdown-item"
                      onClick={() => setShowCalendarDropdown(false)}
                    >
                      Exam Schedule
                    </Link>
                    <Link
                      to="/calendar/club-activities"
                      className="dropdown-item"
                      onClick={() => setShowCalendarDropdown(false)}
                    >
                      Club Activities
                    </Link>
                    <Link
                      to="/calendar/add-event"
                      className="dropdown-item"
                      onClick={() => setShowCalendarDropdown(false)}
                    >
                      Add Event
                    </Link>
                  </div>
                )}
              </div>

              {/* Student Links */}
              {!isAdmin && (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${isActive('/dashboard')}`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/gpa-calculator"
                    className={`nav-link ${isActive('/gpa-calculator')}`}
                  >
                    GPA Calculator
                  </Link>

                  <Link
                    to="/deadlines"
                    className={`nav-link ${isActive('/deadlines')}`}
                  >
                    Deadlines
                  </Link>

                  <Link
                    to="/free-labs"
                    className={`nav-link ${isActive('/free-labs')}`}
                  >
                    Free Labs
                  </Link>

                  {/* ✅ Only Routine remains */}
                  <Link
                    to="/routine"
                    className={`nav-link ${isActive('/routine')}`}
                  >
                    Routine
                  </Link>
                </>
              )}

              {/* Cafeteria Dropdown */}
              <div className="dropdown-container">
                <button
                  className={`nav-link dropdown-toggle ${
                    showCafeteriaDropdown ? 'active' : ''
                  }`}
                  onClick={() =>
                    setShowCafeteriaDropdown(!showCafeteriaDropdown)
                  }
                  onMouseEnter={() => setShowCafeteriaDropdown(true)}
                  onMouseLeave={() => setShowCafeteriaDropdown(false)}
                >
                  {isAdmin ? 'Cafeteria Admin' : 'Cafeteria'} ▼
                </button>
                {showCafeteriaDropdown && (
                  <div
                    className="dropdown-menu"
                    onMouseEnter={() => setShowCafeteriaDropdown(true)}
                    onMouseLeave={() => setShowCafeteriaDropdown(false)}
                  >
                    {isAdmin ? (
                      <>
                        <Link
                          to="/cafeteria/admin"
                          className="dropdown-item"
                          onClick={() => setShowCafeteriaDropdown(false)}
                        >
                          Manage Food Items
                        </Link>
                        <Link
                          to="/cafeteria/admin/menu-planning"
                          className="dropdown-item"
                          onClick={() => setShowCafeteriaDropdown(false)}
                        >
                          Weekly Planning
                        </Link>
                        <Link
                          to="/cafeteria/admin/today-menu"
                          className="dropdown-item"
                          onClick={() => setShowCafeteriaDropdown(false)}
                        >
                          Today’s Menu
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/cafeteria/today-menu"
                          className="dropdown-item"
                          onClick={() => setShowCafeteriaDropdown(false)}
                        >
                          Today’s Menu
                        </Link>
                        <Link
                          to="/cafeteria/submit-review"
                          className="dropdown-item"
                          onClick={() => setShowCafeteriaDropdown(false)}
                        >
                          Submit Review
                        </Link>
                        <Link
                          to="/cafeteria/past-reviews"
                          className="dropdown-item"
                          onClick={() => setShowCafeteriaDropdown(false)}
                        >
                          Past Reviews
                        </Link>
                        <Link
                          to="/cafeteria/weekly-calendar"
                          className="dropdown-item"
                          onClick={() => setShowCafeteriaDropdown(false)}
                        >
                          Weekly Calendar
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {!isAdmin && (
                <Link
                  to="/profile"
                  className={`nav-link ${isActive('/profile')}`}
                >
                  Profile
                </Link>
              )}

              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>

              <span className="nav-user">
                {user.name} {isAdmin ? '(Admin)' : ''}
              </span>
            </>
          ) : (
            <>
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                Home
              </Link>
              <Link to="/login" className={`nav-link ${isActive('/login')}`}>
                Login
              </Link>
              <Link to="/signup" className={`nav-link ${isActive('/signup')}`}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
