// src/components/career/student/ApplyModal.jsx - NEW FILE
import React, { useState } from 'react';
import axios from '../../../api/axios';
import '../../../App.css';

const ApplyModal = ({ internship, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    resumeLink: '',
    coverLetter: '',
    additionalInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/applications/apply', {
        internshipId: internship._id,
        ...formData
      });

      if (response.data.success) {
        alert('Application submitted successfully!');
        onSuccess();
        onClose();
      } else {
        setError(response.data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content apply-modal">
        <div className="modal-header">
          <h2>Apply for {internship.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="apply-company-info">
            <div className="company-logo-small">
              {internship.organization?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h3>{internship.organization?.name}</h3>
              <p className="company-industry">{internship.organization?.industry}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="resumeLink">
                Resume Link (Google Drive, Dropbox, etc.)
                <span className="required">*</span>
              </label>
              <input
                type="url"
                id="resumeLink"
                name="resumeLink"
                value={formData.resumeLink}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
                required
              />
              <small className="help-text">
                Make sure your resume is publicly accessible
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="coverLetter">
                Cover Letter
                <span className="required">*</span>
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                placeholder="Explain why you're interested in this position..."
                rows="6"
                required
              />
              <small className="help-text">
                Customize your cover letter for this specific internship
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="additionalInfo">
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                placeholder="Any additional information you'd like to share..."
                rows="4"
              />
              <small className="help-text">
                Portfolio links, GitHub profile, relevant coursework, etc.
              </small>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyModal;