import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api.jsx'; // Make sure this is imported

const gradePoints = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0
};

const gradeOptions = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
const semesterOptions = ['Spring', 'Summer', 'Fall'];

function GPAForm({
  onSubmit,
  onCancel,
  onCalculate,
  showPreview,
  loading,
  existingCGPA = 0,
  existingCredits = 0, // NEW: Actual existing credits
  existingSemestersCount = 0, // NEW: Actual semester count
  existingDataLoading = false // NEW: Loading state for existing data
}) {
  const [formData, setFormData] = useState({
    semester: 'Fall',
    year: new Date().getFullYear(),
    courses: [
      { courseCode: '', courseName: '', creditHours: 3, grade: 'A' }
    ]
  });
  const [error, setError] = useState('');
  const [calculatedData, setCalculatedData] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [retakeWarning, setRetakeWarning] = useState(null);
  const [isCheckingRetakes, setIsCheckingRetakes] = useState(false);
  const [projectionNote, setProjectionNote] = useState(''); // NEW: For projection explanation

  // NEW: Check for retakes
  const checkForRetakes = async () => {
    if (!formData.courses || formData.courses.length === 0) return;

    // Check if any course has a code
    const hasCourseCodes = formData.courses.some(c => c.courseCode.trim() !== '');
    if (!hasCourseCodes) return;

    setIsCheckingRetakes(true);
    try {
      const response = await apiService.checkRetakes({
        courses: formData.courses,
        semester: formData.semester,
        year: formData.year
      });

      if (response.success && response.data.hasRetakes) {
        setRetakeWarning({
          show: true,
          courses: response.data.retakes,
          count: response.data.retakeCount,
          message: `${response.data.retakeCount} course(s) are being retaken. The latest grade will be used for CGPA calculation.`
        });
      } else {
        setRetakeWarning(null);
      }
    } catch (err) {
      console.error('Error checking retakes:', err);
      // Don't show error to user, just silently fail
    } finally {
      setIsCheckingRetakes(false);
    }
  };

  // Check for retakes when courses change
  useEffect(() => {
    if (!previewMode) {
      const timer = setTimeout(() => {
        checkForRetakes();
      }, 500); // Debounce to avoid too many API calls

      return () => clearTimeout(timer);
    }
  }, [formData.courses, formData.semester, formData.year]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setRetakeWarning(null); // Clear warning when semester/year changes
  };

  const handleCourseChange = (index, field, value) => {
    const newCourses = [...formData.courses];
    newCourses[index][field] = value;
    setFormData({ ...formData, courses: newCourses });
    // Clear retake warning when courses change
    if (field === 'courseCode') {
      setRetakeWarning(null);
    }
  };

  const addCourse = () => {
    setFormData({
      ...formData,
      courses: [
        ...formData.courses,
        { courseCode: '', courseName: '', creditHours: 3, grade: 'A' }
      ]
    });
  };

  const removeCourse = (index) => {
    if (formData.courses.length > 1) {
      const newCourses = formData.courses.filter((_, i) => i !== index);
      setFormData({ ...formData, courses: newCourses });
      setRetakeWarning(null); // Re-check retakes
    }
  };

  const calculateGPA = () => {
    // Validate course codes
    const invalidCourse = formData.courses.find(course => {
      const trimmedCode = course.courseCode ? course.courseCode.trim() : '';
      return !trimmedCode || !course.grade || !course.creditHours;
    });

    if (invalidCourse) {
      setError('Each course must have a valid course code, credit hours, and grade. Course name is optional.');
      return null;
    }

    // Calculate semester GPA
    let totalPoints = 0;
    let totalCredits = 0;

    formData.courses.forEach(course => {
      const points = gradePoints[course.grade] || 0;
      totalPoints += points * course.creditHours;
      totalCredits += course.creditHours;
    });

    const semesterGPA = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;

    // NEW: Calculate projected CGPA with actual data
    const projectedCGPA = calculateProjectedCGPA(existingCGPA, semesterGPA, totalCredits);

    const calculated = {
      semesterGPA,
      projectedCGPA,
      totalCredits,
      totalPoints,
      courses: formData.courses.length,
      semester: formData.semester,
      year: formData.year
    };

    setCalculatedData(calculated);
    setError('');

    if (onCalculate) {
      onCalculate(calculated);
    }

    return calculated;
  };

  // NEW: Updated calculateProjectedCGPA with actual data
  const calculateProjectedCGPA = (currentCGPA, newSemesterGPA, newCredits) => {
    // If no existing semesters, projected CGPA is just the new semester GPA
    if (existingSemestersCount === 0) {
      setProjectionNote('This is your first semester. Your CGPA will be the same as your semester GPA.');
      return newSemesterGPA;
    }

    // If existing CGPA is 0 but we have existing semesters, something is wrong
    if (currentCGPA === 0 && existingSemestersCount > 0) {
      setProjectionNote('Note: Current CGPA is 0 but you have existing semesters. Projection may be inaccurate.');
      return newSemesterGPA;
    }

    // Calculate weighted average with actual existing credits
    const totalCredits = existingCredits + newCredits;

    if (totalCredits === 0) {
      setProjectionNote('No credits found. Projection cannot be calculated.');
      return newSemesterGPA;
    }

    const weightedCGPA = (currentCGPA * existingCredits + newSemesterGPA * newCredits) / totalCredits;
    const result = Number(weightedCGPA.toFixed(2));

    // Set projection note
    const improvement = result > currentCGPA ? 'improve' : result < currentCGPA ? 'lower' : 'maintain';
    setProjectionNote(`Based on ${existingCredits} existing credits and ${newCredits} new credits. This will ${improvement} your CGPA.`);

    return result;
  };

  const handleCalculate = async (e) => {
    e.preventDefault();

    // Check for retakes one more time before calculating
    await checkForRetakes();

    const result = calculateGPA();
    if (result) {
      setPreviewMode(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Calculate GPA first to validate
    const calculated = calculateGPA();
    if (!calculated) {
      return;
    }

    // Prepare data with trimmed course codes
    const submitData = {
      ...formData,
      courses: formData.courses.map(course => ({
        ...course,
        courseCode: course.courseCode.trim(),
        courseName: course.courseName.trim() || ''
      }))
    };

    try {
      await onSubmit(submitData);
      // Reset after successful submission
      setPreviewMode(false);
      setCalculatedData(null);
      setRetakeWarning(null);
      setProjectionNote('');
      // Optionally reset form
      setFormData({
        semester: 'Fall',
        year: new Date().getFullYear(),
        courses: [
          { courseCode: '', courseName: '', creditHours: 3, grade: 'A' }
        ]
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save semester');
    }
  };

  const handleDiscard = () => {
    setPreviewMode(false);
    setCalculatedData(null);
    setError('');
    setRetakeWarning(null);
    setProjectionNote('');
  };

  const handleEdit = () => {
    setPreviewMode(false);
    setRetakeWarning(null);
    setProjectionNote('');
  };

  const getGPAStatus = (gpa) => {
    if (gpa >= 3.7) return { color: '#27ae60', text: 'Excellent', emoji: '🎉' };
    if (gpa >= 3.3) return { color: '#2ecc71', text: 'Very Good', emoji: '👍' };
    if (gpa >= 3.0) return { color: '#f1c40f', text: 'Good', emoji: '✅' };
    if (gpa >= 2.7) return { color: '#e67e22', text: 'Satisfactory', emoji: '📊' };
    return { color: '#e74c3c', text: 'Needs Improvement', emoji: '📈' };
  };

  // Helper to render retake warning
  const renderRetakeWarning = () => {
    if (!retakeWarning || !retakeWarning.show) return null;

    return (
      <div className="alert alert-warning alert-dismissible fade show" role="alert">
        <div className="d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>
            <strong>Retake Warning:</strong> {retakeWarning.message}
            {retakeWarning.courses && retakeWarning.courses.length > 0 && (
              <div className="mt-2 small">
                <strong>Retaken courses:</strong>
                <ul className="mb-0 mt-1">
                  {retakeWarning.courses.map((retake, index) => (
                    <li key={index}>
                      {retake.courseCode}: Previously {retake.previousGrade} in {retake.previousSemester} {retake.previousYear}
                      {retake.willReplace && (
                        <span className="text-success ms-1">
                          (Will replace previous grade in CGPA)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn-close"
          onClick={() => setRetakeWarning(null)}
        ></button>
      </div>
    );
  };

  return (
    <div className="card">
      <h3>GPA Calculator</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Retake warning display */}
      {renderRetakeWarning()}

      {/* NEW: Existing data loading indicator */}
      {existingDataLoading && (
        <div className="alert alert-info">
          <i className="bi bi-hourglass-split me-2"></i>
          Loading your existing semester data for accurate projection...
        </div>
      )}

      {previewMode && calculatedData && (
        <div className="gpa-preview-card mb-4">
          <h4 className="text-center mb-3">📊 GPA Preview</h4>

          <div className="row g-3">
            {/* Current Semester GPA */}
            <div className="col-md-6">
              <div className="card h-100 border-primary">
                <div className="card-body text-center">
                  <h5 className="card-title">Semester GPA</h5>
                  <div className="display-4 fw-bold mb-2" style={{ color: getGPAStatus(calculatedData.semesterGPA).color }}>
                    {calculatedData.semesterGPA.toFixed(2)}
                  </div>
                  <div className="d-flex justify-content-center align-items-center">
                    <span className="badge bg-primary me-2">{getGPAStatus(calculatedData.semesterGPA).emoji}</span>
                    <span style={{ color: getGPAStatus(calculatedData.semesterGPA).color }}>
                      {getGPAStatus(calculatedData.semesterGPA).text}
                    </span>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      {calculatedData.semester} {calculatedData.year}<br />
                      {calculatedData.courses} courses • {calculatedData.totalCredits} credits
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Projected CGPA */}
            <div className="col-md-6">
              <div className="card h-100 border-info">
                <div className="card-body text-center">
                  <h5 className="card-title">Projected CGPA</h5>
                  <div className="display-4 fw-bold mb-2" style={{ color: getGPAStatus(calculatedData.projectedCGPA).color }}>
                    {calculatedData.projectedCGPA.toFixed(2)}
                  </div>
                  <div className="d-flex justify-content-center align-items-center">
                    <span className="badge bg-info me-2">📈</span>
                    <span style={{ color: getGPAStatus(calculatedData.projectedCGPA).color }}>
                      {getGPAStatus(calculatedData.projectedCGPA).text}
                    </span>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      Current CGPA: {existingCGPA.toFixed(2)}<br />
                      Existing Semesters: {existingSemestersCount}<br />
                      Existing Credits: {existingCredits}
                    </small>
                    {/* NEW: Projection note */}
                    {projectionNote && (
                      <div className="mt-2 small text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        {projectionNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="preview-details mt-3 p-3 bg-light rounded">
            <h6>Semester Details:</h6>
            <div className="row">
              {formData.courses.map((course, index) => (
                <div key={index} className="col-md-6 mb-2">
                  <div className="d-flex justify-content-between">
                    <span>
                      <strong>{course.courseCode.trim() || 'No Code'}</strong>
                      {course.courseName && `: ${course.courseName}`}
                    </span>
                    <span>
                      {course.creditHours}cr • {course.grade} ({gradePoints[course.grade]} pts)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={previewMode ? handleSubmit : handleCalculate} noValidate>
        <div className="form-row">
          <div className="form-group col-md-6">
            <label>Semester</label>
            <select
              name="semester"
              className="form-control"
              value={formData.semester}
              onChange={handleChange}
              disabled={previewMode}
            >
              {semesterOptions.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="form-group col-md-6">
            <label>Year</label>
            <input
              type="number"
              name="year"
              className="form-control"
              value={formData.year}
              onChange={handleChange}
              min="2000"
              max="2100"
              disabled={previewMode}
            />
          </div>
        </div>

        {/* Courses Section */}
        <div className="courses-section mt-4">
          <div className="section-header d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Courses</h4>
            {!previewMode && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={addCourse}
                disabled={isCheckingRetakes || existingDataLoading}
              >
                {isCheckingRetakes ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Checking...
                  </>
                ) : (
                  'Add Course'
                )}
              </button>
            )}
          </div>

          {formData.courses.map((course, index) => (
            <div key={index} className="course-row mb-2 p-2 border rounded">
              <div className="row g-2">
                {/* Course Code */}
                <div className="col-md-3">
                  <input
                    type="text"
                    placeholder="Course Code *"
                    value={course.courseCode}
                    onChange={(e) => handleCourseChange(index, 'courseCode', e.target.value)}
                    className="form-control form-control-sm"
                    required
                    disabled={previewMode || isCheckingRetakes || existingDataLoading}
                  />
                  {!previewMode && !course.courseCode.trim() && (
                    <small className="text-danger">Required</small>
                  )}
                </div>

                {/* Course Name */}
                <div className="col-md-3">
                  <input
                    type="text"
                    placeholder="Course Name (optional)"
                    value={course.courseName}
                    onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)}
                    className="form-control form-control-sm"
                    disabled={previewMode || isCheckingRetakes || existingDataLoading}
                  />
                </div>

                {/* Credits */}
                <div className="col-md-2">
                  <select
                    value={course.creditHours}
                    onChange={(e) => handleCourseChange(index, 'creditHours', parseInt(e.target.value))}
                    className="form-control form-control-sm"
                    disabled={previewMode || isCheckingRetakes || existingDataLoading}
                  >
                    {[1, 2, 3, 4, 5].map(hours => (
                      <option key={hours} value={hours}>{hours} Credit{hours !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Grade */}
                <div className="col-md-2">
                  <select
                    value={course.grade}
                    onChange={(e) => handleCourseChange(index, 'grade', e.target.value)}
                    className="form-control form-control-sm"
                    disabled={previewMode || isCheckingRetakes || existingDataLoading}
                  >
                    {gradeOptions.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                {/* Remove Course */}
                <div className="col-md-2">
                  {!previewMode && formData.courses.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm w-100"
                      onClick={() => removeCourse(index)}
                      disabled={isCheckingRetakes || existingDataLoading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* NEW: Current Status Info (only show when not in preview mode) */}
        {!previewMode && !existingDataLoading && (
          <div className="current-status-info p-3 bg-light rounded mb-3">
            <h6 className="mb-2">Current Status:</h6>
            <div className="row small">
              <div className="col-md-4">
                <span className="text-muted">CGPA:</span> {existingCGPA.toFixed(2)}
              </div>
              <div className="col-md-4">
                <span className="text-muted">Semesters:</span> {existingSemestersCount}
              </div>
              <div className="col-md-4">
                <span className="text-muted">Credits:</span> {existingCredits}
              </div>
            </div>
            {existingSemestersCount === 0 && (
              <small className="text-muted d-block mt-1">
                <i className="bi bi-info-circle me-1"></i>
                This will be your first semester. Your CGPA will be your semester GPA.
              </small>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions mt-4">
          {previewMode ? (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline flex-fill"
                onClick={handleEdit}
                disabled={loading}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-danger flex-fill"
                onClick={handleDiscard}
                disabled={loading}
              >
                Discard
              </button>
              <button
                type="submit"
                className="btn btn-success flex-fill"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    Save to Profile
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline flex-fill"
                onClick={onCancel}
                disabled={loading || isCheckingRetakes || existingDataLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-fill"
                disabled={loading || isCheckingRetakes || existingDataLoading}
              >
                {isCheckingRetakes || existingDataLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    {existingDataLoading ? 'Loading Data...' : 'Checking...'}
                  </>
                ) : (
                  'Calculate & Preview'
                )}
              </button>
            </div>
          )}
        </div>

        <div className="form-note mt-3">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Fields marked with * are required.
            {retakeWarning && retakeWarning.show && (
              <span className="text-warning">
                {' '}Some courses are being retaken - latest grade will be used for CGPA.
              </span>
            )}
          </small>
        </div>
      </form>
    </div>
  );
}

export default GPAForm;