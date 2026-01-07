import React from 'react';

const WarningModal = ({ warnings, courseCode, onConfirm, onCancel }) => {
    if (!warnings || warnings.length === 0) return null;

    return (
        <div className="modal-overlay warning-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>⚠️ Course Placement Warnings</h3>
                    <button className="btn-close" onClick={onCancel}></button>
                </div>

                <div className="modal-body">
                    <p>
                        <strong>{courseCode}</strong> has the following warnings:
                    </p>

                    <div className="warnings-list">
                        {warnings.map((warning, index) => (
                            <div key={index} className={`warning-item ${warning.type}`}>
                                <div className="warning-icon">
                                    {warning.type.includes('hard') ? '🚫' : '⚠️'}
                                </div>
                                <div className="warning-content">
                                    <strong>{warning.type.replace('_', ' ').toUpperCase()}</strong>
                                    <p>{warning.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="alert alert-warning mt-3">
                        <strong>Note:</strong> You can still add the course, but it may affect your academic progress.
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-warning" onClick={onConfirm}>
                        Add Anyway
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WarningModal;