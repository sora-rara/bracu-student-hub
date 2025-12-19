// pages/GraduationPage.jsx
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import ProgressDashboard from '../Graduation/ProgressDashboard';
import ProgramSelectionModal from '../Graduation/ProgramSelectionModal';

const GraduationPage = () => {
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [hasProgram, setHasProgram] = useState(false);

    useEffect(() => {
        checkProgramStatus();
    }, []);

    const checkProgramStatus = async () => {
        try {
            const response = await axios.get('/api/graduation/check-status');
            if (response.data.success) {
                setHasProgram(response.data.data.hasProgram);
                if (!response.data.data.hasProgram) {
                    setShowProgramModal(true);
                }
            }
        } catch (err) {
            console.error('Error checking program status:', err);
        }
    };

    return (
        <div className="graduation-page">
            {/* Program Selection Modal */}
            {showProgramModal && (
                <ProgramSelectionModal
                    isOpen={showProgramModal}
                    onClose={() => setShowProgramModal(false)}
                    onProgramSelected={() => {
                        setHasProgram(true);
                        setShowProgramModal(false);
                        // Refresh the page or data
                        window.location.reload();
                    }}
                />
            )}

            {/* Page Header */}
            <div className="page-header mb-4">
                <h1>Graduation Planner</h1>
                {!hasProgram && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowProgramModal(true)}
                    >
                        <i className="bi bi-mortarboard-fill me-2"></i>
                        Set Up Your Program
                    </button>
                )}
            </div>

            {/* Main Content */}
            {hasProgram ? (
                <ProgressDashboard />
            ) : (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <h3>Welcome to Graduation Planner!</h3>
                        <p className="text-muted mb-4">
                            Set up your program to start tracking your graduation progress.
                        </p>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => setShowProgramModal(true)}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraduationPage;