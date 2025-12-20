import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios.jsx';
import {
  FileText, Calendar, Clock, CheckCircle, XCircle,
  AlertCircle, TrendingUp, Filter, Search, ExternalLink,
  ChevronDown, ChevronUp, MessageSquare, Download,
  Eye, Edit, Trash2, RefreshCw
} from 'lucide-react';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [expandedApplication, setExpandedApplication] = useState(null);

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/api/career/applications?${params}`);
      
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/career/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', icon: FileText },
      'submitted': { color: 'bg-blue-100 text-blue-800', icon: FileText },
      'under-review': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'shortlisted': { color: 'bg-purple-100 text-purple-800', icon: TrendingUp },
      'interview-scheduled': { color: 'bg-indigo-100 text-indigo-800', icon: Calendar },
      'interviewed': { color: 'bg-indigo-100 text-indigo-800', icon: MessageSquare },
      'accepted': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'withdrawn': { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      'waitlisted': { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: FileText };
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon size={12} />
        {status.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  const getOpportunityLink = (application) => {
    switch (application.opportunityType) {
      case 'job':
        return `/career/jobs/${application.opportunityId._id}`;
      case 'internship':
        return `/career/internships/${application.opportunityId._id}`;
      case 'scholarship':
        return `/career/scholarships/${application.opportunityId._id}`;
      default:
        return '#';
    }
  };

  const getOpportunityTitle = (application) => {
    return application.opportunityId?.title || application.opportunityId?.name || 'Unknown';
  };

  const getOpportunityCompany = (application) => {
    return (
      application.opportunityId?.company?.name ||
      application.opportunityId?.organization?.name ||
      application.opportunityId?.provider?.name ||
      'Unknown'
    );
  };

  const ApplicationCard = ({ application }) => {
    const isExpanded = expandedApplication === application._id;
    
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusBadge(application.status)}
                <span className="text-sm text-gray-500">
                  Applied: {new Date(application.submissionDate).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                <Link to={getOpportunityLink(application)} className="hover:text-blue-600">
                  {getOpportunityTitle(application)}
                </Link>
              </h3>
              
              <p className="text-gray-600 text-sm">
                {getOpportunityCompany(application)} • 
                <span className="ml-1 capitalize">{application.opportunityType}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedApplication(isExpanded ? null : application._id)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {/* Timeline */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Application Timeline</h4>
                <div className="space-y-3">
                  {application.timeline?.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{event.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {event.details && (
                          <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              {application.documents && application.documents.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Submitted Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {application.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700"
                      >
                        <FileText size={14} />
                        {doc.name}
                        <Download size={12} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200">
                  View Details
                </button>
                <button className="flex-1 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200">
                  Update Status
                </button>
                {application.status === 'draft' && (
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200">
                    Delete Draft
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)} from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">Application Tracker</h1>
            <p className="text-xl text-indigo-100 mb-6">
              Track and manage all your job, internship, and scholarship applications in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Applications"
            value={stats?.user?.applications || 0}
            icon={FileText}
            color="bg-indigo-500"
          />
          <StatCard 
            title="Under Review"
            value={applications.filter(a => a.status === 'under-review').length}
            icon={Clock}
            color="bg-yellow-500"
          />
          <StatCard 
            title="Accepted"
            value={applications.filter(a => a.status === 'accepted').length}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard 
            title="Interviews"
            value={applications.filter(a => a.status.includes('interview')).length}
            icon={MessageSquare}
            color="bg-purple-500"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search applications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="job">Jobs</option>
                <option value="internship">Internships</option>
                <option value="scholarship">Scholarships</option>
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under-review">Under Review</option>
                <option value="interview-scheduled">Interview Scheduled</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
              
              <button
                onClick={() => setFilters({ type: '', status: '', search: '' })}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Your Applications</h2>
            <button
              onClick={fetchApplications}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No applications found</h3>
              <p className="text-gray-500 mb-6">
                {filters.search || filters.type || filters.status
                  ? 'Try adjusting your filters'
                  : "You haven't applied to any opportunities yet"}
              </p>
              <Link
                to="/career"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
              >
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div>
              {applications.map(application => (
                <ApplicationCard key={application._id} application={application} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;