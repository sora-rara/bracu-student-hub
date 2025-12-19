// src/components/Cafeteria/TodayMenuAdmin.js - UPDATED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios.jsx';

const TodayMenuAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [todaysMenu, setTodaysMenu] = useState([]);
  const [error, setError] = useState('');

  const fetchTodaysMenu = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching today\'s menu...');

      // Try different endpoints to find the right one
      let response;
      let menuItems = [];

      try {
        // Try endpoint 1
        response = await axios.get('/cafeteria/menu/today');
        console.log('📊 Response from /cafeteria/menu/today:', response.data);
      } catch (err) {
        console.log('❌ First endpoint failed, trying alternative...');
        // Try endpoint 2
        const today = new Date().toISOString().split('T')[0];
        response = await axios.get(`/cafeteria/menu/date/${today}`);
        console.log('📊 Response from /cafeteria/menu/date:', response.data);
      }

      if (response.data.success) {
        // Handle different response structures
        if (response.data.data?.menus) {
          // Structure: { menus: [{ mealTime, foodItems: [{ item }] }] }
          response.data.data.menus.forEach(menu => {
            if (menu.foodItems && Array.isArray(menu.foodItems)) {
              menu.foodItems.forEach(foodItem => {
                if (foodItem.item) {
                  menuItems.push(foodItem.item);
                }
              });
            }
          });
        } else if (response.data.data?.foodItems) {
          // Structure: { foodItems: [...] }
          menuItems = response.data.data.foodItems;
        } else if (Array.isArray(response.data.data)) {
          // Structure: [...]
          menuItems = response.data.data;
        } else if (response.data.data?.menuItems) {
          // Structure: { menuItems: [...] }
          menuItems = response.data.data.menuItems;
        }

        console.log(`✅ Processed ${menuItems.length} menu items`);
        setTodaysMenu(menuItems);
      } else {
        console.warn('Menu request not successful:', response.data);
        setTodaysMenu([]);
        setError('No menu available for today.');
      }
    } catch (err) {
      console.error('❌ Error fetching today\'s menu:', err);
      setError('Failed to load today\'s menu. Please try again.');
      setTodaysMenu([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysMenu();
  }, [fetchTodaysMenu]);

  const getImageUrl = (imageName) => {
    if (!imageName) return 'https://via.placeholder.com/300x200?text=No+Image';
    if (typeof imageName !== 'string') return 'https://via.placeholder.com/300x200?text=No+Image';
    if (imageName.startsWith('http')) return imageName;
    if (imageName.startsWith('/uploads/')) return `http://localhost:5000${imageName}`;
    return `http://localhost:5000/uploads/${imageName}`;
  };

  // Get current date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="page-container" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Simple Header - No tabs or extra buttons */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #4CAF50',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          color: '#333',
          marginBottom: '10px',
          fontSize: '2rem'
        }}>
          🍽️ Today's Menu - Admin View
        </h1>
        <p style={{
          color: '#666',
          fontSize: '1.1rem',
          marginBottom: '15px'
        }}>
          {currentDate}
        </p>
        <button
          onClick={fetchTodaysMenu}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          🔄 Refresh Menu
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          flexDirection: 'column'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #4CAF50',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading today's menu...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '30px',
          borderRadius: '10px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0 }}>⚠️ {error}</h3>
          <button
            onClick={fetchTodaysMenu}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* No Menu State */}
      {!loading && !error && todaysMenu.length === 0 && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '50px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#666', marginBottom: '15px' }}>No menu items scheduled for today.</h3>
          <p style={{ color: '#888', marginBottom: '25px' }}>
            Add food items to the weekly menu planning to see them here.
          </p>
        </div>
      )}

      {/* Menu Items Grid - ONLY SHOWING PICTURE, DESCRIPTION, PRICE */}
      {!loading && !error && todaysMenu.length > 0 && (
        <>
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f0f7ff',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: 0, color: '#1976d2' }}>
              📋 {todaysMenu.length} Food Items Available Today
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '25px',
            marginTop: '20px'
          }}>
            {todaysMenu.map((item, index) => (
              <div
                key={item._id || index}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                  }
                }}
              >
                {/* FOOD PICTURE - Large and prominent */}
                <div style={{
                  width: '100%',
                  height: '220px',
                  overflow: 'hidden',
                  backgroundColor: '#f8f9fa',
                  position: 'relative'
                }}>
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/320x220/4CAF50/FFFFFF?text=No+Image';
                    }}
                  />
                  {item.featured && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}>
                      ⭐ Featured
                    </div>
                  )}
                </div>

                {/* FOOD DETAILS - Only what you asked for */}
                <div style={{ padding: '20px' }}>
                  {/* Food Name and Price */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.4rem',
                      color: '#333',
                      fontWeight: '600',
                      flex: 1,
                      lineHeight: '1.3'
                    }}>
                      {item.name}
                    </h3>
                    <span style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '6px 15px',
                      borderRadius: '20px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      marginLeft: '10px',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
                      ৳{item.price?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  {/* Description - Full description without truncation */}
                  {item.description && (
                    <div style={{
                      marginBottom: '20px',
                      padding: '15px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      borderLeft: '4px solid #4CAF50'
                    }}>
                      <p style={{
                        color: '#555',
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        margin: 0
                      }}>
                        {item.description}
                      </p>
                    </div>
                  )}

                  {/* Category Badge */}
                  {item.category && (
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '5px 15px',
                      borderRadius: '15px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      marginBottom: '10px'
                    }}>
                      {item.category.replace('_', ' ').toUpperCase()}
                    </div>
                  )}

                  {/* Additional Info in small text */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '15px',
                    fontSize: '0.85rem',
                    color: '#777'
                  }}>
                    <div>
                      {item.mealTime && (
                        <span style={{ marginRight: '15px' }}>
                          🕒 {item.mealTime}
                        </span>
                      )}
                    </div>
                    <div>
                      {item.status === 'active' ? (
                        <span style={{ color: '#4CAF50' }}>
                          ✅ Available
                        </span>
                      ) : (
                        <span style={{ color: '#f44336' }}>
                          ⏸️ Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simple Summary */}
          <div style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#666' }}>
              <strong>Menu last updated:</strong> {new Date().toLocaleTimeString()}
            </p>
          </div>
        </>
      )}

      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TodayMenuAdmin;