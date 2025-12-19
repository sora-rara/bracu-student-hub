import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import authService from '../services/auth';

const CourseContentPage = () => {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list', 'detail', 'upload'
  const [selectedCourse, setSelectedCourse] = useState(courseCode || '');
  
  const [content, setContent] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [filters, setFilters] = useState({
    contentType: '',
    programCode: '',
    semester: '',
    year: '',
    search: ''
  });
  
  const [availableFilters, setAvailableFilters] = useState({
    contentTypes: [],
    programs: [],
    semesters: [],
    years: []
  });
  
  const [uploadForm, setUploadForm] = useState({
    courseCode: selectedCourse || '',
    courseName: '',
    programCode: '',
    programName: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    contentType: 'other',
    title: '',
    description: '',
    tags: '',
    file: null
  });

  useEffect(() => {
    if (courseCode) {
      setView('detail');
      setSelectedCourse(courseCode);
      fetchCourseContent();
      fetchCourseDetails(courseCode);
    } else {
      fetchCourses();
      fetchAllContent();
    }
  }, [courseCode]);

  useEffect(() => {
    if (selectedCourse) {
      const course = courses.find(c => c.courseCode === selectedCourse);
      if (course) {
        setUploadForm(prev => ({
          ...prev,
          courseCode: selectedCourse,
          courseName: course.courseName,
          programCode: course.programCode,
          programName: course.programName
        }));
      }
    }
  }, [selectedCourse, courses]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/course-content/courses');
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAllContent = async () => {
    try {
      const user = authService.getCurrentUser();
      const queryParams = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        ),
        userEmail: user?.email || ''
      }).toString();

      const response = await axios.get(`/api/course-content?${queryParams}`);
      if (response.data.success) {
        // Filter content based on user role and approval status
        const user = authService.getCurrentUser();
        let filteredContent = response.data.data;
        
        if (user?.role === 'student') {
          // Students see approved content + their own uploads
          filteredContent = filteredContent.filter(item => 
            item.status === 'approved' || 
            item.uploadedByEmail === user.email
          );
        }
        
        setContent(filteredContent);
        setAvailableFilters(response.data.filters);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseContent = async () => {
    try {
      const user = authService.getCurrentUser();
      const queryParams = new URLSearchParams({
        courseCode: selectedCourse,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        ),
        userEmail: user?.email || ''
      }).toString();

      const response = await axios.get(`/api/course-content?${queryParams}`);
      if (response.data.success) {
        // Filter content based on user role and approval status
        const user = authService.getCurrentUser();
        let filteredContent = response.data.data;
        
        if (user?.role === 'student') {
          // Students see approved content + their own uploads
          filteredContent = filteredContent.filter(item => 
            item.status === 'approved' || 
            item.uploadedByEmail === user.email
          );
        }
        
        setContent(filteredContent);
        setAvailableFilters(response.data.filters);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (code) => {
    try {
      const response = await axios.get(`/api/course-content/courses/${code}`);
      if (response.data.success) {
        setCourseDetails(response.data.data.course);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  // FIXED: Course selection - stays on current page for upload form
  const handleCourseSelect = (code) => {
    if (view === 'upload') {
      // If in upload view, just update the selected course
      setSelectedCourse(code);
      const course = courses.find(c => c.courseCode === code);
      if (course) {
        setUploadForm(prev => ({
          ...prev,
          courseCode: code,
          courseName: course.courseName,
          programCode: course.programCode,
          programName: course.programName
        }));
      }
    } else {
      // Otherwise navigate to the course detail
      setSelectedCourse(code);
      navigate(`/course-content/${code}`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    const user = authService.getCurrentUser();
    if (!user) {
      alert('Please login to upload content');
      navigate('/login');
      return;
    }

    if (!uploadForm.courseCode || !uploadForm.title || !uploadForm.file) {
      alert('Please fill in all required fields and select a file');
      return;
    }

    if (uploadForm.file.size > 50 * 1024 * 1024) {
      alert('File size cannot exceed 50MB');
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      
      Object.keys(uploadForm).forEach(key => {
        if (key !== 'file' && uploadForm[key]) {
          data.append(key, uploadForm[key]);
        }
      });
      
      data.append('file', uploadForm.file);
      data.append('userEmail', user.email);
      data.append('userName', user.name);
      data.append('userRole', user.role);

      const response = await axios.post('/api/course-content/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const message = user.role === 'student' 
          ? 'Content uploaded successfully! It will be visible to others after admin approval.'
          : 'Content uploaded successfully!';
        
        alert(message);
        resetUploadForm();
        
        if (selectedCourse) {
          setView('detail');
          fetchCourseContent();
        } else {
          setView('list');
          fetchAllContent();
        }
        
        // Navigate to my uploads page
        navigate('/my-uploads');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      courseCode: selectedCourse || '',
      courseName: '',
      programCode: '',
      programName: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      contentType: 'other',
      title: '',
      description: '',
      tags: '',
      file: null
    });
    setPreviewUrl(null);
  };

  const handleDownload = async (contentId, fileName) => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        alert('Please login to download content');
        navigate('/login');
        return;
      }

      const response = await axios.get(`/api/course-content/${contentId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Update download count
      fetchCourseContent();
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📄';
    if (fileType.includes('powerpoint')) return '📊';
    if (fileType.includes('excel')) return '📈';
    if (fileType.includes('text')) return '📝';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  const getStatusBadge = (status, rejectionReason = '') => {
    const statusConfig = {
      approved: { label: '✅ Approved', className: 'status-approved' },
      pending: { label: '⏳ Pending', className: 'status-pending' },
      rejected: { label: '❌ Rejected', className: 'status-rejected' }
    };
    
    const config = statusConfig[status] || { label: status, className: '' };
    
    return (
      <div className={`status-badge ${config.className}`}>
        <span>{config.label}</span>
        {status === 'rejected' && rejectionReason && (
          <div className="rejection-reason">
            Reason: {rejectionReason}
          </div>
        )}
      </div>
    );
  };

  // RENDER FUNCTIONS
  const renderHeader = () => (
    <div className="page-header">
      {view === 'detail' ? (
        <>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => {
              navigate('/course-content');
              setView('list');
            }}
            style={{ marginBottom: '15px' }}
          >
            ← Back to All Courses
          </button>
          <h1>📁 {selectedCourse} - Course Content</h1>
          {courseDetails && (
            <p className="course-title">{courseDetails.courseName}</p>
          )}
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setView('upload')}
            >
              📤 Upload Content
            </button>
          </div>
        </>
      ) : view === 'upload' ? (
        <>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setView(selectedCourse ? 'detail' : 'list')}
            style={{ marginBottom: '15px' }}
          >
            ← Back
          </button>
          <h1>📤 Upload Course Content</h1>
          <p>Share study materials with your classmates</p>
        </>
      ) : (
        <>
          <h1>📁 Course Content Library</h1>
          <p>Browse and share course materials</p>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setView('upload')}
            >
              📤 Upload Content
            </button>
            <Link to="/my-uploads" className="btn btn-outline">
              📁 My Uploads
            </Link>
          </div>
        </>
      )}
    </div>
  );

  const renderFilters = () => (
    <div className="content-filters">
      <div className="filter-row">
        <div className="filter-group">
          <label>Content Type</label>
          <select
            value={filters.contentType}
            onChange={(e) => setFilters({...filters, contentType: e.target.value})}
          >
            <option value="">All Types</option>
            {availableFilters.contentTypes?.map(type => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Program</label>
          <select
            value={filters.programCode}
            onChange={(e) => setFilters({...filters, programCode: e.target.value})}
          >
            <option value="">All Programs</option>
            {availableFilters.programs?.map(program => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Semester</label>
          <select
            value={filters.semester}
            onChange={(e) => setFilters({...filters, semester: e.target.value})}
          >
            <option value="">All Semesters</option>
            {availableFilters.semesters?.map(sem => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Year</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({...filters, year: e.target.value})}
          >
            <option value="">All Years</option>
            {availableFilters.years?.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search content..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          onKeyPress={(e) => e.key === 'Enter' && fetchCourseContent()}
        />
        <button 
          className="search-btn"
          onClick={() => fetchCourseContent()}
        >
          🔍
        </button>
      </div>
    </div>
  );

  const renderCourseSelection = () => (
    <div className="form-section">
      <h3>1. Select Course</h3>
      <div className="form-group">
        <label>Course Code *</label>
        <select
          value={selectedCourse}
          onChange={(e) => handleCourseSelect(e.target.value)}
          required
        >
          <option value="">-- Select a course --</option>
          {courses.map(course => (
            <option key={course.courseCode} value={course.courseCode}>
              {course.courseCode} - {course.courseName}
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <div className="course-info-preview">
          <h4>Selected Course:</h4>
          <p><strong>Code:</strong> {uploadForm.courseCode}</p>
          <p><strong>Name:</strong> {uploadForm.courseName}</p>
          <p><strong>Program:</strong> {uploadForm.programName}</p>
        </div>
      )}
    </div>
  );

  const renderUploadForm = () => {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return (
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>Please login to upload course content</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      );
    }

    return (
      <div className="upload-form-container">
        <form onSubmit={handleUpload} className="upload-form">
          {renderCourseSelection()}

          {/* Content Details */}
          <div className="form-section">
            <h3>2. Content Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  placeholder="e.g., Midterm Exam 2023"
                  required
                />
              </div>
              <div className="form-group">
                <label>Content Type *</label>
                <select
                  value={uploadForm.contentType}
                  onChange={(e) => setUploadForm({...uploadForm, contentType: e.target.value})}
                  required
                >
                  <option value="other">-- Select type --</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="lecture_notes">Lecture Notes</option>
                  <option value="assignment">Assignment</option>
                  <option value="lab_manual">Lab Manual</option>
                  <option value="exam">Exam</option>
                  <option value="textbook">Textbook</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={uploadForm.semester}
                  onChange={(e) => setUploadForm({...uploadForm, semester: e.target.value})}
                >
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <input
                  type="number"
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  value={uploadForm.year}
                  onChange={(e) => setUploadForm({...uploadForm, year: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                placeholder="Brief description of the content..."
                rows="3"
                maxLength="500"
              />
              <small className="char-count">
                {uploadForm.description.length}/500 characters
              </small>
            </div>

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                placeholder="e.g., midterm, solutions, chapter-1"
              />
              <small>Add tags to help others find this content</small>
            </div>
          </div>

          {/* File Upload */}
          <div className="form-section">
            <h3>3. Upload File *</h3>
            <div className="file-upload-area">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                required
              />
              <label htmlFor="file-upload" className="file-upload-label">
                📎 Choose File
              </label>
              {uploadForm.file && (
                <div className="file-info">
                  <p>
                    <span className="file-icon">
                      {getFileIcon(uploadForm.file.type)}
                    </span>
                    {uploadForm.file.name}
                  </p>
                  <p className="file-size">
                    Size: {formatFileSize(uploadForm.file.size)}
                  </p>
                </div>
              )}
              <p className="file-help-text">
                Allowed: PDF, DOC/DOCX, PPT/PPTX, TXT, ZIP, RAR, JPG, PNG, GIF (Max 50MB)
              </p>
            </div>

            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            )}
          </div>

          {/* Uploader Info */}
          <div className="form-section">
            <h3>4. Uploader Information</h3>
            <div className="uploader-info">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <div className="notice">
                {user.role === 'student' ? (
                  <p className="text-warning">
                    ⚠️ Student uploads require admin approval before being visible to others.
                    You can track your upload status in "My Uploads" page.
                  </p>
                ) : (
                  <p className="text-success">
                    ✅ Your uploads will be immediately visible to others.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setView(selectedCourse ? 'detail' : 'list')}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-small"></span>
                  Uploading...
                </>
              ) : (
                '📤 Upload Content'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderContentList = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading course content...</p>
        </div>
      );
    }

    const user = authService.getCurrentUser();
    const filteredContent = content.filter(item => {
      if (user?.role === 'admin' || user?.role === 'instructor') {
        return true; // Admins and instructors see everything
      }
      return item.status === 'approved' || item.uploadedByEmail === user?.email;
    });

    if (filteredContent.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No content found</h3>
          <p>Be the first to upload content!</p>
          <button 
            className="btn btn-primary"
            onClick={() => setView('upload')}
          >
            📤 Upload First File
          </button>
        </div>
      );
    }

    return (
      <div className="content-list">
        {filteredContent.map(item => {
          const user = authService.getCurrentUser();
          const isOwner = item.uploadedByEmail === user?.email;
          const canSeePending = user?.role === 'admin' || user?.role === 'instructor' || isOwner;
          
          // Only show if approved OR user has permission to see pending/rejected
          if (!canSeePending && item.status !== 'approved') {
            return null;
          }

          return (
            <div key={item._id} className="content-card">
              <div className="content-header">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(item.fileType)}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p className="file-meta">
                      {item.contentType.replace('_', ' ')} • 
                      {formatFileSize(item.fileSize)} • 
                      Uploaded by {item.uploadedBy}
                      {isOwner && ' (You)'}
                    </p>
                  </div>
                </div>
                <div className="content-status">
                  {item.status !== 'approved' && getStatusBadge(item.status, item.rejectionReason)}
                  <div className="content-actions">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDownload(item._id, item.fileName)}
                      disabled={item.status === 'rejected'}
                    >
                      📥 Download
                    </button>
                    {isOwner && item.status === 'pending' && (
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate('/my-uploads')}
                      >
                        ⏳ Track Status
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {item.description && (
                <p className="content-description">{item.description}</p>
              )}

              <div className="content-footer">
                <div className="content-stats">
                  <span className="stat">👁️ {item.viewCount || 0} views</span>
                  <span className="stat">📥 {item.downloadCount || 0} downloads</span>
                  <span className="stat">📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="content-tags">
                    {item.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="course-content-page">
      {renderHeader()}
      
      {view === 'upload' ? (
        renderUploadForm()
      ) : (
        <>
          {view === 'list' && renderFilters()}
          {view === 'detail' && selectedCourse && renderFilters()}
          
          {/* Content Stats */}
          {view === 'detail' && selectedCourse && (
            <div className="content-stats">
              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-content">
                  <h3>{content.filter(item => item.status === 'approved').length}</h3>
                  <p>Approved Files</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📥</div>
                <div className="stat-content">
                  <h3>
                    {content.reduce((sum, item) => sum + (item.downloadCount || 0), 0)}
                  </h3>
                  <p>Total Downloads</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👁️</div>
                <div className="stat-content">
                  <h3>
                    {content.reduce((sum, item) => sum + (item.viewCount || 0), 0)}
                  </h3>
                  <p>Total Views</p>
                </div>
              </div>
              {authService.isAdmin() && (
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <h3>
                      {content.filter(item => item.status === 'pending').length}
                    </h3>
                    <p>Pending Review</p>
                    <small>
                      <Link to="/admin/courses">Review Now →</Link>
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {renderContentList()}
        </>
      )}
    </div>
  );
};

export default CourseContentPage;