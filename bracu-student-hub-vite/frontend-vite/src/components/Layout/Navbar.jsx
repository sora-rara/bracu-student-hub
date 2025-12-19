// Update Navbar.jsx - Add Find My Group dropdown in the correct position
import React, { useState } from 'react';
import { FaChevronDown, FaUsers, FaShieldAlt } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.jsx';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [showCafeteriaDropdown, setShowCafeteriaDropdown] = useState(false);
  const [showGraduationDropdown, setShowGraduationDropdown] = useState(false);
  const [showGroupsDropdown, setShowGroupsDropdown] = useState(false); // Add this

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isAdmin = user && (user.role === 'admin' || user.isAdmin);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span>🎓</span>
          <span>BRACU Student Hub</span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className={`nav-link admin-link ${isActive('/admin')}`}>
                  <FaShieldAlt /> Admin Dashboard
                </Link>
              )}

              {/* Calendar Dropdown */}
              <div className="dropdown-container">
                <button
                  className={`nav-link dropdown-toggle ${showCalendarDropdown ? 'active' : ''}`}
                  onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                  onMouseEnter={() => setShowCalendarDropdown(true)}
                  onMouseLeave={() => setShowCalendarDropdown(false)}
                >
                  Calendar <FaChevronDown className={`dropdown-arrow ${showCalendarDropdown ? 'active' : ''}`} />
                </button>
                {showCalendarDropdown && (
                  <div
                    className="dropdown-menu"
                    onMouseEnter={() => setShowCalendarDropdown(true)}
                    onMouseLeave={() => setShowCalendarDropdown(false)}
                  >
                    <Link to="/calendar" className="dropdown-item" onClick={() => setShowCalendarDropdown(false)}>
                      Main Calendar
                    </Link>
                    <Link to="/calendar/academic-dates" className="dropdown-item" onClick={() => setShowCalendarDropdown(false)}>
                      Academic Dates
                    </Link>
                    <Link to="/calendar/exam-schedule" className="dropdown-item" onClick={() => setShowCalendarDropdown(false)}>
                      Exam Schedule
                    </Link>
                    <Link to="/calendar/club-activities" className="dropdown-item" onClick={() => setShowCalendarDropdown(false)}>
                      Club Activities
                    </Link>
                    <Link to="/calendar/add-event" className="dropdown-item" onClick={() => setShowCalendarDropdown(false)}>
                      Add Event
                    </Link>
                  </div>
                )}
              </div>

              {/* ✅ Find My Group Dropdown - VISIBLE TO BOTH ADMINS & STUDENTS */}
              <div className="dropdown-container">
                <button
                  className={`nav-link dropdown-toggle ${showGroupsDropdown ? 'active' : ''}`}
                  onClick={() => setShowGroupsDropdown(!showGroupsDropdown)}
                  onMouseEnter={() => setShowGroupsDropdown(true)}
                  onMouseLeave={() => setShowGroupsDropdown(false)}
                >
                  <FaUsers /> Find My Group <FaChevronDown className={`dropdown-arrow ${showGroupsDropdown ? 'active' : ''}`} />
                </button>
                {showGroupsDropdown && (
                  <div
                    className="dropdown-menu"
                    onMouseEnter={() => setShowGroupsDropdown(true)}
                    onMouseLeave={() => setShowGroupsDropdown(false)}
                  >
                    <Link to="/find-my-group" className="dropdown-item" onClick={() => setShowGroupsDropdown(false)}>
                      Browse All Posts
                    </Link>

                    {/* Students can create posts, Admins can moderate */}
                    {!isAdmin ? (
                      <Link to="/find-my-group/create" className="dropdown-item" onClick={() => setShowGroupsDropdown(false)}>
                        Create New Post
                      </Link>
                    ) : (
                      <Link to="/find-my-group/moderation" className="dropdown-item" onClick={() => setShowGroupsDropdown(false)}>
                        Moderate Posts
                      </Link>
                    )}

                    <Link to="/find-my-group/my-posts" className="dropdown-item" onClick={() => setShowGroupsDropdown(false)}>
                      My Posts
                    </Link>
                    <Link to="/find-my-group/my-groups" className="dropdown-item" onClick={() => setShowGroupsDropdown(false)}>
                      My Groups
                    </Link>

                    {isAdmin && (
                      <Link to="/find-my-group/analytics" className="dropdown-item" onClick={() => setShowGroupsDropdown(false)}>
                        <FaShieldAlt /> Analytics
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Student-only links (hidden from admin) */}
              {!isAdmin && (
                <>
                  <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>Dashboard</Link>
                  <Link to="/gpa-calculator" className={`nav-link ${isActive('/gpa-calculator')}`}>GPA Calculator</Link>
                  <Link to="/deadlines" className={`nav-link ${isActive('/deadlines')}`}>Deadlines</Link>

                  {/* Graduation Planner Dropdown (ONLY FOR STUDENTS) */}
                  <div className="dropdown-container">
                    <button
                      className={`nav-link dropdown-toggle ${showGraduationDropdown ? 'active' : ''}`}
                      onClick={() => setShowGraduationDropdown(!showGraduationDropdown)}
                      onMouseEnter={() => setShowGraduationDropdown(true)}
                      onMouseLeave={() => setShowGraduationDropdown(false)}
                    >
                      Graduation Planner <FaChevronDown className={`dropdown-arrow ${showGraduationDropdown ? 'active' : ''}`} />
                    </button>
                    {showGraduationDropdown && (
                      <div
                        className="dropdown-menu"
                        onMouseEnter={() => setShowGraduationDropdown(true)}
                        onMouseLeave={() => setShowGraduationDropdown(false)}
                      >
                        <Link to="/graduation" className="dropdown-item" onClick={() => setShowGraduationDropdown(false)}>
                          Progress Dashboard
                        </Link>
                        <Link to="/graduation/remaining" className="dropdown-item" onClick={() => setShowGraduationDropdown(false)}>
                          Remaining Courses
                        </Link>
                        <Link to="/graduation/timeline" className="dropdown-item" onClick={() => setShowGraduationDropdown(false)}>
                          Graduation Timeline
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Cafeteria Dropdown (shared) */}
              <div className="dropdown-container">
                <button
                  className={`nav-link dropdown-toggle ${showCafeteriaDropdown ? 'active' : ''}`}
                  onClick={() => setShowCafeteriaDropdown(!showCafeteriaDropdown)}
                  onMouseEnter={() => setShowCafeteriaDropdown(true)}
                  onMouseLeave={() => setShowCafeteriaDropdown(false)}
                >
                  {isAdmin ? 'Cafeteria Admin' : 'Cafeteria'} <FaChevronDown className={`dropdown-arrow ${showCafeteriaDropdown ? 'active' : ''}`} />
                </button>
                {showCafeteriaDropdown && (
                  <div
                    className="dropdown-menu"
                    onMouseEnter={() => setShowCafeteriaDropdown(true)}
                    onMouseLeave={() => setShowCafeteriaDropdown(false)}
                  >
                    {isAdmin ? (
                      <>
                        <Link to="/cafeteria/admin" className="dropdown-item" onClick={() => setShowCafeteriaDropdown(false)}>Manage Food Items</Link>
                        <Link to="/cafeteria/admin/menu-planning" className="dropdown-item" onClick={() => setShowCafeteriaDropdown(false)}>Weekly Planning</Link>
                        <Link to="/cafeteria/admin/today-menu" className="dropdown-item" onClick={() => setShowCafeteriaDropdown(false)}>Today's Menu (Admin)</Link>
                      </>
                    ) : (
                      <>
                        <Link to="/cafeteria/today-menu" className="dropdown-item" onClick={() => setShowCafeteriaDropdown(false)}>Today's Menu</Link>
                        <Link to="/cafeteria/submit-review" className="dropdown-item" onClick={() => setShowCafeteriaDropdown(false)}>Submit Review</Link>
                        <Link to="/cafeteria/past-reviews" className="dropdown-item" onClick={() => setShowCafeteriaDropdown(false)}>Past Reviews</Link>
                        <Link to="/cafeteria/weekly-calendar" className="dropdown-item" onClick={() => setShowCafeteriaDropdown(false)}>Weekly Calendar</Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Profile (students only) */}
              {!isAdmin && <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>Profile</Link>}

              {/* Notification Bell & Logout (shared) */}
              {/* Add NotificationBell component here */}
              <button onClick={handleLogout} className="btn btn-outline">Logout</button>
              <span className="nav-user">👤 {user.name} {isAdmin ? '(Admin)' : ''}</span>
            </>
          ) : (
            <>
              <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
              <Link to="/login" className={`nav-link ${isActive('/login')}`}>Login</Link>
              <Link to="/signup" className={`nav-link ${isActive('/signup')}`}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;