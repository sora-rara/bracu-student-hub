import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios.jsx';
import { 
  DollarSign, Calendar, Award, Filter, Search, 
  Star, Building, CheckCircle, TrendingUp, Target,
  ExternalLink, Save, GraduationCap, BookOpen, Users,
  AlertCircle, Clock, Percent, Flag
} from 'lucide-react';

const ScholarshipFinderPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minAmount: '',
    academicLevel: '',
    upcoming: 'true',
    sort: 'deadline'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalScholarships: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [eligibilityResults, setEligibilityResults] = useState({});

  const categories = [
    { value: 'academic-merit', label: 'Academic Merit', icon: '🏆' },
    { value: 'athletic', label: 'Athletic', icon: '⚽' },
    { value: 'need-based', label: 'Need-Based', icon: '💝' },
    { value: 'minority', label: 'Minority', icon: '🌍' },
    { value: 'field-specific', label: 'Field Specific', icon: '🎯' },
    { value: 'leadership', label: 'Leadership', icon: '👑' },
    { value: 'community-service', label: 'Community Service', icon: '🤝' },
    { value: 'creative-arts', label: 'Creative Arts', icon: '🎨' },
    { value: 'research', label: 'Research', icon: '🔬' },
    { value: 'study-abroad', label: 'Study Abroad', icon: '✈️' },
    { value: 'other', label: 'Other', icon: '✨' }
  ];

  const academicLevels = [
    { value: 'freshman', label: 'Freshman' },
    { value: 'sophomore', label: 'Sophomore' },
    { value: 'junior', label: 'Junior' },
    { value: 'senior', label: 'Senior' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'phd', label: 'PhD' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'deadline', label: 'Application Deadline' },
    { value: 'amount', label: 'Highest Amount' }
  ];

  useEffect(() => {
    fetchScholarships();
  }, [filters, pagination.currentPage]);

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 12,
        ...filters
      });
      
      const response = await axios.get(`/api/career/scholarships?${params}`);
      
      if (response.data.success) {
        setScholarships(response.data.scholarships);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching scholarships:', err);
      setError('Failed to load scholarships. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleCheckEligibility = async (scholarshipId) => {
    try {
      const response = await axios.post('/api/career/check-eligibility', {
        opportunityType: 'scholarship',
        opportunityId: scholarshipId
      });
      
      if (response.data.success) {
        setEligibilityResults(prev => ({
          ...prev,
          [scholarshipId]: response.data.eligibility
        }));
      }
    } catch (err) {
      console.error('Error checking eligibility:', err);
      alert('Unable to check eligibility at this time');
    }
  };

  const handleSaveScholarship = async (scholarshipId) => {
    try {
      const response = await axios.post('/api/career/save', {
        opportunityType: 'scholarship',
        opportunityId: scholarshipId
      });
      
      if (response.data.success) {
        // Update local state
        setScholarships(prev => prev.map(scholarship => 
          scholarship._id === scholarshipId 
            ? { ...scholarship, isSaved: response.data.saved }
            : scholarship
        ));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save scholarship');
    }
  };

  const formatDeadline = (date) => {
    if (!date) return 'Rolling';
    const deadline = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Closed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ScholarshipCard = ({ scholarship }) => {
    const eligibility = eligibilityResults[scholarship._id];
    const deadlineColor = formatDeadline(scholarship.application?.deadline) === 'Closed' 
      ? 'bg-red-100 text-red-800'
      : formatDeadline(scholarship.application?.deadline) === 'Today' 
      ? 'bg-red-100 text-red-800'
      : formatDeadline(scholarship.application?.deadline).includes('days') && parseInt(formatDeadline(scholarship.application?.deadline)) <= 7
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800';
    
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="p-6">
          {/* Scholarship Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  scholarship.category === 'academic-merit' 
                    ? 'bg-blue-100 text-blue-800'
                    : scholarship.category === 'need-based'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {categories.find(c => c.value === scholarship.category)?.label || scholarship.category}
                </span>
                
                {scholarship.isFeatured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star size={12} /> Featured
                  </span>
                )}
                
                {scholarship.isExclusive && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    🔒 Exclusive
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-1">{scholarship.name}</h3>
              <div className="flex items-center gap-2 text-gray-600">
                <Building size={16} />
                <span className="font-medium">{scholarship.provider?.name}</span>
                {scholarship.provider?.isVerified && (
                  <CheckCircle size={14} className="text-green-500" />
                )}
              </div>
            </div>
            
            <button
              onClick={() => handleSaveScholarship(scholarship._id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={scholarship.isSaved ? 'Remove from saved' : 'Save scholarship'}
            >
              <Save className={scholarship.isSaved ? 'text-blue-600 fill-blue-600' : 'text-gray-400'} size={20} />
            </button>
          </div>

          {/* Scholarship Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {scholarship.shortDescription}
          </p>

          {/* Award Details */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-green-500" />
                <span className="text-lg font-bold text-gray-800">
                  ${scholarship.award?.amount?.toLocaleString() || 'Varies'}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${deadlineColor}`}>
                {formatDeadline(scholarship.application?.deadline)}
              </span>
            </div>
            
            <div className="text-sm text-gray-500">
              {scholarship.award?.type?.replace('-', ' ').toUpperCase()} 
              {scholarship.award?.renewable && ' • Renewable'}
            </div>
          </div>

          {/* Eligibility Badges */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {scholarship.eligibility?.minGPA && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  GPA: {scholarship.eligibility.minGPA}+
                </span>
              )}
              
              {scholarship.eligibility?.financialNeed && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Financial Need
                </span>
              )}
              
              {scholarship.eligibility?.essaysRequired && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Essay Required
                </span>
              )}
              
              {scholarship.eligibility?.recommendationsRequired > 0 && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  {scholarship.eligibility.recommendationsRequired} Recommendation{scholarship.eligibility.recommendationsRequired !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Eligibility Check */}
          {eligibility && (
            <div className={`mb-4 p-3 rounded-lg ${eligibility.isEligible 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {eligibility.isEligible ? (
                  <>
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">You are eligible!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-red-600" />
                    <span className="text-sm font-medium text-red-700">You may not be eligible</span>
                  </>
                )}
              </div>
              {eligibility.reasons.length > 0 && (
                <ul className="text-xs text-gray-600 mt-1">
                  {eligibility.reasons.map((reason, idx) => (
                    <li key={idx}>• {reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link
              to={`/career/scholarships/${scholarship._id}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200"
            >
              View Details
            </Link>
            
            <button
              onClick={() => handleCheckEligibility(scholarship._id)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
            >
              Check Eligibility
            </button>
            
            {scholarship.hasApplied ? (
              <button
                disabled
                className="flex-1 bg-green-100 text-green-800 font-medium py-2.5 px-4 rounded-lg cursor-default"
              >
                Applied ✓
              </button>
            ) : (
              <a
                href={scholarship.application?.applicationLink || '#'}
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">Scholarship Finder</h1>
            <p className="text-xl text-green-100 mb-6">
              Discover scholarship opportunities based on your eligibility. 
              Find funding for your education journey.
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign size={16} />
                <span>{pagination.totalScholarships.toLocaleString()} Scholarships</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} />
                <span>Total Awards: ${scholarships.reduce((sum, s) => sum + (s.award?.amount || 0), 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{scholarships.filter(s => s.application?.deadline && new Date(s.application.deadline) > new Date()).length} Upcoming Deadlines</span>
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
                  Search Scholarships
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Scholarship name, provider..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scholarship Type
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Types</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Award Amount ($)
                </label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="e.g., 1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Academic Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Level
                </label>
                <select
                  value={filters.academicLevel}
                  onChange={(e) => handleFilterChange('academicLevel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Levels</option>
                  {academicLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upcoming Deadlines */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.upcoming === 'true'}
                    onChange={(e) => handleFilterChange('upcoming', e.target.checked ? 'true' : 'false')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Show Upcoming Deadlines Only</span>
                </label>
              </div>

              {/* Sort Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  minAmount: '',
                  academicLevel: '',
                  upcoming: 'true',
                  sort: 'deadline'
                })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                Reset All Filters
              </button>
            </div>

            {/* Scholarship Tips */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen size={20} /> Application Tips
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">📅 Apply Early</p>
                  <p>Start applications well before deadlines</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">📝 Personalize Essays</p>
                  <p>Tailor each essay to the specific scholarship</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">📋 Gather Documents</p>
                  <p>Prepare transcripts and recommendations early</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scholarships List */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Available Scholarships
                    <span className="text-gray-500 font-normal text-lg ml-2">
                      ({pagination.totalScholarships.toLocaleString()} results)
                    </span>
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {filters.search && `Search: "${filters.search}"`}
                    {filters.category && ` • Type: ${categories.find(c => c.value === filters.category)?.label}`}
                    {filters.minAmount && ` • Min Amount: $${parseInt(filters.minAmount).toLocaleString()}`}
                  </p>
                </div>
                
                <Link
                  to="/career/applications?type=scholarship"
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  My Applications →
                </Link>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Unable to Load Scholarships</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchScholarships}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Scholarships Grid */}
            {!loading && !error && (
              <>
                {scholarships.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                    <DollarSign className="mx-auto text-gray-400 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No scholarships found</h3>
                    <p className="text-gray-500 mb-6">
                      {filters.search || filters.category 
                        ? 'Try adjusting your filters to find more opportunities'
                        : 'No scholarships are currently available. Check back soon!'}
                    </p>
                    <button
                      onClick={() => setFilters({
                        search: '',
                        category: '',
                        minAmount: '',
                        academicLevel: '',
                        upcoming: 'true',
                        sort: 'deadline'
                      })}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {scholarships.map(scholarship => (
                        <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
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
                              key={pageNum}
                              onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                              className={`px-4 py-2 border rounded-lg ${
                                pagination.currentPage === pageNum
                                  ? 'bg-green-600 text-white border-green-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                          <>
                            <span className="px-2">...</span>
                            <button
                              onClick={() => setPagination(prev => ({ ...prev, currentPage: pagination.totalPages }))}
                              className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
                                pagination.currentPage === pagination.totalPages ? 'bg-green-600 text-white border-green-600' : ''
                              }`}
                            >
                              {pagination.totalPages}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                          disabled={!pagination.hasNextPage}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    )}

                    {/* Results Info */}
                    <div className="mt-8 text-center text-sm text-gray-500">
                      Showing page {pagination.currentPage} of {pagination.totalPages} 
                      • {pagination.totalScholarships.toLocaleString()} scholarships total
                    </div>
                  </>
                )}
              </>
            )}

            {/* Scholarship Resources */}
            {!loading && !error && scholarships.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <GraduationCap size={24} /> Scholarship Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-2">Application Guide</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Step-by-step guide to writing winning scholarship applications
                    </p>
                    <Link to="/resources/scholarship-guide" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Read Guide →
                    </Link>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-2">Essay Templates</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Professional templates for personal statements and essays
                    </p>
                    <Link to="/resources/essay-templates" className="text-green-600 hover:text-green-800 text-sm font-medium">
                      Download Templates →
                    </Link>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-2">Deadline Calendar</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Track all your scholarship deadlines in one place
                    </p>
                    <Link to="/calendar" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                      View Calendar →
                    </Link>
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

export default ScholarshipFinderPage;