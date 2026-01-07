// src/pages/FacultyRatingPage.jsx
import { useState, useEffect, useMemo } from 'react';
import axios from '../../api/axios.jsx';

const FacultyRatingPage = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [averages, setAverages] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    teachingQuality: 5,
    engagement: 5,
    helpfulness: 5,
    comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------------- FETCH FACULTY ---------------- */

  useEffect(() => {
    fetchFacultyList();
  }, []);

  const fetchFacultyList = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/ratings/faculty-list');

      // Backend sends initials directly - no auto-generation
      setFacultyList(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load faculty members.');

      // Mock fallback
      setFacultyList([
        { _id: '1', name: 'Dr. John Smith', initials: 'JS', department: 'Computer Science', email: 'john@example.com' },
        { _id: '2', name: 'Prof. Jane Doe', initials: 'JD', department: 'Mathematics', email: 'jane@example.com' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FETCH RATINGS ---------------- */

  const fetchFacultyRatings = async (facultyId) => {
    try {
      const { data } = await axios.get(`/api/ratings/faculty/${facultyId}`);
      setRatings(data.ratings || []);
      setAverages(data.averages || null);
    } catch (err) {
      console.error(err);
      setRatings([]);
      setAverages(null);
    }
  };

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredFaculty = useMemo(() => {
    if (!searchTerm.trim()) return facultyList;

    const q = searchTerm.toLowerCase();

    return facultyList.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.department?.toLowerCase().includes(q) ||
      (f.initials && f.initials.toLowerCase().includes(q))
    );
  }, [facultyList, searchTerm]);

  /* ---------------- HANDLERS ---------------- */

  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty);
    setShowRatingForm(false);
    fetchFacultyRatings(faculty._id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'comments' ? value : parseInt(value)
    }));
  };

  const handleStarClick = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await axios.post('/api/ratings/submit', {
        facultyId: selectedFaculty._id,
        ...formData
      });

      alert(`Rating ${res.data.action} successfully`);
      setShowRatingForm(false);
      setFormData({
        teachingQuality: 5,
        engagement: 5,
        helpfulness: 5,
        comments: ''
      });
      fetchFacultyRatings(selectedFaculty._id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="faculty-rating-container">
      <div className="content-wrapper">

        {/* LEFT PANEL */}
        <div className="left-panel">
          <h2>Faculty Members</h2>

          <input
            type="text"
            className="search-input"
            placeholder="Search by name, initials, department, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <p className="search-results-info">
              Showing {filteredFaculty.length} of {facultyList.length}
            </p>
          )}

          {loading ? (
            <div className="loading">Loading faculty members...</div>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="faculty-list">
              {filteredFaculty.map(f => (
                <div
                  key={f._id}
                  className={`faculty-card ${selectedFaculty?._id === f._id ? 'selected' : ''}`}
                  onClick={() => handleFacultySelect(f)}
                >
                  <div className="faculty-avatar">
                    <div className="avatar-circle">
                      {f.initials || f.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                  </div>
                  <div className="faculty-info">
                    <h3>{f.name}</h3>
                    <p className="faculty-department">{f.department || 'Department not specified'}</p>
                    <p className="faculty-email">{f.email}</p>
                    {f.initials && (
                      <div className="faculty-meta">
                        <span className="initials-info">Initials: <strong>{f.initials}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {selectedFaculty ? (
            <>
              {!showRatingForm ? (
                <>
                  <div className="faculty-header">
                    <div className="faculty-header-main">
                      <div className="selected-faculty-avatar">
                        <div className="avatar-circle large">
                          {selectedFaculty.initials ||
                            selectedFaculty.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                      </div>
                      <div className="selected-faculty-info">
                        <h2>{selectedFaculty.name}</h2>
                        <div className="selected-faculty-meta">
                          {selectedFaculty.initials && (
                            <span className="selected-initials">{selectedFaculty.initials}</span>
                          )}
                          <span className="selected-department">{selectedFaculty.department}</span>
                        </div>
                        <p className="selected-email">{selectedFaculty.email}</p>
                      </div>
                    </div>
                    <button
                      className="rate-btn"
                      onClick={() => setShowRatingForm(true)}
                    >
                      Rate This Faculty
                    </button>
                  </div>

                  {averages && (
                    <div className="averages-section">
                      <h3>Overall Ratings</h3>
                      <div className="averages-grid">
                        <div className="average-item">
                          <span className="average-label">Teaching Quality</span>
                          <div className="average-value">{averages.teachingQuality}/5</div>
                        </div>
                        <div className="average-item">
                          <span className="average-label">Engagement</span>
                          <div className="average-value">{averages.engagement}/5</div>
                        </div>
                        <div className="average-item">
                          <span className="average-label">Helpfulness</span>
                          <div className="average-value">{averages.helpfulness}/5</div>
                        </div>
                        <div className="average-item overall">
                          <span className="average-label">Overall</span>
                          <div className="average-value">{averages.overall}/5</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="ratings-list">
                    <h3>Student Reviews ({ratings.length})</h3>
                    {ratings.length > 0 ? (
                      ratings.map(rating => (
                        <div key={rating._id} className="rating-card">
                          <div className="rating-header">
                            <span className="student-name">
                              {rating.studentName || 'Anonymous'}
                            </span>
                            <span className="rating-date">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="rating-scores">
                            <span>Teaching: {rating.teachingQuality}/5</span>
                            <span>Engagement: {rating.engagement}/5</span>
                            <span>Helpfulness: {rating.helpfulness}/5</span>
                          </div>
                          {rating.comments && (
                            <p className="rating-comment">{rating.comments}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="no-ratings">No ratings yet. Be the first to rate this faculty.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className={`rating-form-container ${isSubmitting ? 'rating-loading' : ''}`}>
                  {isSubmitting && (
                    <div className="loading-indicator">
                      <div className="spinner"></div>
                      <p>Submitting your rating...</p>
                    </div>
                  )}

                  <div className="rating-header">
                    <h3>Rate Faculty Member</h3>
                    <p className="rating-faculty-info">
                      You are rating <strong>{selectedFaculty.name}</strong> ({selectedFaculty.initials || 'No initials'}) from the
                      <strong> {selectedFaculty.department}</strong> department
                    </p>
                  </div>

                  <form onSubmit={handleSubmitRating}>
                    <div className="rating-criteria-grid">
                      {/* Teaching Quality */}
                      <div className="rating-criterion">
                        <div className="criterion-header">
                          <div className="criterion-title">
                            <h4>Teaching Quality</h4>
                            <p className="criterion-description">
                              How clear, organized, and effective was the instructor's teaching?
                            </p>
                          </div>
                          <div className="criterion-score">
                            {formData.teachingQuality}/5
                          </div>
                        </div>

                        <div className="star-rating-container">
                          <div className="star-rating-wrapper">
                            <div className="stars-container">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={`star-button ${star <= formData.teachingQuality ? 'selected' : ''}`}
                                  onClick={() => handleStarClick('teachingQuality', star)}
                                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''} for Teaching Quality`}
                                  disabled={isSubmitting}
                                >
                                  ★
                                </button>
                              ))}
                            </div>

                            <div className="star-labels">
                              <span className={`star-label poor ${formData.teachingQuality === 1 ? 'active' : ''}`}>
                                Poor
                              </span>
                              <span className={`star-label fair ${formData.teachingQuality === 2 ? 'active' : ''}`}>
                                Fair
                              </span>
                              <span className={`star-label good ${formData.teachingQuality === 3 ? 'active' : ''}`}>
                                Good
                              </span>
                              <span className={`star-label very-good ${formData.teachingQuality === 4 ? 'active' : ''}`}>
                                Very Good
                              </span>
                              <span className={`star-label excellent ${formData.teachingQuality === 5 ? 'active' : ''}`}>
                                Excellent
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Engagement */}
                      <div className="rating-criterion">
                        <div className="criterion-header">
                          <div className="criterion-title">
                            <h4>Engagement</h4>
                            <p className="criterion-description">
                              How engaging, interactive, and stimulating were the classes?
                            </p>
                          </div>
                          <div className="criterion-score">
                            {formData.engagement}/5
                          </div>
                        </div>

                        <div className="star-rating-container">
                          <div className="star-rating-wrapper">
                            <div className="stars-container">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={`star-button ${star <= formData.engagement ? 'selected' : ''}`}
                                  onClick={() => handleStarClick('engagement', star)}
                                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''} for Engagement`}
                                  disabled={isSubmitting}
                                >
                                  ★
                                </button>
                              ))}
                            </div>

                            <div className="star-labels">
                              <span className={`star-label poor ${formData.engagement === 1 ? 'active' : ''}`}>
                                Poor
                              </span>
                              <span className={`star-label fair ${formData.engagement === 2 ? 'active' : ''}`}>
                                Fair
                              </span>
                              <span className={`star-label good ${formData.engagement === 3 ? 'active' : ''}`}>
                                Good
                              </span>
                              <span className={`star-label very-good ${formData.engagement === 4 ? 'active' : ''}`}>
                                Very Good
                              </span>
                              <span className={`star-label excellent ${formData.engagement === 5 ? 'active' : ''}`}>
                                Excellent
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Helpfulness */}
                      <div className="rating-criterion">
                        <div className="criterion-header">
                          <div className="criterion-title">
                            <h4>Helpfulness</h4>
                            <p className="criterion-description">
                              How accessible and helpful was the instructor outside of class?
                            </p>
                          </div>
                          <div className="criterion-score">
                            {formData.helpfulness}/5
                          </div>
                        </div>

                        <div className="star-rating-container">
                          <div className="star-rating-wrapper">
                            <div className="stars-container">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={`star-button ${star <= formData.helpfulness ? 'selected' : ''}`}
                                  onClick={() => handleStarClick('helpfulness', star)}
                                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''} for Helpfulness`}
                                  disabled={isSubmitting}
                                >
                                  ★
                                </button>
                              ))}
                            </div>

                            <div className="star-labels">
                              <span className={`star-label poor ${formData.helpfulness === 1 ? 'active' : ''}`}>
                                Poor
                              </span>
                              <span className={`star-label fair ${formData.helpfulness === 2 ? 'active' : ''}`}>
                                Fair
                              </span>
                              <span className={`star-label good ${formData.helpfulness === 3 ? 'active' : ''}`}>
                                Good
                              </span>
                              <span className={`star-label very-good ${formData.helpfulness === 4 ? 'active' : ''}`}>
                                Very Good
                              </span>
                              <span className={`star-label excellent ${formData.helpfulness === 5 ? 'active' : ''}`}>
                                Excellent
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="comments-section">
                      <label htmlFor="comments">
                        Additional Comments (Optional)
                        <span className="hint"> - Specific feedback helps instructors improve</span>
                      </label>
                      <textarea
                        id="comments"
                        name="comments"
                        value={formData.comments}
                        onChange={handleInputChange}
                        className="comments-textarea"
                        placeholder="Share specific examples of what worked well or could be improved..."
                        rows="5"
                        maxLength="500"
                        disabled={isSubmitting}
                      />
                      <div className="comments-helper">
                        <div className={`char-count ${formData.comments.length > 450 ? 'low' : ''} ${formData.comments.length >= 500 ? 'full' : ''}`}>
                          {formData.comments.length}/500 characters
                        </div>
                        <div className="char-tip">
                          Be constructive and respectful
                        </div>
                      </div>
                    </div>

                    {/* Rating Summary */}
                    <div className="rating-summary">
                      <h4>Your Rating Summary</h4>
                      <div className="summary-scores">
                        <div className="summary-score">
                          <span className="summary-score-label">Teaching</span>
                          <div className="summary-score-value">{formData.teachingQuality}/5</div>
                          <div className="summary-score-stars">
                            {'★'.repeat(formData.teachingQuality)}
                            {'☆'.repeat(5 - formData.teachingQuality)}
                          </div>
                        </div>
                        <div className="summary-score">
                          <span className="summary-score-label">Engagement</span>
                          <div className="summary-score-value">{formData.engagement}/5</div>
                          <div className="summary-score-stars">
                            {'★'.repeat(formData.engagement)}
                            {'☆'.repeat(5 - formData.engagement)}
                          </div>
                        </div>
                        <div className="summary-score">
                          <span className="summary-score-label">Helpfulness</span>
                          <div className="summary-score-value">{formData.helpfulness}/5</div>
                          <div className="summary-score-stars">
                            {'★'.repeat(formData.helpfulness)}
                            {'☆'.repeat(5 - formData.helpfulness)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="rating-actions">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => setShowRatingForm(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-rating-btn"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-small"></span>
                            Submitting...
                          </>
                        ) : (
                          'Submit Rating'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="placeholder">
              <div className="placeholder-icon"></div>

              <h3>Choose a faculty member from the list to view ratings or submit your own review.</h3>
              <p className="hint">Click on any faculty card to get started</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FacultyRatingPage;