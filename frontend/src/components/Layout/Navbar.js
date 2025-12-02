
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

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
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/gpa-calculator" className={`nav-link ${isActive('/gpa-calculator')}`}>
                GPA Calculator
              </Link>
              <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
                Profile
              </Link>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
              <span className="nav-user">👤 {user.name}</span>
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
