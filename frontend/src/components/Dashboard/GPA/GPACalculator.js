/* import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GPAForm from './GPAForm'; // Fixed import path
import apiService from '../../../services/api'; // Fixed import path
import authService from '../../../services/auth'; // Fixed import path

function GPACalculator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(() => authService.getCurrentUser());

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
        setSuccess('Semester added successfully!');
        
        // Clear form after successful submission
        setTimeout(() => {
          setSuccess('');
          navigate('/dashboard'); // Go back to dashboard to see the new semester
        }, 2000);
      } else {
        setError(result.message || 'Failed to add semester');
      }
    } catch (err) {
      console.error('Add semester error:', err);
      setError(err.message || 'Failed to save semester. Please check your data.');
    } finally {
      setLoading(false);
    }
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
      <div className="gpa-calculator-header">
        <h1>GPA Calculator</h1>
        <p className="subtitle">Add your semester grades to calculate your GPA</p>
        <button 
          className="btn btn-outline"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="gpa-calculator-container">
        <GPAForm 
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dashboard')}
          loading={loading}
        />
        
        <div className="info-card">
          <h3>📊 How GPA is Calculated</h3>
          <ul>
            <li><strong>A/A+</strong> = 4.0 points</li>
            <li><strong>A-</strong> = 3.7 points</li>
            <li><strong>B+</strong> = 3.3 points</li>
            <li><strong>B</strong> = 3.0 points</li>
            <li><strong>B-</strong> = 2.7 points</li>
            <li><strong>C+</strong> = 2.3 points</li>
            <li><strong>C</strong> = 2.0 points</li>
            <li><strong>C-</strong> = 1.7 points</li>
            <li><strong>D+</strong> = 1.3 points</li>
            <li><strong>D</strong> = 1.0 points</li>
            <li><strong>D-</strong> = 0.7 points</li>
            <li><strong>F</strong> = 0.0 points</li>
          </ul>
          <p className="formula">
            <strong>Formula:</strong> GPA = Σ(Grade Points × Credit Hours) ÷ Σ(Credit Hours)
          </p>
        </div>
      </div>
    </div>
  );
}

export default GPACalculator; */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GPAForm from './GPAForm'; // Your form component

function GPACalculator() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [gpa, setGPA] = useState(null);

  // Grade to point mapping
  const gradePoints = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'D-': 0.7,
    'F': 0.0
  };

  const handleSubmit = (semesterData) => {
    setError('');
    if (!semesterData || semesterData.length === 0) {
      setError('Please enter at least one course.');
      return;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    for (const course of semesterData) {
      const { creditHours, grade } = course;

      if (!gradePoints[grade]) {
        setError(`Invalid grade "${grade}" for course "${course.courseName}"`);
        return;
      }

      totalPoints += gradePoints[grade] * creditHours;
      totalCredits += creditHours;
    }

    if (totalCredits === 0) {
      setError('Total credit hours cannot be zero.');
      return;
    }

    const calculatedGPA = (totalPoints / totalCredits).toFixed(2);
    setGPA(calculatedGPA);
  };

  return (
    <div className="container">
      <div className="gpa-calculator-header">
        <h1>GPA Calculator</h1>
        <p className="subtitle">Add your semester grades to calculate your GPA</p>
        <button 
          className="btn btn-outline"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="gpa-calculator-container">
        <GPAForm 
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dashboard')}
        />

        {gpa !== null && (
          <div className="alert alert-success">
            <h3>🎓 Your GPA: {gpa}</h3>
          </div>
        )}

        <div className="info-card">
          <h3>📊 How GPA is Calculated</h3>
          <ul>
            <li><strong>A/A+</strong> = 4.0 points</li>
            <li><strong>A-</strong> = 3.7 points</li>
            <li><strong>B+</strong> = 3.3 points</li>
            <li><strong>B</strong> = 3.0 points</li>
            <li><strong>B-</strong> = 2.7 points</li>
            <li><strong>C+</strong> = 2.3 points</li>
            <li><strong>C</strong> = 2.0 points</li>
            <li><strong>C-</strong> = 1.7 points</li>
            <li><strong>D+</strong> = 1.3 points</li>
            <li><strong>D</strong> = 1.0 points</li>
            <li><strong>D-</strong> = 0.7 points</li>
            <li><strong>F</strong> = 0.0 points</li>
          </ul>
          <p className="formula">
            <strong>Formula:</strong> GPA = Σ(Grade Points × Credit Hours) ÷ Σ(Credit Hours)
          </p>
        </div>
      </div>
    </div>
  );
}

export default GPACalculator;
