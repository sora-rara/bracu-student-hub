// src/components/career/student/JobList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import JobCard from './JobCard';
import "../../../App.css";

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchTerm, typeFilter, locationFilter, salaryFilter, scheduleFilter, sortBy]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/career/jobs');
      
      if (response.data.success) {
        setJobs(response.data.data || []);
        setError('');
      } else {
        setError('Failed to load jobs.');
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again later.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        (job.title && job.title.toLowerCase().includes(term)) ||
        (job.company?.name && job.company.name.toLowerCase().includes(term)) ||
        (job.description && job.description.toLowerCase().includes(term)) ||
        (job.shortDescription && job.shortDescription.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => job.jobType === typeFilter);
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(job => job.location === locationFilter);
    }

    // Salary filter
    if (salaryFilter !== 'all') {
      filtered = filtered.filter(job => {
        if (!job.salary?.amount) return false;
        const amount = job.salary.amount;
        
        if (salaryFilter === 'under-10') return amount < 10;
        if (salaryFilter === '10-20') return amount >= 10 && amount <= 20;
        if (salaryFilter === '20-30') return amount > 20 && amount <= 30;
        if (salaryFilter === 'over-30') return amount > 30;
        
        return true;
      });
    }

    // Schedule filter
    if (scheduleFilter !== 'all') {
      filtered = filtered.filter(job => job.schedule === scheduleFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'deadline':
          const deadlineA = new Date(a.deadline || '9999-12-31');
          const deadlineB = new Date(b.deadline || '9999-12-31');
          return deadlineA - deadlineB;
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'salary-high':
          return (b.salary?.amount || 0) - (a.salary?.amount || 0);
        case 'salary-low':
          return (a.salary?.amount || 0) - (b.salary?.amount || 0);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  const handleRetry = () => {
    setError('');
    fetchJobs();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Jobs</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  const activeJobs = filteredJobs.filter(j => 
    j.status === 'active' || j.status === 'Active' || j.status === 'open'
  );
  const featuredJobs = filteredJobs.filter(j => j.isFeatured);

  return (
    <div className="job-list">
      {/* Header */}
      <div className="list-header">
        <h1>Part-time Jobs</h1>
        <p className="subtitle">
          Find flexible part-time opportunities to earn while you learn
        </p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{jobs.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active:</span>
          <span className="stat-value">{activeJobs.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Featured:</span>
          <span className="stat-value">{featuredJobs.length}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search jobs by title, company, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-grid">
          <div className="filter-group">
            <label>Job Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="part-time">Part-time</option>
              <option value="remote">Remote</option>
              <option value="on-campus">On-campus</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Locations</option>
              <option value="remote">Remote</option>
              <option value="on-campus">On-campus</option>
              <option value="dhaka">Dhaka</option>
              <option value="chittagong">Chittagong</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Salary per hour</label>
            <select
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Salaries</option>
              <option value="under-10">Under $10</option>
              <option value="10-20">$10 - $20</option>
              <option value="20-30">$20 - $30</option>
              <option value="over-30">Over $30</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Schedule</label>
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Schedules</option>
              <option value="flexible">Flexible</option>
              <option value="weekends">Weekends</option>
              <option value="evenings">Evenings</option>
              <option value="mornings">Mornings</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="deadline">Deadline Soonest</option>
              <option value="title">Title (A-Z)</option>
              <option value="salary-high">Salary (High to Low)</option>
              <option value="salary-low">Salary (Low to High)</option>
            </select>
          </div>
        </div>

        <div className="active-filters">
          {(searchTerm || typeFilter !== 'all' || locationFilter !== 'all' || 
            salaryFilter !== 'all' || scheduleFilter !== 'all') && (
            <button 
              className="clear-all-btn"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setLocationFilter('all');
                setSalaryFilter('all');
                setScheduleFilter('all');
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredJobs.length}</strong> of{' '}
          <strong>{jobs.length}</strong> jobs
        </p>
      </div>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <div className="featured-section">
          <h2 className="section-title">
            <span className="featured-icon">⭐</span> Featured Jobs
          </h2>
          <p className="section-subtitle">Top opportunities for students</p>
          <div className="featured-grid">
            {featuredJobs.map(job => (
              <JobCard 
                key={job._id} 
                job={job}
                featured={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Jobs */}
      <div className="all-jobs-section">
        <h2 className="section-title">
          {featuredJobs.length > 0 ? 'All Jobs' : 'Available Jobs'}
        </h2>
        
        {filteredJobs.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No jobs found</h3>
            <p>Try adjusting your filters or search term</p>
            <button 
              className="reset-btn"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setLocationFilter('all');
                setSalaryFilter('all');
                setScheduleFilter('all');
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs
              .filter(j => !j.isFeatured || featuredJobs.length === 0)
              .map(job => (
                <JobCard 
                  key={job._id} 
                  job={job}
                  featured={false}
                />
              ))}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="tips-section">
        <div className="tips-header">
          <h3><span className="tip-icon">💡</span> Job Search Tips</h3>
          <p className="tips-subtitle">Maximize your chances of getting hired</p>
        </div>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-number">01</div>
            <h4>Customize Your Resume</h4>
            <p>Tailor your resume for each specific job application.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">02</div>
            <h4>Highlight Flexible Hours</h4>
            <p>Emphasize your availability and flexibility as a student.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">03</div>
            <h4>Prepare for Interviews</h4>
            <p>Research the company and prepare thoughtful questions.</p>
          </div>
          <div className="tip-card">
            <div className="tip-number">04</div>
            <h4>Follow Up</h4>
            <p>Send a thank-you email after interviews.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobList;