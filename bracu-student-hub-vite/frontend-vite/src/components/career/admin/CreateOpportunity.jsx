// src/components/career/admin/CreateOpportunity.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../App.css';

const CreateOpportunity = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formValid, setFormValid] = useState(false);
  
  // Department categories with icons
  const departments = [
    { id: 'computer-science', name: 'Computer Science', icon: '💻' },
    { id: 'engineering', name: 'Engineering', icon: '⚙️' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'marketing', name: 'Marketing', icon: '📢' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'design', name: 'Design', icon: '🎨' },
    { id: 'data-science', name: 'Data Science', icon: '📊' },
    { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'research', name: 'Research', icon: '🔬' },
    { id: 'non-profit', name: 'Non-Profit', icon: '🤝' },
    { id: 'government', name: 'Government', icon: '🏛️' },
    { id: 'media', name: 'Media', icon: '🎥' },
    { id: 'art', name: 'Art', icon: '🎭' },
    { id: 'science', name: 'Science', icon: '🧪' },
    { id: 'law', name: 'Law', icon: '⚖️' },
    { id: 'architecture', name: 'Architecture', icon: '🏗️' },
    { id: 'environmental', name: 'Environmental', icon: '🌱' },
    { id: 'hospitality', name: 'Hospitality', icon: '🏨' }
  ];

  // Internship types with descriptions
  const internshipTypes = [
    { id: 'summer', name: 'Summer Internship', desc: 'Typically 8-12 weeks, May-August' },
    { id: 'fall', name: 'Fall Internship', desc: 'September-December semester' },
    { id: 'spring', name: 'Spring Internship', desc: 'January-April semester' },
    { id: 'winter', name: 'Winter Internship', desc: 'December-January break' },
    { id: 'year-round', name: 'Year-Round', desc: 'Flexible schedule throughout the year' },
    { id: 'co-op', name: 'Co-op Program', desc: 'Alternating work and study semesters' },
    { id: 'virtual', name: 'Virtual/Remote', desc: 'Work from anywhere' },
    { id: 'part-time', name: 'Part-Time', desc: '20 hours or less per week' },
    { id: 'full-time', name: 'Full-Time', desc: '40 hours per week' },
    { id: 'project-based', name: 'Project-Based', desc: 'Specific project duration' }
  ];

  // Education levels
  const educationLevels = [
    { id: 'high-school', name: 'High School' },
    { id: 'undergraduate', name: 'Undergraduate' },
    { id: 'graduate', name: 'Graduate' },
    { id: 'phd', name: 'PhD' },
    { id: 'postdoc', name: 'Postdoctoral' },
    { id: 'any', name: 'Any Level' }
  ];

  // Year in school options
  const yearInSchoolOptions = [
    { id: 'freshman', name: 'Freshman' },
    { id: 'sophomore', name: 'Sophomore' },
    { id: 'junior', name: 'Junior' },
    { id: 'senior', name: 'Senior' },
    { id: 'graduate-student', name: 'Graduate Student' },
    { id: 'phd-candidate', name: 'PhD Candidate' }
  ];

  // Location types
  const locationTypes = [
    { id: 'on-site', name: 'On-Site', icon: '🏢' },
    { id: 'remote', name: 'Remote', icon: '🏠' },
    { id: 'hybrid', name: 'Hybrid', icon: '🔄' }
  ];

  // Compensation types
  const compensationTypes = [
    { id: 'paid', name: 'Paid', desc: 'Hourly or salary' },
    { id: 'unpaid', name: 'Unpaid', desc: 'No monetary compensation' },
    { id: 'stipend', name: 'Stipend', desc: 'Fixed amount per period' },
    { id: 'academic-credit', name: 'Academic Credit', desc: 'Course credit offered' },
    { id: 'housing-provided', name: 'Housing Provided', desc: 'Accommodation included' },
    { id: 'transportation', name: 'Transportation', desc: 'Commute assistance' },
    { id: 'meal-allowance', name: 'Meal Allowance', desc: 'Food stipend' }
  ];

  // Currencies
  const currencies = [
    { id: 'USD', symbol: '$', name: 'US Dollar' },
    { id: 'EUR', symbol: '€', name: 'Euro' },
    { id: 'GBP', symbol: '£', name: 'British Pound' },
    { id: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { id: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { id: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ];

  // Benefits options
  const commonBenefits = [
    'Free Lunch', 'Gym Membership', 'Health Insurance', 'Dental Insurance',
    'Vision Insurance', 'Transportation Allowance', 'Housing Stipend',
    'Professional Development', 'Conference Budget', 'Stock Options',
    '401(k) Matching', 'Paid Time Off', 'Flexible Hours', 'Work From Home',
    'Tuition Reimbursement', 'Child Care', 'Pet Friendly', 'Snacks & Drinks',
    'Company Events', 'Mentorship Program', 'Networking Opportunities'
  ];

  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    organization: {
      name: '',
      website: '',
      description: '',
      industry: '',
      logo: '',
      size: 'medium'
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
      address: '',
      timezone: ''
    },
    
    // Duration
    duration: {
      startDate: '',
      endDate: '',
      hoursPerWeek: {
        min: '20',
        max: '40'
      },
      flexibility: 'fixed'
    },
    
    // Compensation
    compensation: {
      type: 'unpaid',
      amount: '',
      currency: 'USD',
      frequency: 'hourly',
      benefits: []
    },
    
    // Requirements
    requirements: {
      educationLevel: 'undergraduate',
      yearInSchool: [],
      minGPA: '',
      skills: [],
      prerequisites: [],
      languages: [],
      certifications: []
    },
    
    majors: [],
    tags: [],
    
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
    
    // Learning & Development
    learningOutcomes: [],
    skillsGained: [],
    mentorship: {
      provided: true,
      type: 'formal',
      details: ''
    },
    
    // Settings
    status: 'active',
    isFeatured: false,
    isEligibleForCredit: false,
    numberOfPositions: '1',
    applicationMethod: 'external-link'
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

  // Add to array
  const addToArray = (field, value, parent = null) => {
    if (value && value.trim()) {
      if (parent) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [field]: [...(prev[parent][field] || []), value.trim()]
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), value.trim()]
        }));
      }
    }
  };

  // Remove from array
  const removeFromArray = (field, index, parent = null) => {
    if (parent) {
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: prev[parent][field].filter((_, i) => i !== index)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  // Toggle checkbox array
  const toggleArrayItem = (field, item, parent = null) => {
    if (parent) {
      setFormData(prev => {
        const currentArray = prev[parent][field] || [];
        const newArray = currentArray.includes(item)
          ? currentArray.filter(i => i !== item)
          : [...currentArray, item];
        
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [field]: newArray
          }
        };
      });
    } else {
      setFormData(prev => {
        const currentArray = prev[field] || [];
        const newArray = currentArray.includes(item)
          ? currentArray.filter(i => i !== item)
          : [...currentArray, item];
        
        return {
          ...prev,
          [field]: newArray
        };
      });
    }
  };

  // Add a benefit
  const addBenefit = () => {
    const benefit = prompt('Enter a benefit (e.g., Free lunch, Gym membership):');
    if (benefit && benefit.trim()) {
      addToArray('benefits', benefit.trim(), 'compensation');
    }
  };

  // Add from common benefits
  const addCommonBenefit = (benefit) => {
    addToArray('benefits', benefit, 'compensation');
  };

  // Quick add skill
  const addSkill = () => {
    const skill = prompt('Enter a required skill:');
    if (skill && skill.trim()) {
      addToArray('skills', skill.trim(), 'requirements');
    }
  };

  // Quick add learning outcome
  const addLearningOutcome = () => {
    const outcome = prompt('Enter a learning outcome:');
    if (outcome && outcome.trim()) {
      addToArray('learningOutcomes', outcome.trim());
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formValid) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }
    
    setLoading(true);
    setSuccess(false);

    try {
      // Prepare data for backend
      const dataToSend = {
        title: formData.title,
        organization: {
          name: formData.organization.name,
          website: formData.organization.website || '',
          industry: formData.organization.industry || '',
          size: formData.organization.size || 'medium'
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
          },
          flexibility: formData.duration.flexibility || 'fixed'
        },
        compensation: {
          type: formData.compensation.type,
          amount: formData.compensation.amount ? parseFloat(formData.compensation.amount) : 0,
          currency: formData.compensation.currency,
          frequency: formData.compensation.frequency || 'hourly',
          benefits: formData.compensation.benefits
        },
        requirements: {
          educationLevel: formData.requirements.educationLevel,
          yearInSchool: formData.requirements.yearInSchool,
          minGPA: formData.requirements.minGPA ? parseFloat(formData.requirements.minGPA) : 0,
          skills: formData.requirements.skills,
          prerequisites: formData.requirements.prerequisites || [],
          languages: formData.requirements.languages || [],
          certifications: formData.requirements.certifications || []
        },
        majors: formData.majors,
        tags: formData.tags,
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
        numberOfPositions: parseInt(formData.numberOfPositions) || 1,
        learningOutcomes: formData.learningOutcomes,
        skillsGained: formData.skillsGained,
        mentorship: formData.mentorship,
        views: 0,
        applicationsCount: 0,
        savesCount: 0
      };

      const response = await axios.post('/api/career/admin/internships', dataToSend, {
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
      console.error('Error creating internship:', error);
      
      let errorMessage = 'Failed to create internship. ';
      
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

  // Calculate progress percentage
  const calculateProgress = () => {
    switch (currentStep) {
      case 1: return '25%';
      case 2: return '50%';
      case 3: return '75%';
      case 4: return '100%';
      default: return '25%';
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

  // Calculate total steps
  const totalSteps = 4;

  // Render step 1: Basic Information
  const renderStep1 = () => (
    <div className="form-section animated-fade-in">
      <div className="form-section-header">
        <div className="section-icon">📝</div>
        <div>
          <h2>Basic Information</h2>
          <p className="section-description">Tell us about the internship position</p>
        </div>
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

        <div className="form-grid">
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

        <div className="form-group">
          <label>Organization Size</label>
          <div className="radio-group">
            {['startup', 'small', 'medium', 'large', 'enterprise'].map(size => (
              <label key={size} className="radio-label">
                <input
                  type="radio"
                  name="organization.size"
                  value={size}
                  checked={formData.organization.size === size}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="radio-custom"></span>
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </label>
            ))}
          </div>
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

  // Render step 2: Details & Requirements
  const renderStep2 = () => (
    <div className="form-section animated-fade-in">
      <div className="form-section-header">
        <div className="section-icon">⚙️</div>
        <div>
          <h2>Details & Requirements</h2>
          <p className="section-description">Specify internship details and candidate requirements</p>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-subtitle">🏢 Internship Type & Category</h3>
        
        <div className="form-group">
          <label className="required">Department/Category *</label>
          <div className="category-grid">
            {departments.map(dept => (
              <label 
                key={dept.id} 
                className={`category-card ${formData.category === dept.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="category"
                  value={dept.id}
                  checked={formData.category === dept.id}
                  onChange={handleChange}
                  disabled={loading}
                  className="hidden-radio"
                />
                <div className="category-icon">{dept.icon}</div>
                <div className="category-name">{dept.name}</div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="required">Internship Program *</label>
          <div className="type-grid">
            {internshipTypes.map(type => (
              <label 
                key={type.id} 
                className={`type-card ${formData.type === type.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="type"
                  value={type.id}
                  checked={formData.type === type.id}
                  onChange={handleChange}
                  disabled={loading}
                  className="hidden-radio"
                />
                <div className="type-content">
                  <div className="type-name">{type.name}</div>
                  <div className="type-desc">{type.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-subtitle">📍 Location</h3>
        
        <div className="form-group">
          <label className="required">Location Type *</label>
          <div className="location-type-grid">
            {locationTypes.map(loc => (
              <label 
                key={loc.id} 
                className={`location-card ${formData.location.type === loc.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="location.type"
                  value={loc.id}
                  checked={formData.location.type === loc.id}
                  onChange={handleChange}
                  disabled={loading}
                  className="hidden-radio"
                />
                <div className="location-icon">{loc.icon}</div>
                <div className="location-name">{loc.name}</div>
              </label>
            ))}
          </div>
        </div>

        {formData.location.type !== 'remote' && (
          <div className="form-grid">
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
            <div className="form-group">
              <label>Address (Optional)</label>
              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleChange}
                placeholder="Full street address"
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="form-card">
        <h3 className="form-subtitle">⏰ Duration & Schedule</h3>
        
        <div className="form-grid">
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
            <div className="range-slider">
              <input
                type="range"
                min="1"
                max="80"
                value={formData.duration.hoursPerWeek.max}
                onChange={(e) => handleChange({target: {name: 'duration.hoursPerWeek.max', value: e.target.value}})}
                disabled={loading}
                className="slider"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Schedule Flexibility</label>
          <div className="radio-group">
            {['fixed', 'flexible', 'part-time-flexible', 'negotiable'].map(flex => (
              <label key={flex} className="radio-label">
                <input
                  type="radio"
                  name="duration.flexibility"
                  value={flex}
                  checked={formData.duration.flexibility === flex}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="radio-custom"></span>
                {flex.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 3: Compensation & Requirements
  const renderStep3 = () => (
    <div className="form-section animated-fade-in">
      <div className="form-section-header">
        <div className="section-icon">💰</div>
        <div>
          <h2>Compensation & Requirements</h2>
          <p className="section-description">Set compensation and candidate requirements</p>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-subtitle">💵 Compensation Package</h3>
        
        <div className="form-group">
          <label className="required">Compensation Type *</label>
          <div className="compensation-grid">
            {compensationTypes.map(comp => (
              <label 
                key={comp.id} 
                className={`compensation-card ${formData.compensation.type === comp.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="compensation.type"
                  value={comp.id}
                  checked={formData.compensation.type === comp.id}
                  onChange={handleChange}
                  disabled={loading}
                  className="hidden-radio"
                />
                <div className="compensation-content">
                  <div className="compensation-name">{comp.name}</div>
                  <div className="compensation-desc">{comp.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {(formData.compensation.type === 'paid' || formData.compensation.type === 'stipend') && (
          <div className="form-grid">
            <div className="form-group">
              <label>Amount</label>
              <div className="amount-input">
                <span className="currency-prefix">{currencies.find(c => c.id === formData.compensation.currency)?.symbol}</span>
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
                  <option key={currency.id} value={currency.id}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Frequency</label>
              <select
                name="compensation.frequency"
                value={formData.compensation.frequency}
                onChange={handleChange}
                disabled={loading}
                className="form-select"
              >
                <option value="hourly">Per Hour</option>
                <option value="weekly">Per Week</option>
                <option value="monthly">Per Month</option>
                <option value="one-time">One-Time Stipend</option>
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
                    onClick={() => removeFromArray('benefits', index, 'compensation')}
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <div className="benefits-actions">
              <button
                type="button"
                onClick={addBenefit}
                className="btn-add-benefit"
                disabled={loading}
              >
                + Add Custom Benefit
              </button>
              
              <div className="common-benefits">
                <span className="common-benefits-label">Quick Add:</span>
                {commonBenefits.slice(0, 6).map(benefit => (
                  <button
                    key={benefit}
                    type="button"
                    onClick={() => addCommonBenefit(benefit)}
                    className="btn-quick-benefit"
                    disabled={loading || formData.compensation.benefits.includes(benefit)}
                  >
                    {benefit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-subtitle">🎓 Candidate Requirements</h3>
        
        <div className="form-grid">
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
                <option key={level.id} value={level.id}>{level.name}</option>
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
            {yearInSchoolOptions.map(year => (
              <label key={year.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requirements.yearInSchool.includes(year.id)}
                  onChange={() => toggleArrayItem('yearInSchool', year.id, 'requirements')}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                {year.name}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Required Skills</label>
          <div className="skills-container">
            <div className="selected-skills">
              {formData.requirements.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                  <button
                    type="button"
                    className="skill-remove"
                    onClick={() => removeFromArray('skills', index, 'requirements')}
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={addSkill}
              className="btn-add-skill"
              disabled={loading}
            >
              + Add Skill
            </button>
          </div>
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
      </div>
    </div>
  );

  // Render step 4: Application & Final
  const renderStep4 = () => (
    <div className="form-section animated-fade-in">
      <div className="form-section-header">
        <div className="section-icon">📋</div>
        <div>
          <h2>Application & Final Review</h2>
          <p className="section-description">Configure application process and final settings</p>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-subtitle">📝 Application Details</h3>
        
        <div className="form-grid">
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

          <div className="form-group">
            <label>Number of Positions</label>
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

        <div className="form-grid">
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
                  onChange={() => toggleArrayItem('documentsRequired', doc, 'applicationDetails')}
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
        <h3 className="form-subtitle">🚀 Learning & Development</h3>
        
        <div className="form-group">
          <label>Learning Outcomes</label>
          <div className="outcomes-container">
            {formData.learningOutcomes.map((outcome, index) => (
              <div key={index} className="outcome-item">
                <span className="outcome-text">{outcome}</span>
                <button
                  type="button"
                  className="outcome-remove"
                  onClick={() => removeFromArray('learningOutcomes', index)}
                  disabled={loading}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLearningOutcome}
              className="btn-add-outcome"
              disabled={loading}
            >
              + Add Learning Outcome
            </button>
          </div>
          <textarea
            value={formData.learningOutcomes.join('\n')}
            onChange={(e) => handleArrayChange('learningOutcomes', e.target.value)}
            placeholder="Gain practical experience\nDevelop professional skills\nLearn new technologies\nWork on real projects"
            rows={3}
            disabled={loading}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>Skills Gained</label>
          <input
            type="text"
            value={formData.skillsGained.join(', ')}
            onChange={(e) => handleArrayChange('skillsGained', e.target.value)}
            placeholder="Teamwork, Problem-solving, Technical skills, Communication"
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label mentorship-checkbox">
            <input
              type="checkbox"
              name="mentorship.provided"
              checked={formData.mentorship.provided}
              onChange={handleChange}
              disabled={loading}
            />
            <span className="checkbox-custom"></span>
            <strong> Mentorship Provided</strong>
          </label>
          
          {formData.mentorship.provided && (
            <div className="mentorship-details">
              <select
                name="mentorship.type"
                value={formData.mentorship.type}
                onChange={handleChange}
                disabled={loading}
                className="form-select"
              >
                <option value="formal">Formal Program</option>
                <option value="informal">Informal Guidance</option>
                <option value="peer">Peer Mentoring</option>
                <option value="executive">Executive Mentorship</option>
              </select>
              
              <textarea
                name="mentorship.details"
                value={formData.mentorship.details}
                onChange={handleChange}
                placeholder="Describe the mentorship program..."
                rows={3}
                disabled={loading}
                className="form-textarea"
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
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

      <div className="form-card">
        <h3 className="form-subtitle">⚙️ Final Settings</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Status</label>
            <div className="status-buttons">
              {['draft', 'active', 'closed'].map(status => (
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
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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

        <div className="form-group">
          <label>Tags (for search optimization)</label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleArrayChange('tags', e.target.value)}
            placeholder="internship, software, engineering, remote, summer (comma-separated)"
            disabled={loading}
            className="form-input"
          />
        </div>
      </div>

      {/* Preview Card */}
      <div className="preview-card">
        <div className="preview-header">
          <h3>👁️ Live Preview</h3>
          <button 
            type="button" 
            className="btn-refresh-preview"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Refresh
          </button>
        </div>
        
        <div className="preview-content">
          <div className="preview-header-section">
            <div className="preview-logo">
              {formData.organization.name.charAt(0).toUpperCase()}
            </div>
            <div className="preview-header-info">
              <h4 className="preview-title">{formData.title || 'Internship Title'}</h4>
              <p className="preview-company">{formData.organization.name || 'Company Name'}</p>
              <div className="preview-tags">
                <span className="preview-tag">
                  {departments.find(d => d.id === formData.category)?.icon || '💼'} 
                  {formData.category.replace('-', ' ').toUpperCase()}
                </span>
                <span className="preview-tag">
                  {internshipTypes.find(t => t.id === formData.type)?.name || 'Internship'}
                </span>
                {formData.isFeatured && <span className="preview-tag featured">⭐ Featured</span>}
              </div>
            </div>
          </div>
          
          <div className="preview-details">
            <div className="preview-detail-item">
              <span className="preview-detail-label">📍</span>
              <span className="preview-detail-value">
                {formData.location.type === 'remote' ? 'Remote' : 
                 formData.location.type === 'hybrid' ? 'Hybrid' : 
                 `${formData.location.city || 'Location'} ${formData.location.country || ''}`.trim()}
              </span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">💰</span>
              <span className="preview-detail-value">
                {formData.compensation.type === 'paid' && formData.compensation.amount 
                  ? `${currencies.find(c => c.id === formData.compensation.currency)?.symbol}${formData.compensation.amount}/${formData.compensation.frequency}` 
                  : formData.compensation.type?.charAt(0).toUpperCase() + formData.compensation.type?.slice(1) || 'Unpaid'}
              </span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">📅</span>
              <span className="preview-detail-value">
                {formData.duration.hoursPerWeek.min}-{formData.duration.hoursPerWeek.max} hrs/week
              </span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">⏰</span>
              <span className="preview-detail-value">
                {formatDate(formData.applicationDetails.deadline) || 'No deadline'}
              </span>
            </div>
          </div>
          
          <div className="preview-description">
            <p>{formData.shortDescription || 'Short description will appear here...'}</p>
          </div>
        </div>
      </div>

      <div className="final-note">
        <div className="note-icon">⚠️</div>
        <div className="note-content">
          <h4>Important Notes</h4>
          <p>Review all information carefully before publishing. Once published, the internship will be immediately visible to students.</p>
          <p>You can always edit or unpublish the internship later from the admin dashboard.</p>
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
    <div className="create-internship-page">
      {/* Professional Header */}
      <div className="admin-create-header">
        <div className="header-top">
          <div className="header-left">
            <button 
              onClick={() => navigate('/admin/career')}
              className="btn-back"
            >
              ← Back
            </button>
            <h1>Create New Internship</h1>
          </div>
          <div className="header-right">
            <div className="admin-badge">ADMIN PANEL</div>
            <div className="header-stats">
              <span className="stat-item">Step {currentStep} of {totalSteps}</span>
              <span className="stat-item">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
          </div>
        </div>
        
        <div className="header-content">
          <p>Fill out the form below to create a new internship opportunity. All fields marked with * are required.</p>
          <div className="header-tips">
            <span className="tip">💡 Save frequently</span>
            <span className="tip">🎯 Be specific and clear</span>
            <span className="tip">📱 Mobile-friendly preview</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="form-progress-container">
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
              className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
              onClick={() => currentStep > step && setCurrentStep(step)}
            >
              <div className="step-circle">
                {currentStep > step ? '✓' : step}
              </div>
              <div className="step-label">
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Details'}
                {step === 3 && 'Compensation'}
                {step === 4 && 'Review'}
              </div>
              <div className="step-line"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="internship-form-container">
        {/* Success Message */}
        {success && (
          <div className="success-overlay">
            <div className="success-card">
              <div className="success-icon">🎉</div>
              <div className="success-content">
                <h3>Internship Created Successfully!</h3>
                <p>Your internship has been published and is now visible to students.</p>
                <div className="success-actions">
                  <button 
                    onClick={() => navigate(`/career/internships`)}
                    className="btn-view-student"
                  >
                    👀 View as Student
                  </button>
                  <button 
                    onClick={() => navigate('/admin/career')}
                    className="btn-go-dashboard"
                  >
                    📊 Go to Dashboard
                  </button>
                </div>
                <p className="redirect-timer">Redirecting in 3 seconds...</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <h3>Creating Internship...</h3>
              <p>Please wait while we save your internship details.</p>
              <div className="loading-progress">
                <div className="progress-bar-indeterminate"></div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="main-form">
          {renderCurrentStep()}

          {/* Form Actions */}
          <div className="form-actions-container">
            <div className="form-navigation">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn-prev"
                  onClick={prevStep}
                  disabled={loading}
                >
                  ← Previous Step
                </button>
              )}
              
              {currentStep < totalSteps && (
                <button
                  type="button"
                  className="btn-next"
                  onClick={nextStep}
                  disabled={loading}
                >
                  Next Step →
                </button>
              )}
              
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  if (window.confirm('Are you sure? Any unsaved changes will be lost.')) {
                    navigate('/admin/career');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            {currentStep === totalSteps && (
              <div className="submit-section">
                <div className="form-validation">
                  <span className={`validation-status ${formValid ? 'valid' : 'invalid'}`}>
                    {formValid ? '✅ All required fields are filled' : '❌ Please fill all required fields'}
                  </span>
                  <span className="validation-count">
                    {Object.values(formData).filter(v => v && typeof v === 'string' && v.trim() !== '').length} fields completed
                  </span>
                </div>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading || !formValid}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Creating Internship...
                    </>
                  ) : (
                    '🎯 Publish Internship'
                  )}
                </button>
                <button
                  type="button"
                  className="btn-save-draft"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, status: 'draft' }));
                    handleSubmit({ preventDefault: () => {} });
                  }}
                  disabled={loading}
                >
                  💾 Save as Draft
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Help Sidebar */}
      <div className="form-help-sidebar">
        <div className="help-header">
          <div className="help-icon">💡</div>
          <div className="help-header-content">
            <h3>Tips & Guidelines</h3>
            <p className="help-subtitle">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>
        
        <div className="help-content">
          <div className="help-tip current-step-tip">
            <h4>Current Step Tips</h4>
            <p>
              {currentStep === 1 && 'Provide clear, engaging information. Use specific titles and detailed descriptions to attract quality candidates.'}
              {currentStep === 2 && 'Be realistic about requirements and competitive with compensation. Consider student schedules and locations.'}
              {currentStep === 3 && 'Highlight unique benefits and learning opportunities. Clear requirements help applicants self-select.'}
              {currentStep === 4 && 'Review everything carefully. Set clear deadlines and provide detailed application instructions.'}
            </p>
          </div>
          
          <div className="help-tip">
            <h4>💎 Best Practices</h4>
            <ul className="best-practices">
              <li>Use specific, keyword-rich titles</li>
              <li>Include clear learning outcomes</li>
              <li>Set realistic deadlines</li>
              <li>Provide detailed responsibilities</li>
              <li>Highlight unique opportunities</li>
            </ul>
          </div>
          
          <div className="help-tip">
            <h4>📊 Statistics</h4>
            <div className="stats-grid-small">
              <div className="stat-item-small">
                <div className="stat-value">85%</div>
                <div className="stat-label">Completion Rate</div>
              </div>
              <div className="stat-item-small">
                <div className="stat-value">3 min</div>
                <div className="stat-label">Avg. Time</div>
              </div>
              <div className="stat-item-small">
                <div className="stat-value">95%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
          </div>

          <div className="help-tip">
            <h4>❓ Need Help?</h4>
            <p>Contact the career center at <strong>career@university.edu</strong> or call <strong>(555) 123-4567</strong> for assistance.</p>
            <button className="btn-help-support">📞 Get Support</button>
          </div>
          
          <div className="help-tip quick-links">
            <h4>🔗 Quick Links</h4>
            <button onClick={() => navigate('/admin/career')} className="quick-link">📋 View All Internships</button>
            <button onClick={() => window.open('/career/internships', '_blank')} className="quick-link">👀 Student View</button>
            <button onClick={() => navigate('/admin/career/analytics')} className="quick-link">📈 Analytics</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOpportunity;