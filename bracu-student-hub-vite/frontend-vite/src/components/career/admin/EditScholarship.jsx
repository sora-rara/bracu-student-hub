// src/components/career/admin/EditScholarship.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const EditScholarship = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formValid, setFormValid] = useState(false);

  // Scholarship categories
  const categories = [
    'Academic Excellence',
    'Merit-Based',
    'Need-Based',
    'Sports',
    'Arts & Culture',
    'Research',
    'STEM',
    'Business',
    'Medical',
    'Law',
    'Engineering',
    'Computer Science',
    'International',
    'Minority',
    'Women in STEM',
    'Leadership',
    'Community Service',
    'Entrepreneurship',
    'Graduate',
    'PhD',
    'Postdoctoral',
    'Study Abroad',
    'Summer Program',
    'Other'
  ];

  // Scholarship types
  const scholarshipTypes = [
    'Full Tuition',
    'Partial',
    'Stipend',
    'Research Grant',
    'Travel Grant',
    'Conference Grant',
    'Book Allowance',
    'Housing Grant',
    'Meal Plan',
    'Fellowship',
    'Bursary',
    'Award'
  ];

  // Education levels
  const educationLevels = [
    'High School',
    'Undergraduate',
    'Graduate',
    'Master\'s',
    'PhD',
    'Postdoctoral',
    'Professional',
    'All Levels'
  ];

  // Currencies
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' }
  ];

  // Coverage options
  const coverageOptions = [
    'tuition',
    'fees',
    'housing',
    'meals',
    'books',
    'travel',
    'health-insurance',
    'stipend',
    'research-materials',
    'conference-travel'
  ];

  const [formData, setFormData] = useState({
    title: '',
    organization: {
      name: '',
      website: '',
      description: '',
      industry: ''
    },
    description: '',
    shortDescription: '',
    category: 'Academic Excellence',
    type: 'Full Tuition',
    level: 'Undergraduate',
    funding: {
      type: 'Full Tuition',
      amount: '',
      currency: 'USD',
      coverage: ['tuition', 'fees'],
      renewable: false,
      renewalConditions: '',
      disbursement: 'Annual',
      duration: '1 year'
    },
    eligibility: {
      academicLevel: 'Undergraduate',
      minGPA: '',
      fieldOfStudy: [],
      nationality: 'Any Nationality',
      countries: [],
      institution: '',
      ageLimit: '',
      additionalRequirements: []
    },
    applicationDetails: {
      deadline: '',
      applicationLink: '',
      contactEmail: '',
      contactPhone: '',
      documentsRequired: ['Transcript', 'Recommendation Letters', 'Personal Statement'],
      instructions: '',
      interviewRequired: false,
      interviewProcess: ''
    },
    applicationProcess: [
      { title: 'Submit Online Application', description: 'Complete the online application form', deadline: '' },
      { title: 'Submit Documents', description: 'Upload all required documents', deadline: '' },
      { title: 'Interview (if applicable)', description: 'Participate in interview process', deadline: '' }
    ],
    benefits: ['Financial Support', 'Academic Recognition', 'Networking Opportunities'],
    timeline: {
      applicationOpen: '',
      applicationDeadline: '',
      reviewPeriod: '4-6 weeks',
      announcementDate: '',
      disbursementDate: ''
    },
    status: 'Active',
    isFeatured: false,
    numberOfAwards: '1',
    tags: []
  });

  useEffect(() => {
    fetchScholarship();
  }, [id]);

  useEffect(() => {
    const isValid = 
      formData.title.trim() !== '' &&
      formData.organization.name.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.shortDescription.trim() !== '' &&
      formData.applicationDetails.deadline !== '';
    
    setFormValid(isValid);
  }, [formData]);

  const fetchScholarship = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/career/admin/scholarships/${id}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const scholarship = response.data.data;
        
        // Format the data for the form
        setFormData({
          title: scholarship.title || '',
          organization: {
            name: scholarship.organization?.name || '',
            website: scholarship.organization?.website || '',
            description: scholarship.organization?.description || '',
            industry: scholarship.organization?.industry || ''
          },
          description: scholarship.description || '',
          shortDescription: scholarship.shortDescription || '',
          category: scholarship.category || 'Academic Excellence',
          type: scholarship.type || 'Full Tuition',
          level: scholarship.level || 'Undergraduate',
          funding: {
            type: scholarship.funding?.type || 'Full Tuition',
            amount: scholarship.funding?.amount || '',
            currency: scholarship.funding?.currency || 'USD',
            coverage: scholarship.funding?.coverage || ['tuition', 'fees'],
            renewable: scholarship.funding?.renewable || false,
            renewalConditions: scholarship.funding?.renewalConditions || '',
            disbursement: scholarship.funding?.disbursement || 'Annual',
            duration: scholarship.funding?.duration || '1 year'
          },
          eligibility: {
            academicLevel: scholarship.eligibility?.academicLevel || 'Undergraduate',
            minGPA: scholarship.eligibility?.minGPA || '',
            fieldOfStudy: scholarship.eligibility?.fieldOfStudy || [],
            nationality: scholarship.eligibility?.nationality || 'Any Nationality',
            countries: scholarship.eligibility?.countries || [],
            institution: scholarship.eligibility?.institution || '',
            ageLimit: scholarship.eligibility?.ageLimit || '',
            additionalRequirements: scholarship.eligibility?.additionalRequirements || []
          },
          applicationDetails: {
            deadline: scholarship.applicationDetails?.deadline?.split('T')[0] || '',
            applicationLink: scholarship.applicationDetails?.applicationLink || '',
            contactEmail: scholarship.applicationDetails?.contactEmail || '',
            contactPhone: scholarship.applicationDetails?.contactPhone || '',
            documentsRequired: scholarship.applicationDetails?.documentsRequired || ['Transcript', 'Recommendation Letters', 'Personal Statement'],
            instructions: scholarship.applicationDetails?.instructions || '',
            interviewRequired: scholarship.applicationDetails?.interviewRequired || false,
            interviewProcess: scholarship.applicationDetails?.interviewProcess || ''
          },
          applicationProcess: scholarship.applicationProcess || [
            { title: 'Submit Online Application', description: 'Complete the online application form', deadline: '' },
            { title: 'Submit Documents', description: 'Upload all required documents', deadline: '' },
            { title: 'Interview (if applicable)', description: 'Participate in interview process', deadline: '' }
          ],
          benefits: scholarship.benefits || ['Financial Support', 'Academic Recognition', 'Networking Opportunities'],
          timeline: {
            applicationOpen: scholarship.timeline?.applicationOpen?.split('T')[0] || '',
            applicationDeadline: scholarship.timeline?.applicationDeadline?.split('T')[0] || '',
            reviewPeriod: scholarship.timeline?.reviewPeriod || '4-6 weeks',
            announcementDate: scholarship.timeline?.announcementDate?.split('T')[0] || '',
            disbursementDate: scholarship.timeline?.disbursementDate?.split('T')[0] || ''
          },
          status: scholarship.status || 'Active',
          isFeatured: scholarship.isFeatured || false,
          numberOfAwards: scholarship.numberOfAwards?.toString() || '1',
          tags: scholarship.tags || []
        });
      } else {
        alert('Failed to load scholarship');
        navigate('/admin/career/scholarships');
      }
    } catch (err) {
      console.error('Error fetching scholarship:', err);
      alert('Failed to load scholarship. Please try again.');
      navigate('/admin/career/scholarships');
    } finally {
      setLoading(false);
    }
  };

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

  const toggleCoverage = (item) => {
    setFormData(prev => {
      const currentCoverage = prev.funding.coverage;
      const newCoverage = currentCoverage.includes(item)
        ? currentCoverage.filter(c => c !== item)
        : [...currentCoverage, item];
      
      return {
        ...prev,
        funding: {
          ...prev.funding,
          coverage: newCoverage
        }
      };
    });
  };

  const addBenefit = () => {
    const benefit = prompt('Enter a benefit:');
    if (benefit && benefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefit.trim()]
      }));
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    const requirement = prompt('Enter an eligibility requirement:');
    if (requirement && requirement.trim()) {
      setFormData(prev => ({
        ...prev,
        eligibility: {
          ...prev.eligibility,
          additionalRequirements: [...prev.eligibility.additionalRequirements, requirement.trim()]
        }
      }));
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        additionalRequirements: prev.eligibility.additionalRequirements.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formValid) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }
    
    setSubmitting(true);

    try {
      const dataToSend = {
        title: formData.title,
        organization: {
          name: formData.organization.name,
          website: formData.organization.website || '',
          description: formData.organization.description || '',
          industry: formData.organization.industry || ''
        },
        description: formData.description,
        shortDescription: formData.shortDescription,
        category: formData.category,
        type: formData.type,
        level: formData.level,
        funding: {
          type: formData.funding.type,
          amount: formData.funding.amount ? parseFloat(formData.funding.amount) : 0,
          currency: formData.funding.currency,
          coverage: formData.funding.coverage,
          renewable: formData.funding.renewable,
          renewalConditions: formData.funding.renewalConditions || '',
          disbursement: formData.funding.disbursement,
          duration: formData.funding.duration
        },
        eligibility: {
          academicLevel: formData.eligibility.academicLevel,
          minGPA: formData.eligibility.minGPA ? parseFloat(formData.eligibility.minGPA) : 0,
          fieldOfStudy: formData.eligibility.fieldOfStudy,
          nationality: formData.eligibility.nationality,
          countries: formData.eligibility.countries,
          institution: formData.eligibility.institution || '',
          ageLimit: formData.eligibility.ageLimit || '',
          additionalRequirements: formData.eligibility.additionalRequirements
        },
        applicationDetails: {
          deadline: formData.applicationDetails.deadline,
          applicationLink: formData.applicationDetails.applicationLink || '',
          contactEmail: formData.applicationDetails.contactEmail || '',
          contactPhone: formData.applicationDetails.contactPhone || '',
          documentsRequired: formData.applicationDetails.documentsRequired,
          instructions: formData.applicationDetails.instructions || '',
          interviewRequired: formData.applicationDetails.interviewRequired,
          interviewProcess: formData.applicationDetails.interviewProcess || ''
        },
        applicationProcess: formData.applicationProcess,
        benefits: formData.benefits,
        timeline: formData.timeline,
        status: formData.status,
        isFeatured: formData.isFeatured,
        numberOfAwards: parseInt(formData.numberOfAwards) || 1,
        tags: formData.tags
      };

      const response = await axios.put(`/api/career/admin/scholarships/${id}`, dataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Scholarship updated successfully!');
        navigate('/admin/career/scholarships');
      }
    } catch (error) {
      console.error('Error updating scholarship:', error);
      
      let errorMessage = 'Failed to update scholarship. ';
      
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
        errorMessage += 'No response from server.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
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
        <p className="section-description">Edit scholarship details</p>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="required">Scholarship Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Presidential Scholarship, STEM Excellence Award"
            required
            disabled={submitting}
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="required">Organization Name *</label>
            <input
              type="text"
              name="organization.name"
              value={formData.organization.name}
              onChange={handleChange}
              placeholder="e.g., University of Excellence, XYZ Foundation"
              required
              disabled={submitting}
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
              placeholder="e.g., Education, Non-Profit, Corporate"
              disabled={submitting}
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
            placeholder="https://organization.com"
            disabled={submitting}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Organization Description</label>
          <textarea
            name="organization.description"
            value={formData.organization.description}
            onChange={handleChange}
            placeholder="Brief description of the organization..."
            rows={3}
            disabled={submitting}
            className="form-textarea"
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
            placeholder="Describe the scholarship purpose, history, and what it aims to achieve..."
            rows={6}
            required
            disabled={submitting}
            className="form-textarea"
          />
          <div className="char-count">
            <span className={formData.description.length > 2500 ? 'warning' : ''}>
              {formData.description.length}/3000 characters
            </span>
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
            disabled={submitting}
            className="form-textarea"
          />
          <div className={`char-count ${formData.shortDescription.length > 200 ? 'warning' : ''}`}>
            {formData.shortDescription.length}/250 characters
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">Scholarship Category & Type</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label className="required">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={submitting}
              className="form-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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
              disabled={submitting}
              className="form-select"
            >
              {scholarshipTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="required">Education Level *</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              required
              disabled={submitting}
              className="form-select"
            >
              {educationLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 2
  const renderStep2 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Funding & Eligibility</h2>
        <p className="section-description">Update funding details and eligibility criteria</p>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">💰 Funding Details</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label className="required">Funding Type *</label>
            <select
              name="funding.type"
              value={formData.funding.type}
              onChange={handleChange}
              required
              disabled={submitting}
              className="form-select"
            >
              {scholarshipTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {formData.funding.type !== 'Full Tuition' && (
            <div className="form-group">
              <label>Amount</label>
              <div className="amount-input">
                <span className="currency-prefix">
                  {currencies.find(c => c.code === formData.funding.currency)?.symbol}
                </span>
                <input
                  type="number"
                  name="funding.amount"
                  value={formData.funding.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={submitting}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Currency</label>
            <select
              name="funding.currency"
              value={formData.funding.currency}
              onChange={handleChange}
              disabled={submitting}
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

        <div className="form-group">
          <label>What does the scholarship cover?</label>
          <div className="checkbox-grid">
            {coverageOptions.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.funding.coverage.includes(option)}
                  onChange={() => toggleCoverage(option)}
                  disabled={submitting}
                />
                <span className="checkbox-custom"></span>
                {option.replace('-', ' ').charAt(0).toUpperCase() + option.replace('-', ' ').slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="funding.renewable"
              checked={formData.funding.renewable}
              onChange={handleChange}
              disabled={submitting}
            />
            <span className="checkbox-custom"></span>
            Renewable Scholarship
          </label>
          
          {formData.funding.renewable && (
            <div className="form-group">
              <label>Renewal Conditions</label>
              <input
                type="text"
                name="funding.renewalConditions"
                value={formData.funding.renewalConditions}
                onChange={handleChange}
                placeholder="e.g., Maintain 3.5+ GPA, Full-time enrollment"
                disabled={submitting}
                className="form-input"
              />
            </div>
          )}
        </div>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">🎯 Eligibility Requirements</h3>
        
        <div className="form-group">
          <label>Field of Study (comma-separated)</label>
          <input
            type="text"
            value={formData.eligibility.fieldOfStudy.join(', ')}
            onChange={(e) => handleArrayChange('fieldOfStudy', e.target.value, 'eligibility')}
            placeholder="Computer Science, Engineering, Business, Medicine"
            disabled={submitting}
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Minimum GPA</label>
            <div className="gpa-input">
              <input
                type="number"
                name="eligibility.minGPA"
                value={formData.eligibility.minGPA}
                onChange={handleChange}
                min="0"
                max="4.0"
                step="0.1"
                placeholder="3.0"
                disabled={submitting}
                className="form-input"
              />
              <span className="gpa-max">/ 4.0</span>
            </div>
          </div>

          <div className="form-group">
            <label>Age Limit (optional)</label>
            <input
              type="number"
              name="eligibility.ageLimit"
              value={formData.eligibility.ageLimit}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 25"
              disabled={submitting}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Additional Requirements</label>
          <div className="requirements-container">
            {formData.eligibility.additionalRequirements.map((req, index) => (
              <span key={index} className="requirement-tag">
                {req}
                <button
                  type="button"
                  className="requirement-remove"
                  onClick={() => removeRequirement(index)}
                  disabled={submitting}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={addRequirement}
              className="btn-add-requirement"
              disabled={submitting}
            >
              + Add Requirement
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 3
  const renderStep3 = () => (
    <div className="form-section">
      <div className="section-header">
        <h2>Application Process</h2>
        <p className="section-description">Update application process and timeline</p>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">📝 Application Details</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label className="required">Application Deadline *</label>
            <input
              type="date"
              name="applicationDetails.deadline"
              value={formData.applicationDetails.deadline}
              onChange={handleChange}
              required
              disabled={submitting}
              className="form-input"
            />
            <div className="date-preview">
              <span className="date-label">Deadline:</span>
              <span className="date-value">{formatDate(formData.applicationDetails.deadline)}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Number of Awards</label>
            <input
              type="number"
              name="numberOfAwards"
              value={formData.numberOfAwards}
              onChange={handleChange}
              min="1"
              placeholder="1"
              disabled={submitting}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Application Link (if external)</label>
          <input
            type="url"
            name="applicationDetails.applicationLink"
            value={formData.applicationDetails.applicationLink}
            onChange={handleChange}
            placeholder="https://organization.com/apply"
            disabled={submitting}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Required Documents</label>
          <div className="checkbox-grid">
            {['Transcript', 'Recommendation Letters', 'Personal Statement', 'Essay', 'Resume/CV', 'Portfolio', 'Proof of Enrollment', 'Financial Documents', 'ID Proof', 'Test Scores'].map(doc => (
              <label key={doc} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.applicationDetails.documentsRequired.includes(doc)}
                  onChange={(e) => {
                    const newDocs = e.target.checked
                      ? [...formData.applicationDetails.documentsRequired, doc]
                      : formData.applicationDetails.documentsRequired.filter(d => d !== doc);
                    setFormData(prev => ({
                      ...prev,
                      applicationDetails: {
                        ...prev.applicationDetails,
                        documentsRequired: newDocs
                      }
                    }));
                  }}
                  disabled={submitting}
                />
                <span className="checkbox-custom"></span>
                {doc}
              </label>
            ))}
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
            disabled={submitting}
            className="form-textarea"
          />
        </div>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">🌟 Benefits & Opportunities</h3>
        
        <div className="form-group">
          <label>Benefits</label>
          <div className="benefits-container">
            {formData.benefits.map((benefit, index) => (
              <span key={index} className="benefit-tag">
                {benefit}
                <button
                  type="button"
                  className="benefit-remove"
                  onClick={() => removeBenefit(index)}
                  disabled={submitting}
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
            disabled={submitting}
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
        <h2>Final Review & Settings</h2>
        <p className="section-description">Review all information and update settings</p>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">📅 Timeline</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Application Opens</label>
            <input
              type="date"
              name="timeline.applicationOpen"
              value={formData.timeline.applicationOpen}
              onChange={handleChange}
              disabled={submitting}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Announcement Date</label>
            <input
              type="date"
              name="timeline.announcementDate"
              value={formData.timeline.announcementDate}
              onChange={handleChange}
              disabled={submitting}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="section-subtitle">⚙️ Settings</h3>
        
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
                    disabled={submitting}
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
                disabled={submitting}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">
                {formData.isFeatured ? 'Featured' : 'Not Featured'}
              </span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Tags for Search (comma-separated)</label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleArrayChange('tags', e.target.value)}
            placeholder="scholarship, financial aid, merit-based, stem, international"
            disabled={submitting}
            className="form-input"
          />
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
              {formData.organization.name.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="preview-header-info">
              <h4 className="preview-title">{formData.title || 'Scholarship Title'}</h4>
              <p className="preview-organization">{formData.organization.name || 'Organization Name'}</p>
              <div className="preview-tags">
                <span className="preview-tag">{formData.category}</span>
                <span className="preview-tag">{formData.type}</span>
                {formData.isFeatured && <span className="preview-tag featured">Featured</span>}
              </div>
            </div>
          </div>
          
          <div className="preview-details">
            <div className="preview-detail-item">
              <span className="preview-detail-label">Amount:</span>
              <span className="preview-detail-value">
                {formData.funding.type === 'Full Tuition' 
                  ? 'Full Tuition' 
                  : formData.funding.amount 
                    ? `${currencies.find(c => c.code === formData.funding.currency)?.symbol}${formData.funding.amount}` 
                    : 'Amount not specified'}
              </span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">Deadline:</span>
              <span className="preview-detail-value">
                {formatDate(formData.applicationDetails.deadline) || 'Not set'}
              </span>
            </div>
            <div className="preview-detail-item">
              <span className="preview-detail-label">Level:</span>
              <span className="preview-detail-value">{formData.level}</span>
            </div>
          </div>
          
          <div className="preview-description">
            <p>{formData.shortDescription || 'Short description will appear here...'}</p>
          </div>
        </div>
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading scholarship...</p>
      </div>
    );
  }

  return (
    <div className="edit-scholarship-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Edit Scholarship</h1>
          <p className="subtitle">Update scholarship details</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/admin/career/scholarships')}
            className="btn-back"
          >
            ← Back to Scholarships
          </button>
        </div>
      </div>

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
                {step === 2 && 'Funding'}
                {step === 3 && 'Application'}
                {step === 4 && 'Review'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-wrapper">
        <form onSubmit={handleSubmit}>
          {renderCurrentStep()}

          <div className="form-actions">
            <div className="action-buttons">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={prevStep}
                  disabled={submitting}
                >
                  Previous
                </button>
              )}
              
              {currentStep < 4 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={nextStep}
                  disabled={submitting}
                >
                  Next
                </button>
              )}
              
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate('/admin/career/scholarships')}
                disabled={submitting}
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
                  disabled={submitting || !formValid}
                >
                  {submitting ? 'Updating...' : 'Update Scholarship'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditScholarship;