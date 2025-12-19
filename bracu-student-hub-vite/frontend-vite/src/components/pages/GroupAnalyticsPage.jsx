import React, { useState, useEffect } from 'react';
import { FaChartBar, FaUsers, FaBook, FaCar, FaClipboardCheck, FaCalendarAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import apiService from '../../services/api';

function GroupAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeRange, setTimeRange] = useState('30days');

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await apiService.getGroupAnalytics();
            
            if (response.success) {
                setAnalytics(response.data);
            }
        } catch (err) {
            setError('Failed to load analytics data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toLocaleString();
    };

    const calculatePercentageChange = (current, previous) => {
        if (!previous || previous === 0) return 100;
        return ((current - previous) / previous * 100).toFixed(1);
    };

    const getTrendIcon = (change) => {
        if (change > 0) return <FaArrowUp className="text-success" />;
        if (change < 0) return <FaArrowDown className="text-danger" />;
        return null;
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2><FaChartBar className="me-2" /> Group Analytics Dashboard</h2>
                            <p className="text-muted">Insights and statistics for group management</p>
                        </div>
                        
                        <div className="d-flex gap-2">
                            <select 
                                className="form-select"
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="90days">Last 90 Days</option>
                                <option value="year">Last Year</option>
                                <option value="all">All Time</option>
                            </select>
                            <button className="btn btn-outline-primary" onClick={fetchAnalytics}>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {analytics && (
                <>
                    {/* Key Metrics */}
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <div className="card stat-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-muted">Total Groups</h6>
                                            <h3 className="mb-0">{formatNumber(analytics.totalGroups)}</h3>
                                            <small className="text-muted">
                                                {analytics.activeGroups} active • {analytics.inactiveGroups} inactive
                                            </small>
                                        </div>
                                        <FaUsers className="display-6 text-primary" />
                                    </div>
                                    {analytics.groupGrowth && (
                                        <div className="mt-2">
                                            <small className={analytics.groupGrowth > 0 ? 'text-success' : 'text-danger'}>
                                                {getTrendIcon(analytics.groupGrowth)}
                                                {analytics.groupGrowth > 0 ? '+' : ''}{analytics.groupGrowth}% from previous period
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="card stat-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-muted">Total Posts</h6>
                                            <h3 className="mb-0">{formatNumber(analytics.totalPosts)}</h3>
                                            <small className="text-muted">
                                                {analytics.openPosts} open • {analytics.closedPosts} closed
                                            </small>
                                        </div>
                                        <FaClipboardCheck className="display-6 text-success" />
                                    </div>
                                    {analytics.postGrowth && (
                                        <div className="mt-2">
                                            <small className={analytics.postGrowth > 0 ? 'text-success' : 'text-danger'}>
                                                {getTrendIcon(analytics.postGrowth)}
                                                {analytics.postGrowth > 0 ? '+' : ''}{analytics.postGrowth}% from previous period
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="card stat-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-muted">Study Groups</h6>
                                            <h3 className="mb-0">{formatNumber(analytics.studyGroups)}</h3>
                                            <small className="text-muted">
                                                {analytics.activeStudyGroups} active
                                            </small>
                                        </div>
                                        <FaBook className="display-6 text-info" />
                                    </div>
                                    <div className="mt-2">
                                        <small className="text-muted">
                                            {analytics.studyGroupsPercentage}% of all groups
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="card stat-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-muted">Transport Groups</h6>
                                            <h3 className="mb-0">{formatNumber(analytics.transportGroups)}</h3>
                                            <small className="text-muted">
                                                {analytics.activeTransportGroups} active
                                            </small>
                                        </div>
                                        <FaCar className="display-6 text-warning" />
                                    </div>
                                    <div className="mt-2">
                                        <small className="text-muted">
                                            {analytics.transportGroupsPercentage}% of all groups
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Analytics */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="mb-0">Group Activity</h5>
                                </div>
                                <div className="card-body">
                                    <div className="activity-stats">
                                        <div className="activity-item mb-3">
                                            <div className="d-flex justify-content-between">
                                                <span>New Groups Created</span>
                                                <strong>{formatNumber(analytics.newGroups)}</strong>
                                            </div>
                                            <div className="progress mt-1" style={{ height: '8px' }}>
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    style={{ width: `${Math.min(analytics.newGroups / (analytics.totalGroups || 1) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="activity-item mb-3">
                                            <div className="d-flex justify-content-between">
                                                <span>Join Requests</span>
                                                <strong>{formatNumber(analytics.joinRequests)}</strong>
                                            </div>
                                            <div className="progress mt-1" style={{ height: '8px' }}>
                                                <div 
                                                    className="progress-bar bg-info" 
                                                    style={{ width: `${Math.min(analytics.joinRequests / (analytics.totalGroups * 5 || 1) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="activity-item mb-3">
                                            <div className="d-flex justify-content-between">
                                                <span>Groups Reached Capacity</span>
                                                <strong>{formatNumber(analytics.fullGroups)}</strong>
                                            </div>
                                            <div className="progress mt-1" style={{ height: '8px' }}>
                                                <div 
                                                    className="progress-bar bg-warning" 
                                                    style={{ width: `${Math.min(analytics.fullGroups / (analytics.totalGroups || 1) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="activity-item">
                                            <div className="d-flex justify-content-between">
                                                <span>Average Group Size</span>
                                                <strong>{analytics.averageGroupSize?.toFixed(1) || 'N/A'}</strong>
                                            </div>
                                            <div className="progress mt-1" style={{ height: '8px' }}>
                                                <div 
                                                    className="progress-bar bg-primary" 
                                                    style={{ width: `${Math.min((analytics.averageGroupSize || 0) / 10 * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="mb-0">Post Performance</h5>
                                </div>
                                <div className="card-body">
                                    <div className="post-stats">
                                        <div className="post-item mb-3">
                                            <div className="d-flex justify-content-between">
                                                <span>Average Response Time</span>
                                                <strong>{analytics.avgResponseTime || 'N/A'}</strong>
                                            </div>
                                            <small className="text-muted">Time from post creation to first interest</small>
                                        </div>

                                        <div className="post-item mb-3">
                                            <div className="d-flex justify-content-between">
                                                <span>Conversion Rate</span>
                                                <strong>{analytics.conversionRate?.toFixed(1) || 'N/A'}%</strong>
                                            </div>
                                            <small className="text-muted">Posts that became groups</small>
                                        </div>

                                        <div className="post-item mb-3">
                                            <div className="d-flex justify-content-between">
                                                <span>Most Active Time</span>
                                                <strong>{analytics.mostActiveTime || 'N/A'}</strong>
                                            </div>
                                            <small className="text-muted">Peak posting hours</small>
                                        </div>

                                        <div className="post-item">
                                            <div className="d-flex justify-content-between">
                                                <span>Top Subject</span>
                                                <strong>{analytics.topSubject || 'N/A'}</strong>
                                            </div>
                                            <small className="text-muted">Most requested study subject</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Time-based Trends */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Growth Trends</h5>
                                    <div>
                                        <FaCalendarAlt className="me-2" />
                                        <small>Time Period: {timeRange}</small>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {analytics.growthData && analytics.growthData.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Period</th>
                                                        <th>New Groups</th>
                                                        <th>New Posts</th>
                                                        <th>New Users</th>
                                                        <th>Growth Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analytics.growthData.map((period, index) => (
                                                        <tr key={index}>
                                                            <td>{period.period}</td>
                                                            <td>{formatNumber(period.newGroups)}</td>
                                                            <td>{formatNumber(period.newPosts)}</td>
                                                            <td>{formatNumber(period.newUsers)}</td>
                                                            <td>
                                                                <span className={period.growthRate > 0 ? 'text-success' : 'text-danger'}>
                                                                    {period.growthRate > 0 ? '+' : ''}{period.growthRate}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-muted">No trend data available for selected period</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="mb-0">Recommendations</h5>
                                </div>
                                <div className="card-body">
                                    <div className="recommendations">
                                        {analytics.recommendations && analytics.recommendations.length > 0 ? (
                                            <ul className="list-group list-group-flush">
                                                {analytics.recommendations.map((rec, index) => (
                                                    <li key={index} className="list-group-item">
                                                        <div className="d-flex align-items-center">
                                                            <div className={`me-3 p-2 rounded-circle ${rec.priority === 'high' ? 'bg-danger' : rec.priority === 'medium' ? 'bg-warning' : 'bg-info'}`}>
                                                                <span className="text-white">{index + 1}</span>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-1">{rec.title}</h6>
                                                                <p className="mb-0 text-muted small">{rec.description}</p>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="recommendation-item">
                                                <p className="text-muted">No recommendations available at this time.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default GroupAnalyticsPage;