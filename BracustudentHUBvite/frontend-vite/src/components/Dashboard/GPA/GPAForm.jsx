import React, { useState } from 'react';

const gradePoints = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0
};

const gradeOptions = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
const semesterOptions = ['Spring', 'Summer', 'Fall'];

function GPAForm({ onSubmit, onCancel, onCalculate, showPreview, loading, existingCGPA = 0 }) {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCourseChange = (index, field, value) => {
    const newCourses = [...formData.courses];
    newCourses[index][field] = value;
    setFormData({ ...formData, courses: newCourses });
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

    // Calculate projected CGPA
    // This is a simplified projection based on current CGPA
    // In a real scenario, you'd fetch the actual semesters
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

  const calculateProjectedCGPA = (currentCGPA, newSemesterGPA, newCredits) => {
    // Simplified projection - in real app, you'd fetch all semesters
    // This assumes current CGPA is based on some existing credits
    const assumedExistingCredits = 30; // Default assumption
    const totalCredits = assumedExistingCredits + newCredits;
    const weightedCGPA = (currentCGPA * assumedExistingCredits + newSemesterGPA * newCredits) / totalCredits;
    return Number(weightedCGPA.toFixed(2));
  };

  const handleCalculate = (e) => {
    e.preventDefault();
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
  };

  const handleEdit = () => {
    setPreviewMode(false);
  };

  const getGPAStatus = (gpa) => {
    if (gpa >= 3.7) return { color: '#27ae60', text: 'Excellent', emoji: '🎉' };
    if (gpa >= 3.3) return { color: '#2ecc71', text: 'Very Good', emoji: '👍' };
    if (gpa >= 3.0) return { color: '#f1c40f', text: 'Good', emoji: '✅' };
    if (gpa >= 2.7) return { color: '#e67e22', text: 'Satisfactory', emoji: '📊' };
    return { color: '#e74c3c', text: 'Needs Improvement', emoji: '📈' };
  };

  return (
    <div className="card">
      <h3>GPA Calculator</h3>

      {error && <div className="alert alert-danger">{error}</div>}

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
                      After adding this semester
                    </small>
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
              >
                <i className="bi bi-plus-circle me-1"></i> Add Course
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
                    disabled={previewMode}
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
                    disabled={previewMode}
                  />
                </div>

                {/* Credits */}
                <div className="col-md-2">
                  <select
                    value={course.creditHours}
                    onChange={(e) => handleCourseChange(index, 'creditHours', parseInt(e.target.value))}
                    className="form-control form-control-sm"
                    disabled={previewMode}
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
                    disabled={previewMode}
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
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

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
                <i className="bi bi-pencil me-1"></i> Edit
              </button>
              <button
                type="button"
                className="btn btn-danger flex-fill"
                onClick={handleDiscard}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-1"></i> Discard
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
                    <i className="bi bi-check-circle me-1"></i> Save to Profile
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
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-1"></i> Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-fill"
                disabled={loading}
              >
                <i className="bi bi-calculator me-1"></i> Calculate & Preview
              </button>
            </div>
          )}
        </div>

        <div className="form-note mt-3">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Fields marked with * are required. Click "Calculate & Preview" to see your GPA before saving.
          </small>
        </div>
      </form>
    </div>
  );
}

export default GPAForm;