

import React, { useState, useEffect } from 'react';

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

function GPAForm({ onSubmit, onCancel }) {
  const [courses, setCourses] = useState([
    { courseCode: '', courseName: '', creditHours: 3, grade: '' }
  ]);
  const [gpa, setGPA] = useState(null);

  // Update GPA whenever courses change
  useEffect(() => {
    let totalPoints = 0;
    let totalCredits = 0;

    for (const course of courses) {
      const { creditHours, grade } = course;
      if (gradePoints[grade]) {
        totalPoints += gradePoints[grade] * creditHours;
        totalCredits += creditHours;
      }
    }

    if (totalCredits > 0) {
      setGPA((totalPoints / totalCredits).toFixed(2));
    } else {
      setGPA(null);
    }
  }, [courses]);

  const handleCourseChange = (index, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[index][field] = field === 'creditHours' ? Number(value) : value.toUpperCase();
    setCourses(updatedCourses);
  };

  const addCourse = () => {
    setCourses([...courses, { courseCode: '', courseName: '', creditHours: 3, grade: '' }]);
  };

  const removeCourse = (index) => {
    const updatedCourses = courses.filter((_, i) => i !== index);
    setCourses(updatedCourses);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(courses);
  };

  return (
    <form onSubmit={handleSubmit}>
      {courses.map((course, index) => (
        <div key={index} className="course-row">
          <input
            type="text"
            placeholder="Course Code"
            value={course.courseCode}
            onChange={(e) => handleCourseChange(index, 'courseCode', e.target.value)}
          />
          <input
            type="text"
            placeholder="Course Name"
            value={course.courseName}
            onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)}
          />
          <input
            type="number"
            placeholder="Credit Hours"
            min="0"
            value={course.creditHours}
            onChange={(e) => handleCourseChange(index, 'creditHours', e.target.value)}
          />
          <input
            type="text"
            placeholder="Grade (A, B+, etc.)"
            value={course.grade}
            onChange={(e) => handleCourseChange(index, 'grade', e.target.value)}
          />
          {courses.length > 1 && (
            <button type="button" onClick={() => removeCourse(index)}>
              ❌
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={addCourse}>
        + Add Course
      </button>

      <div style={{ marginTop: '10px' }}>
        <strong>GPA: </strong> {gpa !== null ? gpa : '-'}
      </div>

      <div className="form-actions">
        <button type="submit">Calculate GPA</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default GPAForm;
