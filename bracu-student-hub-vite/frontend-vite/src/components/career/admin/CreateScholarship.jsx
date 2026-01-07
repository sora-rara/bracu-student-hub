// src/components/career/admin/CreateScholarship.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const CreateScholarship = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formValid, setFormValid] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [apiBasePath, setApiBasePath] = useState('/api/scholarships');

  // Match your Mongoose schema
  const categories = [
    'academic-merit',
    'need-based',
    'athletic',
    'minority',
    'women',
    'international',
    'graduate',
    'undergraduate',
    'research',
    'creative-arts',
    'stem',
    'humanities',
    'social-sciences',
    'business',
    'engineering',
    'medical',
    'law',
    'community-service',
    'leadership',
    'other'
  ];

  const scholarshipTypes = [
    'full-tuition',
    'partial-tuition',
    'room-board',
    'book-stipend',
    'travel-grant',
    'research-grant',
    'fellowship',
    'bursary',
    'award',
    'prize'
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' }
  ];

  const statusOptions = ['draft', 'active', 'closed', 'archived'];

  // Initialize form data that matches backend structure
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    organization: {
      name: '',
      website: '',
      industry: '',
      size: 'medium'
    },
    description: '',
    shortDescription: '',
    
    // Categorization
    category: 'academic-merit',
    type: 'full-tuition',
    
    // Award Details
    awardAmount: 1000,
    currency: 'USD',
    isRenewable: false,
    renewalConditions: '',
    numberOfAwards: 1,
    
    // Eligibility Criteria
    eligibility: {
      educationLevel: ['undergraduate'],
      nationality: ['any'],
      residencyStatus: ['any']
    },
    
    // Application Details
    applicationDetails: {
      deadline: '',
      applicationLink: '',
      contactEmail: '',
      contactPhone: '',
      documentsRequired: [],
      essayTopics: [],
      recommendationLetters: 0,
      interviewRequired: false,
      instructions: '',
      selectionProcess: ''
    },
    
    // Status & Settings
    status: 'draft',
    isFeatured: false,
    
    // Meta Information
    tags: []
  });

  // Check form validation
  useEffect(() => {
    const isValid = 
      formData.title.trim() !== '' &&
      formData.organization.name.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.shortDescription.trim() !== '' &&
      formData.category !== '' &&
      formData.type !== '' &&
      !isNaN(formData.awardAmount) &&
      formData.awardAmount !== '' &&
      formData.currency !== '' &&
      formData.applicationDetails.deadline !== '' &&
      formData.applicationDetails.applicationLink.trim() !== '';
    
    setFormValid(isValid);
  }, [formData]);

  // Handle nested field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle number inputs
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value === '' ? 0 : Number(value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    }
  };

  // Handle array fields - FIXED VERSION
  const handleArrayChange = (fieldName, value) => {
    const arrayValues = value.split(',').map(v => v.trim()).filter(v => v);
    
    if (fieldName === 'tags') {
      setFormData(prev => ({
        ...prev,
        [fieldName]: arrayValues
      }));
    } else if (fieldName.startsWith('applicationDetails.')) {
      const subField = fieldName.replace('applicationDetails.', '');
      setFormData(prev => ({
        ...prev,
        applicationDetails: {
          ...prev.applicationDetails,
          [subField]: arrayValues
        }
      }));
    }
  };

  // Test API endpoint
  const testApiEndpoint = async () => {
    try {
      setLoading(true);
      setDebugInfo('Testing API endpoint...');
      
      // Test GET endpoint first to see what's available
	  const testPaths = [
		  '/api/career/admin/scholarships/test',  // Test admin endpoint
		  '/api/career/admin/scholarships',  // Test GET admin endpoint
		  '/api/scholarships',
		  '/api/scholarships/test/api'
	  ];  
	  let availablePath = null;
      
      for (const path of testPaths) {
        try {
          console.log(`Testing GET: ${path}`);
          const response = await axios.get(path, { withCredentials: true });
          console.log(`✅ GET ${path}:`, response.status);
          
          if (response.data.success) {
            availablePath = path.replace('/test/api', '').replace('/test-working', '');
            setApiBasePath(availablePath);
            setDebugInfo(`✅ API available at: ${availablePath}`);
            break;
          }
        } catch (error) {
          console.log(`❌ GET ${path}:`, error.response?.status || error.message);
        }
      }
      
      if (!availablePath) {
        setDebugInfo('❌ Could not find API endpoint');
      }
      
    } catch (error) {
      console.error('Test error:', error);
      setDebugInfo(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Main submission
  const handleSubmit = async (e, saveAsDraft = false) => {
    e.preventDefault();
    
    if (!formValid && !saveAsDraft) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }
    
    setLoading(true);
    setDebugInfo('Submitting...');

    try {
      // Prepare data EXACTLY as backend expects
		const submissionData = {
		  title: formData.title.trim(),
		  organization: {
			name: formData.organization.name.trim(),
			website: formData.organization.website.trim() || '',
			industry: formData.organization.industry.trim() || '',
			size: formData.organization.size || 'medium'
		  },
		  description: formData.description.trim(),
		  shortDescription: formData.shortDescription.trim(),
		  category: formData.category,
		  type: formData.type,
		  awardAmount: Number(formData.awardAmount),
		  currency: formData.currency,
		  isRenewable: formData.isRenewable,
		  renewalConditions: formData.renewalConditions.trim(),
		  numberOfAwards: Number(formData.numberOfAwards),
		  eligibility: formData.eligibility,
		  applicationDetails: {
			deadline: formData.applicationDetails.deadline,
			applicationLink: formData.applicationDetails.applicationLink.trim(),
			contactEmail: formData.applicationDetails.contactEmail.trim() || '',
			contactPhone: formData.applicationDetails.contactPhone.trim() || '',
			documentsRequired: formData.applicationDetails.documentsRequired || [],
			essayTopics: formData.applicationDetails.essayTopics || [],
			recommendationLetters: Number(formData.applicationDetails.recommendationLetters) || 0,
			interviewRequired: formData.applicationDetails.interviewRequired,
			instructions: formData.applicationDetails.instructions.trim() || '',
			selectionProcess: formData.applicationDetails.selectionProcess.trim() || ''
		  },
		  status: saveAsDraft ? 'draft' : formData.status,
		  isFeatured: formData.isFeatured,
		  tags: Array.isArray(formData.tags) ? formData.tags : []
		};

      console.log('🔍 Submission data:', JSON.stringify(submissionData, null, 2));

      // Try different API paths
	  const apiPaths = [
		  '/api/career/admin/scholarships',  
		  '/api/career/admin/scholarships/create',
		  '/api/scholarships/admin/create', 
		  '/api/admin/scholarships/create'
	  ];
      let response = null;
      let successfulPath = null;
      
      for (const path of apiPaths) {
        try {
          console.log(`🔄 Trying POST: ${path}`);
          response = await axios.post(path, submissionData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`✅ POST ${path}:`, response.data);
          successfulPath = path;
          setApiBasePath(path.replace('/admin/create', ''));
          break;
        } catch (error) {
          console.log(`❌ POST ${path}:`, error.response?.status || error.message);
          if (error.response?.status === 404) {
            continue; // Try next path
          }
          throw error; // Throw other errors
        }
      }

      if (!response) {
        throw new Error('All API paths failed. Please check backend routes.');
      }

      console.log('🎉 Response:', response.data);

      if (response.data.success) {
        const message = saveAsDraft 
          ? 'Scholarship saved as draft successfully!' 
          : 'Scholarship created successfully!';
        alert(message);
        navigate('/admin/career/scholarships');
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('❌ Submission error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to create scholarship. ';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        setTimeout(() => navigate('/login'), 1000);
      } else if (error.response?.status === 403) {
        errorMessage = 'Admin access required!';
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check backend routes.';
      } else if (error.response?.status === 400) {
        if (error.response.data.details) {
          errorMessage = `Validation errors: ${error.response.data.details.join(', ')}`;
        } else if (error.response.data.error) {
          errorMessage = `Error: ${error.response.data.error}`;
        }
      } else if (error.message.includes('All API paths failed')) {
        errorMessage = error.message;
      }
      
      setDebugInfo(`❌ Error: ${errorMessage}`);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Navigation
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

  const formatCategory = (category) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
        <p className="section-description">Enter scholarship details</p>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="required">Scholarship Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter scholarship title"
            required
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="required">Organization Name *</label>
          <input
            type="text"
            name="organization.name"
            value={formData.organization.name}
            onChange={handleChange}
            placeholder="Organization name"
            required
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Organization Website</label>
          <input
            type="url"
            name="organization.website"
            value={formData.organization.website}
            onChange={handleChange}
            placeholder="https://example.com"
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
            placeholder="Education, Technology, Healthcare, etc."
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="required">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of the scholarship..."
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
            placeholder="Brief summary (max 250 characters)"
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

  // Render step 2 - FIXED VERSION
  const renderStep2 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Scholarship Details</h2>
        <p className="section-description">Set award amount and category</p>
      </div>

      <div className="form-card">
        <div className="form-row">
          <div className="form-group">
            <label className="required">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{formatCategory(cat)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="required">Scholarship Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-select"
            >
              {scholarshipTypes.map(type => (
                <option key={type} value={type}>{formatType(type)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="required">Award Amount *</label>
            <div className="amount-input">
              <span className="currency-prefix">
                {currencies.find(c => c.code === formData.currency)?.symbol}
              </span>
              <input
                type="number"
                name="awardAmount"
                value={formData.awardAmount}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                placeholder="1000.00"
                required
                disabled={loading}
                className="form-input"
              />
            </div>
            <small className="form-hint">Must be a number (e.g., 1000, 5000.50)</small>
          </div>

          <div className="form-group">
            <label className="required">Currency *</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
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

        <div className="form-row">
          <div className="form-group">
            <label className="required">Number of Awards *</label>
            <input
              type="number"
              name="numberOfAwards"
              value={formData.numberOfAwards}
              onChange={handleNumberChange}
              min="1"
              placeholder="1"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Renewable</label>
            <div className="checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isRenewable"
                  checked={formData.isRenewable}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                This scholarship is renewable
              </label>
            </div>
          </div>
        </div>

        {formData.isRenewable && (
          <div className="form-group">
            <label>Renewal Conditions</label>
            <textarea
              name="renewalConditions"
              value={formData.renewalConditions}
              onChange={handleChange}
              placeholder="Conditions for scholarship renewal..."
              rows={3}
              disabled={loading}
              className="form-textarea"
            />
          </div>
        )}

        <div className="form-group">
          <label>Tags (comma separated)</label>
          <input
            type="text"
            value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
            onChange={(e) => handleArrayChange('tags', e.target.value)}
            placeholder="scholarship, education, grant, etc."
            disabled={loading}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );

  // Render step 3 - FIXED VERSION
  const renderStep3 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Application Details</h2>
        <p className="section-description">Set application requirements</p>
      </div>

      <div className="form-card">
        <div className="form-row">
          <div className="form-group">
            <label className="required">Application Deadline *</label>
            <input
              type="datetime-local"
              name="applicationDetails.deadline"
              value={formData.applicationDetails.deadline}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="required">Application Link *</label>
            <input
              type="url"
              name="applicationDetails.applicationLink"
              value={formData.applicationDetails.applicationLink}
              onChange={handleChange}
              placeholder="https://example.com/apply"
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
              name="applicationDetails.contactEmail"
              value={formData.applicationDetails.contactEmail}
              onChange={handleChange}
              placeholder="contact@example.com"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Contact Phone</label>
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

        <div className="form-row">
          <div className="form-group">
            <label>Documents Required</label>
            <input
              type="text"
              value={Array.isArray(formData.applicationDetails.documentsRequired) 
                ? formData.applicationDetails.documentsRequired.join(', ') 
                : ''}
              onChange={(e) => handleArrayChange('applicationDetails.documentsRequired', e.target.value)}
              placeholder="transcript, resume, essay, etc."
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Essay Topics</label>
            <input
              type="text"
              value={Array.isArray(formData.applicationDetails.essayTopics) 
                ? formData.applicationDetails.essayTopics.join(', ') 
                : ''}
              onChange={(e) => handleArrayChange('applicationDetails.essayTopics', e.target.value)}
              placeholder="career goals, financial need, etc."
              disabled={loading}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Recommendation Letters Required</label>
            <input
              type="number"
              name="applicationDetails.recommendationLetters"
              value={formData.applicationDetails.recommendationLetters}
              onChange={handleNumberChange}
              min="0"
              max="5"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Interview Required</label>
            <div className="checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="applicationDetails.interviewRequired"
                  checked={formData.applicationDetails.interviewRequired}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                Interview is required for this scholarship
              </label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Application Instructions</label>
          <textarea
            name="applicationDetails.instructions"
            value={formData.applicationDetails.instructions}
            onChange={handleChange}
            placeholder="Detailed instructions for applicants..."
            rows={4}
            disabled={loading}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>Selection Process Description</label>
          <textarea
            name="applicationDetails.selectionProcess"
            value={formData.applicationDetails.selectionProcess}
            onChange={handleChange}
            placeholder="How candidates will be selected..."
            rows={4}
            disabled={loading}
            className="form-textarea"
          />
        </div>
      </div>
    </div>
  );

  // Render step 4
  const renderStep4 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Review & Submit</h2>
        <p className="section-description">Review all information before submitting</p>
      </div>

      <div className="form-card">
        <div className="review-section">
          <h3>Basic Information</h3>
          <div className="review-row">
            <span className="review-label">Title:</span>
            <span className="review-value">{formData.title || 'Not set'}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Organization:</span>
            <span className="review-value">{formData.organization.name || 'Not set'}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Category:</span>
            <span className="review-value">{formatCategory(formData.category)}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Type:</span>
            <span className="review-value">{formatType(formData.type)}</span>
          </div>
        </div>

        <div className="review-section">
          <h3>Award Details</h3>
          <div className="review-row">
            <span className="review-label">Amount:</span>
            <span className="review-value">
              {currencies.find(c => c.code === formData.currency)?.symbol}{formData.awardAmount} {formData.currency}
            </span>
          </div>
          <div className="review-row">
            <span className="review-label">Number of Awards:</span>
            <span className="review-value">{formData.numberOfAwards}</span>
          </div>
          <div className="review-row">
            <span className="review-label">Renewable:</span>
            <span className="review-value">{formData.isRenewable ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="review-section">
          <h3>Application Details</h3>
          <div className="review-row">
            <span className="review-label">Deadline:</span>
            <span className="review-value">
              {formData.applicationDetails.deadline 
                ? new Date(formData.applicationDetails.deadline).toLocaleString() 
                : 'Not set'}
            </span>
          </div>
          <div className="review-row">
            <span className="review-label">Application Link:</span>
            <span className="review-value">
              {formData.applicationDetails.applicationLink || 'Not set'}
            </span>
          </div>
          <div className="review-row">
            <span className="review-label">Recommendation Letters:</span>
            <span className="review-value">{formData.applicationDetails.recommendationLetters}</span>
          </div>
        </div>

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
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
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
                Feature this scholarship
              </label>
            </div>
          </div>
        </div>

        <div className="validation-status">
          <span className={`status-indicator ${formValid ? 'valid' : 'invalid'}`}>
            {formValid ? '✅ All required fields are filled' : '❌ Please fill all required fields'}
          </span>
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
    <div className="create-scholarship-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Create New Scholarship</h1>
          <p className="subtitle">Fill out the form below to create a new scholarship opportunity</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/admin/career/scholarships')}
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
                {['Basic', 'Details', 'Application', 'Review'][step - 1]}
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
                    {loading ? 'Creating...' : 'Create Scholarship'}
                  </button>
                </>
              )}
              
              <button
                type="button"
                onClick={() => navigate('/admin/career/scholarships')}
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

export default CreateScholarship;