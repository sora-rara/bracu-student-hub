import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios.jsx';
import { 
  GraduationCap, Calendar, MapPin, DollarSign, Filter, 
  Search, Star, Building, CheckCircle, TrendingUp,
  ExternalLink, Save, Share2, Target, Clock, Award,
  Briefcase, Users, BookOpen
} from 'lucide-react';

const InternshipTrackerPage = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    compensationType: '',
    locationType: '',
    major: '',
    sort: 'newest'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalInternships: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [savedInternships, setSavedInternships] = useState([]);
  const [appliedInternships, setAppliedInternships] = useState([]);

  const categories = [
    { value: 'engineering', label: 'Engineering', icon: '⚙️' },
    { value: 'computer-science', label: 'Computer Science', icon: '💻' },
    { value: 'business', label: 'Business', icon: '📊' },
    { value: 'marketing', label: 'Marketing', icon: '📈' },
    { value: 'finance', label: 'Finance', icon: '💰' },
    { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'research', label: 'Research', icon: '🔬' },
    { value: 'non-profit', label: 'Non-Profit', icon: '🤝' },
    { value: 'government', label: 'Government', icon: '🏛️' },
    { value: 'media', label: 'Media', icon: '🎥' },
    { value: 'design', label: 'Design', icon: '🎨' },
    { value: 'data-science', label: 'Data Science', icon: '📊' },
    { value: 'cybersecurity', label: 'Cybersecurity', icon: '🔒' },
    { value: 'other', label: 'Other', icon: '✨' }
  ];

  const internshipTypes = [
    { value: 'summer', label: 'Summer' },
    { value: 'fall', label: 'Fall' },
    { value: 'winter', label: 'Winter' },
    { value: 'spring', label: 'Spring' },
    { value: 'year-round', label: 'Year-Round' },
    { value: 'co-op', label: 'Co-op' },
    { value: 'virtual', label: 'Virtual' }
  ];

  const compensationTypes = [
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'stipend', label: 'Stipend' },
    { value: 'academic-credit', label: 'Academic Credit' },
    { value: 'housing-provided', label: 'Housing Provided' }
  ];

  const majors = [
    'Computer Science', 'Engineering', 'Business', 'Biology',
    'Psychology', 'Communications', 'Mathematics', 'Economics',
    'Political Science', 'Art', 'Music', 'Chemistry'
  ];

  useEffect(() => {
    fetchInternships();
    fetchUserData();
  }, [filters, pagination.currentPage]);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 12,
        ...filters
      });
      
      const response = await axios.get(`/api/career/internships?${params}`);
      
      if (response.data.success) {
        setInternships(response.data.internships);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError('Failed to load internships. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      // Fetch saved internships
      const savedRes = await axios.get('/api/career/saved?type=internship');
      if (savedRes.data.success) {
        setSavedInternships(savedRes.data.savedItems.map(item => item.opportunityId._id));
      }
      
      // Fetch applied internships
      const appliedRes = await axios.get('/api/career/applications?type=internship');
      if (appliedRes.data.success) {
        setAppliedInternships(appliedRes.data.applications.map(app => app.opportunityId._id));
      }
    } catch (err) {
      // User might not be logged in
      console.log('Could not fetch user data');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSaveInternship = async (internshipId) => {
    try {
      const response = await axios.post('/api/career/save', {
        opportunityType: 'internship',
        opportunityId: internshipId
      });
      
      if (response.data.success) {
        if (response.data.saved) {
          setSavedInternships(prev => [...prev, internshipId]);
        } else {
          setSavedInternships(prev => prev.filter(id => id !== internshipId));
        }
        
        // Update local state
        setInternships(prev => prev.map(internship => 
          internship._id === internshipId 
            ? { ...internship, isSaved: response.data.saved }
            : internship
        ));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save internship');
    }
  };

  const InternshipCard = ({ internship }) => {
    const isSaved = savedInternships.includes(internship._id);
    const hasApplied = appliedInternships.includes(internship._id);
    
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="p-6">
          {/* Internship Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  internship.type === 'summer' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : internship.type === 'virtual'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {internshipTypes.find(t => t.value === internship.type)?.label || internship.type}
                </span>
                
                {internship.isFeatured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star size={12} /> Featured
                  </span>
                )}
                
                {internship.isEligibleForCredit && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    🎓 Credit Eligible
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-1">{internship.title}</h3>
              <div className="flex items-center gap-2 text-gray-600">
                <Building size={16} />
                <span className="font-medium">{internship.organization?.name}</span>
                {internship.organization?.isVerified && (
                  <CheckCircle size={14} className="text-green-500" />
                )}
              </div>
            </div>
            
            <button
              onClick={() => handleSaveInternship(internship._id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isSaved ? 'Remove from saved' : 'Save internship'}
            >
              <Save className={isSaved ? 'text-blue-600 fill-blue-600' : 'text-gray-400'} size={20} />
            </button>
          </div>

          {/* Internship Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {internship.shortDescription}
          </p>

          {/* Internship Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-sm">
                {internship.location?.city || 'Multiple Locations'}
                {internship.location?.type === 'remote' && ' (Remote)'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm">
                {new Date(internship.duration?.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign size={16} className={
                internship.compensation?.type === 'paid' ? 'text-green-500' : 'text-gray-400'
              } />
              <span className="text-sm font-medium">
                {internship.compensation?.type === 'paid' 
                  ? `$${internship.compensation?.amount?.toLocaleString() || 'Competitive'}` 
                  : internship.compensation?.type?.replace('-', ' ').toUpperCase() || 'Unpaid'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm">
                {internship.duration?.hoursPerWeek?.min}-{internship.duration?.hoursPerWeek?.max} hrs/week
              </span>
            </div>
          </div>

          {/* Skills & Learning Outcomes */}
          {internship.skillsGained && internship.skillsGained.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">You'll Learn:</p>
              <div className="flex flex-wrap gap-2">
                {internship.skillsGained.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
                {internship.skillsGained.length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    +{internship.skillsGained.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Application Deadline */}
          {internship.applicationDetails?.deadline && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    Apply by {new Date(internship.applicationDetails.deadline).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {Math.ceil((new Date(internship.applicationDetails.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link
              to={`/career/internships/${internship._id}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200"
            >
              View Details
            </Link>
            
            {hasApplied ? (
              <button
                disabled
                className="flex-1 bg-green-100 text-green-800 font-medium py-2.5 px-4 rounded-lg cursor-default"
              >
                Applied ✓
              </button>
            ) : (
              <a
                href={internship.applicationDetails?.applicationLink || '#'}
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">Internship Tracker</h1>
            <p className="text-xl text-purple-100 mb-6">
              Discover, save, and apply for internship opportunities. 
              Track your applications and find the perfect experience.
            </p>
            
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Target size={16} />
                <span>{pagination.totalInternships.toLocaleString()} Internships</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} />
                <span>{internships.filter(i => i.compensation?.type === 'paid').length} Paid Positions</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{internships.filter(i => i.location?.type === 'remote').length} Remote Opportunities</span>
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
                  Search Internships
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Position, company, skills..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field/Industry
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Industries</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Internship Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internship Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Types</option>
                  {internshipTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compensation Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compensation
                </label>
                <select
                  value={filters.compensationType}
                  onChange={(e) => handleFilterChange('compensationType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Types</option>
                  {compensationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Major Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major/Field of Study
                </label>
                <select
                  value={filters.major}
                  onChange={(e) => handleFilterChange('major', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Majors</option>
                  {majors.map(major => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type
                </label>
                <select
                  value={filters.locationType}
                  onChange={(e) => handleFilterChange('locationType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Locations</option>
                  <option value="on-site">On-Site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => setFilters({
                  search: '',
                  category: '',
                  type: '',
                  compensationType: '',
                  locationType: '',
                  major: '',
                  sort: 'newest'
                })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                Reset All Filters
              </button>
            </div>

            {/* Saved Internships */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Save size={20} /> My Saved Internships
              </h3>
              {savedInternships.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    You have {savedInternships.length} saved internship{savedInternships.length !== 1 ? 's' : ''}
                  </p>
                  <Link
                    to="/career/saved?type=internship"
                    className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                  >
                    View Saved
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Save internships to track them here
                </p>
              )}
            </div>
          </div>

          {/* Internships List */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Available Internships
                    <span className="text-gray-500 font-normal text-lg ml-2">
                      ({pagination.totalInternships.toLocaleString()} results)
                    </span>
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {filters.search && `Search: "${filters.search}"`}
                    {filters.category && ` • Industry: ${categories.find(c => c.value === filters.category)?.label}`}
                    {filters.compensationType && ` • Compensation: ${compensationTypes.find(c => c.value === filters.compensationType)?.label}`}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Link
                    to="/career/applications?type=internship"
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    My Applications →
                  </Link>
                  <Link
                    to="/career/internships/tracker"
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Application Tracker →
                  </Link>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-red-700 mb-2">Unable to Load Internships</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchInternships}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Internships Grid */}
            {!loading && !error && (
              <>
                {internships.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                    <GraduationCap className="mx-auto text-gray-400 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No internships found</h3>
                    <p className="text-gray-500 mb-6">
                      {filters.search || filters.category 
                        ? 'Try adjusting your filters to find more opportunities'
                        : 'No internships are currently available. Check back soon!'}
                    </p>
                    <button
                      onClick={() => setFilters({
                        search: '',
                        category: '',
                        type: '',
                        compensationType: '',
                        locationType: '',
                        major: '',
                        sort: 'newest'
                      })}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {internships.map(internship => (
                        <InternshipCard key={internship._id} internship={internship} />
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
                                ? 'bg-purple-600 text-white' 
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
            {!loading && internships.length > 0 && (
              <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <BookOpen size={20} /> Internship Application Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm text-purple-700">
                    <p className="font-medium mb-1">🎯 Tailor Your Application</p>
                    <p>Customize your resume and cover letter for each internship</p>
                  </div>
                  <div className="text-sm text-purple-700">
                    <p className="font-medium mb-1">📝 Research the Company</p>
                    <p>Understand the organization's mission and values</p>
                  </div>
                  <div className="text-sm text-purple-700">
                    <p className="font-medium mb-1">💡 Highlight Projects</p>
                    <p>Showcase relevant academic and personal projects</p>
                  </div>
                  <div className="text-sm text-purple-700">
                    <p className="font-medium mb-1">🤝 Network</p>
                    <p>Connect with alumni and professionals in your field</p>
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

export default InternshipTrackerPage;