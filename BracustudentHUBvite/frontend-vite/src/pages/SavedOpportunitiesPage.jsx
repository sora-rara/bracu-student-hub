import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios.jsx';
import {
  Save, Trash2, Briefcase, GraduationCap, DollarSign,
  Calendar, MapPin, Star, Building, ExternalLink,
  Filter, Search, Eye, CheckCircle, AlertCircle
} from 'lucide-react';

const SavedOpportunitiesPage = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    applied: '',
    search: ''
  });

  useEffect(() => {
    fetchSavedItems();
  }, [filters]);

  const fetchSavedItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/api/career/saved?${params}`);
      
      if (response.data.success) {
        setSavedItems(response.data.savedItems);
      }
    } catch (err) {
      console.error('Error fetching saved items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (opportunityType, opportunityId) => {
    try {
      await axios.post('/api/career/save', {
        opportunityType,
        opportunityId
      });
      
      setSavedItems(prev => prev.filter(item => 
        !(item.opportunityType === opportunityType && item.opportunityId._id === opportunityId)
      ));
    } catch (err) {
      alert('Failed to remove saved item');
    }
  };

  const getOpportunityLink = (item) => {
    switch (item.opportunityType) {
      case 'job':
        return `/career/jobs/${item.opportunityId._id}`;
      case 'internship':
        return `/career/internships/${item.opportunityId._id}`;
      case 'scholarship':
        return `/career/scholarships/${item.opportunityId._id}`;
      default:
        return '#';
    }
  };

  const getOpportunityIcon = (type) => {
    switch (type) {
      case 'job':
        return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'internship':
        return { icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'scholarship':
        return { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' };
      default:
        return { icon: Briefcase, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getOpportunityDetails = (item) => {
    const opportunity = item.opportunityId;
    switch (item.opportunityType) {
      case 'job':
        return {
          title: opportunity.title,
          company: opportunity.company?.name,
          location: opportunity.location?.city,
          deadline: opportunity.applicationProcess?.deadline,
          compensation: opportunity.compensation?.amount
        };
      case 'internship':
        return {
          title: opportunity.title,
          company: opportunity.organization?.name,
          location: opportunity.location?.city,
          deadline: opportunity.applicationDetails?.deadline,
          type: opportunity.type
        };
      case 'scholarship':
        return {
          title: opportunity.name,
          company: opportunity.provider?.name,
          amount: opportunity.award?.amount,
          deadline: opportunity.application?.deadline
        };
      default:
        return {};
    }
  };

  const SavedItemCard = ({ item }) => {
    const details = getOpportunityDetails(item);
    const iconInfo = getOpportunityIcon(item.opportunityType);
    const Icon = iconInfo.icon;

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${iconInfo.bg}`}>
                <Icon className={iconInfo.color} size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium capitalize">
                    {item.opportunityType}
                  </span>
                  {item.applied && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle size={10} /> Applied
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  <Link to={getOpportunityLink(item)} className="hover:text-blue-600">
                    {details.title}
                  </Link>
                </h3>
                <p className="text-gray-600 text-sm">{details.company}</p>
              </div>
            </div>
            
            <button
              onClick={() => handleRemoveSaved(item.opportunityType, item.opportunityId._id)}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              title="Remove from saved"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {details.location && (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <MapPin size={14} className="text-gray-400" />
                <span>{details.location}</span>
              </div>
            )}
            
            {details.deadline && (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <Calendar size={14} className="text-gray-400" />
                <span>Apply by {new Date(details.deadline).toLocaleDateString()}</span>
              </div>
            )}
            
            {(details.compensation || details.amount) && (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <DollarSign size={14} className="text-green-500" />
                <span>${(details.compensation || details.amount)?.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              to={getOpportunityLink(item)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200"
            >
              View Details
            </Link>
            
            {!item.applied && details.deadline && new Date(details.deadline) > new Date() && (
              <a
                href="#"
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
      <div className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">Saved Opportunities</h1>
            <p className="text-xl text-teal-100 mb-6">
              Track and manage all the jobs, internships, and scholarships you've saved.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search saved items..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Types</option>
                <option value="job">Jobs</option>
                <option value="internship">Internships</option>
                <option value="scholarship">Scholarships</option>
              </select>
              
              <select
                value={filters.applied}
                onChange={(e) => setFilters(prev => ({ ...prev, applied: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Statuses</option>
                <option value="true">Applied</option>
                <option value="false">Not Applied</option>
              </select>
              
              <button
                onClick={() => setFilters({ type: '', applied: '', search: '' })}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Saved Items Grid */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Your Saved Items ({savedItems.length})
            </h2>
            <div className="text-sm text-gray-500">
              {savedItems.filter(item => item.applied).length} applied • 
              {savedItems.filter(item => !item.applied).length} pending
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : savedItems.length === 0 ? (
            <div className="text-center py-16">
              <Save className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No saved items</h3>
              <p className="text-gray-500 mb-6">
                {filters.search || filters.type || filters.applied
                  ? 'No items match your filters'
                  : "You haven't saved any opportunities yet"}
              </p>
              <Link
                to="/career"
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
              >
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedItems.map(item => (
                <SavedItemCard key={`${item.opportunityType}-${item.opportunityId._id}`} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-teal-50 border border-teal-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-teal-800 mb-3 flex items-center gap-2">
            <AlertCircle size={20} /> Tips for Managing Saved Items
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-sm text-teal-700">
              <p className="font-medium mb-1">📅 Track Deadlines</p>
              <p>Note application deadlines in your calendar</p>
            </div>
            <div className="text-sm text-teal-700">
              <p className="font-medium mb-1">📝 Prepare Early</p>
              <p>Start working on applications well before deadlines</p>
            </div>
            <div className="text-sm text-teal-700">
              <p className="font-medium mb-1">🎯 Prioritize</p>
              <p>Focus on opportunities that best match your goals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedOpportunitiesPage;