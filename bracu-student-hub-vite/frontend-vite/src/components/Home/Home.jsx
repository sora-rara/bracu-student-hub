import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/auth.jsx';

function Home() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to BRACU Student Hub</h1>
          <p className="hero-subtitle">
            Your comprehensive academic companion for tracking grades, calculating GPA,
            and managing your educational journey.
          </p>

          {!isAuthenticated ? (
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Login
              </Link>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>

        <div className="hero-image">
          <div className="features-illustration">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h3>GPA Calculator</h3>
              <p>Accurate semester and cumulative GPA calculations</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <h3>Progress Tracking</h3>
              <p>Monitor your academic performance over time</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <h3>Goal Setting</h3>
              <p>Set and achieve your academic targets</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose BRACU Student Hub?</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure & Private</h3>
            <p>Your academic data is encrypted and stored securely.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Easy to Use</h3>
            <p>Intuitive interface designed for students of all levels.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast & Reliable</h3>
            <p>Instant calculations with real-time updates.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Detailed Analytics</h3>
            <p>Comprehensive reports and visualizations of your performance.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Start Your Academic Journey Today</h2>
        <p>
          Join hundreds of students who are already using BRACU Student Hub to
          track their academic progress and achieve their educational goals.
        </p>

        {!isAuthenticated ? (
          <Link to="/signup" className="btn btn-success btn-lg">
            Create Free Account
          </Link>
        ) : (
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            Continue to Dashboard
          </Link>
        )}
      </section>
    </div>
  );
}

export default Home;