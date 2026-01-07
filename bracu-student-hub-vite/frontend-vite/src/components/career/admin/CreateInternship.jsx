// src/components/career/admin/CreateInternship.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../App.css';

const CreateInternship = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formValid, setFormValid] = useState(false);

  // Updated categories to match schema
  const departments = [
    'Computer Science',
    'Engineering',
    'Business',
    'Marketing',
    'Finance',
    'Healthcare',
    'Design',
    'Data Science',
    'Cybersecurity',
    'Education',
    'Research',
    'Non-Profit',
    'Government',
    'Media',
    'Art',
    'Science',
    'Law',
    'Architecture',
    'Environmental',
    'Hospitality',
    'Other'
  ];

  // Updated types to match schema
  const internshipTypes = [
    'Summer',
    'Fall', 
    'Spring',
    'Winter',
    'Year-Round',
    'Co-op Program',
    'Virtual/Remote',
    'Part-Time',
    'Full-Time',
    'Project-Based'
  ];

  const educationLevels = [
    'Undergraduate',
    'Graduate',
    'PhD',
    'Any Level'
  ];

  const yearInSchool = [
    'Freshman',
    'Sophomore', 
    'Junior',
    'Senior',
    'Graduate Student',
    'PhD Candidate'
  ];

  const locationTypes = [
    'On-Site',
    'Remote',
    'Hybrid'
  ];

  const compensationTypes = [
    'Paid',
    'Unpaid',
    'Stipend',
    'Academic Credit',
    'Housing Provided'
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' }
  ];

  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    organization: {
      name: '',
      website: '',
      industry: '',
      size: 'Medium'
    },
    description: '',
    shortDescription: '',
    
    // Internship Details
    category: 'Computer Science',
    type: 'Summer',
    
    // Location
    location: {
      type: 'On-Site',
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
      type: 'Unpaid',
      amount: '',
      currency: 'USD',
      benefits: []
    },
    
    // Requirements
    requirements: {
      educationLevel: 'Undergraduate',
      yearInSchool: [],
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
      contactPhone: '',
      documentsRequired: [],
      instructions: '',
      interviewProcess: ''
    },
    
    // Settings
    status: 'Active',
    isFeatured: false,
    isEligibleForCredit: false,
    numberOfPositions: '1'
  });

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

  // Handle array fields
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

  // Toggle year in school
  const toggleYearInSchool = (year) => {
    setFormData(prev => {
      const currentYears = prev.requirements.yearInSchool;
      const newYears = currentYears.includes(year)
        ? currentYears.filter(y => y !== year)
        : [...currentYears, year];
      
      return {
        ...prev,
        requirements: {
          ...prev.requirements,
          yearInSchool: newYears
        }
      };
    });
  };

  // Toggle document required
  const toggleDocument = (doc) => {
    setFormData(prev => {
      const currentDocs = prev.applicationDetails.documentsRequired;
      const newDocs = currentDocs.includes(doc)
        ? currentDocs.filter(d => d !== doc)
        : [...currentDocs, doc];
      
      return {
        ...prev,
        applicationDetails: {
          ...prev.applicationDetails,
          documentsRequired: newDocs
        }
      };
    });
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formValid) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }
    
    setLoading(true);

    try {
      // Prepare data for backend - values will be normalized by backend
      const dataToSend = {
        title: formData.title,
        organization: {
          name: formData.organization.name,
          website: formData.organization.website || '',
          industry: formData.organization.industry || '',
          size: formData.organization.size || 'Medium'
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
          contactPhone: formData.applicationDetails.contactPhone || '',
          documentsRequired: formData.applicationDetails.documentsRequired,
          instructions: formData.applicationDetails.instructions || '',
          interviewProcess: formData.applicationDetails.interviewProcess || ''
        },
        status: formData.status,
        isFeatured: formData.isFeatured,
        isEligibleForCredit: formData.isEligibleForCredit || false,
        numberOfPositions: parseInt(formData.numberOfPositions) || 1
      };

      console.log('Sending data:', dataToSend);

      const response = await axios.post('http://localhost:5000/api/career/admin/internships', dataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      alert('Internship created successfully!');
      navigate('/admin/career');

    } catch (error) {
      console.error('Error creating internship:', error);
      
      let errorMessage = 'Failed to create internship. ';
      
      if (error.response) {
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
      setLoading(false);
    }
  };

  // Navigation between steps
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
    switch (currentStep) {
      case 1: return '25%';
      case 2: return '50%';
      case 3: return '75%';
      case 4: return '100%';
      default: return '25%';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render step 1
  const renderStep1 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Basic Information</h2>
        <p className="section-description">Tell us about the internship position</p>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="required">Internship Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Software Engineering Intern"
            required
            disabled={loading}
            className="form-input"
          />
          <span className="form-hint">Be specific and descriptive to attract the right candidates</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="required">Organization Name *</label>
            <input
              type="text"
              name="organization.name"
              value={formData.organization.name}
              onChange={handleChange}
              placeholder="e.g., Google, Microsoft, Amazon"
              required
              disabled={loading}
              className="form-input"
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
              disabled={loading}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Organization Website</label>
          <input
            type="url"
            name="organization.website"
            value={formData.organization.website}
            onChange={handleChange}
            placeholder="https://company.com"
            disabled={loading}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="required">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the internship role, responsibilities, projects, and what the intern will learn..."
            rows={6}
            required
            disabled={loading}
            className="form-textarea"
          />
          <div className="char-count">
            <span className={formData.description.length > 2500 ? 'warning' : ''}>
              {formData.description.length}/3000 characters
            </span>
            <span className="char-hint">Minimum 200 characters recommended</span>
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
            disabled={loading}
            className="form-textarea"
          />
          <div className={`char-count ${formData.shortDescription.length > 200 ? 'warning' : ''}`}>
            {formData.shortDescription.length}/250 characters
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 2
  const renderStep2 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Details & Requirements</h2>
        <p className="section-description">Specify internship details and candidate requirements</p>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">Internship Type & Category</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label className="required">Department/Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-select"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="required">Internship Program *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-select"
            >
              {internshipTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="required">Location Type *</label>
          <div className="radio-group">
            {locationTypes.map(loc => (
              <label key={loc} className="radio-label">
                <input
                  type="radio"
                  name="location.type"
                  value={loc}
                  checked={formData.location.type === loc}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="radio-custom"></span>
                {loc}
              </label>
            ))}
          </div>
        </div>

        {formData.location.type !== 'Remote' && (
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                placeholder="e.g., San Francisco"
                disabled={loading}
                className="form-input"
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
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">Duration & Schedule</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="duration.startDate"
              value={formData.duration.startDate}
              onChange={handleChange}
              disabled={loading}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="duration.endDate"
              value={formData.duration.endDate}
              onChange={handleChange}
              disabled={loading}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Hours Per Week</label>
          <div className="range-container">
            <div className="range-inputs">
              <input
                type="number"
                name="duration.hoursPerWeek.min"
                value={formData.duration.hoursPerWeek.min}
                onChange={handleChange}
                min="1"
                max="80"
                placeholder="Min"
                disabled={loading}
                className="range-input"
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                name="duration.hoursPerWeek.max"
                value={formData.duration.hoursPerWeek.max}
                onChange={handleChange}
                min="1"
                max="80"
                placeholder="Max"
                disabled={loading}
                className="range-input"
              />
              <span className="range-unit">hours/week</span>
            </div>
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">Candidate Requirements</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Education Level</label>
            <select
              name="requirements.educationLevel"
              value={formData.requirements.educationLevel}
              onChange={handleChange}
              disabled={loading}
              className="form-select"
            >
              {educationLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Minimum GPA</label>
            <div className="gpa-input">
              <input
                type="number"
                name="requirements.minGPA"
                value={formData.requirements.minGPA}
                onChange={handleChange}
                min="0"
                max="4.0"
                step="0.1"
                placeholder="3.0"
                disabled={loading}
                className="form-input"
              />
              <span className="gpa-max">/ 4.0</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Year in School</label>
          <div className="checkbox-grid">
            {yearInSchool.map(year => (
              <label key={year} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requirements.yearInSchool.includes(year)}
                  onChange={() => toggleYearInSchool(year)}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                {year}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Required Skills</label>
          <input
            type="text"
            value={formData.requirements.skills.join(', ')}
            onChange={(e) => handleArrayChange('skills', e.target.value, 'requirements')}
            placeholder="JavaScript, React, Communication, Teamwork (comma-separated)"
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Targeted Majors</label>
          <input
            type="text"
            value={formData.majors.join(', ')}
            onChange={(e) => handleArrayChange('majors', e.target.value)}
            placeholder="Computer Science, Engineering, Business Administration (comma-separated)"
            disabled={loading}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );

  // Render step 3
  const renderStep3 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Compensation & Benefits</h2>
        <p className="section-description">Set compensation package and benefits</p>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">Compensation Package</h3>
        
        <div className="form-group">
          <label className="required">Compensation Type *</label>
          <select
            name="compensation.type"
            value={formData.compensation.type}
            onChange={handleChange}
            required
            disabled={loading}
            className="form-select"
          >
            {compensationTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {(formData.compensation.type === 'Paid' || formData.compensation.type === 'Stipend') && (
          <div className="form-row">
            <div className="form-group">
              <label>Amount</label>
              <div className="amount-input">
                <span className="currency-prefix">
                  {currencies.find(c => c.code === formData.compensation.currency)?.symbol}
                </span>
                <input
                  type="number"
                  name="compensation.amount"
                  value={formData.compensation.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                name="compensation.currency"
                value={formData.compensation.currency}
                onChange={handleChange}
                disabled={loading}
                className="form-select"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Benefits & Perks</label>
          <div className="benefits-container">
            <div className="selected-benefits">
              {formData.compensation.benefits.map((benefit, index) => (
                <span key={index} className="benefit-tag">
                  {benefit}
                  <button
                    type="button"
                    className="benefit-remove"
                    onClick={() => removeBenefit(index)}
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addBenefit}
              className="btn-add-benefit"
              disabled={loading}
            >
              + Add Benefit
            </button>
          </div>
          <span className="form-hint">Common benefits: Free lunch, Gym membership, Health insurance, Transportation allowance</span>
        </div>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">Position Details</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Number of Positions Available</label>
            <input
              type="number"
              name="numberOfPositions"
              value={formData.numberOfPositions}
              onChange={handleChange}
              min="1"
              placeholder="1"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isEligibleForCredit"
                checked={formData.isEligibleForCredit}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="checkbox-custom"></span>
              Eligible for Academic Credit
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 4
  const renderStep4 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Application & Final Review</h2>
        <p className="section-description">Configure application process and final settings</p>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">Application Details</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label className="required">Application Deadline *</label>
            <div className="date-input-container">
              <input
                type="date"
                name="applicationDetails.deadline"
                value={formData.applicationDetails.deadline}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              />
              <div className="date-preview">
                <span className="date-label">Deadline:</span>
                <span className="date-value">{formatDate(formData.applicationDetails.deadline)}</span>
              </div>
            </div>
          </div>
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
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Contact Email</label>
            <input
              type="email"
              name="applicationDetails.contactEmail"
              value={formData.applicationDetails.contactEmail}
              onChange={handleChange}
              placeholder="internships@company.com"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Contact Phone (Optional)</label>
            <input
              type="tel"
              name="applicationDetails.contactPhone"
              value={formData.applicationDetails.contactPhone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              disabled={loading}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Required Documents</label>
          <div className="checkbox-grid">
            {['Resume', 'Cover Letter', 'Transcript', 'Portfolio', 'Letters of Recommendation', 'Writing Sample'].map(doc => (
              <label key={doc} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.applicationDetails.documentsRequired.includes(doc)}
                  onChange={() => toggleDocument(doc)}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                {doc}
              </label>
            ))}
          </div>
          <input
            type="text"
            value={formData.applicationDetails.documentsRequired.join(', ')}
            onChange={(e) => handleArrayChange('documentsRequired', e.target.value, 'applicationDetails')}
            placeholder="Other documents (comma-separated)"
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Application Instructions</label>
          <textarea
            name="applicationDetails.instructions"
            value={formData.applicationDetails.instructions}
            onChange={handleChange}
            placeholder="Specific instructions for applicants..."
            rows={4}
            disabled={loading}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>Interview Process</label>
          <textarea
            name="applicationDetails.interviewProcess"
            value={formData.applicationDetails.interviewProcess}
            onChange={handleChange}
            placeholder="Describe the interview process..."
            rows={3}
            disabled={loading}
            className="form-textarea"
          />
        </div>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">Final Settings</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <div className="status-buttons">
              {['Draft', 'Active', 'Closed'].map(status => (
                <label key={status} className={`status-btn ${formData.status === status ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={handleChange}
                    disabled={loading}
                    className="hidden-radio"
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Featured</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">
                {formData.isFeatured ? 'Featured' : 'Not Featured'}
              </span>
            </label>
            <span className="form-hint">Featured internships appear at the top of listings</span>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="preview-card">
        <div className="preview-header">
          <h3>Live Preview</h3>
        </div>
        
        <div className="preview-content">
          <div className="preview-header-section">
            <div className="preview-logo">
              {formData.organization.name.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="preview-header-info">
              <h4 className="preview-title">{formData.title || 'Internship Title'}</h4>
              <p className="preview-company">{formData.organization.name || 'Company Name'}</p>
              <div className="preview-tags">
                <span className="preview-tag">{formData.category}</span>
                <span className="preview-tag">{formData.type}</span>
                {formData.isFeatured && <span className="preview-tag featured">Featured</span>}
              </div>
            </div>
          </div>
          
          <div className="preview-details">
            <div className="preview-detail-item">
              <span className="preview-detail-label">Location:</span>
              <span className="preview-detail-value">
                {formData.location.type === 'Remote' ? 'Remote' : 
                 formData.location.type === 'Hybrid' ? 'Hybrid' : 
                 `${formData.location.city || 'Location'} ${formData.location.country || ''}`.trim()}
              </span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">Compensation:</span>
              <span className="preview-detail-value">
                {formData.compensation.type === 'Paid' && formData.compensation.amount 
                  ? `${currencies.find(c => c.code === formData.compensation.currency)?.symbol}${formData.compensation.amount}` 
                  : formData.compensation.type}
              </span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">Hours:</span>
              <span className="preview-detail-value">
                {formData.duration.hoursPerWeek.min}-{formData.duration.hoursPerWeek.max} hrs/week
              </span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">Deadline:</span>
              <span className="preview-detail-value">
                {formatDate(formData.applicationDetails.deadline) || 'Not set'}
              </span>
            </div>
          </div>
          
          <div className="preview-description">
            <p>{formData.shortDescription || 'Short description will appear here...'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current step
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
    <div className="create-internship-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Create New Internship</h1>
          <p className="subtitle">Fill out the form below to create a new internship opportunity</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/admin/career')}
            className="btn-back"
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
              <div className="step-circle">
                {step}
              </div>
              <div className="step-label">
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Details'}
                {step === 3 && 'Compensation'}
                {step === 4 && 'Review'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <div className="form-wrapper">
        <form onSubmit={handleSubmit}>
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
              
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate('/admin/career')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            {currentStep === 4 && (
              <div className="submit-section">
                <div className="validation-status">
                  <span className={`status-indicator ${formValid ? 'valid' : 'invalid'}`}>
                    {formValid ? '✓ All required fields are filled' : '✗ Please fill all required fields'}
                  </span>
                </div>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading || !formValid}
                >
                  {loading ? 'Creating...' : 'Publish Internship'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, status: 'Draft' }));
                    handleSubmit({ preventDefault: () => {} });
                  }}
                  disabled={loading}
                >
                  Save as Draft
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInternship;