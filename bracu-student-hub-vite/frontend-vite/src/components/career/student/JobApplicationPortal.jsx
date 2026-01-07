// src/components/career/student/JobApplicationPortal.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const JobApplicationPortal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    phoneNumber: '',
    resume: '',
    coverLetter: '',
    availability: '',
    preferredHours: '',
    relevantSkills: '',
    previousExperience: '',
    expectedSalary: '',
    additionalInfo: ''
  });
  
  const [references, setReferences] = useState([
    { name: '', email: '', phone: '', relationship: '' }
  ]);

  useEffect(() => {
    fetchJob();
    loadUserData();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`/api/career/jobs/${id}`);
      if (res.data.success) {
        setJob(res.data.data);
      } else {
        setError('Job not found');
      }
    } catch (err) {
      setError('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const res = await axios.get('/api/auth/check');
      if (res.data.loggedIn && res.data.user) {
        const user = res.data.user;
        setFormData(prev => ({
          ...prev,
          phoneNumber: user.phoneNumber || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load user data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReferenceChange = (index, field, value) => {
    const newRefs = [...references];
    newRefs[index] = { ...newRefs[index], [field]: value };
    setReferences(newRefs);
  };

  const addReference = () => {
    setReferences([...references, { name: '', email: '', phone: '', relationship: '' }]);
  };

  const removeReference = (index) => {
    if (references.length > 1) {
      setReferences(references.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    if (!formData.coverLetter.trim()) {
      setError('Cover letter is required');
      return false;
    }
    
    if (!formData.availability.trim()) {
      setError('Availability is required');
      return false;
    }
    
    // Validate references
    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      if (!ref.name.trim()) {
        setError(`Reference ${i + 1}: Name is required`);
        return false;
      }
      if (!ref.email.trim() || !ref.email.includes('@')) {
        setError(`Reference ${i + 1}: Valid email is required`);
        return false;
      }
      if (!ref.relationship.trim()) {
        setError(`Reference ${i + 1}: Relationship is required`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError('');

    try {
      const submissionData = {
        ...formData,
        relevantSkills: formData.relevantSkills.split(',').map(skill => skill.trim()).filter(skill => skill),
        references: references
      };

      const response = await axios.post(
        `/api/career/jobs/${id}/apply`,
        submissionData,
        {
          headers: { 
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/career/my-job-applications');
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="success-screen">
        <div className="success-icon">✓</div>
        <h1>Application Submitted Successfully!</h1>
        <p>Your application for "{job?.title}" has been submitted.</p>
        <p>You will be redirected to your applications page shortly.</p>
        <div className="success-buttons">
          <button onClick={() => navigate(`/career/jobs/${id}`)} className="btn-secondary">
            Back to Job
          </button>
          <button onClick={() => navigate('/career/my-job-applications')} className="btn-primary">
            View My Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="application-portal">
      <header className="portal-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="header-content">
          <h1>Application for: {job?.title}</h1>
          <p className="company-name">{job?.company?.name}</p>
          {job?.deadline && (
            <p className="deadline">
              Application Deadline: {new Date(job.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
      </header>

      <div className="portal-content">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message alert alert-danger">{error}</div>}

          {/* Contact Information */}
          <section className="form-section card">
            <h2>Contact Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  value={formData.phoneNumber} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-group">
                <label>Expected Salary (per hour)</label>
                <input 
                  type="number" 
                  name="expectedSalary" 
                  value={formData.expectedSalary} 
                  onChange={handleInputChange} 
                  placeholder="e.g., 15"
                  min="0"
                />
                <small>Leave empty if negotiable</small>
              </div>
            </div>
          </section>

          {/* Availability */}
          <section className="form-section card">
            <h2>Availability</h2>
            <div className="form-group">
              <label>Weekly Availability *</label>
              <textarea 
                name="availability" 
                value={formData.availability} 
                onChange={handleInputChange}
                rows="3"
                placeholder="Example: Available Mon-Fri 3pm-9pm, Sat 10am-4pm"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Preferred Hours per Week</label>
              <input 
                type="text" 
                name="preferredHours" 
                value={formData.preferredHours} 
                onChange={handleInputChange}
                placeholder="e.g., 15-20 hours"
              />
            </div>
          </section>

          {/* Skills & Experience */}
          <section className="form-section card">
            <h2>Skills & Experience</h2>
            
            <div className="form-group">
              <label>Relevant Skills (comma separated)</label>
              <input 
                type="text" 
                name="relevantSkills" 
                value={formData.relevantSkills} 
                onChange={handleInputChange}
                placeholder="e.g., Customer Service, Microsoft Office, Communication"
              />
            </div>
            
            <div className="form-group">
              <label>Previous Experience</label>
              <textarea 
                name="previousExperience" 
                value={formData.previousExperience} 
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe your previous work experience, including part-time jobs, internships, or volunteer work..."
              />
            </div>
          </section>

          {/* Cover Letter */}
          <section className="form-section card">
            <h2>Cover Letter *</h2>
            <p className="section-description">
              Explain why you're interested in this position and why you'd be a good fit
            </p>
            <textarea 
              name="coverLetter" 
              value={formData.coverLetter} 
              onChange={handleInputChange}
              rows="10"
              placeholder="Write your cover letter here..."
              required
            />
            <div className="word-count">
              {formData.coverLetter.length} characters • Approximately {Math.ceil(formData.coverLetter.split(/\s+/).length)} words
            </div>
          </section>

          {/* References */}
          <section className="form-section card">
            <h2>References (at least 1 required)</h2>
            <p className="section-description">
              Provide contact information for professional or academic references
            </p>
            
            {references.map((ref, index) => (
              <div key={index} className="reference-card">
                <div className="card-header">
                  <h3>Reference #{index + 1}</h3>
                  {references.length > 1 && (
                    <button 
                      type="button" 
                      className="btn-remove" 
                      onClick={() => removeReference(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      value={ref.name}
                      onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                      placeholder="Reference full name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      value={ref.email}
                      onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                      placeholder="Reference email"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      value={ref.phone}
                      onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
                      placeholder="Reference phone number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Relationship *</label>
                    <input 
                      type="text" 
                      value={ref.relationship}
                      onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)}
                      placeholder="e.g., Professor, Supervisor, Manager"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" className="btn-add" onClick={addReference}>
              + Add Reference
            </button>
          </section>

          {/* Additional Information */}
          <section className="form-section card">
            <h2>Additional Information</h2>
            <p className="section-description">
              Anything else you'd like to share that may support your application
            </p>
            <textarea 
              name="additionalInfo" 
              value={formData.additionalInfo} 
              onChange={handleInputChange}
              rows="5"
              placeholder="Additional information, certifications, awards, or special circumstances..."
            />
          </section>

          {/* Note about files */}
          <section className="form-section card note-section">
            <h3>📄 Note About Resume</h3>
            <p>
              Currently, file uploads are not supported in this version. Please include your resume content in the "Previous Experience" section above.
              TEAM BRACUSTUDENTHUB will fix it soon! Stay Tuned!
            </p>
          </section>

          {/* Submit Section */}
          <div className="submit-section card">
            <div className="terms">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">
                I certify that all information provided is accurate and complete. I understand that providing false information may result in disqualification.
              </label>
            </div>
            
            <div className="submit-buttons">
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationPortal;