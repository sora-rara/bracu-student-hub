// pages/InternshipDetailPage.jsx
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios.jsx';
import {
  GraduationCap, Calendar, MapPin, DollarSign, Clock,
  Building, CheckCircle, Award, Users, Target, 
  ExternalLink, Save, Share2, ArrowLeft, FileText,
  BookOpen, TrendingUp, Globe, Mail, AlertCircle,
  Star, ChevronRight
} from 'lucide-react';

const InternshipDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarInternships, setSimilarInternships] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchInternshipDetails();
  }, [id]);

  const fetchInternshipDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/career/internships/${id}`);
      
      if (response.data.success) {
        setInternship(response.data.internship);
        setSimilarInternships(response.data.similarInternships);
        setIsSaved(response.data.internship.isSaved || false);
        setHasApplied(response.data.internship.hasApplied || false);
      }
    } catch (err) {
      console.error('Error fetching internship:', err);
      navigate('/career/internships');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInternship = async () => {
    try {
      const response = await axios.post('/api/career/save', {
        opportunityType: 'internship',
        opportunityId: id
      });
      
      if (response.data.success) {
        setIsSaved(response.data.saved);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save internship');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDuration = () => {
    if (!internship?.duration?.startDate || !internship?.duration?.endDate) {
      return 'Flexible';
    }
    
    const start = new Date(internship.duration.startDate);
    const end = new Date(internship.duration.endDate);
    const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
    
    return `${formatDate(start)} - ${formatDate(end)} (${months} months)`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Internship Not Found</h3>
          <Link
            to="/career/internships"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-lg"
          >
            Back to Internships
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/career/internships')}
                className="flex items-center gap-2 text-purple-100 hover:text-white"
              >
                <ArrowLeft size={20} />
                Back to Internships
              </button>
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
                    {internship.type?.toUpperCase()}
                  </span>
                  {internship.isFeatured && (
                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium flex items-center gap-1">
                      <Star size={12} /> Featured
                    </span>
                  )}
                  {internship.isEligibleForCredit && (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                      🎓 Credit Eligible
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{internship.title}</h1>
                
                <div className="flex items-center gap-4 text-purple-100">
                  <div className="flex items-center gap-2">
                    <Building size={18} />
                    <span className="font-medium">{internship.organization?.name}</span>
                    {internship.organization?.isVerified && (
                      <CheckCircle size={16} className="text-green-300" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>
                      {internship.location?.city}, {internship.location?.state}
                      {internship.location?.type === 'remote' && ' (Remote)'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveInternship}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title={isSaved ? 'Remove from saved' : 'Save internship'}
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
          {/* Left Column - Internship Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Internship Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{internship.description}</p>
              </div>
            </div>

            {/* Learning Outcomes */}
            {internship.learningOutcomes && internship.learningOutcomes.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Learning Outcomes</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {internship.learningOutcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Target size={18} className="text-purple-600 mt-0.5" />
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Gained */}
            {internship.skillsGained && internship.skillsGained.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Skills You'll Gain</h2>
                <div className="flex flex-wrap gap-2">
                  {internship.skillsGained.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Requirements & Eligibility</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Education Level */}
                {internship.requirements?.educationLevel && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Education Level</h3>
                    <p className="text-gray-600">
                      {internship.requirements.educationLevel.charAt(0).toUpperCase() + internship.requirements.educationLevel.slice(1)}
                    </p>
                  </div>
                )}

                {/* Year in School */}
                {internship.requirements?.yearInSchool && internship.requirements.yearInSchool.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Year in School</h3>
                    <div className="flex flex-wrap gap-2">
                      {internship.requirements.yearInSchool.map((year, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                          {year}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* GPA */}
                {internship.requirements?.minGPA && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Minimum GPA</h3>
                    <p className="text-gray-600">{internship.requirements.minGPA}+</p>
                  </div>
                )}

                {/* Majors */}
                {internship.majors && internship.majors.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-gray-700 mb-3">Targeted Majors</h3>
                    <div className="flex flex-wrap gap-2">
                      {internship.majors.map((major, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                          {major}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Application & Details */}
          <div className="space-y-6">
            {/* Application Card */}
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <div className="space-y-4">
                {/* Duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-purple-600" />
                    <span className="font-medium text-gray-700">Duration</span>
                  </div>
                  <span className="text-gray-800 font-medium">{getDuration()}</span>
                </div>

                {/* Hours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-gray-500" />
                    <span className="font-medium text-gray-700">Hours/Week</span>
                  </div>
                  <span className="text-gray-800 font-medium">
                    {internship.duration?.hoursPerWeek?.min}-{internship.duration?.hoursPerWeek?.max}
                  </span>
                </div>

                {/* Compensation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className={
                      internship.compensation?.type === 'paid' ? 'text-green-500' : 'text-gray-500'
                    } />
                    <span className="font-medium text-gray-700">Compensation</span>
                  </div>
                  <span className="text-gray-800 font-medium">
                    {internship.compensation?.type === 'paid' 
                      ? `$${internship.compensation?.amount?.toLocaleString()}` 
                      : internship.compensation?.type?.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Deadline */}
                {internship.applicationDetails?.deadline && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-purple-600" />
                        <span className="font-medium text-purple-700">Application Deadline</span>
                      </div>
                      <span className="font-bold text-purple-800">
                        {formatDate(internship.applicationDetails.deadline)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

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
                    href={internship.applicationDetails?.applicationLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    Apply Now <ExternalLink size={18} />
                  </a>
                )}

                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                  Save for Later
                </button>
              </div>
            </div>

            {/* Organization Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">About the Organization</h3>
              
              <div className="space-y-4">
                {internship.organization?.description && (
                  <p className="text-gray-600 text-sm">{internship.organization.description}</p>
                )}
                
                <div className="space-y-2">
                  {internship.organization?.website && (
                    <a
                      href={internship.organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm"
                    >
                      <Globe size={14} />
                      {internship.organization.website.replace('https://', '')}
                    </a>
                  )}
                  
                  {internship.organization?.industry && (
                    <p className="flex items-center gap-2 text-gray-600 text-sm">
                      <TrendingUp size={14} />
                      Industry: {internship.organization.industry}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mentorship */}
            {internship.mentorship?.provided && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Mentorship Program</h3>
                <div className="flex items-start gap-3">
                  <Users size={20} className="text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-gray-700">This internship includes dedicated mentorship</p>
                    {internship.mentorship.details && (
                      <p className="text-gray-600 text-sm mt-1">{internship.mentorship.details}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Internships */}
        {similarInternships.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Internships</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarInternships.slice(0, 3).map(similar => (
                <Link
                  key={similar._id}
                  to={`/career/internships/${similar._id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {similar.type?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{similar.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{similar.organization?.name}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{similar.location?.city || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>
                        {similar.compensation?.type === 'paid' 
                          ? `$${similar.compensation?.amount?.toLocaleString()}` 
                          : similar.compensation?.type?.toUpperCase()}
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

export default InternshipDetailPage;