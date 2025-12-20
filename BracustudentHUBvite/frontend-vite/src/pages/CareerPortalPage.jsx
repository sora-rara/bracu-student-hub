import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios.jsx';
import { 
  Briefcase, GraduationCap, DollarSign, Search, 
  Filter, TrendingUp, Clock, MapPin, Star,
  ExternalLink, ChevronRight, Users, Award, Target
} from 'lucide-react';

const CareerPortalPage = () => {
  const [stats, setStats] = useState(null);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [featuredInternships, setFeaturedInternships] = useState([]);
  const [featuredScholarships, setFeaturedScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const statsRes = await axios.get('/api/career/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      
      // Fetch featured opportunities
      const [jobsRes, internshipsRes, scholarshipsRes] = await Promise.all([
        axios.get('/api/career/jobs?featured=true&limit=4'),
        axios.get('/api/career/internships?featured=true&limit=4'),
        axios.get('/api/career/scholarships?featured=true&limit=4')
      ]);
      
      if (jobsRes.data.success) setFeaturedJobs(jobsRes.data.jobs);
      if (internshipsRes.data.success) setFeaturedInternships(internshipsRes.data.internships);
      if (scholarshipsRes.data.success) setFeaturedScholarships(scholarshipsRes.data.scholarships);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, value, label, color }) => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const OpportunityCard = ({ type, item }) => {
    const getTypeInfo = () => {
      switch (type) {
        case 'job':
          return {
            icon: Briefcase,
            color: 'bg-blue-100 text-blue-800',
            label: 'Job',
            path: `/career/jobs/${item._id}`
          };
        case 'internship':
          return {
            icon: GraduationCap,
            color: 'bg-purple-100 text-purple-800',
            label: 'Internship',
            path: `/career/internships/${item._id}`
          };
        case 'scholarship':
          return {
            icon: DollarSign,
            color: 'bg-green-100 text-green-800',
            label: 'Scholarship',
            path: `/career/scholarships/${item._id}`
          };
        default:
          return { icon: Briefcase, color: 'bg-gray-100 text-gray-800', label: 'Opportunity' };
      }
    };

    const typeInfo = getTypeInfo();
    const Icon = typeInfo.icon;

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {item.isFeatured && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  <Star size={12} className="inline mr-1" /> Featured
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {item.title || item.name}
            </h3>
            <p className="text-gray-600 text-sm">
              {type === 'job' && item.company?.name}
              {type === 'internship' && item.organization?.name}
              {type === 'scholarship' && item.provider?.name}
            </p>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {item.shortDescription}
        </p>

        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          {type === 'job' && (
            <>
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{item.location?.city || 'Multiple Locations'}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign size={14} />
                <span>${item.compensation?.amount?.toLocaleString() || 'Competitive'}</span>
              </div>
            </>
          )}
          {type === 'internship' && (
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{item.type?.charAt(0).toUpperCase() + item.type?.slice(1)}</span>
            </div>
          )}
          {type === 'scholarship' && (
            <div className="flex items-center gap-1">
              <Award size={14} />
              <span>${item.award?.amount?.toLocaleString() || 'Varies'}</span>
            </div>
          )}
        </div>

        <Link
          to={typeInfo.path}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
        >
          View Details
        </Link>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Your Career & Opportunity Portal
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Discover jobs, internships, and scholarships tailored for students.
              Take the next step in your career journey.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.totals?.jobs || 0}</div>
                <div className="text-sm text-blue-200">Part-Time Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.totals?.internships || 0}</div>
                <div className="text-sm text-blue-200">Internships</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.totals?.scholarships || 0}</div>
                <div className="text-sm text-blue-200">Scholarships</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.user?.applications || 0}</div>
                <div className="text-sm text-blue-200">Your Applications</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search jobs, internships, scholarships..."
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-800"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            icon={Briefcase} 
            value={stats?.totals?.jobs || 0} 
            label="Available Jobs"
            color="bg-blue-500"
          />
          <StatCard 
            icon={GraduationCap} 
            value={stats?.totals?.internships || 0} 
            label="Internships"
            color="bg-purple-500"
          />
          <StatCard 
            icon={DollarSign} 
            value={stats?.totals?.scholarships || 0} 
            label="Scholarships"
            color="bg-green-500"
          />
          <StatCard 
            icon={Users} 
            value={stats?.user?.applications || 0} 
            label="Your Applications"
            color="bg-orange-500"
          />
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 font-medium ${activeTab === 'all' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Opportunities
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-6 py-3 font-medium ${activeTab === 'jobs' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('internships')}
              className={`px-6 py-3 font-medium ${activeTab === 'internships' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              Internships
            </button>
            <button
              onClick={() => setActiveTab('scholarships')}
              className={`px-6 py-3 font-medium ${activeTab === 'scholarships' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              Scholarships
            </button>
          </div>
        </div>

        {/* Featured Opportunities */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Featured Opportunities</h2>
            <Link 
              to="/career/all" 
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {activeTab === 'all' || activeTab === 'jobs' ? (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="text-blue-600" size={20} />
                <h3 className="text-xl font-semibold text-gray-700">Featured Jobs</h3>
              </div>
              {featuredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredJobs.map(job => (
                    <OpportunityCard key={job._id} type="job" item={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No featured jobs available</p>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'all' || activeTab === 'internships' ? (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-purple-600" size={20} />
                <h3 className="text-xl font-semibold text-gray-700">Featured Internships</h3>
              </div>
              {featuredInternships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredInternships.map(internship => (
                    <OpportunityCard key={internship._id} type="internship" item={internship} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No featured internships available</p>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'all' || activeTab === 'scholarships' ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="text-green-600" size={20} />
                <h3 className="text-xl font-semibold text-gray-700">Featured Scholarships</h3>
              </div>
              {featuredScholarships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredScholarships.map(scholarship => (
                    <OpportunityCard key={scholarship._id} type="scholarship" item={scholarship} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No featured scholarships available</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/career/jobs"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Part-Time Jobs</h3>
                <p className="text-sm text-gray-500">Find flexible work opportunities</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">Browse Jobs</span>
              <ChevronRight className="text-blue-600 transform group-hover:translate-x-1 transition-transform" size={16} />
            </div>
          </Link>

          <Link 
            to="/career/internships"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <GraduationCap className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Internships</h3>
                <p className="text-sm text-gray-500">Gain real-world experience</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-600 font-medium">Explore Internships</span>
              <ChevronRight className="text-purple-600 transform group-hover:translate-x-1 transition-transform" size={16} />
            </div>
          </Link>

          <Link 
            to="/career/scholarships"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Scholarships</h3>
                <p className="text-sm text-gray-500">Find funding for your education</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-medium">View Scholarships</span>
              <ChevronRight className="text-green-600 transform group-hover:translate-x-1 transition-transform" size={16} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CareerPortalPage;