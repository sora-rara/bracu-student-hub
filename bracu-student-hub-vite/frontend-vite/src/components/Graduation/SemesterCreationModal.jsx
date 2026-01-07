import React, { useState, useEffect } from 'react';

const SemesterCreationModal = ({ isOpen, onClose, onCreate, existingSemesters = [] }) => {
    const [season, setSeason] = useState('Spring');
    const [year, setYear] = useState(new Date().getFullYear());
    const [creditLimit, setCreditLimit] = useState(12);
    const [availableYears, setAvailableYears] = useState([]);
    const [existingSeasonYear, setExistingSeasonYear] = useState(new Set());

    // Generate available years (current year + next 4 years)
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 0; i < 6; i++) {
            years.push(currentYear + i);
        }
        setAvailableYears(years);

        // Track existing season-year combinations
        const existing = new Set();
        existingSemesters.forEach(sem => {
            if (sem.season && sem.year) {
                existing.add(`${sem.season}-${sem.year}`);
            }
        });
        setExistingSeasonYear(existing);
    }, [existingSemesters]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const seasonYearKey = `${season}-${year}`;

        // Check if semester already exists
        if (existingSeasonYear.has(seasonYearKey)) {
            alert(`A ${season} ${year} semester already exists!`);
            return;
        }

        const semesterData = {
            season,
            year: parseInt(year),
            creditLimit: parseInt(creditLimit),
            semesterName: `${season} ${year}`
        };

        onCreate(semesterData);
        resetForm();
    };

    const resetForm = () => {
        setSeason('Spring');
        setYear(new Date().getFullYear());
        setCreditLimit(12);
    };

    const getNextSuggestedSeasonYear = () => {
        if (existingSemesters.length === 0) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const month = now.getMonth();

            // Determine current season
            let currentSeason = 'Spring'; // Jan-Apr
            if (month >= 5 && month <= 8) currentSeason = 'Summer'; // May-Aug
            else if (month >= 9) currentSeason = 'Fall'; // Sep-Dec

            return { season: currentSeason, year: currentYear };
        }

        // Find the latest semester
        const latest = existingSemesters.reduce((latest, sem) => {
            const semKey = (sem.year * 10) + (sem.season === 'Spring' ? 1 : sem.season === 'Summer' ? 2 : 3);
            const latestKey = (latest.year * 10) + (latest.season === 'Spring' ? 1 : latest.season === 'Summer' ? 2 : 3);
            return semKey > latestKey ? sem : latest;
        });

        // Determine next season
        let nextSeason = 'Spring';
        let nextYear = latest.year;

        if (latest.season === 'Spring') {
            nextSeason = 'Summer';
            nextYear = latest.year;
        } else if (latest.season === 'Summer') {
            nextSeason = 'Fall';
            nextYear = latest.year;
        } else { // Fall
            nextSeason = 'Spring';
            nextYear = latest.year + 1;
        }

        return { season: nextSeason, year: nextYear };
    };

    const handleSuggestNext = () => {
        const { season: nextSeason, year: nextYear } = getNextSuggestedSeasonYear();
        setSeason(nextSeason);
        setYear(nextYear);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Create New Semester</h3>
                    <button className="btn-close" onClick={onClose}></button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">Season</label>
                                <select
                                    className="form-select"
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value)}
                                    required
                                >
                                    <option value="Spring">Spring</option>
                                    <option value="Summer">Summer</option>
                                    <option value="Fall">Fall</option>
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Year</label>
                                <select
                                    className="form-select"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    required
                                >
                                    {availableYears.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Credit Limit</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    className="form-control"
                                    value={creditLimit}
                                    onChange={(e) => setCreditLimit(e.target.value)}
                                    min="3"
                                    max="21"
                                    required
                                />
                                <span className="input-group-text">credits</span>
                            </div>
                            <small className="text-muted">Maximum credits allowed this semester (typically 12-15)</small>
                        </div>

                        <div className="alert alert-info">
                            <small>
                                <strong>Academic Calendar:</strong>
                                <br />• Spring: January - April
                                <br />• Summer: May - August
                                <br />• Fall: September - December
                            </small>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleSuggestNext}
                            >
                                Suggest Next Semester
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Create Semester
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SemesterCreationModal;