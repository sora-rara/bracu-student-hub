// src/components/career/admin/CreateJob.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formValid, setFormValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const jobTypes = ['part-time', 'remote', 'on-campus', 'freelance', 'internship'];
  const locations = ['Remote', 'On-campus', 'Dhaka', 'Chittagong', 'Other'];
  const schedules = ['flexible', 'weekends', 'evenings', 'mornings', 'specific-hours'];
  const currencies = ['USD', 'BDT', 'EUR'];
  const salaryPeriods = ['hourly', 'weekly', 'monthly', 'fixed'];
  const durations = ['1 month', '3 months', '6 months', '1 year', 'Ongoing', 'Other'];

  // Form State
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    company: {
      name: '',
      website: '',
      industry: '',
      size: 'medium',
      description: ''
    },
    description: '',
    shortDescription: '',
    
    // Job Details
    jobType: 'part-time',
    location: 'Remote',
    schedule: 'flexible',
    duration: 'Ongoing',
    
    // Salary
    salary: {
      amount: '',
      currency: 'USD',
      period: 'hourly'
    },
    
    // Requirements & Responsibilities
    responsibilities: [''],
    requirements: [''],
    benefits: [''],
    
    // Application Details
    deadline: '',
    contactEmail: '',
    contactPhone: '',
    applicationInstructions: '',
    
    // Settings
    status: 'draft',
    isFeatured: false,
    
    // Meta
    tags: []
  });

  // Check form validation
  useEffect(() => {
    const isValid = 
      formData.title.trim() !== '' &&
      formData.company.name.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.shortDescription.trim() !== '' &&
      formData.salary.amount !== '' &&
      formData.deadline !== '';
    
    setFormValid(isValid);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      
      if (subChild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: type === 'checkbox' ? checked : value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayField = (field, value, index = null) => {
    if (index !== null) {
      const newArray = [...formData[field]];
      newArray[index] = value;
      setFormData(prev => ({
        ...prev,
        [field]: newArray
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], '']
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e, saveAsDraft = false) => {
    e.preventDefault();
    
    if (!formValid && !saveAsDraft) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');

    try {
      // Prepare data
      const submissionData = {
        title: formData.title.trim(),
        company: {
          name: formData.company.name.trim(),
          website: formData.company.website.trim() || '',
          industry: formData.company.industry.trim() || '',
          size: formData.company.size,
          description: formData.company.description.trim() || ''
        },
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim(),
        jobType: formData.jobType,
        location: formData.location,
        schedule: formData.schedule,
        duration: formData.duration,
        salary: {
          amount: Number(formData.salary.amount),
          currency: formData.salary.currency,
          period: formData.salary.period
        },
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        requirements: formData.requirements.filter(r => r.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        deadline: formData.deadline,
        contactEmail: formData.contactEmail.trim() || '',
        contactPhone: formData.contactPhone.trim() || '',
        applicationInstructions: formData.applicationInstructions.trim() || '',
        status: saveAsDraft ? 'draft' : formData.status,
        isFeatured: formData.isFeatured,
        tags: formData.tags
      };

      console.log('Submitting job data:', submissionData);

      const response = await axios.post('/api/jobs/admin/create', submissionData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const message = saveAsDraft 
          ? 'Job saved as draft successfully!' 
          : 'Job created successfully!';
        alert(message);
        navigate('/admin/career/jobs');
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Submission error:', error);
      
      let errorMsg = 'Failed to create job. ';
      
      if (error.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
        setTimeout(() => navigate('/login'), 1000);
      } else if (error.response?.status === 403) {
        errorMsg = 'Admin access required!';
      } else if (error.response?.status === 400) {
        if (error.response.data.details) {
          errorMsg = `Validation errors: ${error.response.data.details.join(', ')}`;
        } else if (error.response.data.error) {
          errorMsg = `Error: ${error.response.data.error}`;
        }
      }
      
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
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

  const calculateProgress = () => {
    return `${(currentStep / 4) * 100}%`;
  };

  const formatType = (type) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Render step 1
  const renderStep1 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Basic Information</h2>
        <p className="section-description">Enter job details</p>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="required">Job Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Part-time Customer Service Representative"
            required
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="required">Company Name *</label>
            <input
              type="text"
              name="company.name"
              value={formData.company.name}
              onChange={handleChange}
              placeholder="Company name"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Company Industry</label>
            <input
              type="text"
              name="company.industry"
              value={formData.company.industry}
              onChange={handleChange}
              placeholder="e.g., Retail, Technology, Education"
              disabled={loading}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Company Website</label>
          <input
            type="url"
            name="company.website"
            value={formData.company.website}
            onChange={handleChange}
            placeholder="https://company.com"
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="required">Job Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of the job..."
            rows={6}
            required
            disabled={loading}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label className="required">Short Description *</label>
          <textarea
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            placeholder="Brief summary for job listings (max 250 characters)"
            rows={3}
            maxLength={250}
            required
            disabled={loading}
            className="form-textarea"
          />
          <div className="char-count">{formData.shortDescription.length}/250</div>
        </div>
      </div>
    </div>
  );

  // Render step 2
  const renderStep2 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Job Details</h2>
        <p className="section-description">Set job type, location, and salary</p>
      </div>

      <div className="form-card">
        <div className="form-row">
          <div className="form-group">
            <label className="required">Job Type *</label>
            <select
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-select"
            >
              {jobTypes.map(type => (
                <option key={type} value={type}>{formatType(type)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="required">Location *</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-select"
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="required">Schedule *</label>
            <select
              name="schedule"
              value={formData.schedule}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-select"
            >
              {schedules.map(sched => (
                <option key={sched} value={sched}>
                  {sched.charAt(0).toUpperCase() + sched.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Duration</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              disabled={loading}
              className="form-select"
            >
              {durations.map(dur => (
                <option key={dur} value={dur}>{dur}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="salary-section">
          <h3 className="section-subtitle">💰 Salary Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="required">Amount *</label>
              <div className="amount-input">
                <span className="currency-prefix">
                  {formData.salary.currency === 'USD' ? '$' : 
                   formData.salary.currency === 'BDT' ? '৳' : '€'}
                </span>
                <input
                  type="number"
                  name="salary.amount"
                  value={formData.salary.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="15.00"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="required">Currency *</label>
              <select
                name="salary.currency"
                value={formData.salary.currency}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-select"
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="required">Period *</label>
              <select
                name="salary.period"
                value={formData.salary.period}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-select"
              >
                {salaryPeriods.map(period => (
                  <option key={period} value={period}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 3
  const renderStep3 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Requirements & Benefits</h2>
        <p className="section-description">Set job requirements and benefits</p>
      </div>

      <div className="form-card">
        <div className="responsibilities-section">
          <h3 className="section-subtitle">📋 Responsibilities</h3>
          {formData.responsibilities.map((resp, index) => (
            <div key={index} className="array-input-row">
              <input
                type="text"
                value={resp}
                onChange={(e) => handleArrayField('responsibilities', e.target.value, index)}
                placeholder={`Responsibility ${index + 1}`}
                disabled={loading}
                className="form-input"
              />
              {formData.responsibilities.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('responsibilities', index)}
                  className="btn-remove-item"
                  disabled={loading}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleArrayField('responsibilities', '')}
            className="btn-add-item"
            disabled={loading}
          >
            + Add Responsibility
          </button>
        </div>

        <div className="requirements-section">
          <h3 className="section-subtitle">🎯 Requirements</h3>
          {formData.requirements.map((req, index) => (
            <div key={index} className="array-input-row">
              <input
                type="text"
                value={req}
                onChange={(e) => handleArrayField('requirements', e.target.value, index)}
                placeholder={`Requirement ${index + 1}`}
                disabled={loading}
                className="form-input"
              />
              {formData.requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('requirements', index)}
                  className="btn-remove-item"
                  disabled={loading}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleArrayField('requirements', '')}
            className="btn-add-item"
            disabled={loading}
          >
            + Add Requirement
          </button>
        </div>

        <div className="benefits-section">
          <h3 className="section-subtitle">🌟 Benefits</h3>
          {formData.benefits.map((benefit, index) => (
            <div key={index} className="array-input-row">
              <input
                type="text"
                value={benefit}
                onChange={(e) => handleArrayField('benefits', e.target.value, index)}
                placeholder={`Benefit ${index + 1}`}
                disabled={loading}
                className="form-input"
              />
              {formData.benefits.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('benefits', index)}
                  className="btn-remove-item"
                  disabled={loading}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleArrayField('benefits', '')}
            className="btn-add-item"
            disabled={loading}
          >
            + Add Benefit
          </button>
        </div>
      </div>
    </div>
  );

  // Render step 4
  const renderStep4 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Application & Settings</h2>
        <p className="section-description">Set application deadline and job settings</p>
      </div>

      <div className="form-card">
        <div className="application-details">
          <h3 className="section-subtitle">📝 Application Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="required">Application Deadline *</label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="contact@company.com"
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Application Instructions</label>
            <textarea
              name="applicationInstructions"
              value={formData.applicationInstructions}
              onChange={handleChange}
              placeholder="Specific instructions for applicants..."
              rows={4}
              disabled={loading}
              className="form-textarea"
            />
          </div>
        </div>

        <div className="job-settings">
          <h3 className="section-subtitle">⚙️ Job Settings</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="required">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-select"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Featured Status</label>
              <div className="checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span className="checkbox-custom"></span>
                  Feature this job
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="part-time, student, remote, customer-service"
              disabled={loading}
              className="form-input"
            />
            <small>Used for search and filtering</small>
          </div>
        </div>

        <div className="validation-status">
          <span className={`status-indicator ${formValid ? 'valid' : 'invalid'}`}>
            {formValid ? '✅ All required fields are filled' : '❌ Please fill all required fields'}
          </span>
        </div>

        {errorMessage && (
          <div className="error-message">
            <span className="error-icon">⚠️</span> {errorMessage}
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="create-job-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Create New Job</h1>
          <p className="subtitle">Fill out the form below to create a new part-time job opportunity</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/admin/career/jobs')}
            className="btn-back"
            disabled={loading}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: calculateProgress() }}
          ></div>
        </div>
        <div className="progress-steps">
          {[1, 2, 3, 4].map(step => (
            <div 
              key={step} 
              className={`progress-step ${currentStep >= step ? 'active' : ''}`}
            >
              <div className="step-circle">{step}</div>
              <div className="step-label">
                {['Basic', 'Details', 'Requirements', 'Settings'][step - 1]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <div className="form-wrapper">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          {renderCurrentStep()}

          {/* Form Actions */}
          <div className="form-actions">
            <div className="action-buttons">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={prevStep}
                  disabled={loading}
                >
                  Previous
                </button>
              )}
              
              {currentStep < 4 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={nextStep}
                  disabled={loading}
                >
                  Next
                </button>
              )}
              
              {currentStep === 4 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading || !formValid}
                  >
                    {loading ? 'Creating...' : 'Create Job'}
                  </button>
                </>
              )}
              
              <button
                type="button"
                onClick={() => navigate('/admin/career/jobs')}
                className="btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Required Fields Note */}
      <div className="required-note">
        <span className="required-marker">*</span> Indicates required field
      </div>
    </div>
  );
};

export default CreateJob;