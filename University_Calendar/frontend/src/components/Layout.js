import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  FaCalendar, 
  FaBook, 
  FaUsers, 
  FaUser, 
  FaHome, 
  FaPlus,
  FaGraduationCap,
  FaBell,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';
import './Layout.css'; // We'll create this for styling

const Layout = () => {
  const location = useLocation();
  
  const navItems = [
    { to: '/', icon: <FaHome />, label: 'Dashboard', exact: true },
    { to: '/calendar', icon: <FaCalendar />, label: 'Calendar View' },
    { to: '/academic', icon: <FaBook />, label: 'Academic Dates' },
    { to: '/clubs', icon: <FaUsers />, label: 'Club Activities' },
    { to: '/exams', icon: <FaGraduationCap />, label: 'Exam Schedule' },
    { to: '/addevent', icon: <FaPlus />, label: 'Add Event', highlight: true },
  ];
  
  const bottomItems = [
    { to: '/notifications', icon: <FaBell />, label: 'Notifications', badge: 3 },
    { to: '/profile', icon: <FaUser />, label: 'Profile' },
    { to: '/settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <div className="layout-container">
      {/* Blue Sidebar */}
      <aside className="sidebar">
        {/* Logo/Header */}
        <div className="sidebar-header">
          <div className="logo-container">
            <FaCalendar className="logo-icon" />
            <div>
              <h3>University</h3>
              <p className="logo-subtitle">Event Calendar</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <p className="nav-section-title">MAIN NAVIGATION</p>
          <ul className="nav-list">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.to} 
                  className={`nav-link ${(item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)) ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          <div className="user-info">
            <div className="user-avatar">
              <FaUser />
            </div>
            <div className="user-details">
              <p className="user-name">Student User</p>
              <p className="user-role">Computer Science</p>
            </div>
          </div>
          
          <div className="bottom-nav">
            {bottomItems.map((item, index) => (
              <Link key={index} to={item.to} className="bottom-nav-link">
                {item.icon}
                {item.badge && <span className="bottom-nav-badge">{item.badge}</span>}
              </Link>
            ))}
            <button className="logout-btn">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="content-header">
          <div className="header-left">
            <h1 className="page-title">
              {location.pathname === '/' && 'Dashboard'}
              {location.pathname === '/calendar' && 'Calendar View'}
              {location.pathname === '/academic' && 'Academic Dates'}
              {location.pathname === '/clubs' && 'Club Activities'}
              {location.pathname === '/exams' && 'Exam Schedule'}
              {location.pathname === '/addevent' && 'Add New Event'}
              {!['/', '/calendar', '/academic', '/clubs', '/exams', '/addevent'].includes(location.pathname) && 'University Calendar'}
            </h1>
            <p className="page-subtitle">
              {location.pathname === '/' && 'Overview of all university events'}
              {location.pathname === '/calendar' && 'Interactive calendar with all events'}
              {location.pathname === '/academic' && 'Important academic dates and deadlines'}
              {location.pathname === '/clubs' && 'Club activities and meetings'}
              {location.pathname === '/exams' && 'Exam schedules and timetables'}
              {location.pathname === '/addevent' && 'Create new university event'}
            </p>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button className="btn btn-primary">
                <FaPlus /> Quick Add
              </button>
              <button className="btn btn-outline-secondary">
                <FaBell /> Notifications
              </button>
            </div>
            <div className="current-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;