// src/components/career/student/ApplicationPortal.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const ApplicationPortal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
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
    coverLetterText: '',
    additionalInfo: ''
  });
  
  const [skills, setSkills] = useState(['']);
  const [workExperience, setWorkExperience] = useState([{ company: '', position: '', duration: '', description: '' }]);
  const [projects, setProjects] = useState([{ name: '', description: '', technologies: '', link: '' }]);
  
  // File State
  const [resume, setResume] = useState(null);
  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [otherDocuments, setOtherDocuments] = useState([]);

  useEffect(() => {
    fetchInternship();
    loadUserData();
  }, [id]);

  const fetchInternship = async () => {
    try {
      const res = await axios.get(`/api/career/internships/${id}`);
      if (res.data.success) {
        setInternship(res.data.data);
      } else {
        setError('Internship not found');
      }
    } catch (err) {
      setError('Failed to load internship');
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

  const handleSkillChange = (index, value) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const addSkill = () => setSkills([...skills, '']);
  const removeSkill = (index) => setSkills(skills.filter((_, i) => i !== index));

  const handleExperienceChange = (index, field, value) => {
    const newExp = [...workExperience];
    newExp[index] = { ...newExp[index], [field]: value };
    setWorkExperience(newExp);
  };

  const addExperience = () => setWorkExperience([...workExperience, { company: '', position: '', duration: '', description: '' }]);
  const removeExperience = (index) => setWorkExperience(workExperience.filter((_, i) => i !== index));

  const handleProjectChange = (index, field, value) => {
    const newProjects = [...projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setProjects(newProjects);
  };

  const addProject = () => setProjects([...projects, { name: '', description: '', technologies: '', link: '' }]);
  const removeProject = (index) => setProjects(projects.filter((_, i) => i !== index));

  const handleFileChange = (setter, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large (max 10MB)');
        return;
      }
      const validTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip'];
      const fileType = '.' + file.name.split('.').pop().toLowerCase();
      if (!validTypes.includes(fileType)) {
        alert('Invalid file type');
        return;
      }
      setter(file);
    }
  };

  const handleOtherDocuments = (e) => {
    const files = Array.from(e.target.files);
    if (otherDocuments.length + files.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }
    setOtherDocuments([...otherDocuments, ...files]);
  };

  const removeOtherDocument = (index) => {
    setOtherDocuments(otherDocuments.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!resume) {
      setError('Resume is required');
      return false;
    }
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
    if (!formData.coverLetterText) {
      setError('Cover letter is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Append files
      if (resume) formDataToSend.append('resume', resume);
      if (coverLetterFile) formDataToSend.append('coverLetterFile', coverLetterFile);
      if (transcript) formDataToSend.append('transcript', transcript);
      if (portfolio) formDataToSend.append('portfolio', portfolio);
      otherDocuments.forEach(file => {
        formDataToSend.append('otherDocuments', file);
      });
      
      // Append arrays
      formDataToSend.append('internshipId', id);
      formDataToSend.append('skills', JSON.stringify(skills.filter(s => s.trim())));
      formDataToSend.append('workExperience', JSON.stringify(workExperience));
      formDataToSend.append('projects', JSON.stringify(projects));

      const response = await axios.post('/api/applications/apply', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (success) {
    return (
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <h1>Application Submitted Successfully!</h1>
        <p>Your application for {internship?.title} at {internship?.organization?.name} has been submitted.</p>
        <div className="success-buttons">
          <button onClick={() => navigate(`/career/internships/${id}`)}>Back to Internship</button>
          <button onClick={() => navigate('/career/my-applications')}>View My Applications</button>
        </div>
      </div>
    );
  }

  return (
    <div className="application-portal">
      <header className="portal-header">
        <h1>Application for: {internship?.title}</h1>
        <p className="company-name">{internship?.organization?.name}</p>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      </header>

      <div className="portal-content">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          {/* Personal Information */}
          <section className="form-section">
            <h2>Personal Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>University ID *</label>
                <input type="text" name="universityId" value={formData.universityId} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select name="department" value={formData.department} onChange={handleInputChange} required>
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="EEE">Electrical & Electronic Engineering</option>
                  <option value="BBA">Business Administration</option>
                  <option value="Economics">Economics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Major *</label>
                <input type="text" name="major" value={formData.major} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select name="semester" value={formData.semester} onChange={handleInputChange} required>
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                    <option key={num} value={num}>{num}</option>
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
                </select>
              </div>
              <div className="form-group">
                <label>CGPA *</label>
                <input type="number" step="0.01" min="0" max="4" name="cgpa" value={formData.cgpa} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Expected Graduation</label>
                <input type="date" name="expectedGraduation" value={formData.expectedGraduation} onChange={handleInputChange} />
              </div>
            </div>
          </section>

          {/* Documents Section */}
          <section className="form-section">
            <h2>Documents</h2>
            <div className="documents-grid">
              <div className="document-upload">
                <label>Resume/CV *</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(setResume, e)} required />
                {resume && <div className="file-name">{resume.name}</div>}
              </div>
              <div className="document-upload">
                <label>Cover Letter (File)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(setCoverLetterFile, e)} />
                {coverLetterFile && <div className="file-name">{coverLetterFile.name}</div>}
              </div>
              <div className="document-upload">
                <label>Transcript</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(setTranscript, e)} />
                {transcript && <div className="file-name">{transcript.name}</div>}
              </div>
              <div className="document-upload">
                <label>Portfolio</label>
                <input type="file" accept=".pdf,.zip" onChange={(e) => handleFileChange(setPortfolio, e)} />
                {portfolio && <div className="file-name">{portfolio.name}</div>}
              </div>
              <div className="document-upload">
                <label>Other Documents (max 5)</label>
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip" onChange={handleOtherDocuments} />
                {otherDocuments.length > 0 && (
                  <div className="files-list">
                    {otherDocuments.map((file, idx) => (
                      <div key={idx} className="file-item">
                        {file.name}
                        <button type="button" onClick={() => removeOtherDocument(idx)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="form-section">
            <h2>Skills</h2>
            {skills.map((skill, index) => (
              <div key={index} className="skill-row">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => handleSkillChange(index, e.target.value)}
                  placeholder="e.g., JavaScript, Python, React"
                />
                {skills.length > 1 && (
                  <button type="button" onClick={() => removeSkill(index)}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addSkill}>+ Add Skill</button>
          </section>

          {/* Work Experience */}
          <section className="form-section">
            <h2>Work Experience</h2>
            {workExperience.map((exp, index) => (
              <div key={index} className="experience-card">
                <div className="card-header">
                  <h3>Experience #{index + 1}</h3>
                  {workExperience.length > 1 && (
                    <button type="button" onClick={() => removeExperience(index)}>Remove</button>
                  )}
                </div>
                <div className="form-grid">
                  <input type="text" placeholder="Company" value={exp.company} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} />
                  <input type="text" placeholder="Position" value={exp.position} onChange={(e) => handleExperienceChange(index, 'position', e.target.value)} />
                  <input type="text" placeholder="Duration" value={exp.duration} onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)} />
                  <textarea placeholder="Description" value={exp.description} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addExperience}>+ Add Experience</button>
          </section>

          {/* Projects */}
          <section className="form-section">
            <h2>Projects</h2>
            {projects.map((project, index) => (
              <div key={index} className="project-card">
                <div className="card-header">
                  <h3>Project #{index + 1}</h3>
                  {projects.length > 1 && (
                    <button type="button" onClick={() => removeProject(index)}>Remove</button>
                  )}
                </div>
                <div className="form-grid">
                  <input type="text" placeholder="Project Name" value={project.name} onChange={(e) => handleProjectChange(index, 'name', e.target.value)} />
                  <input type="text" placeholder="Technologies" value={project.technologies} onChange={(e) => handleProjectChange(index, 'technologies', e.target.value)} />
                  <input type="url" placeholder="Project Link" value={project.link} onChange={(e) => handleProjectChange(index, 'link', e.target.value)} />
                  <textarea placeholder="Description" value={project.description} onChange={(e) => handleProjectChange(index, 'description', e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addProject}>+ Add Project</button>
          </section>

          {/* Cover Letter */}
          <section className="form-section">
            <h2>Cover Letter *</h2>
            <textarea 
              name="coverLetterText" 
              value={formData.coverLetterText} 
              onChange={handleInputChange}
              rows="10"
              placeholder="Explain why you're interested in this position, how your skills match the requirements, and what you hope to gain from this internship..."
              required
            />
          </section>

          {/* Additional Info */}
          <section className="form-section">
            <h2>Additional Information</h2>
            <textarea 
              name="additionalInfo" 
              value={formData.additionalInfo} 
              onChange={handleInputChange}
              rows="5"
              placeholder="Any additional information you'd like to share..."
            />
          </section>

          {/* Submit */}
          <div className="submit-section">
            <div className="terms">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">I confirm all information is accurate</label>
            </div>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationPortal;