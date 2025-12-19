import React from 'react';

function GPAList({ semesters, onDelete, onViewDetails }) {
  if (!semesters || semesters.length === 0) {
    return (
      <div className="card">
        <h3>Your Semesters</h3>
        <div className="empty-state">
          <p>No semester data found. Add your first semester to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Your Semesters ({semesters.length})</h3>
      <div className="semesters-table">
        <div className="table-header">
          <div className="table-cell">Semester</div>
          <div className="table-cell">Year</div>
          <div className="table-cell">GPA</div>
          <div className="table-cell">Credits</div>
          <div className="table-cell">Courses</div>
          <div className="table-cell">Actions</div>
        </div>

        {semesters.map((semester) => (
          <div key={semester._id} className="table-row">
            <div className="table-cell">{semester.semester}</div>
            <div className="table-cell">{semester.year}</div>
            <div className="table-cell">
              <span className="gpa-badge">{semester.semesterGPA ? semester.semesterGPA.toFixed(2) : 'N/A'}</span>
            </div>
            <div className="table-cell">{semester.totalCredits || 0}</div>
            <div className="table-cell">{semester.courses ? semester.courses.length : 0}</div>
            <div className="table-cell actions">
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => onViewDetails && onViewDetails(semester._id)}
              >
                View
              </button>
              <button 
                className="btn btn-danger btn-sm" 
                onClick={() => onDelete(semester._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GPAList;