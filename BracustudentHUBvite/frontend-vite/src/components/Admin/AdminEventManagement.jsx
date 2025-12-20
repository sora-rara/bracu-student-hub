// src/components/Admin/AdminEventManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth.jsx"; // Use your auth service

const AdminEventManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'job',
    organization: '',
    description: '',
    deadline: '',
    link: '',
    location: 'On-campus',
    tags: [],
    contactEmail: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load user on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Get user from localStorage (sync)
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          // Update form email if user exists
          setFormData(prev => ({
            ...prev,
            contactEmail: currentUser.email || ''
          }));
          
          // Verify session with server (async)
          const authStatus = await authService.checkAuthStatus();
          if (!authStatus.loggedIn) {
            // Session expired, redirect to login
            navigate('/login');
            return;
          }
        } else {
          // No user in localStorage, redirect to login
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('Auth loading error:', error);
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  // Check if user is admin
  const isAdmin = user && (user.role === "admin" || user.isAdmin);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Show admin only message if not admin
  if (!isAdmin) {
    return (
      <div className="admin-only-container">
        <div className="admin-only-message">
          <h2>🔒 Admin Access Required</h2>
          <p>Only administrators can post career opportunities.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const eventTypes = [
    { value: 'job', label: 'Part-Time Job', icon: '👔' },
    { value: 'internship', label: 'Internship', icon: '💼' },
    { value: 'scholarship', label: 'Scholarship', icon: '💰' }
  ];

  const quickTags = ['On-campus', 'Remote', 'Paid', 'Summer 2024', 'Tech', 'Business'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate form data
      if (!formData.title || !formData.organization || !formData.description || !formData.deadline || !formData.link) {
        setError('Please fill in all required fields (marked with *)');
        setLoading(false);
        return;
      }

      // Validate URL
      try {
        new URL(formData.link);
      } catch (err) {
        setError('Please enter a valid URL for the application link');
        setLoading(false);
        return;
      }

      // Prepare the data
      const eventData = {
        title: formData.title,
        type: formData.type,
        organization: formData.organization,
        description: formData.description,
        deadline: formData.deadline,
        link: formData.link,
        location: formData.location,
        tags: formData.tags,
        contactEmail: formData.contactEmail || user?.email,
        status: 'active'
      };

      console.log('Submitting event data:', eventData);

      // Use the correct endpoint with session-based auth
      const response = await fetch('http://localhost:5000/api/career/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(eventData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        try {
          const result = await response.json();
          console.log('Success response:', result);
          
          setSuccess(true);
          setFormData({
            title: '',
            type: 'job',
            organization: '',
            description: '',
            deadline: '',
            link: '',
            location: 'On-campus',
            tags: [],
            contactEmail: user?.email || ''
          });
          
          setTimeout(() => {
            setSuccess(false);
            navigate('/career');
          }, 3000);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          // Still consider it success if status is 2xx
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            navigate('/career');
          }, 3000);
        }
      } else {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const text = await response.text();
          console.log('Error response:', text);
          if (text) {
            try {
              const errorData = JSON.parse(text);
              errorMessage = errorData.error || errorData.message || text;
            } catch {
              errorMessage = text || errorMessage;
            }
          }
        } catch (textError) {
          console.error('Error reading response:', textError);
        }
        
        // Handle specific status codes
        if (response.status === 401) {
          errorMessage = "Session expired. Please login again.";
          setTimeout(() => {
            authService.logout();
            navigate('/login');
          }, 2000);
        } else if (response.status === 403) {
          errorMessage = "Access denied. Admin privileges required.";
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Network error:', error);
      setError(`Network error: ${error.message}. Make sure backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-event-container">
      <div className="post-event-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          ← Back
        </button>
        <h1>🎯 Post Career Opportunity</h1>
        <p>Share job, internship, or scholarship opportunities with students</p>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
          Logged in as: {user?.name} ({user?.role})
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ Opportunity posted successfully! Redirecting to career page...
        </div>
      )}

      <form className="post-event-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>📋 Select Opportunity Type</h3>
          <div className="event-type-buttons">
            {eventTypes.map(type => (
              <button
                type="button"
                key={type.value}
                className={`event-type-btn ${formData.type === type.value ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                disabled={loading}
              >
                <span className="event-type-icon">{type.icon}</span>
                <span className="event-type-label">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>📝 Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Software Development Intern"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Organization *</label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                placeholder="Company/University name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Application Deadline *</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="On-campus">On-campus</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Off-campus">Off-campus</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Application Link *</label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://apply.example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the opportunity, requirements, benefits..."
              rows="5"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>🏷️ Add Tags</h3>
          <div className="tags-container">
            {quickTags.map(tag => (
              <button
                type="button"
                key={tag}
                className={`tag-btn ${formData.tags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
                disabled={loading}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="form-help">
            Selected tags: {formData.tags.join(', ') || 'None'}
          </div>
        </div>

        <div className="form-section">
          <h3>📧 Contact Information</h3>
          <div className="form-group">
            <label>Contact Email (for questions)</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              placeholder="contact@organization.com"
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/career')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !formData.title || !formData.organization || !formData.description || !formData.deadline || !formData.link}
          >
            {loading ? 'Posting...' : '📤 Post Opportunity'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', fontSize: '12px' }}>
        <strong>Debug Info:</strong>
        <div>User: {user?.name} ({user?.role})</div>
        <div>User ID: {user?.id}</div>
        <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
        <div>Endpoint: POST http://localhost:5000/api/career/admin/events</div>
        <div>Auth Type: Session-based (cookies)</div>
      </div>
    </div>
  );
};

export default AdminEventManagement;