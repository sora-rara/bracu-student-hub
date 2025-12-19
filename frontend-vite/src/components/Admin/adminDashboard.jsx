// src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    (config) => {
        console.log('🔐 API Request:', config.method?.toUpperCase(), config.url);
        if (
            config.url &&
            !config.url.startsWith('/api/') &&
            !config.url.startsWith('http') &&
            !config.url.includes('/uploads/')
        ) {
            config.url = `/api${config.url}`;
            console.log('🔄 Rewriting URL to:', config.url);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', {
            url: error?.config?.url,
            status: error?.response?.status,
            message: error?.message,
        });

        if (error?.response?.status === 401) {
            alert('Session expired or unauthorized. Please log in again.');
            window.location.href = '/login';
        }

        if (error?.response?.status === 403) {
            alert('Admin access required. Please log in as administrator.');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('Checking connection...');
    const [isBackendConnected, setIsBackendConnected] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [adminFoodItems, setAdminFoodItems] = useState([]);
    const [stats, setStats] = useState({
        totalFoodItems: 0,
        featuredItems: 0,
        totalReviews: 0,
        totalMenus: 0,
    });

    const checkAuthStatus = useCallback(async () => {
        try {
            console.log('🔐 Checking authentication status...');
            const authResponse = await api.get('/api/auth/check');
            console.log('Auth check:', authResponse.data);

            if (!authResponse.data.loggedIn) {
                alert('Please log in first.');
                window.location.href = '/login';
                return false;
            }

            const verifyResponse = await api.get('/api/auth/verify-session');
            console.log('Admin verification:', verifyResponse.data);

            if (verifyResponse.data.isAdmin) {
                setIsAdmin(true);
                return true;
            } else {
                alert('Admin access required.');
                window.location.href = '/';
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            alert('Please log in to access admin panel.');
            window.location.href = '/login';
            return false;
        }
    }, []);

    const getImageUrl = useCallback((imageName) => {
        if (!imageName || typeof imageName !== 'string') return 'https://via.placeholder.com/300x200?text=No+Image';
        if (imageName.startsWith('http')) return imageName;
        if (imageName.startsWith('/uploads/')) return `${BASE_URL.replace('/api', '')}${imageName}`;
        return `${BASE_URL.replace('/api', '')}/uploads/${imageName}`;
    }, []);

    const getTotalScheduledMenus = useCallback(async () => {
        try {
            const response = await api.get('/api/cafeteria/admin/menus/future');
            if (response.data?.success) return response.data.data?.count || 0;
            return 0;
        } catch (error) {
            console.error('Error fetching scheduled menus:', error);
            return 0;
        }
    }, []);

    const testBackendConnection = useCallback(async () => {
        setLoading(true);
        setConnectionStatus('🔗 Connecting to backend...');
        try {
            const res = await api.get('/api/health');
            if (res.data?.success) {
                setConnectionStatus('✅ Connected to backend');
                setIsBackendConnected(true);

                try {
                    await api.get('/api/cafeteria/health');
                } catch (cafErr) {
                    console.warn('Cafeteria health check warning:', cafErr.message);
                }
            } else {
                setConnectionStatus('⚠️ Backend responded but returned an error');
                setIsBackendConnected(false);
            }
        } catch (err) {
            console.error('Health check failed:', err?.message || err);
            setConnectionStatus('❌ Cannot connect to backend');
            setIsBackendConnected(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAdminFoodItems = useCallback(async () => {
        if (!isBackendConnected || !isAdmin) return;
        setLoading(true);
        try {
            console.log('Fetching admin food items...');
            const response = await api.get('/api/cafeteria/admin/food-items');
            console.log('Received admin food items:', response.data);

            let items = response.data?.data?.foodItems || response.data?.foodItems || [];
            setAdminFoodItems(items);

            const featuredCount = items.filter(i => i.featured).length;
            const activeCount = items.filter(i => i.status === 'active').length;

            try {
                const statsResponse = await api.get('/api/cafeteria/stats');
                const reviewsCount = statsResponse.data?.data?.totalReviews || 0;
                const scheduledMenusCount = await getTotalScheduledMenus();

                setStats({
                    totalFoodItems: activeCount,
                    featuredItems: featuredCount,
                    totalReviews: reviewsCount,
                    totalMenus: scheduledMenusCount
                });
            } catch (statsErr) {
                console.warn('Could not fetch additional stats:', statsErr);
                setStats({
                    totalFoodItems: activeCount,
                    featuredItems: featuredCount,
                    totalReviews: 0,
                    totalMenus: 0
                });
            }
        } catch (error) {
            console.error('Error fetching admin food items:', error);
            alert('Failed to fetch food items: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [isBackendConnected, isAdmin, getTotalScheduledMenus]);

    const fetchTodaysMenu = useCallback(async () => {
        if (!isBackendConnected) return;
        try {
            await api.get('/api/cafeteria/menu/today');
            console.log("Today's menu fetched successfully");
        } catch (error) {
            console.error("Error fetching today's menu:", error?.message || error);
        }
    }, [isBackendConnected]);

    const handleDeleteFoodItem = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        setLoading(true);
        try {
            const response = await api.delete(`/api/cafeteria/admin/food-items/${id}`);
            if (response.data?.success) {
                alert('✅ Food item deleted!');
                await fetchAdminFoodItems();
            } else alert('❌ Failed to delete');
        } catch (error) {
            console.error('Error deleting food item:', error);
            alert('Failed to delete.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeatured = async (id, currentStatus) => {
        setLoading(true);
        try {
            const response = await api.patch(`/api/cafeteria/admin/food-items/${id}/featured`, {
                featured: !currentStatus,
            });
            if (response.data?.success) {
                alert(`✅ Item ${!currentStatus ? 'featured' : 'unfeatured'}`);
                await fetchAdminFoodItems();
            } else alert('Failed to update');
        } catch (error) {
            console.error('Error toggling featured:', error);
            alert('Failed to update');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED useEffect
    useEffect(() => {
        let isMounted = true;

        const initializeDashboard = async () => {
            try {
                const isAuthenticated = await checkAuthStatus();
                if (!isMounted || !isAuthenticated) return;

                await testBackendConnection();
                if (!isMounted || !isBackendConnected) return;

                await fetchAdminFoodItems();
                await fetchTodaysMenu();
            } catch (error) {
                console.error('Dashboard initialization failed:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initializeDashboard();

        return () => {
            isMounted = false; // cleanup to prevent state updates on unmounted component
        };
    }, [checkAuthStatus, testBackendConnection, fetchAdminFoodItems, fetchTodaysMenu, isBackendConnected]);

    const testConnection = async () => {
        try {
            console.log('Testing backend connection...');
            const authRes = await api.get('/api/auth/check');
            console.log('Auth check:', authRes.data);
            const verifyRes = await api.get('/api/auth/verify-session');
            console.log('Admin verification:', verifyRes.data);
            const healthRes = await api.get('/api/cafeteria/health');
            console.log('Cafeteria health:', healthRes.data);
            const today = format(new Date(), 'yyyy-MM-dd');
            const menuRes = await api.get(`/api/cafeteria/menu/date/${today}`);
            console.log('Menu check:', menuRes.data);
            alert('✅ All API endpoints are working! Check console for details.');
        } catch (error) {
            console.error('Backend test failed:', error);
            alert(`❌ Test failed: ${error?.response?.data?.message || error.message}`);
        }
    };

    const CafeteriaStats = () => (
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
            <div className="stat-card">
                <div className="stat-icon">🍽️</div>
                <div className="stat-content">
                    <h3>{stats.totalFoodItems}</h3>
                    <p>Total Food Items</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                    <h3>{stats.featuredItems}</h3>
                    <p>Featured Items</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div className="stat-content">
                    <h3>{stats.totalReviews}</h3>
                    <p>Total Reviews</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                    <h3>{stats.totalMenus}</h3>
                    <p>Scheduled Menus</p>
                </div>
            </div>
        </div>
    );

    if (loading && adminFoodItems.length === 0) {
        return (
            <div className="admin-dashboard">
                <div className="loading-screen">
                    <h2>Loading Admin Dashboard...</h2>
                    <p>{connectionStatus}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>🏛️ Admin Panel</h1>
                <p>Manage cafeteria items and menus</p>
                <div className="header-actions">
                    <button onClick={testBackendConnection} disabled={loading} className="primary-btn">
                        {loading ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button onClick={testConnection} disabled={loading} className="secondary-btn">
                        Quick API Test
                    </button>
                    <button onClick={fetchAdminFoodItems} disabled={loading} className="outline-btn">
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-section">
                    <h2>🏬 Cafeteria Dashboard</h2>
                    <div className={`connection-status ${isBackendConnected ? 'connected' : 'disconnected'}`} style={{ marginBottom: '20px' }}>
                        {connectionStatus}
                    </div>

                    <CafeteriaStats />

                    <div className="items-table" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 20px 0', paddingBottom: '10px', borderBottom: '2px solid #f0f0f0' }}>All Food Items ({adminFoodItems.length})</h3>
                        {adminFoodItems.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', width: '100px' }}>Image</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', minWidth: '150px' }}>Name</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', width: '120px' }}>Category</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', width: '100px' }}>Price</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', width: '100px' }}>Status</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', width: '200px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminFoodItems.map(item => (
                                            <tr key={item._id || item.id} style={{ borderBottom: '1px solid #e9ecef', transition: 'background-color 0.2s' }}>
                                                <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                    <img 
                                                        src={getImageUrl(item.image)} 
                                                        alt={item.name} 
                                                        style={{ 
                                                            width: '80px', 
                                                            height: '60px', 
                                                            objectFit: 'cover',
                                                            borderRadius: '6px',
                                                            border: '1px solid #ddd'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/80x60?text=No+Image';
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px', verticalAlign: 'middle', fontWeight: '500' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: '600' }}>{item.name}</span>
                                                        {item.featured && (
                                                            <span style={{ 
                                                                fontSize: '12px', 
                                                                color: '#e6b400', 
                                                                backgroundColor: '#fff9e6', 
                                                                padding: '2px 6px', 
                                                                borderRadius: '4px',
                                                                marginTop: '4px',
                                                                width: 'fit-content'
                                                            }}>
                                                                ⭐ Featured
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                    <span style={{ 
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px', 
                                                        backgroundColor: '#e9ecef',
                                                        fontSize: '13px'
                                                    }}>
                                                        {item.category || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', verticalAlign: 'middle', fontWeight: '600', color: '#28a745' }}>
                                                    ৳{item.price?.toFixed(2) || '0.00'}
                                                </td>
                                                <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                    <span 
                                                        className={`status-badge ${item.status}`}
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            textTransform: 'uppercase',
                                                            backgroundColor: item.status === 'active' ? '#d4edda' : 
                                                                           item.status === 'inactive' ? '#f8d7da' : '#fff3cd',
                                                            color: item.status === 'active' ? '#155724' : 
                                                                   item.status === 'inactive' ? '#721c24' : '#856404'
                                                        }}
                                                    >
                                                        {item.status || 'unknown'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                    <div className="actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <button 
                                                            onClick={() => navigate(`/cafeteria/admin/edit-item/${item._id || item.id}`)} 
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#17a2b8',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px'
                                                            }}
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteFoodItem(item._id || item.id, item.name)} 
                                                            className="delete-btn"
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#dc3545',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px'
                                                            }}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleFeatured(item._id || item.id, item.featured)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: item.featured ? '#ffc107' : '#6c757d',
                                                                color: item.featured ? '#212529' : 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px'
                                                            }}
                                                        >
                                                            {item.featured ? '⭐ Unfeature' : 'Mark Featured'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#6c757d', marginBottom: '20px' }}>No food items found.</p>
                                <button 
                                    onClick={() => navigate('/cafeteria/admin/add-item')} 
                                    className="primary-btn"
                                >
                                    ➕ Add First Food Item
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;