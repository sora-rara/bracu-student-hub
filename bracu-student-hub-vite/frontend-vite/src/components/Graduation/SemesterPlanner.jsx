import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import SemesterContainer from './SemesterContainer';
import CourseBrowser from './CourseBrowser';
import TimelineProjection from './TimelineProjection';
import SemesterCreationModal from './SemesterCreationModal';

const SemesterPlanner = () => {
    const [semesters, setSemesters] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [error, setError] = useState('');
    const [showSemesterModal, setShowSemesterModal] = useState(false);
    const [selectedSemesterId, setSelectedSemesterId] = useState(null);
    const courseBrowserRef = useRef();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const remainingResponse = await axios.get('/api/graduation/courses/remaining');
            const planResponse = await axios.get('/api/semester-planner');

            if (planResponse.data.success && planResponse.data.data) {
                const planData = planResponse.data.data;
                const dbSemesters = planData.plannedSemesters || [];

                console.log('📋 Loaded plan from DB:', planData);
                console.log('📋 Planned semesters from DB:', dbSemesters);

                // Set semesters from DB
                setSemesters(dbSemesters);

                // Enrich courses with planned status
                const coursesWithStatus = enrichCourses(
                    remainingResponse.data.data?.remainingCourses || [],
                    dbSemesters
                );

                setAvailableCourses(coursesWithStatus);
                setCurrentPlan(planData);

                // Auto-select first semester if none selected
                if (!selectedSemesterId && dbSemesters.length > 0) {
                    const firstSemester = dbSemesters[0];
                    // Try all possible ID fields
                    const semesterId = firstSemester._id || firstSemester.id || firstSemester.tempId;
                    if (semesterId) {
                        console.log('✅ Auto-selecting first semester:', semesterId);
                        setSelectedSemesterId(semesterId);
                    }
                } else if (selectedSemesterId) {
                    // Verify selected semester still exists
                    const selectedSemesterExists = dbSemesters.some(s =>
                        s._id === selectedSemesterId ||
                        s.id === selectedSemesterId ||
                        s.tempId === selectedSemesterId
                    );

                    if (!selectedSemesterExists) {
                        console.log('⚠️ Selected semester no longer exists, clearing selection');
                        setSelectedSemesterId(null);
                    }
                }
            } else {
                console.log('📋 No existing plan found');
                const coursesWithStatus = enrichCourses(
                    remainingResponse.data.data?.remainingCourses || [],
                    []
                );
                setAvailableCourses(coursesWithStatus);
                setSemesters([]);
            }

        } catch (error) {
            console.error('❌ Error loading planner data:', error);
            setError(error.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Update availableCourses whenever semesters change
    useEffect(() => {
        const updateCourses = async () => {
            try {
                // Get fresh remaining courses
                const remainingResponse = await axios.get('/api/graduation/courses/remaining');

                if (remainingResponse.data.success) {
                    const enriched = enrichCourses(
                        remainingResponse.data.data?.remainingCourses || [],
                        semesters // Use current semesters state
                    );
                    setAvailableCourses(enriched);
                }
            } catch (error) {
                console.error('Error updating courses:', error);
            }
        };

        // Only update if we have semesters to check
        if (semesters.length > 0) {
            updateCourses();
        }
    }, [semesters]);

    const enrichCourses = (allCourses, plannedSemesters) => {
        console.log('🔄 Enriching courses with', plannedSemesters?.length, 'semesters');

        // Create a map of course codes to their planned status
        const courseStatusMap = new Map();

        plannedSemesters?.forEach(semester => {
            semester.plannedCourses?.forEach(course => {
                courseStatusMap.set(course.courseCode, {
                    isPlanned: true,
                    plannedInSemester: semester.semesterName
                });
            });
        });

        const enrichedCourses = allCourses.map(course => {
            const status = courseStatusMap.get(course.courseCode);
            return {
                ...course,
                isPlanned: status?.isPlanned || false,
                plannedInSemester: status?.plannedInSemester || null,
                canTake: course.canTake || false
            };
        });

        const plannedCount = enrichedCourses.filter(c => c.isPlanned).length;
        console.log(`📈 Enriched courses: ${plannedCount} planned out of ${enrichedCourses.length} total`);

        return enrichedCourses;
    };

    const handleAddCourse = (courseCode, isRepeat = false) => {
        console.log('Adding course:', courseCode, 'to semester:', selectedSemesterId, 'isRepeat:', isRepeat);

        if (!selectedSemesterId) {
            alert('Please select a semester first!');
            return;
        }

        const semester = semesters.find(s =>
            s._id === selectedSemesterId ||
            s.id === selectedSemesterId ||
            s.tempId === selectedSemesterId
        );

        if (!semester) {
            alert('Selected semester not found!');
            return;
        }

        // Check if course already exists in ANY semester
        const courseAlreadyPlanned = semesters.some(sem =>
            sem.plannedCourses?.some(course => course.courseCode === courseCode)
        );

        if (courseAlreadyPlanned) {
            const confirmMove = window.confirm(
                `This course is already planned in another semester. Do you want to move it to ${semester.semesterName}?`
            );

            if (!confirmMove) {
                return;
            }

            // Remove from other semesters first
            const semestersWithoutCourse = semesters.map(s => ({
                ...s,
                plannedCourses: s.plannedCourses?.filter(course => course.courseCode !== courseCode) || []
            }));

            // Now add to selected semester
            const updatedSemesters = semestersWithoutCourse.map(s => {
                if (s._id === selectedSemesterId || s.id === selectedSemesterId || s.tempId === selectedSemesterId) {
                    return {
                        ...s,
                        plannedCourses: [
                            ...(s.plannedCourses || []),
                            {
                                courseCode,
                                isRepeat: Boolean(isRepeat),
                                addedAt: new Date().toISOString()
                            }
                        ]
                    };
                }
                return s;
            });

            setSemesters(updatedSemesters);
        } else {
            // Course not planned anywhere yet - just add to selected semester
            const updatedSemesters = semesters.map(s => {
                if (s._id === selectedSemesterId || s.id === selectedSemesterId || s.tempId === selectedSemesterId) {
                    return {
                        ...s,
                        plannedCourses: [
                            ...(s.plannedCourses || []),
                            {
                                courseCode,
                                isRepeat: Boolean(isRepeat),
                                addedAt: new Date().toISOString()
                            }
                        ]
                    };
                }
                return s;
            });

            setSemesters(updatedSemesters);
        }

        // No need to manually refresh CourseBrowser - useEffect will handle it
    };

    const handleSemesterUpdate = (semesterId, updates) => {
        const updatedSemesters = semesters.map(s => {
            if (s._id === semesterId || s.id === semesterId || s.tempId === semesterId) {
                return { ...s, ...updates };
            }
            return s;
        });
        setSemesters(updatedSemesters);
    };

    const handleDeleteSemester = (semesterId) => {
        console.log('🔥 Deleting semester ID:', semesterId);
        console.log('📌 Currently selected semester ID:', selectedSemesterId);

        const updatedSemesters = semesters.filter(s =>
            s._id !== semesterId && s.id !== semesterId && s.tempId !== semesterId
        );
        setSemesters(updatedSemesters);

        // Clear selection if deleted semester was selected
        const isSelectedSemester =
            selectedSemesterId === semesterId ||
            selectedSemesterId === semesterId?._id ||
            selectedSemesterId === semesterId?.id ||
            selectedSemesterId === semesterId?.tempId;

        if (isSelectedSemester) {
            console.log('✅ Clearing selected semester because it was deleted');
            setSelectedSemesterId(null);
        }

        console.log('✅ Remaining semesters after deletion:', updatedSemesters.length);
    };

    const handleCreateSemester = (semesterData) => {
        // Generate a proper temporary ID
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newSemester = {
            semesterName: `${semesterData.season} ${semesterData.year}`,
            season: semesterData.season,
            year: semesterData.year,
            creditLimit: semesterData.creditLimit || 12,
            plannedCourses: [],
            isActive: true,
            createdAt: new Date().toISOString(),
            tempId: tempId
        };

        const updatedSemesters = sortSemesters([...semesters, newSemester]);
        setSemesters(updatedSemesters);
        setSelectedSemesterId(tempId); // Auto-select the new semester
        setShowSemesterModal(false);

        return tempId;
    };

    const savePlan = async () => {
        try {
            console.log('💾 Saving plan with', semesters.length, 'semesters');

            // Prepare data for backend
            const semestersToSave = semesters.map(semester => {
                // Create clean object
                const cleanSemester = {
                    semesterName: semester.semesterName,
                    year: semester.year,
                    season: semester.season,
                    creditLimit: semester.creditLimit || 12,
                    plannedCourses: semester.plannedCourses || [],
                    isActive: semester.isActive !== false
                };

                // Only include _id if it's from the database (not a temp ID)
                if (semester._id && !semester._id.toString().startsWith('temp-')) {
                    cleanSemester._id = semester._id;
                }

                return cleanSemester;
            });

            console.log('📤 Sending to backend:', semestersToSave);

            const response = await axios.post('/api/semester-planner', {
                plannedSemesters: semestersToSave
            });

            if (response.data.success) {
                console.log('✅ Plan saved successfully:', response.data);
                alert('Plan saved successfully!');

                // Reload data to get proper IDs from backend
                await loadData();
            } else {
                console.error('❌ Failed to save plan:', response.data);
                alert('Failed to save plan: ' + response.data.message);
            }
        } catch (error) {
            console.error('❌ Error saving plan:', error);
            alert('Error saving plan. Please try again.');
        }
    };

    const resetPlan = () => {
        if (window.confirm('Are you sure you want to reset all planned semesters?')) {
            setSemesters([]);
            setSelectedSemesterId(null);
        }
    };

    const sortSemesters = (semesters) => {
        const seasonOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };

        return [...semesters].sort((a, b) => {
            const aKey = (a.year * 10) + (seasonOrder[a.season] || 0);
            const bKey = (b.year * 10) + (seasonOrder[b.season] || 0);
            return aKey - bKey;
        });
    };

    if (loading) {
        return (
            <div className="loading-container text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading semester planner...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-4">
                <h4>Error Loading Planner</h4>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={loadData}>
                    Retry
                </button>
            </div>
        );
    }

    const sortedSemesters = sortSemesters(semesters);

    return (
        <div className="semester-planner">
            {/* Semester Creation Modal */}
            {showSemesterModal && (
                <SemesterCreationModal
                    isOpen={showSemesterModal}
                    onClose={() => setShowSemesterModal(false)}
                    onCreate={handleCreateSemester}
                />
            )}

            {/* Page Header */}
            <div className="planner-header mb-4">
                <h1>Semester Planner</h1>

            </div>
            {/* Timeline Projection */}
            {currentPlan && (
                <div className="card">
                    <div className="card-body">
                        <TimelineProjection plan={currentPlan} />
                    </div>
                </div>
            )}
            {/* Planned Semesters Section */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3 className="mb-0">Planned Semesters</h3>
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => setShowSemesterModal(true)}
                        >
                            + Add Semester
                        </button>
                    </div>

                    {sortedSemesters.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-muted mb-3">No semesters planned yet.</p>
                            <button className="btn btn-primary" onClick={() => setShowSemesterModal(true)}>
                                Create First Semester
                            </button>
                        </div>
                    ) : (
                        <div className="semesters-container">
                            {sortedSemesters.map((semester, index) => (
                                <SemesterContainer
                                    key={semester._id || semester.tempId || index}
                                    semester={semester}
                                    index={index}
                                    onUpdate={handleSemesterUpdate}
                                    onDelete={handleDeleteSemester}
                                    onSelect={() => setSelectedSemesterId(semester._id || semester.tempId)}
                                    isSelected={(semester._id || semester.tempId) === selectedSemesterId}
                                />
                            ))}
                        </div>
                    )}

                    <div className="mt-4">
                        {/* 🔥 FIXED: Check if selected semester actually exists */}
                        {(() => {
                            const selectedSemester = sortedSemesters.find(s =>
                                (s._id === selectedSemesterId) ||
                                (s.tempId === selectedSemesterId) ||
                                (s.id === selectedSemesterId)
                            );

                            // If no semester found but selectedSemesterId exists, clear it
                            if (!selectedSemester && selectedSemesterId) {
                                console.log('⚠️ Selected semester not found, clearing selection');
                                // Use setTimeout to avoid state update during render
                                setTimeout(() => setSelectedSemesterId(null), 0);
                                return null;
                            }

                            // If semester exists, show the alert
                            if (selectedSemester) {
                                return (
                                    <div className="alert alert-info mb-3 d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>Selected:</strong> {selectedSemester.semesterName}
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setSelectedSemesterId(null)}
                                        >
                                            Clear Selection
                                        </button>
                                    </div>
                                );
                            }

                            // If no semester selected, show nothing
                            return null;
                        })()}

                        <div className="d-flex justify-content-between">
                            <button
                                className="btn btn-primary"
                                onClick={savePlan}
                                disabled={sortedSemesters.length === 0}
                            >
                                Save Plan
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={resetPlan}
                                disabled={sortedSemesters.length === 0}
                            >
                                Reset All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Browser */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3 className="mb-0">Course Browser</h3>
                        {selectedSemesterId ? (
                            <span className="badge bg-info">
                                Adding to: {
                                    sortedSemesters.find(s =>
                                        (s._id === selectedSemesterId) ||
                                        (s.tempId === selectedSemesterId)
                                    )?.semesterName
                                }
                            </span>
                        ) : (
                            <span className="text-muted">
                                Select a semester above to add courses
                            </span>
                        )}
                    </div>

                    {/* Note: CourseBrowser fetches its own data now */}
                    <CourseBrowser
                        ref={courseBrowserRef}
                        onAddCourse={handleAddCourse}
                        selectedSemesterId={selectedSemesterId}
                        disabled={!selectedSemesterId}
                    />
                </div>
            </div>


        </div>
    );
};

export default SemesterPlanner;