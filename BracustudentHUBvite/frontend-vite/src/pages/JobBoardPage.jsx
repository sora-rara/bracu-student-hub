import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios.jsx';
import { 
  Briefcase, MapPin, DollarSign, Clock, Filter, 
  Search, Star, Building, CheckCircle, TrendingUp,
  ExternalLink, Save, Share2, AlertCircle
} from 'lucide-react';

const JobBoardPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    locationType: '',
    type: 'part-time',
    minCompensation: '',
    sort: 'newest'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const categories = [
    { value: 'retail', label: 'Retail', icon: '🛍️' },
    { value: 'food-service', label: 'Food Service', icon: '🍽️' },
    { value: 'tutoring', label: 'Tutoring', icon: '📚' },
    { value: 'research', label: 'Research', icon: '🔬' },
    { value: 'admin', label: 'Administrative', icon: '💼' },
    { value: 'tech-support', label: 'Tech Support', icon: '💻' },
    { value: 'customer-service', label: 'Customer Service', icon: '👥' },
    { value: 'delivery', label: 'Delivery', icon: '🚚' },
    { value: 'on-campus', label: 'On-Campus', icon: '🏫' },
    { value: 'other', label: 'Other', icon: '✨' }
  ];

  const jobTypes = [
    { value: 'part-time', label: 'Part-Time' },
    { value: 'full-time', label: 'Full-Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const locationTypes = [
    { value: 'on-site', label: 'On-Site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'salary', label: 'Highest Pay' },
    { value: 'deadline', label: 'Application Deadline' }
  ];

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.currentPage]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 12,
        ...filters
      });
      
      const response = await axios.get(`/api/career/jobs?${params}`);
      
      if (response.data.success) {
        setJobs(response.data.jobs);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSaveJob = async (jobId, isCurrentlySaved) => {
    try {
      const response = await axios.post('/api/career/save', {
        opportunityType: 'job',
        opportunityId: jobId
      });
      
      if (response.data.success) {
        // Update local state
        setJobs(prev => prev.map(job => 
          job._id === jobId 
            ? { ...job, isSaved: response.data.saved }
            : job
        ));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save job');
    }
  };

  const JobCard = ({ job }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-6">
        {/* Job Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                job.category === 'on-campus' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {categories.find(c => c.value === job.category)?.label || job.category}
              </span>
              
              {job.isUrgent && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  ⚡ Urgent Hire
                </span>
              )}
              
              {job.isFeatured && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star size={12} /> Featured
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-1">{job.title}</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <Building size={16} />
              <span className="font-medium">{job.company?.name}</span>
              {job.company?.isVerified && (
                <CheckCircle size={14} className="text-green-500" />
              )}
              {job.company?.isAlumniCompany && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Alumni
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => handleSaveJob(job._id, job.isSaved)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={job.isSaved ? 'Remove from saved' : 'Save job'}
          >
            <Save className={job.isSaved ? 'text-blue-600 fill-blue-600' : 'text-gray-400'} size={20} />
          </button>
        </div>

        {/* Job Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {job.shortDescription}
        </p>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-sm">
              {job.location?.city || 'Multiple Locations'}
              {job.location?.type === 'remote' && ' (Remote)'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-700">
            <DollarSign size={16} className="text-green-500" />
            <span className="text-sm font-medium">
              ${job.compensation?.amount?.toLocaleString() || 'Competitive'}
              {job.compensation?.type === 'hourly' && '/hr'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-700">
            <Clock size={16} className="text-gray-400" />
            <span className="text-sm">
              {job.hoursPerWeek?.min}-{job.hoursPerWeek?.max} hrs/week
              {job.hoursPerWeek?.flexible && ' (Flexible)'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp size={16} className="text-gray-400" />
            <span className="text-sm">{job.requirements?.experience || 'No experience required'}</span>
          </div>
        </div>

        {/* Requirements Summary */}
        {job.requirements?.skills && job.requirements.skills.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Skills:</p>
            <div className="flex flex-wrap gap-2">
              {job.requirements.skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {skill}
                </span>
              ))}
              {job.requirements.skills.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  +{job.requirements.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            to={`/career/jobs/${job._id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200"
          >
            View Details
          </Link>
          
          {job.hasApplied ? (
            <button
              disabled
              className="flex-1 bg-green-100 text-green-800 font-medium py-2.5 px-4 rounded-lg cursor-default"
            >
              Applied
            </button>
          ) : (
            <a
              href={job.applicationProcess?.applicationLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Apply Now <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">Part-Time Job Board</h1>
            <p className="text-xl text-blue-100 mb-6">
              Find flexible work opportunities that fit your student schedule. 
              Verified companies, alumni connections, and on-campus positions.
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{pagination.totalJobs.toLocaleString()} Jobs Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Building size={16} />
                <span>Verified Companies</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Remote & On-Site</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Filter size={20} /> Filters
              </h2>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Jobs
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Job title, company, skills..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {jobTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type
                </label>
                <select
                  value={filters.locationType}
                  onChange={(e) => handleFilterChange('locationType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Locations</option>
                  {locationTypes.map(location => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Compensation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Pay ($/hr)
                </label>
                <input
                  type="number"
                  value={filters.minCompensation}
                  onChange={(e) => handleFilterChange('minCompensation', e.target.value)}
                  placeholder="e.g., 15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Sort Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => setFilters({
                  search: '',
                  category: '',
                  locationType: '',
                  type: 'part-time',
                  minCompensation: '',
                  sort: 'newest'
                })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                Reset All Filters
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Available Jobs
                    <span className="text-gray-500 font-normal text-lg ml-2">
                      ({pagination.totalJobs.toLocaleString()} results)
                    </span>
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {filters.search && `Search: "${filters.search}"`}
                    {filters.category && ` • Category: ${categories.find(c => c.value === filters.category)?.label}`}
                    {filters.locationType && ` • Location: ${locationTypes.find(l => l.value === filters.locationType)?.label}`}
                  </p>
                </div>
                
                <Link
                  to="/career/applications?type=job"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  My Applications →
                </Link>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Unable to Load Jobs</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchJobs}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Jobs Grid */}
            {!loading && !error && (
              <>
                {jobs.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                    <Briefcase className="mx-auto text-gray-400 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
                    <p className="text-gray-500 mb-6">
                      {filters.search || filters.category 
                        ? 'Try adjusting your filters to find more opportunities'
                        : 'No jobs are currently available. Check back soon!'}
                    </p>
                    <button
                      onClick={() => setFilters({
                        search: '',
                        category: '',
                        locationType: '',
                        type: 'part-time',
                        minCompensation: '',
                        sort: 'newest'
                      })}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {jobs.map(job => (
                        <JobCard key={job._id} job={job} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                          disabled={!pagination.hasPrevPage}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
                          const pageNum = pagination.currentPage <= 3 
                            ? idx + 1
                            : pagination.currentPage + idx - 2;
                          
                          if (pageNum > pagination.totalPages) return null;
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                              className={`px-4 py-2 rounded-lg ${pagination.currentPage === pageNum 
                                ? 'bg-blue-600 text-white' 
                                : 'border border-gray-300 hover:bg-gray-50'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                          disabled={!pagination.hasNextPage}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Tips Section */}
            {!loading && jobs.length > 0 && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <AlertCircle size={20} /> Job Application Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">📝 Tailor Your Resume</p>
                    <p>Customize your resume for each job application</p>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">📅 Apply Early</p>
                    <p>Early applicants are more likely to get interviews</p>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">✅ Follow Up</p>
                    <p>Send a thank-you email after applying</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobBoardPage;