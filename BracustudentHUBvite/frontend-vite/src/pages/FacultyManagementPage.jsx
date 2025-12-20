// src/pages/FacultyManagementPage.jsx
import { useState, useEffect } from 'react';
import axios from '../api/axios.jsx';

const FacultyManagementPage = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    initials: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFacultyList();
  }, []);

  useEffect(() => {
    // Filter faculty based on search term
    if (searchTerm.trim() === '') {
      setFilteredFaculty(facultyList);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = facultyList.filter(faculty => 
        faculty.name.toLowerCase().includes(searchLower) ||
        (faculty.initials && faculty.initials.toLowerCase().includes(searchLower)) ||
        (faculty.department && faculty.department.toLowerCase().includes(searchLower)) ||
        faculty.email.toLowerCase().includes(searchLower)
      );
      setFilteredFaculty(filtered);
    }
  }, [searchTerm, facultyList]);

  const fetchFacultyList = async () => {
    try {
      const response = await axios.get('/api/ratings/faculty-list');
      setFacultyList(response.data);
      setFilteredFaculty(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setError('Failed to load faculty list. Please check backend connection.');
      // Set empty arrays on error
      setFacultyList([]);
      setFilteredFaculty([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Auto-uppercase for initials field
    if (name === 'initials') {
      processedValue = value.toUpperCase().replace(/[^A-Z]/g, ''); // Only allow letters
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || 
        !formData.department.trim() || !formData.initials.trim()) {
      setError('All fields are required. Initials must be provided.');
      setLoading(false);
      return;
    }

    // Validate initials format (2-4 uppercase letters)
    if (!/^[A-Z]{2,4}$/.test(formData.initials.trim())) {
      setError('Initials must be 2-4 uppercase letters (e.g., SADF, JS, RJD).');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/ratings/create-faculty', {
        ...formData,
        role: 'faculty'
      });

      if (response.status === 201) {
        setSuccess(`Faculty member "${formData.name}" added successfully with initials "${formData.initials}"!`);
        // Reset form
        setFormData({
          name: '',
          email: '',
          department: '',
          initials: ''
        });
        // Refresh the list
        fetchFacultyList();
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      setError(error.response?.data?.error || 'Failed to add faculty member. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleDeleteFaculty = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty member? This will also delete all ratings for this faculty.')) {
      return;
    }

    try {
      await axios.delete(`/api/ratings/faculty/${facultyId}`);
      setSuccess('Faculty member deleted successfully!');
      fetchFacultyList(); // Refresh the list
    } catch (error) {
      console.error('Error deleting faculty:', error);
      setError('Failed to delete faculty member. ' + (error.response?.data?.error || ''));
    }
  };

  return (
    <div className="faculty-management-container">
      <div className="content-wrapper">
        <div className="left-panel">
          <h2>Add New Faculty</h2>
          <form className="faculty-form" onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Dr. John Smith"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.smith@university.edu"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Computer Science"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Initials *</label>
              <input
                type="text"
                name="initials"
                value={formData.initials}
                onChange={handleInputChange}
                placeholder="JS, MMR, SADA (2-4 uppercase letters)"
                maxLength="4"
                pattern="[A-Z]*"
                required
                disabled={loading}
                style={{ textTransform: 'uppercase' }}
              />
              <small className="hint">
                Official initials (2-4 uppercase letters). Example: "SADA" for "Sadif Ahmed".
                <strong> Must be unique.</strong>
              </small>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Faculty Member'}
            </button>
          </form>
        </div>

        <div className="right-panel">
          <div className="panel-header">
            <h2>Existing Faculty Members ({filteredFaculty.length})</h2>
            <div className="search-container">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Search by name, initials, or department..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    type="button" 
                    onClick={handleClearSearch}
                    className="clear-search-btn"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              {searchTerm && (
                <p className="search-results-info">
                  Showing {filteredFaculty.length} of {facultyList.length} faculty members
                </p>
              )}
            </div>
          </div>

          <div className="faculty-list">
            {filteredFaculty.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? (
                  <>
                    <p>No faculty members found for "{searchTerm}".</p>
                    <p>Try a different search term or clear the search.</p>
                  </>
                ) : (
                  <>
                    <p>No faculty members added yet.</p>
                    <p>Add your first faculty member using the form on the left.</p>
                  </>
                )}
              </div>
            ) : (
              filteredFaculty.map(faculty => (
                <div key={faculty._id} className="faculty-card">
                  <div className="faculty-info">
                    <div className="faculty-header-row">
                      <h3>{faculty.name}</h3>
                      {faculty.initials && (
                        <span className="faculty-initials-badge">[{faculty.initials}]</span>
                      )}
                    </div>
                    <p className="faculty-department">
                      <strong>Department:</strong> {faculty.department || 'Not specified'}
                    </p>
                    <p className="faculty-email">
                      <strong>Email:</strong> {faculty.email}
                    </p>
                    <div className="faculty-meta">
                      <span className="faculty-role">Role: {faculty.role}</span>
                      {faculty.initials ? (
                        <span className="initials-info">Initials: <strong>{faculty.initials}</strong></span>
                      ) : (
                        <span className="no-initials">No initials set</span>
                      )}
                    </div>
                  </div>
                  <div className="faculty-actions">
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteFaculty(faculty._id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyManagementPage;