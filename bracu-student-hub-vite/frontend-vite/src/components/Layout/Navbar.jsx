import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.jsx';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  // Group dropdown states for students
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Admin dropdown states
  const [adminDropdowns, setAdminDropdowns] = useState({
    calendar: false,
    academics: false,
    career: false,
    groups: false,
    cafeteria: false
  });

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isAdmin = user && (user.role === 'admin' || user.isAdmin);

  const toggleStudentDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const toggleAdminDropdown = (dropdown) => {
    setAdminDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const closeAllDropdowns = () => {
    setActiveDropdown(null);
    setAdminDropdowns({ calendar: false, academics: false, career: false, groups: false, cafeteria: false });
  };

  // Student navigation structure
  const studentNavigation = [
    {
      type: 'link',
      to: '/dashboard',
      label: 'Dashboard',
    },
    {
      type: 'dropdown',
      id: 'calendar',
      label: 'Calendar',
      items: [
        { to: '/calendar', label: 'Main Calendar' },
        { to: '/calendar/academic-dates', label: 'Academic Dates' },
        { to: '/calendar/exam-schedule', label: 'Exam Schedule' },
        { to: '/calendar/club-activities', label: 'Club Activities' },
        { to: '/calendar/add-event', label: 'Add Event' },
      ]
    },
    {
      type: 'dropdown',
      id: 'groups',
      label: 'Find My Group',
      items: [
        { to: '/find-my-group', label: 'Browse All Posts' },
        { to: '/find-my-group/create', label: 'Create New Post' },
        { to: '/find-my-group/my-posts', label: 'My Posts' },
        { to: '/find-my-group/my-groups', label: 'My Groups' },
      ]
    },
    {
      type: 'mega-dropdown',
      id: 'academics',
      label: 'Academics',
      sections: [
        {
          title: 'Course Resources',
          items: [
            { to: '/course-content', label: 'Course Content' },
            { to: '/course-reviews', label: 'Course Reviews' },
            { to: '/my-uploads', label: 'My Uploads' },
          ]
        },
        {
          title: 'Textbook Exchange',
          items: [
            { to: '/textbooks', label: 'Browse Textbooks' },
            { to: '/textbooks/create', label: 'List a Textbook' },
            { to: '/textbooks/my-listings', label: 'My Listings' },
            { to: '/textbooks/favorites', label: 'My Favorites' },
          ]
        },
        {
          title: 'Tools',
          items: [
            { to: '/gpa-calculator', label: 'GPA Calculator' },
            { to: '/faculty-rating', label: 'Faculty Rating' },
          ]
        }
      ]
    },
    {
      type: 'mega-dropdown',
      id: 'career',
      label: 'Career',
      sections: [
        {
          title: 'Opportunities',
          items: [
            { to: '/career/internships', label: 'Internships' },
            { to: '/career/jobs', label: 'Part-Time Jobs' },
            { to: '/career/saved-jobs', label: 'Saved Jobs' },
          ]
        },
        {
          title: 'Applications',
          items: [
            { to: '/career/my-applications', label: 'Internship Applications' },
            { to: '/career/my-job-applications', label: 'Job Applications' },
          ]
        },
        {
          title: 'Scholarships',
          items: [
            { to: '/career/scholarships', label: 'Available Scholarships' },
            { to: '/career/my-scholarship-applications', label: 'My Applications' },
          ]
        }
      ]
    },
    {
      type: 'mega-dropdown',
      id: 'planning',
      label: 'Planning',
      sections: [
        {
          title: 'Academic Planning',
          items: [
            { to: '/routine', label: 'Routine' },
            { to: '/deadlines', label: 'Deadlines' },
            { to: '/free-labs', label: 'Free Labs' },
            { to: '/questions', label: 'Q/A' },
          ]
        },
        {
          title: 'Financial Planning',
          items: [
            { to: '/budget', label: 'Budget' },
          ]
        },
        {
          title: 'Graduation Planning',
          items: [
            { to: '/graduation', label: 'Progress Dashboard' },
            { to: '/graduation/remaining', label: 'Remaining Courses' },
            { to: '/graduation/planner', label: 'Semester Planner' },
          ]
        }
      ]
    },
    {
      type: 'dropdown',
      id: 'cafeteria',
      label: 'Cafeteria',
      items: [
        { to: '/cafeteria/today-menu', label: "Today's Menu" },
        { to: '/cafeteria/submit-review', label: 'Submit Review' },
        { to: '/cafeteria/weekly-calendar', label: 'Weekly Calendar' },
      ]
    },
    {
      type: 'link',
      to: '/profile',
      label: 'Profile'
    }
  ];

  // Admin navigation structure
  const adminNavigation = [
    {
      type: 'link',
      to: '/admin',
      label: 'Admin Dashboard'
    },
    {
      type: 'dropdown',
      id: 'calendar',
      label: 'Calendar',
      items: [
        { to: '/calendar', label: 'Main Calendar' },
        { to: '/calendar/academic-dates', label: 'Academic Dates' },
        { to: '/calendar/exam-schedule', label: 'Exam Schedule' },
        { to: '/calendar/club-activities', label: 'Club Activities' },
        { to: '/calendar/add-event', label: 'Add Event' },
      ]
    },
    {
      type: 'mega-dropdown',
      id: 'academics',
      label: 'Academics',
      sections: [
        {
          title: 'Faculty Management',
          items: [
            { to: '/admin/faculty-management', label: 'Manage Faculty' },
          ]
        },
        {
          title: 'Course Management',
          items: [
            { to: '/course-content/admin', label: 'Course Content & Reviews' },
          ]
        }
      ]
    },
    {
      type: 'mega-dropdown',
      id: 'career',
      label: 'Career',
      sections: [
        {
          title: 'Internship Admin',
          items: [
            { to: '/admin/career', label: 'Internship Dashboard' },
            { to: '/admin/career/internships', label: 'Manage Internships' },
            { to: '/admin/career/applications', label: 'Applications' },
          ]
        },
        {
          title: 'Job Admin',
          items: [
            { to: '/admin/career/jobs', label: 'Job Dashboard' },
            { to: '/admin/career/jobs/create', label: 'Create New Job' },
          ]
        },
        {
          title: 'Scholarship Admin',
          items: [
            { to: '/admin/career/scholarships', label: 'Scholarship Dashboard' },
            { to: '/admin/career/scholarships/create', label: 'Create New Scholarship' },
          ]
        }
      ]
    },
    {
      type: 'dropdown',
      id: 'groups',
      label: 'Community',
      items: [
        { to: '/find-my-group/moderation', label: 'Group Moderation' },

      ]
    },
    {
      type: 'dropdown',
      id: 'cafeteria',
      label: 'Cafeteria',
      items: [
        { to: '/cafeteria/admin', label: 'Manage Food Items' },
        { to: '/cafeteria/admin/menu-planning', label: 'Weekly Planning' },
        { to: '/cafeteria/admin/today-menu', label: "Today's Menu" },
      ]
    }
  ];

  const renderLink = (item, isStudent = true) => (
    <Link
      key={item.to}
      to={item.to}
      className={`nav-link ${isActive(item.to) ? 'active' : ''}`}
      onClick={closeAllDropdowns}
    >
      {item.label}
    </Link>
  );

  const renderDropdown = (item, isStudent = true) => {
    const isOpen = isStudent
      ? activeDropdown === item.id
      : adminDropdowns[item.id];

    const toggle = () => {
      if (isStudent) {
        toggleStudentDropdown(item.id);
      } else {
        toggleAdminDropdown(item.id);
      }
    };

    return (
      <div
        key={item.id}
        className="dropdown-container"
      >
        <button
          className={`nav-link dropdown-toggle ${isOpen ? 'active' : ''}`}
          onClick={toggle}
        >
          {item.label}
          <span className={`dropdown-arrow ${isOpen ? 'active' : ''}`}>▼</span>
        </button>

        {isOpen && item.type === 'mega-dropdown' ? (
          <div className={`dropdown-menu mega-menu ${item.sections.length > 2 ? 'triple-column' : ''}`}>
            {item.sections.map((section, idx) => (
              <div key={idx} className="mega-section">
                <div className="mega-section-title">
                  {section.title}
                </div>
                <div className="mega-section-items">
                  {section.items.map((subItem, subIdx) => (
                    <Link
                      key={subIdx}
                      to={subItem.to}
                      className="dropdown-item"
                      onClick={closeAllDropdowns}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : isOpen && (
          <div className="dropdown-menu">
            {item.items.map((subItem, idx) => (
              <Link
                key={idx}
                to={subItem.to}
                className="dropdown-item"
                onClick={closeAllDropdowns}
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNavItem = (item, isStudent = true) => {
    switch (item.type) {
      case 'link':
        return renderLink(item, isStudent);
      case 'dropdown':
      case 'mega-dropdown':
        return renderDropdown(item, isStudent);
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeAllDropdowns}>
          <span>BRACU Student Hub</span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {isAdmin ? (
                // ADMIN NAVIGATION
                <>
                  {adminNavigation.map(item => renderNavItem(item, false))}
                </>
              ) : (
                // STUDENT NAVIGATION
                studentNavigation.map(item => renderNavItem(item, true))
              )}

              {/* Shared logout and user info */}
              <button onClick={handleLogout} className="btn btn-outline">Logout</button>
              <span className="nav-user">
                👤 {user.name} {isAdmin ? '(Admin)' : ''}
              </span>
            </>
          ) : (
            <>
              <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeAllDropdowns}>Home</Link>
              <Link to="/login" className={`nav-link ${isActive('/login')}`} onClick={closeAllDropdowns}>Login</Link>
              <Link to="/signup" className={`nav-link ${isActive('/signup')}`} onClick={closeAllDropdowns}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;