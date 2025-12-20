// pages/CareerDashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios.jsx';
import {
  Briefcase, GraduationCap, DollarSign, TrendingUp,
  Calendar, Clock, CheckCircle, AlertCircle, Target,
  Users, Award, BarChart, Bell, FileText, Star,
  ChevronRight, TrendingDown, Eye, ExternalLink
} from 'lucide-react';

const CareerDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/career/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.dashboard);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
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

  const StatCard = ({ title, value, change, icon: Icon, color, link }) => (
    <Link to={link || '#'}>
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value.toLocaleString()}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {change > 0 ? (
                  <TrendingUp size={14} className="text-green-500" />
                ) : (
                  <TrendingDown size={14} className="text-red-500" />
                )}
                <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
      </div>
    </Link>
  );

  const ApplicationStatusCard = ({ status, count, color, percentage }) => (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-sm text-gray-700">{status}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800">{count}</span>
        {percentage && (
          <span className="text-xs text-gray-500">({percentage}%)</span>
        )}
      </div>
    </div>
  );

  const UpcomingDeadlineCard = ({ item, type }) => {
    const getDeadline = () => {
      switch (type) {
        case 'job':
          return item.applicationProcess?.deadline;
        case 'internship':
          return item.applicationDetails?.deadline;
        case 'scholarship':
          return item.application?.deadline;
        default:
          return null;
      }
    };

    const deadline = getDeadline();
    const daysLeft = deadline ? Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-gray-800">{item.title || item.name}</h4>
            <p className="text-sm text-gray-500 mt-1">
              {item.company?.name || item.organization?.name || item.provider?.name}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            daysLeft <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {daysLeft}d left
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {deadline ? new Date(deadline).toLocaleDateString() : 'No deadline'}
          </span>
          <Link to={`/career/${type}s/${item._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View →
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Career Dashboard</h1>
              <p className="text-indigo-100">Track your applications, saved opportunities, and upcoming deadlines</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                <Bell size={18} />
                Notifications
              </button>
              <button className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors">
                <Target size={18} />
                Set Goals
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Applications"
            value={dashboardData?.stats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
            change={12}
            icon={FileText}
            color="bg-indigo-500"
            link="/career/applications"
          />
          <StatCard
            title="Saved Opportunities"
            value={dashboardData?.savedItems?.length || 0}
            change={8}
            icon={Star}
            color="bg-yellow-500"
            link="/career/saved"
          />
          <StatCard
            title="Upcoming Deadlines"
            value={dashboardData?.upcomingDeadlines || 0}
            change={-3}
            icon={Calendar}
            color="bg-red-500"
          />
          <StatCard
            title="Profile Views"
            value={stats?.user?.profileViews || 0}
            change={25}
            icon={Eye}
            color="bg-green-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Applications & Status */}
          <div className="lg:col-span-2">
            {/* Recent Applications */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Applications</h2>
                <Link to="/career/applications" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              {dashboardData?.applications && dashboardData.applications.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.applications.slice(0, 5).map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {app.opportunityType === 'job' && <Briefcase size={18} className="text-blue-600" />}
                          {app.opportunityType === 'internship' && <GraduationCap size={18} className="text-purple-600" />}
                          {app.opportunityType === 'scholarship' && <DollarSign size={18} className="text-green-600" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {app.opportunityId?.title || app.opportunityId?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Applied {new Date(app.submissionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          app.status === 'under-review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No applications yet</p>
                  <Link
                    to="/career"
                    className="inline-block mt-3 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Browse opportunities →
                  </Link>
                </div>
              )}
            </div>

            {/* Application Status Overview */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Application Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData?.stats?.find(s => s._id === 'submitted')?.count || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Submitted</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {dashboardData?.stats?.find(s => s._id === 'under-review')?.count || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Review</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboardData?.stats?.find(s => s._id === 'interview-scheduled')?.count || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Interview</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData?.stats?.find(s => s._id === 'accepted')?.count || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Accepted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Deadlines */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/career/jobs"
                  className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={20} className="text-blue-600" />
                    <span className="font-medium text-gray-800">Browse Jobs</span>
                  </div>
                  <ChevronRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/career/internships"
                  className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap size={20} className="text-purple-600" />
                    <span className="font-medium text-gray-800">Find Internships</span>
                  </div>
                  <ChevronRight size={16} className="text-purple-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/career/scholarships"
                  className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-green-600" />
                    <span className="font-medium text-gray-800">Apply Scholarships</span>
                  </div>
                  <ChevronRight size={16} className="text-green-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/career/applications"
                  className="flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-indigo-600" />
                    <span className="font-medium text-gray-800">Track Applications</span>
                  </div>
                  <ChevronRight size={16} className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Upcoming Deadlines</h2>
                <Link to="/career/saved" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              <div className="space-y-4">
                {dashboardData?.upcomingDeadlinesList && dashboardData.upcomingDeadlinesList.length > 0 ? (
                  dashboardData.upcomingDeadlinesList.slice(0, 3).map((item, idx) => (
                    <UpcomingDeadlineCard key={idx} item={item} type={item.type} />
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-500 text-sm">No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target size={20} className="text-blue-600" />
                <h3 className="font-bold text-gray-800">Weekly Goal</h3>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Application Progress</span>
                  <span>3/5 applications</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Complete 2 more applications to reach your weekly goal!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerDashboardPage;