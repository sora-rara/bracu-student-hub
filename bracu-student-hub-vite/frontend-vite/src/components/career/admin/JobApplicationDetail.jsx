// src/components/career/admin/JobApplicationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const JobApplicationDetail = () => {
  const { jobId, applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [jobId, applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(
        `/api/jobs/admin/${jobId}/applications/${applicationId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const appData = response.data.data;
        setApplication(appData);
        setJob(appData.jobId);
        
        // Process student data
        const studentData = processStudentData(appData);
        setStudent(studentData);
      } else {
        setError(response.data.error || 'Failed to load application');
      }
    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Failed to load application details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processStudentData = (appData) => {
    const sources = {
      studentId: appData.studentId || {},
      applicationData: appData.applicationData || {},
      academicInfo: appData.academicInfo || {}
    };

    const getFirstValid = (values) => {
      for (let value of values) {
        if (value !== undefined && value !== null && value !== '' && value !== 'N/A') {
          return value;
        }
      }
      return 'N/A';
    };

    return {
      name: getFirstValid([
        sources.studentId.name,
        sources.applicationData.name,
        'N/A'
      ]),
      
      email: getFirstValid([
        sources.studentId.email,
        sources.applicationData.email,
        'N/A'
      ]),
      
      phoneNumber: getFirstValid([
        sources.applicationData.phoneNumber,
        sources.studentId.phoneNumber,
        'N/A'
      ]),
      
      universityId: getFirstValid([
        sources.academicInfo.universityId,
        sources.studentId.universityId,
        'N/A'
      ]),
      
      major: getFirstValid([
        sources.academicInfo.major,
        sources.studentId.major,
        'N/A'
      ]),
      
      department: getFirstValid([
        sources.studentId.department,
        'N/A'
      ]),
      
      year: getFirstValid([
        sources.studentId.year,
        'N/A'
      ]),
      
      cgpa: sources.academicInfo.currentGPA || sources.studentId.cgpa || 'N/A'
    };
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'pending',
      submitted: 'submitted',
      reviewed: 'reviewed',
      shortlisted: 'shortlisted',
      'interview-scheduled': 'shortlisted',
      accepted: 'accepted',
      rejected: 'rejected',
      withdrawn: 'withdrawn'
    };
    
    const statusText = {
      pending: 'Pending',
      submitted: 'Submitted',
      reviewed: 'Reviewed',
      shortlisted: 'Shortlisted',
      'interview-scheduled': 'Interview Scheduled',
      accepted: 'Accepted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    
    return (
      <span className={`status-badge badge-${colors[status] || 'default'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      
      const response = await axios.put(
         `/api/jobs/admin/${jobId}/applications/${applicationId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('Application status updated successfully');
        fetchApplication();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update application status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteApplication = async () => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/jobs/admin/${jobId}/applications/${applicationId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('Application deleted successfully');
        navigate(`/admin/career/jobs/applications/${jobId}`);
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    }
  };

  const renderStudentInfo = () => {
    if (!student) return <p className="no-data">No student information available</p>;
    
    return (
      <div className="student-info-grid">
        {student.name !== 'N/A' && (
          <div className="info-item">
            <span className="info-label">Name:</span>
            <span className="info-value">{student.name}</span>
          </div>
        )}
        
        {student.email !== 'N/A' && (
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">
              <a href={`mailto:${student.email}`}>{student.email}</a>
            </span>
          </div>
        )}
        
        {student.phoneNumber !== 'N/A' && (
          <div className="info-item">
            <span className="info-label">Phone:</span>
            <span className="info-value">
              <a href={`tel:${student.phoneNumber}`}>{student.phoneNumber}</a>
            </span>
          </div>
        )}
        
        {student.universityId !== 'N/A' && (
          <div className="info-item">
            <span className="info-label">University ID:</span>
            <span className="info-value">{student.universityId}</span>
          </div>
        )}
        
        {student.major !== 'N/A' && (
          <div className="info-item">
            <span className="info-label">Major:</span>
            <span className="info-value">{student.major}</span>
          </div>
        )}
        
        {student.department !== 'N/A' && (
          <div className="info-item">
            <span className="info-label">Department:</span>
            <span className="info-value">{student.department}</span>
          </div>
        )}
        
        {student.year !== 'N/A' && (
          <div className="info-item">
            <span className="info-label">Year:</span>
            <span className="info-value">{student.year}</span>
          </div>
        )}
        
        {student.cgpa !== 'N/A' && (
          <div className="info-item">
            <span className="info-label">GPA:</span>
            <span className="info-value">
              {typeof student.cgpa === 'number' ? student.cgpa.toFixed(2) : student.cgpa}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderApplicationData = () => {
    if (!application?.applicationData) return <p className="no-data">No application data available</p>;
    
    const appData = application.applicationData;
    
    return (
      <div className="application-data-grid">
        {appData.availability && (
          <div className="info-item full-width">
            <span className="info-label">Availability:</span>
            <span className="info-value">{appData.availability}</span>
          </div>
        )}
        
        {appData.preferredHours && (
          <div className="info-item">
            <span className="info-label">Preferred Hours:</span>
            <span className="info-value">{appData.preferredHours}</span>
          </div>
        )}
        
        {appData.expectedSalary && (
          <div className="info-item">
            <span className="info-label">Expected Salary:</span>
            <span className="info-value">${appData.expectedSalary}/hour</span>
          </div>
        )}
        
        {appData.relevantSkills?.length > 0 && (
          <div className="info-item full-width">
            <span className="info-label">Relevant Skills:</span>
            <div className="skills-tags">
              {appData.relevantSkills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}
        
        {appData.previousExperience && (
          <div className="info-item full-width">
            <span className="info-label">Previous Experience:</span>
            <div className="experience-text">
              {appData.previousExperience}
            </div>
          </div>
        )}
        
        {appData.additionalInfo && (
          <div className="info-item full-width">
            <span className="info-label">Additional Information:</span>
            <div className="additional-info-text">
              {appData.additionalInfo}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCoverLetter = () => {
    if (!application?.applicationData?.coverLetter) {
      return <p className="no-data">No cover letter provided</p>;
    }
    
    return (
      <div className="cover-letter-section">
        <div className="cover-letter-text">
          {application.applicationData.coverLetter}
        </div>
        <div className="word-count">
          {application.applicationData.coverLetter.split(/\s+/).filter(w => w.length > 0).length} words
        </div>
      </div>
    );
  };

  const renderReferences = () => {
    if (!application?.applicationData?.references || application.applicationData.references.length === 0) {
      return <p className="no-data">No references provided</p>;
    }
    
    return (
      <div className="references-list">
        {application.applicationData.references.map((ref, index) => (
          <div key={index} className="reference-card">
            <div className="card-header">
              <h3>Reference #{index + 1}</h3>
            </div>
            <div className="reference-details">
              {ref.name && (
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{ref.name}</span>
                </div>
              )}
              {ref.email && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">
                    <a href={`mailto:${ref.email}`}>{ref.email}</a>
                  </span>
                </div>
              )}
              {ref.phone && (
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">
                    <a href={`tel:${ref.phone}`}>{ref.phone}</a>
                  </span>
                </div>
              )}
              {ref.relationship && (
                <div className="info-item">
                  <span className="info-label">Relationship:</span>
                  <span className="info-value">{ref.relationship}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading application details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <div className="button-group">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            ← Go Back
          </button>
          <button onClick={fetchApplication} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-application-detail-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="header-left">
          <h1>Job Application Details</h1>
          <p className="subtitle">
            {job?.title || 'Job Application'}
          </p>
        </div>
        <div className="header-right">
          <button 
            onClick={() => navigate(`/admin/career/jobs/applications/${jobId}`)}
            className="btn-back"
          >
            ← Back to Applications
          </button>
        </div>
      </div>

      {/* Application Info Card */}
      <div className="application-info-card">
        <div className="application-header">
          <h2>Application #{application?._id?.slice(-6) || 'N/A'}</h2>
          <div className="status-section">
            {getStatusBadge(application?.status)}
            <select
              value={application?.status || 'pending'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="status-select"
              disabled={updating}
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview-scheduled">Interview Scheduled</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        <div className="application-dates">
          <div className="date-item">
            <span className="date-label">Submitted:</span>
            <span className="date-value">
              {formatDate(application?.submittedAt || application?.createdAt)}
            </span>
          </div>
          {application?.reviewedAt && (
            <div className="date-item">
              <span className="date-label">Reviewed:</span>
              <span className="date-value">
                {formatDate(application.reviewedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Student Information */}
      <div className="detail-section">
        <h3 className="section-title">Student Information</h3>
        {renderStudentInfo()}
      </div>

      {/* Application Data */}
      <div className="detail-section">
        <h3 className="section-title">Application Data</h3>
        {renderApplicationData()}
      </div>

      {/* Cover Letter */}
      <div className="detail-section">
        <h3 className="section-title">Cover Letter</h3>
        {renderCoverLetter()}
      </div>

      {/* References */}
      <div className="detail-section">
        <h3 className="section-title">References</h3>
        {renderReferences()}
      </div>

      {/* Notes Section */}
      <div className="detail-section">
        <h3 className="section-title">Notes & Comments</h3>
        <div className="notes-section">
          <textarea 
            className="notes-textarea" 
            placeholder="Add notes about this application..."
            rows={4}
          />
          <button className="btn-primary">Add Note</button>
        </div>
        
        {application?.notes?.length > 0 && (
          <div className="existing-notes">
            {application.notes.map((note, index) => (
              <div key={index} className="note-item">
                <div className="note-content">{note.content}</div>
                <div className="note-meta">
                  <span className="note-date">{formatDate(note.addedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="action-section">
        <div className="button-group">
          <button 
            onClick={() => navigate(`/admin/career/jobs/applications/${jobId}`)}
            className="btn-secondary"
          >
            ← Back to List
          </button>
          <button 
            onClick={() => window.print()}
            className="btn-secondary"
          >
            🖨️ Print
          </button>
          <button 
            onClick={() => {
              const email = student.email !== 'N/A' ? student.email : '';
              if (email) {
                window.location.href = `mailto:${email}?subject=Update on your job application`;
              } else {
                alert('No email address available for this student');
              }
            }}
            className="btn-secondary"
          >
            📧 Email Student
          </button>
          <button 
            onClick={handleDeleteApplication}
            className="btn-danger"
          >
            🗑️ Delete Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationDetail;