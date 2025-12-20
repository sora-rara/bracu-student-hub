// pages/JobDetailPage.jsx
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios.jsx';
import {
  Briefcase, MapPin, DollarSign, Clock, Calendar,
  Building, CheckCircle, Users, Award, ExternalLink,
  Share2, Save, ArrowLeft, Mail, Globe, Phone,
  FileText, Download, AlertCircle, Star
} from 'lucide-react';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/career/jobs/${id}`);
      
      if (response.data.success) {
        setJob(response.data.job);
        setSimilarJobs(response.data.similarJobs);
        setIsSaved(response.data.job.isSaved || false);
        setHasApplied(response.data.job.hasApplied || false);
      }
    } catch (err) {
      console.error('Error fetching job:', err);
      navigate('/career/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async () => {
    try {
      const response = await axios.post('/api/career/save', {
        opportunityType: 'job',
        opportunityId: id
      });
      
      if (response.data.success) {
        setIsSaved(response.data.saved);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save job');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDeadlineColor = () => {
    if (!job?.applicationProcess?.deadline) return 'bg-gray-100 text-gray-800';
    
    const deadline = new Date(job.applicationProcess.deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-100 text-red-800';
    if (diffDays <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Job Not Found</h3>
          <Link
            to="/career/jobs"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/career/jobs')}
                className="flex items-center gap-2 text-blue-100 hover:text-white"
              >
                <ArrowLeft size={20} />
                Back to Jobs
              </button>
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
                    {job.category?.replace('-', ' ').toUpperCase()}
                  </span>
                  {job.isFeatured && (
                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium flex items-center gap-1">
                      <Star size={12} /> Featured
                    </span>
                  )}
                  {job.isUrgent && (
                    <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                      ⚡ Urgent Hire
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{job.title}</h1>
                
                <div className="flex items-center gap-4 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Building size={18} />
                    <span className="font-medium">{job.company?.name}</span>
                    {job.company?.isVerified && (
                      <CheckCircle size={16} className="text-green-300" />
                    )}
                    {job.company?.isAlumniCompany && (
                      <span className="text-xs bg-purple-500 px-2 py-0.5 rounded">
                        Alumni Company
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>
                      {job.location?.city}, {job.location?.state}
                      {job.location?.type === 'remote' && ' (Remote)'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveJob}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title={isSaved ? 'Remove from saved' : 'Save job'}
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
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Requirements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                {job.requirements?.skills && job.requirements.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Skills Required</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {job.requirements?.experience && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Experience</h3>
                    <p className="text-gray-600">{job.requirements.experience} years</p>
                  </div>
                )}

                {/* Education */}
                {job.requirements?.educationLevel && job.requirements.educationLevel !== 'any' && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Education Level</h3>
                    <p className="text-gray-600">
                      {job.requirements.educationLevel.charAt(0).toUpperCase() + job.requirements.educationLevel.slice(1)}
                    </p>
                  </div>
                )}

                {/* GPA */}
                {job.requirements?.minGPA && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Minimum GPA</h3>
                    <p className="text-gray-600">{job.requirements.minGPA}+</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compensation & Benefits */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Compensation & Benefits</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Compensation</h3>
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-green-500" />
                    <span className="text-xl font-bold text-gray-800">
                      ${job.compensation?.amount?.toLocaleString()}
                      {job.compensation?.type === 'hourly' && '/hr'}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {job.compensation?.type?.replace('-', ' ').toUpperCase()}
                  </p>
                </div>

                {/* Hours */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Hours Per Week</h3>
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-gray-500" />
                    <span className="text-gray-800 font-medium">
                      {job.hoursPerWeek?.min}-{job.hoursPerWeek?.max} hours
                    </span>
                  </div>
                  {job.hoursPerWeek?.flexible && (
                    <p className="text-green-600 text-sm mt-1">Flexible schedule available</p>
                  )}
                </div>

                {/* Benefits */}
                {job.compensation?.benefits && job.compensation.benefits.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-gray-700 mb-3">Benefits</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {job.compensation.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-600">
                          <CheckCircle size={16} className="text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Application & Company Info */}
          <div className="space-y-6">
            {/* Application Card */}
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <div className={`mb-4 p-3 rounded-lg ${getDeadlineColor()}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span className="font-medium">Application Deadline</span>
                  </div>
                  {job.applicationProcess?.deadline && (
                    <span className="font-bold">
                      {formatDate(job.applicationProcess.deadline)}
                    </span>
                  )}
                </div>
                {!job.applicationProcess?.deadline && (
                  <p className="text-sm mt-1">Rolling applications</p>
                )}
              </div>

              <div className="space-y-3">
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
                    href={job.applicationProcess?.applicationLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    Apply Now <ExternalLink size={18} />
                  </a>
                )}

                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                  Save for Later
                </button>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Application Method</h4>
                  <p className="text-gray-600 text-sm">{job.applicationProcess?.method?.toUpperCase()}</p>
                  
                  {job.applicationProcess?.documentsRequired && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Required Documents</h4>
                      <ul className="space-y-2">
                        {job.applicationProcess.documentsRequired.map((doc, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText size={14} />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">About the Company</h3>
              
              <div className="space-y-4">
                {job.company?.description && (
                  <p className="text-gray-600 text-sm">{job.company.description}</p>
                )}
                
                <div className="space-y-2">
                  {job.company?.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Globe size={16} />
                      {job.company.website.replace('https://', '')}
                    </a>
                  )}
                  
                  {job.applicationProcess?.contactEmail && (
                    <a
                      href={`mailto:${job.applicationProcess.contactEmail}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Mail size={16} />
                      {job.applicationProcess.contactEmail}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Job Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{job.views || 0}</div>
                  <p className="text-sm text-gray-500">Views</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{job.applicationsCount || 0}</div>
                  <p className="text-sm text-gray-500">Applications</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {job.applicationProcess?.deadline ? 'Deadline' : 'Rolling'}
                  </div>
                  <p className="text-sm text-gray-500">Application Type</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {job.hoursPerWeek?.flexible ? 'Flexible' : 'Fixed'}
                  </div>
                  <p className="text-sm text-gray-500">Schedule</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Jobs */}
        {similarJobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Jobs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarJobs.slice(0, 3).map(similarJob => (
                <Link
                  key={similarJob._id}
                  to={`/career/jobs/${similarJob._id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {similarJob.category?.replace('-', ' ')}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{similarJob.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{similarJob.company?.name}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{similarJob.location?.city || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>${similarJob.compensation?.amount?.toLocaleString() || 'Competitive'}</span>
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

export default JobDetailPage;