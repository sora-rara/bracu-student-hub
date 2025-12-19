// src/components/Admin/AdminDashboard.js
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
        <div className="stats-grid">
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
                    <button onClick={testBackendConnection} disabled={loading}>
                        {loading ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button onClick={testConnection} disabled={loading}>
                        Quick API Test
                    </button>
                    <button onClick={fetchAdminFoodItems} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-section">
                    <h2>🏬 Cafeteria Dashboard</h2>
                    <div className={`connection-status ${isBackendConnected ? 'connected' : 'disconnected'}`}>
                        {connectionStatus}
                    </div>

                    <CafeteriaStats />

                    <div className="items-table">
                        <h3>All Food Items ({adminFoodItems.length})</h3>
                        {adminFoodItems.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminFoodItems.map(item => (
                                        <tr key={item._id || item.id}>
                                            <td>
                                                <img src={getImageUrl(item.image)} alt={item.name} className="item-thumbnail" />
                                            </td>
                                            <td>{item.name}</td>
                                            <td>{item.category}</td>
                                            <td>৳{item.price}</td>
                                            <td>
                                                <span className={`status-badge ${item.status}`}>{item.status}</span>
                                            </td>
                                            <td className="actions">
                                                <button onClick={() => navigate(`/cafeteria/admin/edit-item/${item._id || item.id}`)}>
                                                    ✏️ Edit
                                                </button>
                                                <button onClick={() => handleDeleteFoodItem(item._id || item.id, item.name)} className="delete-btn">
                                                    🗑️ Delete
                                                </button>
                                                <button onClick={() => handleToggleFeatured(item._id || item.id, item.featured)}>
                                                    {item.featured ? '⭐ Unfeature' : 'Mark Featured'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-items">No food items found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
