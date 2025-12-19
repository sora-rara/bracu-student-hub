import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBook, FaCar, FaUsers, FaCalendar, FaMapMarker, FaRoad } from 'react-icons/fa';
import apiService from '../../services/api';
import authService from '../../services/auth';

function CreateNeedPost() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialType = queryParams.get('type') || 'study';

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: initialType,
        genderPreference: 'any',
        subject: '',
        courseCode: '',
        meetingFrequency: 'flexible',
        route: '',
        vehicleType: 'any',
        schedule: 'daily',
        maxMembers: 1
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const user = authService.getCurrentUser();

    // CreateNeedPost.jsx - ADD this check at the beginning
    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/find-my-group');
            alert('Admins cannot create posts');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate form
        if (!formData.title.trim() || !formData.description.trim()) {
            setError('Title and description are required');
            setLoading(false);
            return;
        }

        try {
            const response = await apiService.createNeedPost(formData);

            if (response.success) {
                setSuccess('Post created successfully!');
                setTimeout(() => {
                    navigate('/find-my-group');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="mb-0">
                                {formData.type === 'study' ? <FaBook className="me-2" /> : <FaCar className="me-2" />}
                                Create New {formData.type === 'study' ? 'Study Group' : 'Transport'} Request
                            </h3>
                        </div>

                        <div className="card-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            <form onSubmit={handleSubmit}>
                                {/* Type Selection */}
                                <div className="row mb-3">
                                    <div className="col-12">
                                        <label className="form-label">Type *</label>
                                        <div className="d-flex gap-3">
                                            <button
                                                type="button"
                                                className={`btn ${formData.type === 'study' ? 'btn-primary' : 'btn-outline-primary'} flex-grow-1`}
                                                onClick={() => setFormData({ ...formData, type: 'study' })}
                                            >
                                                <FaBook className="me-2" /> Study Group
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn ${formData.type === 'transport' ? 'btn-success' : 'btn-outline-success'} flex-grow-1`}
                                                onClick={() => setFormData({ ...formData, type: 'transport' })}
                                            >
                                                <FaCar className="me-2" /> Transport
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Title & Description */}
                                <div className="row mb-3">
                                    <div className="col-12">
                                        <label className="form-label">Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="e.g., Looking for study partners for CSE220"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-12">
                                        <label className="form-label">Description *</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="form-control"
                                            rows="4"
                                            placeholder="Describe what you're looking for, your expectations, etc."
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Type-specific fields */}
                                {formData.type === 'study' ? (
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Subject</label>
                                            <input
                                                type="text"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                className="form-control"
                                                placeholder="e.g., Data Structures, Calculus"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Course Code</label>
                                            <input
                                                type="text"
                                                name="courseCode"
                                                value={formData.courseCode}
                                                onChange={handleChange}
                                                className="form-control"
                                                placeholder="e.g., CSE220"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaRoad className="me-2" /> Route
                                            </label>
                                            <input
                                                type="text"
                                                name="route"
                                                value={formData.route}
                                                onChange={handleChange}
                                                className="form-control"
                                                placeholder="e.g., Gulshan to BRAC University"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaCar className="me-2" /> Vehicle Type
                                            </label>
                                            <select
                                                name="vehicleType"
                                                value={formData.vehicleType}
                                                onChange={handleChange}
                                                className="form-control"
                                            >
                                                <option value="any">Any Vehicle</option>
                                                <option value="car">Car</option>
                                                <option value="motorcycle">Motorcycle</option>
                                                <option value="bus">Bus</option>
                                                <option value="rickshaw">Rickshaw</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Common Fields */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            <FaUsers className="me-2" /> Gender Preference
                                        </label>
                                        <select
                                            name="genderPreference"
                                            value={formData.genderPreference}
                                            onChange={handleChange}
                                            className="form-control"
                                        >
                                            <option value="any">Any Gender</option>
                                            <option value="female-only">Female Only</option>
                                            <option value="male-only">Male Only</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            <FaCalendar className="me-2" />
                                            {formData.type === 'study' ? 'Meeting Frequency' : 'Schedule'}
                                        </label>
                                        <select
                                            name={formData.type === 'study' ? 'meetingFrequency' : 'schedule'}
                                            value={formData.type === 'study' ? formData.meetingFrequency : formData.schedule}
                                            onChange={handleChange}
                                            className="form-control"
                                        >
                                            {formData.type === 'study' ? (
                                                <>
                                                    <option value="flexible">Flexible</option>
                                                    <option value="once">Once</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="bi-weekly">Bi-weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="daily">Daily</option>
                                                    <option value="weekdays">Weekdays Only</option>
                                                    <option value="weekends">Weekends Only</option>
                                                    <option value="specific-days">Specific Days</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">Maximum Members (including you)</label>
                                        <input
                                            type="number"
                                            name="maxMembers"
                                            value={formData.maxMembers}
                                            onChange={handleChange}
                                            className="form-control"
                                            min="1"
                                            max="20"
                                        />
                                        <small className="text-muted">How many people are you looking for?</small>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => navigate('/find-my-group')}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Post'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateNeedPost;