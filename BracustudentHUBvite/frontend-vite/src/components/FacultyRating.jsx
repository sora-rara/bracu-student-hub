import { useState, useEffect } from 'react';
import './FacultyRating.css';

const FacultyRating = ({ user }) => {
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [averages, setAverages] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    teachingQuality: 5,
    engagement: 5,
    helpfulness: 5,
    comments: ''
  });

  /* =======================
     Fetch Faculty List
  ======================= */
  useEffect(() => {
    fetchFacultyList();
  }, []);

  const fetchFacultyList = async () => {
    try {
      const response = await fetch('/api/ratings/faculty-list');
      const data = await response.json();
      setFacultyList(data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const fetchFacultyRatings = async (facultyId) => {
    try {
      const response = await fetch(`/api/ratings/faculty/${facultyId}`);
      const data = await response.json();
      setRatings(data.ratings);
      setAverages(data.averages);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  /* =======================
     Handlers
  ======================= */
  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty);
    setShowRatingForm(false);
    setSubmitSuccess(false);
    fetchFacultyRatings(faculty._id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'comments' ? value : parseInt(value)
    }));
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const response = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: selectedFaculty._id,
          ...formData
        }),
        credentials: 'include'
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setShowRatingForm(false);
        setFormData({
          teachingQuality: 5,
          engagement: 5,
          helpfulness: 5,
          comments: ''
        });
        fetchFacultyRatings(selectedFaculty._id);

        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('An error occurred while submitting your rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================
     Star Rating Component
  ======================= */
  const StarRating = ({ value, onChange, name, label }) => (
    <div className="star-rating-container">
      <div className="star-label">
        <span>{label}</span>
        <span className="star-value">{value}/5</span>
      </div>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star ${star <= value ? 'active' : ''}`}
            onClick={() => onChange({ target: { name, value: star } })}
            disabled={isSubmitting}
            aria-label={`Rate ${star} star`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  /* =======================
     Render
  ======================= */
  return (
    <div className="faculty-rating-container">
      <div className="content-wrapper">

        {/* LEFT PANEL */}
        <div className="left-panel">
          <h2>Faculty Members</h2>
          <div className="faculty-list">
            {facultyList.map(faculty => (
              <div
                key={faculty._id}
                className={`faculty-card ${selectedFaculty?._id === faculty._id ? 'selected' : ''}`}
                onClick={() => handleFacultySelect(faculty)}
              >
                <h3>{faculty.name}</h3>
                <p>{faculty.department}</p>
                <p>{faculty.email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {selectedFaculty ? (
            <>
              <div className="faculty-header">
                <h2>{selectedFaculty.name}</h2>
                <p className="department">{selectedFaculty.department}</p>
                <button
                  className="rate-btn"
                  onClick={() => setShowRatingForm(!showRatingForm)}
                >
                  {showRatingForm ? 'Cancel' : 'Rate This Faculty'}
                </button>
              </div>

              {showRatingForm ? (
                <div className={`rating-form ${isSubmitting ? 'form-loading' : ''}`}>
                  {isSubmitting && <div className="loading-spinner"></div>}

                  <form onSubmit={handleSubmitRating}>
                    <StarRating
                      value={formData.teachingQuality}
                      onChange={handleInputChange}
                      name="teachingQuality"
                      label="Teaching Quality"
                    />

                    <StarRating
                      value={formData.engagement}
                      onChange={handleInputChange}
                      name="engagement"
                      label="Engagement"
                    />

                    <StarRating
                      value={formData.helpfulness}
                      onChange={handleInputChange}
                      name="helpfulness"
                      label="Helpfulness"
                    />

                    <div className="form-group">
                      <label>Comments (Optional)</label>
                      <textarea
                        name="comments"
                        value={formData.comments}
                        onChange={handleInputChange}
                        rows="5"
                        maxLength="500"
                        disabled={isSubmitting}
                      />
                      <div className="char-counter">
                        {formData.comments.length}/500
                      </div>
                    </div>

                    <button className="submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </form>

                  {submitSuccess && (
                    <div className="success-message">
                      ✅ Rating submitted successfully!
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {averages && (
                    <div className="averages-section">
                      <h3>Overall Ratings</h3>
                      <div className="averages-grid">
                        <div>Teaching: {averages.teachingQuality}/5</div>
                        <div>Engagement: {averages.engagement}/5</div>
                        <div>Helpfulness: {averages.helpfulness}/5</div>
                        <div className="overall">Overall: {averages.overall}/5</div>
                      </div>
                    </div>
                  )}

                  <div className="ratings-list">
                    <h3>Student Reviews ({ratings.length})</h3>
                    {ratings.length ? ratings.map(r => (
                      <div key={r._id} className="rating-card">
                        <div className="rating-header">
                          <span>{r.studentId?.name || 'Anonymous'}</span>
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>Teaching: {r.teachingQuality}/5</p>
                        <p>Engagement: {r.engagement}/5</p>
                        <p>Helpfulness: {r.helpfulness}/5</p>
                        {r.comments && <p>{r.comments}</p>}
                      </div>
                    )) : (
                      <p>No ratings yet.</p>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="placeholder">Select a faculty member to view or rate.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyRating;
