// src/components/GraduationPlanner/ProgramSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

const ProgramSelectionModal = ({ isOpen, onClose, onProgramSelected }) => {
    const [programs, setPrograms] = useState([
        { programCode: 'CSE', programName: 'Computer Science and Engineering', totalCreditsRequired: 136 },
        { programCode: 'CS', programName: 'Computer Science', totalCreditsRequired: 120 }
    ]);
    const [selectedProgram, setSelectedProgram] = useState('');
    const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPrograms();
        }
    }, [isOpen]);

    const fetchPrograms = async () => {
        try {
            const response = await axios.get('/api/graduation/programs');
            if (response.data.success) {
                setPrograms(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching programs:', err);
            // Keep default programs
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProgram) {
            setError('Please select a program');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/graduation/initialize', {
                program: selectedProgram,
                admissionYear: admissionYear
            });

            if (response.data.success) {
                onProgramSelected({
                    program: selectedProgram,
                    admissionYear: admissionYear,
                    programName: response.data.data.programName
                });
                onClose();
            } else {
                setError(response.data.message || 'Failed to initialize program');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error initializing program');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Select Your Program</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={loading}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <p className="text-muted mb-4">
                            Select your program to calculate your graduation progress. Your GPA data will be automatically synced.
                        </p>

                        {error && (
                            <div className="alert alert-danger">
                                <small>{error}</small>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Program *</label>
                                <select
                                    className="form-select"
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Choose a program...</option>
                                    {programs.map((program) => (
                                        <option key={program.programCode} value={program.programCode}>
                                            {program.programName} ({program.programCode}) - {program.totalCreditsRequired} credits
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Admission Year *</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={admissionYear}
                                    onChange={(e) => setAdmissionYear(parseInt(e.target.value) || new Date().getFullYear())}
                                    min="2000"
                                    max={new Date().getFullYear()}
                                    required
                                    disabled={loading}
                                />
                                <small className="text-muted">The year you started at the university</small>
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
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Setting Up...
                                        </>
                                    ) : 'Continue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramSelectionModal;