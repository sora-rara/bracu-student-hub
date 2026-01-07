// src/components/career/admin/EditOpportunity.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import "../../../App.css";

const EditOpportunity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formValid, setFormValid] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    organization: {
      name: '',
      website: '',
      description: '',
      industry: ''
    },
    description: '',
    shortDescription: '',
    
    // Internship Details
    category: 'computer-science',
    type: 'summer',
    
    // Location
    location: {
      type: 'on-site',
      city: '',
      country: '',
      address: ''
    },
    
    // Duration
    duration: {
      startDate: '',
      endDate: '',
      hoursPerWeek: {
        min: '20',
        max: '40'
      }
    },
    
    // Compensation
    compensation: {
      type: 'unpaid',
      amount: '',
      currency: 'USD',
      benefits: []
    },
    
    // Requirements
    requirements: {
      educationLevel: 'undergraduate',
      yearInSchool: ['junior', 'senior'],
      minGPA: '',
      skills: [],
      prerequisites: []
    },
    
    majors: [],
    
    // Application Details
    applicationDetails: {
      deadline: '',
      applicationLink: '',
      contactEmail: '',
      documentsRequired: [],
      instructions: ''
    },
    
    // Settings
    status: 'active',
    isFeatured: false,
    
    // Learning Outcomes
    learningOutcomes: ['Gain practical experience', 'Develop professional skills'],
    skillsGained: [],
    mentorship: {
      provided: true,
      details: 'Regular mentorship sessions with experienced professionals'
    }
  });

  // Fetch internship data on component mount
  useEffect(() => {
    fetchInternship();
  }, [id]);

  // Check form validation
  useEffect(() => {
    const isValid = 
      formData.title.trim() !== '' &&
      formData.organization.name.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.shortDescription.trim() !== '' &&
      formData.applicationDetails.deadline !== '' &&
      formData.applicationDetails.applicationLink.trim() !== '';
    
    setFormValid(isValid);
  }, [formData]);

  const fetchInternship = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/career/admin/internships/${id}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setFormData(response.data.data);
      } else {
        alert('Failed to load internship data');
        navigate('/admin/career');
      }
    } catch (error) {
      console.error('Error fetching internship:', error);
      alert('Failed to load internship. Please try again.');
      navigate('/admin/career');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      
      setFormData(prev => {
        const newState = { ...prev };
        
        if (subChild) {
          newState[parent] = {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: type === 'checkbox' ? checked : value
            }
          };
        } else {
          newState[parent] = {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          };
        }
        
        return newState;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle array fields (skills, majors, etc.)
  const handleArrayChange = (field, values, parent = null) => {
    if (parent) {
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: values.split(',').map(v => v.trim()).filter(v => v)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: values.split(',').map(v => v.trim()).filter(v => v)
      }));
    }
  };

  // Add a benefit
  const addBenefit = () => {
    const benefit = prompt('Enter a benefit (e.g., Free lunch, Gym membership):');
    if (benefit && benefit.trim()) {
      setFormData(prev => ({
        ...prev,
        compensation: {
          ...prev.compensation,
          benefits: [...prev.compensation.benefits, benefit.trim()]
        }
      }));
    }
  };

  // Remove a benefit
  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      compensation: {
        ...prev.compensation,
        benefits: prev.compensation.benefits.filter((_, i) => i !== index)
      }
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formValid) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }
    
    setSaving(true);
    setSuccess(false);

    try {
      // Prepare data for backend
      const dataToSend = {
        title: formData.title,
        organization: {
          name: formData.organization.name,
          website: formData.organization.website || '',
          industry: formData.organization.industry || ''
        },
        description: formData.description,
        shortDescription: formData.shortDescription,
        category: formData.category,
        type: formData.type,
        location: formData.location,
        duration: {
          startDate: formData.duration.startDate || null,
          endDate: formData.duration.endDate || null,
          hoursPerWeek: {
            min: parseInt(formData.duration.hoursPerWeek.min) || 20,
            max: parseInt(formData.duration.hoursPerWeek.max) || 40
          }
        },
        compensation: {
          type: formData.compensation.type,
          amount: formData.compensation.amount ? parseFloat(formData.compensation.amount) : 0,
          currency: formData.compensation.currency,
          benefits: formData.compensation.benefits
        },
        requirements: {
          educationLevel: formData.requirements.educationLevel,
          yearInSchool: formData.requirements.yearInSchool,
          minGPA: formData.requirements.minGPA ? parseFloat(formData.requirements.minGPA) : 0,
          skills: formData.requirements.skills,
          prerequisites: formData.requirements.prerequisites || []
        },
        majors: formData.majors,
        applicationDetails: {
          deadline: formData.applicationDetails.deadline,
          applicationLink: formData.applicationDetails.applicationLink,
          contactEmail: formData.applicationDetails.contactEmail || '',
          documentsRequired: formData.applicationDetails.documentsRequired,
          instructions: formData.applicationDetails.instructions || ''
        },
        status: formData.status,
        isFeatured: formData.isFeatured,
        learningOutcomes: formData.learningOutcomes,
        skillsGained: formData.skillsGained,
        mentorship: formData.mentorship
      };

      const response = await axios.put(`/api/career/admin/internships/${id}`, dataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response:', response.data);
      
      setSuccess(true);
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/admin/career');
      }, 2000);

    } catch (error) {
      console.error('Error updating internship:', error);
      
      let errorMessage = 'Failed to update internship. ';
      
      if (error.response) {
        console.error('Server response:', error.response.data);
        
        if (error.response.status === 400) {
          errorMessage = 'Validation error: ';
          if (error.response.data.details) {
            errorMessage += error.response.data.details.join(', ');
          } else {
            errorMessage += error.response.data.error || 'Check your input';
          }
        } else if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          navigate('/login');
        } else if (error.response.status === 403) {
          errorMessage = 'Admin access required!';
        } else if (error.response.status === 404) {
          errorMessage = 'Internship not found. It may have been deleted.';
        } else {
          errorMessage += `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Check if backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Navigation between steps
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    switch (currentStep) {
      case 1: return '33%';
      case 2: return '66%';
      case 3: return '100%';
      default: return '33%';
    }
  };

  // Render step 1: Basic Information
  const renderStep1 = () => (
    <div className="form-section">
      <div className="form-section-header">
        <div className="section-icon">📝</div>
        <div>
          <h2>Basic Information</h2>
          <p className="section-description">Core details about the internship position</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="required">Internship Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Software Engineering Intern"
            required
            disabled={saving}
          />
          <span className="form-hint">Be specific and descriptive</span>
        </div>

        <div className="form-group">
          <label className="required">Organization Name *</label>
          <input
            type="text"
            name="organization.name"
            value={formData.organization.name}
            onChange={handleChange}
            placeholder="e.g., Google, Microsoft, Amazon"
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>Organization Industry</label>
          <input
            type="text"
            name="organization.industry"
            value={formData.organization.industry}
            onChange={handleChange}
            placeholder="e.g., Technology, Finance, Healthcare"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>Organization Website</label>
          <input
            type="url"
            name="organization.website"
            value={formData.organization.website}
            onChange={handleChange}
            placeholder="https://company.com"
            disabled={saving}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="required">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the internship role, responsibilities, projects, and what the intern will learn..."
          rows={6}
          required
          disabled={saving}
        />
        <div className="char-count">
          {formData.description.length}/2000 characters
        </div>
      </div>

      <div className="form-group">
        <label className="required">Short Description *</label>
        <textarea
          name="shortDescription"
          value={formData.shortDescription}
          onChange={handleChange}
          placeholder="Brief summary that appears in listings (max 250 characters)"
          rows={3}
          maxLength={250}
          required
          disabled={saving}
        />
        <div className={`char-count ${formData.shortDescription.length > 200 ? 'low' : ''}`}>
          {formData.shortDescription.length}/250 characters
        </div>
      </div>

      <div className="form-note">
        <strong>💡 Tip:</strong> Make your description engaging and clear. Highlight unique opportunities and learning experiences.
      </div>
    </div>
  );

  // Render step 2: Details
  const renderStep2 = () => (
    <div className="form-section">
      <div className="form-section-header">
        <div className="section-icon">⚙️</div>
        <div>
          <h2>Internship Details</h2>
          <p className="section-description">Specific requirements, logistics, and compensation</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="required">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            disabled={saving}
          >
            <option value="computer-science">Computer Science</option>
            <option value="engineering">Engineering</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="design">Design</option>
            <option value="data-science">Data Science</option>
            <option value="cybersecurity">Cybersecurity</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label className="required">Internship Type *</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            disabled={saving}
          >
            <option value="summer">Summer Internship</option>
            <option value="fall">Fall Internship</option>
            <option value="winter">Winter Internship</option>
            <option value="spring">Spring Internship</option>
            <option value="year-round">Year-Round</option>
            <option value="co-op">Co-op Program</option>
            <option value="virtual">Virtual/Remote</option>
          </select>
        </div>

        <div className="form-group">
          <label className="required">Location Type *</label>
          <select
            name="location.type"
            value={formData.location.type}
            onChange={handleChange}
            required
            disabled={saving}
          >
            <option value="on-site">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {formData.location.type !== 'remote' && (
          <>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                placeholder="e.g., San Francisco"
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="location.country"
                value={formData.location.country}
                onChange={handleChange}
                placeholder="e.g., United States"
                disabled={saving}
              />
            </div>
          </>
        )}
      </div>

      <div className="form-divider"></div>

      <h3>Duration & Schedule</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Start Date</label>
          <input
            type="date"
            name="duration.startDate"
            value={formData.duration.startDate ? formData.duration.startDate.split('T')[0] : ''}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input
            type="date"
            name="duration.endDate"
            value={formData.duration.endDate ? formData.duration.endDate.split('T')[0] : ''}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        <div className="form-group">
          <label>Min Hours/Week</label>
          <input
            type="number"
            name="duration.hoursPerWeek.min"
            value={formData.duration.hoursPerWeek.min}
            onChange={handleChange}
            min="1"
            max="80"
            placeholder="20"
            disabled={saving}
          />
        </div>
        <div className="form-group">
          <label>Max Hours/Week</label>
          <input
            type="number"
            name="duration.hoursPerWeek.max"
            value={formData.duration.hoursPerWeek.max}
            onChange={handleChange}
            min="1"
            max="80"
            placeholder="40"
            disabled={saving}
          />
        </div>
      </div>

      <div className="form-divider"></div>

      <h3>Compensation</h3>
      <div className="compensation-card">
        <div className="form-grid">
          <div className="form-group">
            <label className="required">Compensation Type *</label>
            <select
              name="compensation.type"
              value={formData.compensation.type}
              onChange={handleChange}
              required
              disabled={saving}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="stipend">Stipend</option>
              <option value="academic-credit">Academic Credit</option>
              <option value="housing-provided">Housing Provided</option>
            </select>
          </div>

          {(formData.compensation.type === 'paid' || formData.compensation.type === 'stipend') && (
            <>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  name="compensation.amount"
                  value={formData.compensation.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select
                  name="compensation.currency"
                  value={formData.compensation.currency}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="BDT">BDT (৳)</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="form-group">
          <label>Benefits</label>
          <div className="tags-input">
            {formData.compensation.benefits.map((benefit, index) => (
              <span key={index} className="tag">
                {benefit}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeBenefit(index)}
                  disabled={saving}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={addBenefit}
              className="btn-add"
              disabled={saving}
            >
              + Add Benefit
            </button>
          </div>
          <span className="form-hint">e.g., Free lunch, Gym membership, Transportation allowance</span>
        </div>
      </div>

      <div className="form-divider"></div>

      <h3>Requirements</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Education Level</label>
          <select
            name="requirements.educationLevel"
            value={formData.requirements.educationLevel}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
            <option value="phd">PhD</option>
            <option value="any">Any</option>
          </select>
        </div>

        <div className="form-group">
          <label>Minimum GPA</label>
          <input
            type="number"
            name="requirements.minGPA"
            value={formData.requirements.minGPA}
            onChange={handleChange}
            min="0"
            max="4.0"
            step="0.1"
            placeholder="3.0"
            disabled={saving}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Required Skills (comma-separated)</label>
        <input
          type="text"
          value={formData.requirements.skills.join(', ')}
          onChange={(e) => handleArrayChange('skills', e.target.value, 'requirements')}
          placeholder="JavaScript, React, Communication, Teamwork"
          disabled={saving}
        />
      </div>

      <div className="form-group">
        <label>Targeted Majors (comma-separated)</label>
        <input
          type="text"
          value={formData.majors.join(', ')}
          onChange={(e) => handleArrayChange('majors', e.target.value)}
          placeholder="Computer Science, Engineering, Business Administration"
          disabled={saving}
        />
      </div>
    </div>
  );

  // Render step 3: Application & Final
  const renderStep3 = () => (
    <div className="form-section">
      <div className="form-section-header">
        <div className="section-icon">📋</div>
        <div>
          <h2>Application & Settings</h2>
          <p className="section-description">How students apply and final settings</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="required">Application Deadline *</label>
          <input
            type="date"
            name="applicationDetails.deadline"
            value={formData.applicationDetails.deadline ? formData.applicationDetails.deadline.split('T')[0] : ''}
            onChange={handleChange}
            required
            disabled={saving}
          />
          <span className="form-hint">
            Deadline: {formatDate(formData.applicationDetails.deadline)}
          </span>
        </div>

        <div className="form-group">
          <label className="required">Application Link *</label>
          <input
            type="url"
            name="applicationDetails.applicationLink"
            value={formData.applicationDetails.applicationLink}
            onChange={handleChange}
            placeholder="https://company.com/apply"
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>Contact Email</label>
          <input
            type="email"
            name="applicationDetails.contactEmail"
            value={formData.applicationDetails.contactEmail}
            onChange={handleChange}
            placeholder="internships@company.com"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>Required Documents</label>
          <input
            type="text"
            value={formData.applicationDetails.documentsRequired.join(', ')}
            onChange={(e) => handleArrayChange('documentsRequired', e.target.value, 'applicationDetails')}
            placeholder="Resume, Cover Letter, Transcript, Portfolio"
            disabled={saving}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Application Instructions</label>
        <textarea
          name="applicationDetails.instructions"
          value={formData.applicationDetails.instructions}
          onChange={handleChange}
          placeholder="Specific instructions for applicants..."
          rows={4}
          disabled={saving}
        />
      </div>

      <div className="form-divider"></div>

      <h3>Learning & Development</h3>
      <div className="form-group">
        <label>Skills Gained (comma-separated)</label>
        <input
          type="text"
          value={formData.skillsGained.join(', ')}
          onChange={(e) => handleArrayChange('skillsGained', e.target.value)}
          placeholder="Teamwork, Problem-solving, Technical skills, Communication"
          disabled={saving}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="mentorship.provided"
            checked={formData.mentorship.provided}
            onChange={handleChange}
            disabled={saving}
          />
          &nbsp; Mentorship Provided
        </label>
      </div>

      {formData.mentorship.provided && (
        <div className="form-group">
          <label>Mentorship Details</label>
          <textarea
            name="mentorship.details"
            value={formData.mentorship.details}
            onChange={handleChange}
            placeholder="Describe the mentorship program..."
            rows={3}
            disabled={saving}
          />
        </div>
      )}

      <div className="form-divider"></div>

      <h3>Final Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              disabled={saving}
            />
            &nbsp; Feature this internship
          </label>
          <span className="form-hint">Featured internships appear at the top of listings</span>
        </div>
      </div>

      {/* Preview Card */}
      <div className="preview-card">
        <h3>👁️ Preview</h3>
        <div className="preview-content">
          <div className="preview-item">
            <div className="preview-label">Title</div>
            <div className="preview-value">{formData.title || 'Not set'}</div>
          </div>
          <div className="preview-item">
            <div className="preview-label">Organization</div>
            <div className="preview-value">{formData.organization.name || 'Not set'}</div>
          </div>
          <div className="preview-item">
            <div className="preview-label">Type</div>
            <div className="preview-value">{formData.type || 'Not set'}</div>
          </div>
          <div className="preview-item">
            <div className="preview-label">Deadline</div>
            <div className="preview-value">{formatDate(formData.applicationDetails.deadline)}</div>
          </div>
        </div>
      </div>

      <div className="form-note">
        <strong>⚠️ Important:</strong> Review all information before submitting. Changes will be immediately visible to students.
      </div>
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep1();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading internship data...</p>
      </div>
    );
  }

  return (
    <div className="create-internship-page">
      {/* Professional Header */}
      <div className="admin-create-header">
        <div className="header-top">
          <h1>Edit Internship</h1>
          <div className="admin-badge">ADMIN PANEL</div>
        </div>
        <div className="header-content">
          <p>Update the internship details below. All fields marked with * are required.</p>
          <p className="internship-id">ID: {id}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="form-progress">
        <div className="progress-steps">
          <div className="progress-bar" style={{ width: calculateProgress() }}></div>
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
            <div className="step-label">Basic Info</div>
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
            <div className="step-label">Details</div>
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <div className="step-label">Review</div>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="internship-form-container">
        {/* Success Message */}
        {success && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <div>
              <h4>Internship Updated Successfully!</h4>
              <p>Your changes have been saved and are now visible to students.</p>
              <p><small>Redirecting to admin panel...</small></p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {saving && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Saving changes...</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {renderCurrentStep()}

          {/* Form Actions */}
          <div className="form-actions">
            <div className="form-navigation">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn-prev"
                  onClick={prevStep}
                  disabled={saving}
                >
                  ← Previous
                </button>
              )}
              
              {currentStep < 3 && (
                <button
                  type="button"
                  className="btn-next"
                  onClick={nextStep}
                  disabled={saving}
                >
                  Next →
                </button>
              )}
              
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/admin/career')}
                disabled={saving}
              >
                Cancel
              </button>
            </div>

            {currentStep === 3 && (
              <button
                type="submit"
                className="btn-submit"
                disabled={saving || !formValid}
              >
                {saving ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Saving Changes...
                  </>
                ) : (
                  'Update Internship'
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Help Sidebar */}
      <div className="form-help-sidebar">
        <div className="help-header">
          <div className="section-icon">💡</div>
          <h3>Editing Guidelines</h3>
        </div>
        
        <div className="help-tip">
          <h4>Step {currentStep} of 3</h4>
          <p>
            {currentStep === 1 && 'Review and update basic information. Keep titles and descriptions clear and engaging.'}
            {currentStep === 2 && 'Update requirements and compensation to attract the right candidates.'}
            {currentStep === 3 && 'Review all changes carefully before saving. Changes take effect immediately.'}
          </p>
        </div>
        
        <div className="help-tip">
          <h4>Best Practices</h4>
          <p>• Keep deadlines updated and realistic</p>
          <p>• Ensure all links are working</p>
          <p>• Check for typos and formatting issues</p>
          <p>• Update status when positions are filled</p>
        </div>
        
        <div className="help-tip">
          <h4>⚠️ Important Note</h4>
          <p>Changes made here will immediately affect how this internship appears to students.</p>
          <p><strong>Consider using "Draft" status</strong> if you're making significant changes and want to preview before publishing.</p>
        </div>

        <div className="help-tip">
          <h4>Quick Actions</h4>
          <button 
            className="btn-quick-action"
            onClick={() => navigate(`/career/internships/${id}`)}
            target="_blank"
          >
            👁️ View as Student
          </button>
          <button 
            className="btn-quick-action"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this internship?')) {
                // Add delete functionality here
                alert('Delete functionality coming soon');
              }
            }}
          >
            🗑️ Delete Internship
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOpportunity;