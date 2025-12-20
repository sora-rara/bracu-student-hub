// pages/ScholarshipDetailPage.jsx
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios.jsx';
import {
  DollarSign, Calendar, Award, Building, CheckCircle,
  BookOpen, Users, Target, ExternalLink, Save,
  Share2, ArrowLeft, FileText, GraduationCap, Globe,
  Mail, Percent, Flag, AlertCircle, Star, ChevronRight
} from 'lucide-react';

const ScholarshipDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarScholarships, setSimilarScholarships] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    fetchScholarshipDetails();
  }, [id]);

  const fetchScholarshipDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/career/scholarships/${id}`);
      
      if (response.data.success) {
        setScholarship(response.data.scholarship);
        setSimilarScholarships(response.data.similarScholarships);
        setIsSaved(response.data.scholarship.isSaved || false);
        setHasApplied(response.data.scholarship.hasApplied || false);
      }
    } catch (err) {
      console.error('Error fetching scholarship:', err);
      navigate('/career/scholarships');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScholarship = async () => {
    try {
      const response = await axios.post('/api/career/save', {
        opportunityType: 'scholarship',
        opportunityId: id
      });
      
      if (response.data.success) {
        setIsSaved(response.data.saved);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save scholarship');
    }
  };

  const handleCheckEligibility = async () => {
    try {
      const response = await axios.post('/api/career/check-eligibility', {
        opportunityType: 'scholarship',
        opportunityId: id
      });
      
      if (response.data.success) {
        setEligibility(response.data.eligibility);
      }
    } catch (err) {
      alert('Unable to check eligibility at this time');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Scholarship Not Found</h3>
          <Link
            to="/career/scholarships"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg"
          >
            Back to Scholarships
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/career/scholarships')}
                className="flex items-center gap-2 text-green-100 hover:text-white"
              >
                <ArrowLeft size={20} />
                Back to Scholarships
              </button>
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
                    {scholarship.category?.replace('-', ' ').toUpperCase()}
                  </span>
                  {scholarship.isFeatured && (
                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium flex items-center gap-1">
                      <Star size={12} /> Featured
                    </span>
                  )}
                  {scholarship.isExclusive && (
                    <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                      🔒 Exclusive
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{scholarship.name}</h1>
                
                <div className="flex items-center gap-4 text-green-100">
                  <div className="flex items-center gap-2">
                    <Building size={18} />
                    <span className="font-medium">{scholarship.provider?.name}</span>
                    {scholarship.provider?.isVerified && (
                      <CheckCircle size={16} className="text-green-300" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} />
                    <span className="font-medium">
                      ${scholarship.award?.amount?.toLocaleString() || 'Varies'}
                      {scholarship.award?.renewable && ' (Renewable)'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveScholarship}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title={isSaved ? 'Remove from saved' : 'Save scholarship'}
                >
                  <Save className={isSaved ? 'text-yellow-400' : 'text-white'} size={20} />
                </button>
                <button className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Scholarship Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Scholarship Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{scholarship.description}</p>
              </div>
            </div>

            {/* Eligibility Criteria */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Eligibility Criteria</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Requirements */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Academic Requirements</h3>
                  
                  {scholarship.eligibility?.minGPA && (
                    <div className="flex items-center gap-3">
                      <Percent size={18} className="text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-800">Minimum GPA</p>
                        <p className="text-gray-600">{scholarship.eligibility.minGPA}+</p>
                      </div>
                    </div>
                  )}
                  
                  {scholarship.eligibility?.academicLevel && scholarship.eligibility.academicLevel.length > 0 && (
                    <div className="flex items-center gap-3">
                      <GraduationCap size={18} className="text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-800">Academic Levels</p>
                        <p className="text-gray-600">
                          {scholarship.eligibility.academicLevel.map(level => 
                            level.charAt(0).toUpperCase() + level.slice(1)
                          ).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Requirements */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Other Requirements</h3>
                  
                  {scholarship.eligibility?.essaysRequired && (
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-800">Essay Required</p>
                        <p className="text-gray-600">Yes</p>
                      </div>
                    </div>
                  )}
                  
                  {scholarship.eligibility?.recommendationsRequired > 0 && (
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-green-600" />
                      <div>
                        <p className="font-medium text-gray-800">Recommendations</p>
                        <p className="text-gray-600">
                          {scholarship.eligibility.recommendationsRequired} required
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {scholarship.eligibility?.financialNeed && (
                    <div className="flex items-center gap-3">
                      <DollarSign size={18} className="text-red-600" />
                      <div>
                        <p className="font-medium text-gray-800">Financial Need</p>
                        <p className="text-gray-600">Demonstrated need required</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Award Details */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Award Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Award Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ${scholarship.award?.amount?.toLocaleString() || 'Varies'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="text-gray-800 font-medium">
                        {scholarship.award?.type?.replace('-', ' ').toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Renewable</p>
                      <p className="text-gray-800 font-medium">
                        {scholarship.award?.renewable ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Usage</h3>
                  <ul className="space-y-2">
                    {scholarship.award?.type === 'tuition' && (
                      <li className="flex items-center gap-2 text-gray-600">
                        <CheckCircle size={16} className="text-green-500" />
                        Can be used for tuition and fees
                      </li>
                    )}
                    {scholarship.award?.type === 'full-ride' && (
                      <li className="flex items-center gap-2 text-gray-600">
                        <CheckCircle size={16} className="text-green-500" />
                        Covers full cost of attendance
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle size={16} className="text-green-500" />
                      Applied directly to student account
                    </li>
                    {scholarship.award?.renewable && (
                      <li className="flex items-center gap-2 text-gray-600">
                        <CheckCircle size={16} className="text-green-500" />
                        Renewable with maintained eligibility
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Application & Eligibility */}
          <div className="space-y-6">
            {/* Application Card */}
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <div className="space-y-4">
                {/* Deadline */}
                <div className={`p-3 rounded-lg ${
                  scholarship.application?.deadline ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className={
                        scholarship.application?.deadline ? 'text-green-600' : 'text-gray-600'
                      } />
                      <span className="font-medium text-gray-700">Application Deadline</span>
                    </div>
                    <span className="font-bold text-gray-800">
                      {scholarship.application?.deadline 
                        ? formatDate(scholarship.application.deadline)
                        : 'Rolling'}
                    </span>
                  </div>
                </div>

                {/* Open Date */}
                {scholarship.application?.openDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600" />
                      <span className="font-medium text-gray-700">Open Date</span>
                    </div>
                    <span className="text-gray-800">{formatDate(scholarship.application.openDate)}</span>
                  </div>
                )}

                {/* Notification Date */}
                {scholarship.application?.notificationDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-purple-600" />
                      <span className="font-medium text-gray-700">Notification Date</span>
                    </div>
                    <span className="text-gray-800">{formatDate(scholarship.application.notificationDate)}</span>
                  </div>
                )}
              </div>

              {/* Eligibility Check */}
              {eligibility && (
                <div className={`mt-4 p-3 rounded-lg ${
                  eligibility.isEligible 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {eligibility.isEligible ? (
                      <>
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="font-medium text-green-700">You are eligible!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="font-medium text-red-700">You may not be eligible</span>
                      </>
                    )}
                  </div>
                  {eligibility.reasons.length > 0 && (
                    <ul className="text-xs text-gray-600 space-y-1">
                      {eligibility.reasons.map((reason, idx) => (
                        <li key={idx}>• {reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="mt-6 space-y-3">
                {hasApplied ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="mx-auto text-green-600 mb-2" size={24} />
                    <p className="font-medium text-green-700">Application Submitted!</p>
                    <p className="text-sm text-green-600 mt-1">
                      Check your application status in the tracker
                    </p>
                  </div>
                ) : (
                  <a
                    href={scholarship.application?.applicationLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    Apply Now <ExternalLink size={18} />
                  </a>
                )}

                <button
                  onClick={handleCheckEligibility}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Check Eligibility
                </button>

                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                  Save for Later
                </button>
              </div>
            </div>

            {/* Provider Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">About the Provider</h3>
              
              <div className="space-y-4">
                {scholarship.provider?.description && (
                  <p className="text-gray-600 text-sm">{scholarship.provider.description}</p>
                )}
                
                <div className="space-y-2">
                  {scholarship.provider?.website && (
                    <a
                      href={scholarship.provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-green-600 hover:text-green-800 text-sm"
                    >
                      <Globe size={14} />
                      {scholarship.provider.website.replace('https://', '')}
                    </a>
                  )}
                  
                  <p className="flex items-center gap-2 text-gray-600 text-sm">
                    <Building size={14} />
                    Provider Type: {scholarship.provider?.type?.replace('-', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Required Documents */}
            {scholarship.application?.documentsRequired && scholarship.application.documentsRequired.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Required Documents</h3>
                <ul className="space-y-2">
                  {scholarship.application.documentsRequired.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-600">
                      <FileText size={14} className="text-gray-400" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Similar Scholarships */}
        {similarScholarships.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Scholarships</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarScholarships.slice(0, 3).map(similar => (
                <Link
                  key={similar._id}
                  to={`/career/scholarships/${similar._id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {similar.category?.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{similar.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{similar.provider?.name}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>${similar.award?.amount?.toLocaleString() || 'Varies'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>
                        {similar.application?.deadline 
                          ? formatDate(similar.application.deadline) 
                          : 'Rolling'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarshipDetailPage;