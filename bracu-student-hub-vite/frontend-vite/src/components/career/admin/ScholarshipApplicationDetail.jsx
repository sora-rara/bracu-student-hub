// src/components/career/admin/ScholarshipApplicationDetail.jsx - PRODUCTION READY
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import '../../../App.css';

const ScholarshipApplicationDetail = () => {
  const { scholarshipId, applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [scholarship, setScholarship] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [scholarshipId, applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(
        `/api/career/scholarships/admin/${scholarshipId}/applications/${applicationId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const appData = response.data.data;
        setApplication(appData);
        setScholarship(appData.scholarshipId);
        
        const studentData = processCompleteStudentData(appData);
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

  const processCompleteStudentData = (appData) => {
    const sources = {
      studentId: appData.studentId || {},
      applicationData: appData.applicationData || {},
      academicInfo: appData.academicInfo || {},
      root: appData.student || appData.user || {},
      userProfile: appData.studentProfile || appData.userProfile || {}
    };
    
    const getFirstValid = (values) => {
      for (let value of values) {
        if (value !== undefined && value !== null && value !== '' && value !== 'N/A') {
          return value;
        }
      }
      return 'N/A';
    };

    const parseGPA = (values) => {
      for (let value of values) {
        if (value !== undefined && value !== null && value !== '') {
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) {
            return parsed;
          }
        }
      }
      return 'N/A';
    };

    return {
      name: getFirstValid([
        sources.studentId.name,
        sources.applicationData.name,
        sources.root.name,
        sources.userProfile.name,
        sources.studentId.fullName,
        'N/A'
      ]),
      
      email: getFirstValid([
        sources.studentId.email,
        sources.applicationData.email,
        sources.root.email,
        sources.userProfile.email,
        'N/A'
      ]),
      
      universityId: getFirstValid([
        sources.academicInfo.universityId,
        sources.applicationData.universityId,
        sources.studentId.universityId,
        sources.root.universityId,
        sources.userProfile.universityId,
        sources.studentId.studentId,
        sources.applicationData.studentId,
        'N/A'
      ]),
      
      phoneNumber: getFirstValid([
        sources.studentId.phoneNumber,
        sources.applicationData.phoneNumber,
        sources.root.phoneNumber,
        sources.userProfile.phoneNumber,
        sources.studentId.phone,
        sources.applicationData.phone,
        sources.root.phone,
        sources.userProfile.phone,
        sources.studentId.contactNumber,
        sources.applicationData.contactNumber,
        sources.userProfile.contactNumber,
        sources.studentId.mobile,
        sources.applicationData.mobile,
        sources.userProfile.mobile,
        'N/A'
      ]),
      
      major: getFirstValid([
        sources.academicInfo.major,
        sources.applicationData.major,
        sources.studentId.major,
        sources.root.major,
        sources.userProfile.major,
        sources.academicInfo.fieldOfStudy,
        sources.applicationData.fieldOfStudy,
        sources.studentId.fieldOfStudy,
        'N/A'
      ]),
      
      department: getFirstValid([
        sources.studentId.department,
        sources.applicationData.department,
        sources.root.department,
        sources.userProfile.department,
        sources.academicInfo.department,
        sources.studentId.departmentName,
        sources.userProfile.departmentName,
        'N/A'
      ]),
      
      year: getFirstValid([
        sources.studentId.year,
        sources.applicationData.year,
        sources.root.year,
        sources.userProfile.year,
        sources.studentId.yearOfStudy,
        sources.userProfile.yearOfStudy,
        sources.studentId.currentYear,
        sources.userProfile.currentYear,
        sources.applicationData.yearLevel,
        'N/A'
      ]),
      
      semester: getFirstValid([
        sources.studentId.semester,
        sources.applicationData.semester,
        sources.userProfile.semester,
        sources.studentId.currentSemester,
        sources.userProfile.currentSemester,
        ''
      ]),
      
      cgpa: parseGPA([
        sources.academicInfo.currentGPA,
        sources.applicationData.cgpa,
        sources.studentId.cgpa,
        sources.userProfile.cgpa,
        sources.academicInfo.gpa,
        sources.applicationData.gpa,
        sources.studentId.gpa,
        sources.userProfile.gpa,
        sources.academicInfo.cumulativeGPA,
        sources.applicationData.cumulativeGPA
      ]),
      
      expectedGraduation: getFirstValid([
        sources.applicationData.expectedGraduation,
        sources.studentId.expectedGraduation,
        sources.userProfile.expectedGraduation,
        'N/A'
      ]),
      
      address: getFirstValid([
        sources.studentId.address,
        sources.applicationData.address,
        sources.userProfile.address,
        sources.root.address,
        'N/A'
      ]),
      
      dateOfBirth: getFirstValid([
        sources.studentId.dateOfBirth,
        sources.applicationData.dateOfBirth,
        sources.userProfile.dateOfBirth,
        sources.root.dateOfBirth,
        sources.studentId.dob,
        sources.userProfile.dob,
        'N/A'
      ]),
      
      nationality: getFirstValid([
        sources.studentId.nationality,
        sources.applicationData.nationality,
        sources.userProfile.nationality,
        sources.root.nationality,
        'N/A'
      ]),
      
      enrollmentStatus: getFirstValid([
        sources.studentId.enrollmentStatus,
        sources.applicationData.enrollmentStatus,
        sources.userProfile.enrollmentStatus,
        'N/A'
      ]),
      
      faculty: getFirstValid([
        sources.studentId.faculty,
        sources.applicationData.faculty,
        sources.userProfile.faculty,
        sources.academicInfo.faculty,
        'N/A'
      ]),
      
      program: getFirstValid([
        sources.studentId.program,
        sources.applicationData.program,
        sources.userProfile.program,
        sources.academicInfo.program,
        'N/A'
      ])
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
      accepted: 'accepted',
      rejected: 'rejected',
      withdrawn: 'withdrawn'
    };
    
    const statusText = {
      pending: 'Pending',
      submitted: 'Submitted',
      reviewed: 'Reviewed',
      shortlisted: 'Shortlisted',
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
      const response = await axios.put(
        `/api/career/scholarships/admin/${scholarshipId}/applications/${applicationId}/status`,
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
    }
  };

  const handleDeleteApplication = async () => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/career/scholarships/admin/${scholarshipId}/applications/${applicationId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('Application deleted successfully');
        navigate(`/admin/career/scholarships/applications/${scholarshipId}`);
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    }
  };

  const renderStudentInfo = () => {
    if (!student) return <p className="no-data">No student information available</p>;
    
    const dataRows = [
      { label: 'Name', value: student.name, type: 'text' },
      { label: 'Email', value: student.email, type: 'email' },
      { label: 'University ID', value: student.universityId, type: 'text' },
      { label: 'Phone', value: student.phoneNumber, type: 'text' },
      { label: 'Major', value: student.major, type: 'text' },
      { label: 'Department', value: student.department, type: 'text' },
      { label: 'Year', value: student.year, type: 'text' },
      { label: 'Semester', value: student.semester, type: 'text' },
      { label: 'GPA', value: typeof student.cgpa === 'number' ? student.cgpa.toFixed(2) : student.cgpa, type: 'text' },
      { label: 'Expected Graduation', value: student.expectedGraduation, type: 'text' },
      { label: 'Date of Birth', value: formatDate(student.dateOfBirth), type: 'text' },
      { label: 'Nationality', value: student.nationality, type: 'text' },
      { label: 'Enrollment Status', value: student.enrollmentStatus, type: 'text' },
      { label: 'Faculty', value: student.faculty, type: 'text' },
      { label: 'Program', value: student.program, type: 'text' },
      { label: 'Address', value: student.address, type: 'full-width' }
    ];
    
    return (
      <div className="student-info-grid">
        {dataRows.map((row, index) => {
          if (row.value === 'N/A' || row.value === '') return null;
          
          if (row.type === 'full-width') {
            return (
              <div key={index} className="info-item full-width">
                <span className="info-label">{row.label}:</span>
                <span className="info-value">{row.value}</span>
              </div>
            );
          }
          
          let displayValue = row.value;
          if (row.type === 'email' && row.value !== 'N/A') {
            displayValue = <a href={`mailto:${row.value}`}>{row.value}</a>;
          } else if (row.type === 'phone' && row.value !== 'N/A') {
            displayValue = <a href={`tel:${row.value}`}>{row.value}</a>;
          }
          
          return (
            <div key={index} className="info-item">
              <span className="info-label">{row.label}:</span>
              <span className="info-value">{displayValue}</span>
            </div>
          );
        })}
        
        {dataRows.every(row => row.value === 'N/A' || row.value === '') && (
          <div className="info-item full-width">
            <span className="info-value">No student information found in application data</span>
          </div>
        )}
      </div>
    );
  };

  const renderAcademicInfo = () => {
    if (!application) return <p className="no-data">No application data available</p>;
    
    const academicInfo = application.academicInfo || {};
    const appData = application.applicationData || {};
    
    const hasAcademicData = 
      academicInfo.currentGPA || 
      academicInfo.major || 
      academicInfo.universityId ||
      appData.cgpa ||
      appData.major ||
      appData.universityId;
    
    if (!hasAcademicData) {
      return <p className="no-data">No academic information provided</p>;
    }
    
    return (
      <div className="academic-info">
        <div className="info-item">
          <span className="info-label">Current GPA:</span>
          <span className="info-value">
            {typeof academicInfo.currentGPA === 'number' 
              ? academicInfo.currentGPA.toFixed(2) 
              : academicInfo.currentGPA || (typeof appData.cgpa === 'number' ? appData.cgpa.toFixed(2) : appData.cgpa) || 'N/A'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Major:</span>
          <span className="info-value">
            {academicInfo.major || appData.major || 'N/A'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">University ID:</span>
          <span className="info-value">
            {academicInfo.universityId || appData.universityId || 'N/A'}
          </span>
        </div>
        {academicInfo.academicAchievements?.length > 0 && (
          <div className="info-item full-width">
            <span className="info-label">Academic Achievements:</span>
            <ul className="achievements-list">
              {academicInfo.academicAchievements.map((achievement, index) => (
                <li key={index}>{achievement}</li>
              ))}
            </ul>
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

  const renderExtracurriculars = () => {
    if (!application) return <p className="no-data">No application data available</p>;
    
    const extracurriculars = application.extracurriculars || [];
    const workExperience = application.workExperience || [];
    const researchProjects = application.researchProjects || [];
    
    const allActivities = [...extracurriculars, ...workExperience, ...researchProjects];
    
    if (allActivities.length === 0) {
      const appData = application.applicationData || {};
      if (appData.workExperience || appData.extracurricularActivities) {
        return (
          <div className="extracurriculars-list">
            <div className="experience-card">
              <div className="card-header">
                <h3>Activities from Application Form</h3>
              </div>
              <div className="additional-info-text">
                <strong>Work Experience:</strong> {appData.workExperience || 'None provided'}
                <br /><br />
                <strong>Extracurricular Activities:</strong> {appData.extracurricularActivities || 'None provided'}
              </div>
            </div>
          </div>
        );
      }
      return <p className="no-data">No extracurricular activities provided</p>;
    }
    
    return (
      <div className="extracurriculars-list">
        {allActivities.map((activity, index) => (
          <div key={index} className="experience-card">
            <div className="card-header">
              <h3>
                {activity.position || activity.title || 'Activity'} - 
                {activity.organization || activity.company || 'Organization'}
              </h3>
            </div>
            <div className="activity-details">
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{activity.activityType || activity.type || 'Activity'}</span>
              </div>
              {activity.description && (
                <div className="info-item full-width">
                  <span className="info-label">Description:</span>
                  <span className="info-value">{activity.description}</span>
                </div>
              )}
              {activity.startDate && (
                <div className="info-item">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">
                    {formatDate(activity.startDate)} - {activity.endDate ? formatDate(activity.endDate) : 'Present'}
                  </span>
                </div>
              )}
              {activity.responsibilities && (
                <div className="info-item full-width">
                  <span className="info-label">Responsibilities:</span>
                  <span className="info-value">{activity.responsibilities}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEssays = () => {
    if (!application) return <p className="no-data">No application data available</p>;
    
    let essays = application.essays || [];
    
    if (essays.length === 0) {
      const individualEssays = [];
      
      if (application.essayText) {
        individualEssays.push({
          question: 'Why do you deserve this scholarship?',
          response: application.essayText,
          wordCount: (application.essayText || '').split(/\s+/).filter(w => w.length > 0).length
        });
      }
      
      if (application.financialNeed) {
        individualEssays.push({
          question: 'Statement of Financial Need',
          response: application.financialNeed,
          wordCount: (application.financialNeed || '').split(/\s+/).filter(w => w.length > 0).length
        });
      }
      
      if (application.careerGoals) {
        individualEssays.push({
          question: 'Career Goals & Aspirations',
          response: application.careerGoals,
          wordCount: (application.careerGoals || '').split(/\s+/).filter(w => w.length > 0).length
        });
      }
      
      if (application.extracurricular) {
        individualEssays.push({
          question: 'Extracurricular Activities & Leadership',
          response: application.extracurricular,
          wordCount: (application.extracurricular || '').split(/\s+/).filter(w => w.length > 0).length
        });
      }
      
      essays = individualEssays;
    }
    
    if (essays.length === 0) {
      const appData = application.applicationData || {};
      if (appData.personalStatement || appData.statementOfPurpose) {
        essays = [{
          question: 'Personal Statement',
          response: appData.personalStatement || appData.statementOfPurpose,
          wordCount: ((appData.personalStatement || appData.statementOfPurpose) || '').split(/\s+/).filter(w => w.length > 0).length
        }];
      }
    }
    
    if (essays.length === 0) {
      return <p className="no-data">No essays provided</p>;
    }
    
    return (
      <div className="essays-container">
        {essays.map((essay, index) => (
          <div key={index} className="essay-item">
            <h4 className="essay-question">{essay.question}</h4>
            <div className="essay-response">
              {essay.response || 'No response provided'}
            </div>
            {(essay.wordCount > 0) && (
              <div className="essay-meta">
                <span className="word-count">{essay.wordCount} words</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderReferences = () => {
    if (!application) return <p className="no-data">No application data available</p>;
    
    let references = application.references || [];
    
    if (references.length === 0) {
      const appData = application.applicationData || {};
      if (appData.references) {
        references = Array.isArray(appData.references) ? appData.references : [appData.references];
      }
    }
    
    if (references.length === 0) {
      return <p className="no-data">No references provided</p>;
    }
    
    return (
      <div className="references-list">
        {references.map((reference, index) => (
          <div key={index} className="reference-card">
            <div className="card-header">
              <h3>Reference {index + 1}</h3>
            </div>
            <div className="reference-details">
              {reference.name && (
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{reference.name}</span>
                </div>
              )}
              {reference.position && (
                <div className="info-item">
                  <span className="info-label">Position:</span>
                  <span className="info-value">{reference.position}</span>
                </div>
              )}
              {reference.organization && (
                <div className="info-item">
                  <span className="info-label">Organization:</span>
                  <span className="info-value">{reference.organization}</span>
                </div>
              )}
              {reference.email && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">
                    <a href={`mailto:${reference.email}`}>{reference.email}</a>
                  </span>
                </div>
              )}
              {reference.phone && (
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">
                    <a href={`tel:${reference.phone}`}>{reference.phone}</a>
                  </span>
                </div>
              )}
              {reference.relationship && (
                <div className="info-item">
                  <span className="info-label">Relationship:</span>
                  <span className="info-value">{reference.relationship}</span>
                </div>
              )}
              {reference.address && (
                <div className="info-item full-width">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{reference.address}</span>
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
    <div className="application-detail-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="header-left">
          <h1>Application Details</h1>
          <p className="subtitle">
            {scholarship?.title || 'Scholarship Application'}
          </p>
        </div>
        <div className="header-right">
          <button 
            onClick={() => navigate(`/admin/career/scholarships/applications/${scholarshipId}`)}
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
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
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
          {application?.updatedAt && (
            <div className="date-item">
              <span className="date-label">Last Updated:</span>
              <span className="date-value">
                {formatDate(application.updatedAt)}
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

      {/* Academic Information */}
      <div className="detail-section">
        <h3 className="section-title">Academic Information</h3>
        {renderAcademicInfo()}
      </div>

      {/* Extracurricular Activities */}
      <div className="detail-section">
        <h3 className="section-title">Extracurricular Activities & Work Experience</h3>
        {renderExtracurriculars()}
      </div>

      {/* Essays */}
      <div className="detail-section">
        <h3 className="section-title">Essays & Statements</h3>
        {renderEssays()}
      </div>

      {/* References */}
      <div className="detail-section">
        <h3 className="section-title">References</h3>
        {renderReferences()}
      </div>

      {/* Documents */}
      {application?.documents && application.documents.length > 0 && (
        <div className="detail-section">
          <h3 className="section-title">Submitted Documents</h3>
          <div className="documents-list">
            {application.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <div className="info-item">
                  <span className="info-label">Document {index + 1}:</span>
                  <span className="info-value">
                    {doc.filename || doc.name || `Document ${index + 1}`}
                    {doc.fileType && ` (${doc.fileType})`}
                  </span>
                </div>
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    View Document
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="action-section">
        <div className="button-group">
          <button 
            onClick={() => navigate(`/admin/career/scholarships/applications/${scholarshipId}`)}
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

export default ScholarshipApplicationDetail;