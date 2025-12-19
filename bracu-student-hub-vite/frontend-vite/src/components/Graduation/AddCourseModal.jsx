import React, { useState } from 'react';
import graduationService from '../../services/graduationService';

const AddCourseModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        courseCode: '',
        courseName: '',
        credits: 3,
        grade: 'A',
        gp: 4.0,
        semester: 'Fall',
        year: new Date().getFullYear(),
        category: 'program-core',
        stream: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        'gen-ed',
        'school-core',
        'program-core',
        'program-elective',
        'project-thesis'
    ];

    const semesters = ['Spring', 'Summer', 'Fall'];
    const gradeOptions = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await graduationService.addCompletedCourse(formData);

            if (response.success) {
                onSuccess(response.data);
                onClose();
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.message || 'Error adding course');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Add Completed Course</h3>
                    <button className="btn-close" onClick={onClose}></button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Course Code *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="courseCode"
                                    value={formData.courseCode}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Course Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="courseName"
                                    value={formData.courseName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Credits *</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="credits"
                                    value={formData.credits}
                                    onChange={handleChange}
                                    min="1"
                                    max="10"
                                    required
                                />
                            </div>

                            <div className="col-md-3 mb-3">
                                <label className="form-label">Grade</label>
                                <select
                                    className="form-control"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                >
                                    {gradeOptions.map(grade => (
                                        <option key={grade} value={grade}>{grade}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3 mb-3">
                                <label className="form-label">Semester</label>
                                <select
                                    className="form-control"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                >
                                    {semesters.map(sem => (
                                        <option key={sem} value={sem}>{sem}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3 mb-3">
                                <label className="form-label">Year</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    min="2000"
                                    max="2100"
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Category *</label>
                                <select
                                    className="form-control"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Stream</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="stream"
                                    value={formData.stream}
                                    onChange={handleChange}
                                    placeholder="e.g., Writing Comprehension, Math and Natural Sciences"
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Add Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddCourseModal;