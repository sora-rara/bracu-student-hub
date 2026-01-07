const TimelineProjection = ({ plan }) => {
    if (!plan || !plan.graduationTimeline) {
        return null;
    }

    const {
        estimatedGraduationSemester,
        estimatedGraduationYear,
        totalRemainingSemesters,
        bottleneckCourses
    } = plan.graduationTimeline;

    return (
        <div className="timeline-projection">
            <h5>🎓 Graduation Timeline</h5>
            <div className="timeline-stats">
                <div className="stat-item">
                    <div className="stat-value">{estimatedGraduationSemester} {estimatedGraduationYear}</div>
                    <div className="stat-label">Estimated Graduation</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{totalRemainingSemesters}</div>
                    <div className="stat-label">Semesters Remaining</div>
                </div>
            </div>

            {bottleneckCourses.length > 0 && (
                <div className="bottleneck-warning">
                    <h6>⚠️ Potential Bottlenecks</h6>
                    <ul>
                        {bottleneckCourses.map(courseCode => (
                            <li key={courseCode}>{courseCode} - Consider planning earlier</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TimelineProjection;