// src/components/career/student/ScholarshipApplicationPortal.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const ScholarshipApplicationPortal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    phoneNumber: '',
    cgpa: '',
    semester: '',
    department: '',
    major: '',
    year: '',
    expectedGraduation: '',
    universityId: '',
    essayText: '',
    additionalInfo: '',
    financialNeed: '',
    careerGoals: '',
    extracurricular: ''
  });
  
  const [academicAchievements, setAcademicAchievements] = useState(['']);
  const [workExperience, setWorkExperience] = useState([{ organization: '', position: '', duration: '', description: '' }]);
  const [researchProjects, setResearchProjects] = useState([{ title: '', description: '', role: '', outcome: '' }]);
  const [references, setReferences] = useState([{ name: '', email: '', phone: '', relationship: '' }]);

  useEffect(() => {
    fetchScholarship();
    loadUserData();
  }, [id]);

  const fetchScholarship = async () => {
    try {
      const res = await axios.get(`/api/career/scholarships/${id}`);
      if (res.data.success) {
        setScholarship(res.data.data);
      } else {
        setError('Scholarship not found');
      }
    } catch (err) {
      setError('Failed to load scholarship');
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
          cgpa: user.cgpa || '',
          semester: user.semester || '',
          department: user.department || '',
          major: user.major || '',
          year: user.year || '',
          universityId: user.universityId || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load user data');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAchievementChange = (index, value) => {
    const newAchievements = [...academicAchievements];
    newAchievements[index] = value;
    setAcademicAchievements(newAchievements);
  };

  const addAchievement = () => setAcademicAchievements([...academicAchievements, '']);
  const removeAchievement = (index) => setAcademicAchievements(academicAchievements.filter((_, i) => i !== index));

  const handleExperienceChange = (index, field, value) => {
    const newExp = [...workExperience];
    newExp[index] = { ...newExp[index], [field]: value };
    setWorkExperience(newExp);
  };

  const addExperience = () => setWorkExperience([...workExperience, { organization: '', position: '', duration: '', description: '' }]);
  const removeExperience = (index) => setWorkExperience(workExperience.filter((_, i) => i !== index));

  const handleResearchChange = (index, field, value) => {
    const newProjects = [...researchProjects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setResearchProjects(newProjects);
  };

  const addResearch = () => setResearchProjects([...researchProjects, { title: '', description: '', role: '', outcome: '' }]);
  const removeResearch = (index) => setResearchProjects(researchProjects.filter((_, i) => i !== index));

  const handleReferenceChange = (index, field, value) => {
    const newRefs = [...references];
    newRefs[index] = { ...newRefs[index], [field]: value };
    setReferences(newRefs);
  };

  const addReference = () => setReferences([...references, { name: '', email: '', phone: '', relationship: '' }]);
  const removeReference = (index) => setReferences(references.filter((_, i) => i !== index));

  const validateForm = () => {
    if (!formData.phoneNumber) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.cgpa) {
      setError('CGPA is required');
      return false;
    }
    if (!formData.semester) {
      setError('Semester is required');
      return false;
    }
    if (!formData.department) {
      setError('Department is required');
      return false;
    }
    if (!formData.major) {
      setError('Major is required');
      return false;
    }
    if (!formData.essayText) {
      setError('Essay is required');
      return false;
    }
    if (!formData.financialNeed) {
      setError('Financial need statement is required');
      return false;
    }
    if (!formData.careerGoals) {
      setError('Career goals statement is required');
      return false;
    }
    if (references.length < 2) {
      setError('At least 2 references are required');
      return false;
    }
    
    // Validate references
    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      if (!ref.name || !ref.name.trim()) {
        setError(`Reference ${i + 1}: Name is required`);
        return false;
      }
      if (!ref.email || !ref.email.trim()) {
        setError(`Reference ${i + 1}: Email is required`);
        return false;
      }
      if (!ref.relationship || !ref.relationship.trim()) {
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
      // Prepare data for submission (without files for now)
      const submissionData = {
        ...formData,
        academicAchievements: JSON.stringify(academicAchievements.filter(a => a.trim())),
        workExperience: JSON.stringify(workExperience.filter(exp => exp.organization || exp.position || exp.description)),
        researchProjects: JSON.stringify(researchProjects.filter(proj => proj.title || proj.description)),
        references: JSON.stringify(references)
      };

      console.log('Submitting application data:', submissionData);

      const response = await axios.post(`/api/career/scholarships/${id}/apply`, submissionData, {
        headers: { 
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate(`/career/my-scholarship-applications`);
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
    return <div className="loading">Loading scholarship details...</div>;
  }

  if (success) {
    return (
      <div className="success-screen">
        <div className="success-icon">✓</div>
        <h1>Application Submitted Successfully!</h1>
        <p>Your application for "{scholarship?.title}" has been submitted.</p>
        <p>You will be redirected to your applications page shortly.</p>
        <div className="success-buttons">
          <button onClick={() => navigate(`/career/scholarships/${id}`)} className="btn-secondary">
            Back to Scholarship
          </button>
          <button onClick={() => navigate('/career/my-scholarship-applications')} className="btn-primary">
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
          <h1>Application for: {scholarship?.title}</h1>
          <p className="organization-name">{scholarship?.organization?.name}</p>
          {scholarship?.applicationDetails?.deadline && (
            <p className="deadline">
              Application Deadline: {new Date(scholarship.applicationDetails.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
      </header>

      <div className="portal-content">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message alert alert-danger">{error}</div>}

          {/* Personal Information */}
          <section className="form-section card">
            <h2>Personal Information</h2>
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
                <label>University ID *</label>
                <input 
                  type="text" 
                  name="universityId" 
                  value={formData.universityId} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Enter your university ID"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select name="department" value={formData.department} onChange={handleInputChange} required>
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="EEE">Electrical & Electronic Engineering</option>
                  <option value="BBA">Business Administration</option>
                  <option value="Economics">Economics</option>
                  <option value="Law">Law</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Arts">Arts & Humanities</option>
                  <option value="Science">Science</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Major *</label>
                <input 
                  type="text" 
                  name="major" 
                  value={formData.major} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Enter your major"
                />
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select name="semester" value={formData.semester} onChange={handleInputChange} required>
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                    <option key={num} value={num}>Semester {num}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Year *</label>
                <select name="year" value={formData.year} onChange={handleInputChange} required>
                  <option value="">Select Year</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                  <option value="5th+">5th Year+</option>
                </select>
              </div>
              <div className="form-group">
                <label>CGPA *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="4" 
                  name="cgpa" 
                  value={formData.cgpa} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Enter your CGPA (0-4)"
                />
              </div>
              <div className="form-group">
                <label>Expected Graduation</label>
                <input 
                  type="date" 
                  name="expectedGraduation" 
                  value={formData.expectedGraduation} 
                  onChange={handleInputChange} 
                  placeholder="Expected graduation date"
                />
              </div>
            </div>
          </section>

          {/* Academic Achievements */}
          <section className="form-section card">
            <h2>Academic Achievements & Awards</h2>
            <p className="section-description">List any academic awards, honors, or achievements</p>
            {academicAchievements.map((achievement, index) => (
              <div key={index} className="achievement-row">
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => handleAchievementChange(index, e.target.value)}
                  placeholder="e.g., Dean's List 2023, National Science Olympiad Gold Medal"
                />
                {academicAchievements.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeAchievement(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addAchievement}>
              + Add Achievement
            </button>
          </section>

          {/* Work Experience */}
          <section className="form-section card">
            <h2>Work Experience & Volunteering</h2>
            <p className="section-description">List your relevant work experience and volunteer activities</p>
            {workExperience.map((exp, index) => (
              <div key={index} className="experience-card">
                <div className="card-header">
                  <h3>Experience #{index + 1}</h3>
                  {workExperience.length > 1 && (
                    <button type="button" className="btn-remove" onClick={() => removeExperience(index)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Organization</label>
                    <input 
                      type="text" 
                      placeholder="Company or organization name" 
                      value={exp.organization} 
                      onChange={(e) => handleExperienceChange(index, 'organization', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Position/Role</label>
                    <input 
                      type="text" 
                      placeholder="Your position or role" 
                      value={exp.position} 
                      onChange={(e) => handleExperienceChange(index, 'position', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input 
                      type="text" 
                      placeholder="e.g., June 2022 - August 2022" 
                      value={exp.duration} 
                      onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)} 
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea 
                      placeholder="Description of responsibilities and achievements" 
                      value={exp.description} 
                      onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addExperience}>
              + Add Experience
            </button>
          </section>

          {/* Research Projects */}
          <section className="form-section card">
            <h2>Research Projects & Publications</h2>
            <p className="section-description">List any research projects or publications</p>
            {researchProjects.map((project, index) => (
              <div key={index} className="project-card">
                <div className="card-header">
                  <h3>Project #{index + 1}</h3>
                  {researchProjects.length > 1 && (
                    <button type="button" className="btn-remove" onClick={() => removeResearch(index)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Project Title</label>
                    <input 
                      type="text" 
                      placeholder="Project title" 
                      value={project.title} 
                      onChange={(e) => handleResearchChange(index, 'title', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Your Role</label>
                    <input 
                      type="text" 
                      placeholder="Your role in the project" 
                      value={project.role} 
                      onChange={(e) => handleResearchChange(index, 'role', e.target.value)} 
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea 
                      placeholder="Project description" 
                      value={project.description} 
                      onChange={(e) => handleResearchChange(index, 'description', e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Outcomes/Publications</label>
                    <textarea 
                      placeholder="Project outcomes, publications, or results" 
                      value={project.outcome} 
                      onChange={(e) => handleResearchChange(index, 'outcome', e.target.value)}
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addResearch}>
              + Add Research Project
            </button>
          </section>

          {/* References */}
          <section className="form-section card">
            <h2>References * (Minimum 2 required)</h2>
            <p className="section-description">Provide contact information for at least 2 references</p>
            {references.map((ref, index) => (
              <div key={index} className="reference-card">
                <div className="card-header">
                  <h3>Reference #{index + 1}</h3>
                  {references.length > 2 && (
                    <button type="button" className="btn-remove" onClick={() => removeReference(index)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="Reference full name" 
                      value={ref.name} 
                      onChange={(e) => handleReferenceChange(index, 'name', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="Reference email" 
                      value={ref.email} 
                      onChange={(e) => handleReferenceChange(index, 'email', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="Reference phone number" 
                      value={ref.phone} 
                      onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Professor, Supervisor, Manager" 
                      value={ref.relationship} 
                      onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)} 
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

          {/* Essay Questions */}
          <section className="form-section card">
            <h2>Essay Questions *</h2>
            
            <div className="essay-question">
              <h3>1. Why do you deserve this scholarship? (500-1000 words)</h3>
              <p className="question-description">Describe your academic achievements, career goals, and how this scholarship will help you achieve them.</p>
              <textarea 
                name="essayText" 
                value={formData.essayText} 
                onChange={handleInputChange}
                rows="10"
                placeholder="Write your essay here..."
                required
              />
              <div className="word-count">
                {formData.essayText.length} characters • Approximately {Math.ceil(formData.essayText.split(/\s+/).length)} words
              </div>
            </div>

            <div className="essay-question">
              <h3>2. Statement of Financial Need *</h3>
              <p className="question-description">Explain your financial situation and why you need this scholarship support.</p>
              <textarea 
                name="financialNeed" 
                value={formData.financialNeed} 
                onChange={handleInputChange}
                rows="6"
                placeholder="Explain your financial need..."
                required
              />
            </div>

            <div className="essay-question">
              <h3>3. Career Goals & Aspirations *</h3>
              <p className="question-description">Describe your short-term and long-term career goals, and how your education aligns with them.</p>
              <textarea 
                name="careerGoals" 
                value={formData.careerGoals} 
                onChange={handleInputChange}
                rows="6"
                placeholder="Describe your career goals..."
                required
              />
            </div>

            <div className="essay-question">
              <h3>4. Extracurricular Activities & Leadership</h3>
              <p className="question-description">Describe your involvement in clubs, organizations, community service, or leadership roles.</p>
              <textarea 
                name="extracurricular" 
                value={formData.extracurricular} 
                onChange={handleInputChange}
                rows="6"
                placeholder="Describe your extracurricular activities..."
              />
            </div>
          </section>

          {/* Additional Info */}
          <section className="form-section card">
            <h2>Additional Information</h2>
            <p className="section-description">Any additional information you'd like to share that may support your application</p>
            <textarea 
              name="additionalInfo" 
              value={formData.additionalInfo} 
              onChange={handleInputChange}
              rows="5"
              placeholder="Additional information..."
            />
          </section>

          {/* Note about files */}
          <section className="form-section card note-section">
            <h3>📄 Note About Supporting Documents</h3>
            <p>
              Currently, file uploads are not supported in this version. Please ensure all required information is included in the form above.
              TEAM BRACUSTUDENTHUB will fix it soon! Stay Tuned!
            </p>
          </section>

          {/* Submit */}
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

export default ScholarshipApplicationPortal;