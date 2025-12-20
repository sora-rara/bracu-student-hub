import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GPAForm from './GPAForm.jsx';
import apiService from '../../../services/api.jsx';
import authService from '../../../services/auth.jsx';

function GPACalculator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [currentCGPA, setCurrentCGPA] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch current CGPA on component mount
  useEffect(() => {
    if (user) {
      fetchCurrentCGPA();
    }
  }, [user]);

  const fetchCurrentCGPA = async () => {
    try {
      const response = await apiService.calculateCGPA();
      if (response.success && response.data) {
        setCurrentCGPA(response.data.cgpa || 0);
      }
    } catch (err) {
      console.error('Failed to fetch current CGPA:', err);
    }
  };

  const handleSubmit = async (semesterData) => {
    if (!user) {
      setError('Please log in to save semester grades.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await apiService.addSemesterGrades(semesterData);

      if (result.success) {
        setSuccess('✅ Semester saved successfully to your profile!');

        // Refresh current CGPA
        await fetchCurrentCGPA();

        // Reset form
        setPreviewData(null);
        setShowPreview(false);

        // Redirect after delay
        setTimeout(() => {
          setSuccess('');
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.message || 'Failed to save semester');
      }
    } catch (err) {
      console.error('Add semester error:', err);
      setError(err.message || 'Failed to save semester. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = (preview) => {
    setPreviewData(preview);
    setShowPreview(true);
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  if (!user) {
    return (
      <div className="container">
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>You need to be logged in to use the GPA Calculator.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="gpa-calculator-header mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="mb-0">GPA Calculator</h1>
          <div className="current-cgpa-badge">
            <span className="badge bg-info fs-6">
              Current CGPA: {currentCGPA.toFixed(2)}
            </span>
          </div>
        </div>

        <p className="subtitle text-muted">
          {showPreview ? 'Review and save your semester GPA' : 'Enter your semester grades to calculate GPA'}
        </p>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline"
            onClick={() => navigate('/dashboard')}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
          </button>
          {showPreview && (
            <button
              className="btn btn-outline"
              onClick={handleCancelPreview}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Back to Calculator
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Success!</strong> {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Compact Section with Grade Scale and How It Works */}
      <div className="compact-section row g-3 mb-4">
        {/* Left Column: Grade Table */}
        <div className="col-12 col-md-6">
          <div className="card mb-3 shadow-sm h-100">
            <div className="card-body py-3">
              <h5 className="card-title mb-2">
                <i className="bi bi-award me-2"></i>
                Grade Point Scale
              </h5>

              <table className="table table-bordered table-sm text-center small mb-0">
                <tbody>
                  <tr><td>A+</td><td>4.0</td><td>C+</td><td>2.3</td></tr>
                  <tr><td>A</td><td>4.0</td><td>C</td><td>2.0</td></tr>
                  <tr><td>A-</td><td>3.7</td><td>C-</td><td>1.7</td></tr>
                  <tr><td>B+</td><td>3.3</td><td>D+</td><td>1.3</td></tr>
                  <tr><td>B</td><td>3.0</td><td>D</td><td>1.0</td></tr>
                  <tr><td>B-</td><td>2.7</td><td>F</td><td>0.0</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: How It Works */}
        <div className="col-12 col-md-6">
          <div className="card mb-3 shadow-sm h-50">
            <div className="card-body py-3">
              <h5 className="card-title mb-3">
                <i className="bi bi-diagram-3 me-2"></i>
                How it Works
              </h5>

              <div className="row text-center g-2">
                {/* Step 1 */}
                <div className="col-4">
                  <div className={`step compact-step ${!showPreview ? 'active' : 'completed'}`}>
                    <div className="step-icon small-icon mb-1">
                      <i className="bi bi-input-cursor-text"></i>
                    </div>
                    <div className="step-number small-number">1</div>
                    <div className="step-title small-title">Enter Grades</div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="col-4">
                  <div className={`step compact-step ${showPreview ? 'active' : ''}`}>
                    <div className="step-icon small-icon mb-1">
                      <i className="bi bi-eye"></i>
                    </div>
                    <div className="step-number small-number">2</div>
                    <div className="step-title small-title">Preview & Calculate</div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="col-4">
                  <div className="step compact-step">
                    <div className="step-icon small-icon mb-1">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="step-number small-number">3</div>
                    <div className="step-title small-title">Save or Discard</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="row">
        <div className="col-lg-8">
          <GPAForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/dashboard')}
            onCalculate={handleCalculate}
            showPreview={showPreview}
            loading={loading}
            existingCGPA={currentCGPA}
          />
        </div>

        <div className="col-lg-4">
          <div className="info-card card h-100">
            <div className="card-body">
              <h4 className="card-title">
                <i className="bi bi-lightbulb me-2"></i>
                Quick Tips
              </h4>

              <div className="tips-list mt-3">
                <div className="tip-item mb-3">
                  <div className="tip-icon">
                    <i className="bi bi-check-circle-fill text-success"></i>
                  </div>
                  <div className="tip-content">
                    <h6>Required Fields</h6>
                    <p className="mb-0 small">Only course code is required. Course name is optional.</p>
                  </div>
                </div>

                <div className="tip-item mb-3">
                  <div className="tip-icon">
                    <i className="bi bi-calculator-fill text-primary"></i>
                  </div>
                  <div className="tip-content">
                    <h6>Calculate First</h6>
                    <p className="mb-0 small">Always preview your GPA before saving to your profile.</p>
                  </div>
                </div>

                <div className="tip-item mb-3">
                  <div className="tip-icon">
                    <i className="bi bi-arrow-repeat text-info"></i>
                  </div>
                  <div className="tip-content">
                    <h6>Edit Anytime</h6>
                    <p className="mb-0 small">You can edit or delete semesters from your dashboard.</p>
                  </div>
                </div>

                <div className="tip-item">
                  <div className="tip-icon">
                    <i className="bi bi-graph-up text-warning"></i>
                  </div>
                  <div className="tip-content">
                    <h6>Track Progress</h6>
                    <p className="mb-0 small">Your CGPA updates automatically when you add new semesters.</p>
                  </div>
                </div>
              </div>

              {previewData && (
                <div className="quick-preview mt-4 p-3 border rounded">
                  <h6>Current Preview:</h6>
                  <div className="d-flex justify-content-between">
                    <span>Semester GPA:</span>
                    <strong>{previewData.semesterGPA?.toFixed(2) || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Projected CGPA:</span>
                    <strong>{previewData.projectedCGPA?.toFixed(2) || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Total Credits:</span>
                    <strong>{previewData.totalCredits || 0}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GPACalculator;